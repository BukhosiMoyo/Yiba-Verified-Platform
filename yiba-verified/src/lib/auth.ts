// NextAuth configuration
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@/lib/rbac";
import { getImpersonationSessionByToken, updateImpersonationActivity } from "@/lib/impersonation";
import { logUserActivity, getClientIP, parseUserAgent } from "@/lib/activity-log";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role: Role;
    institutionId: string | null;
    qctoId: string | null;
    onboarding_completed?: boolean;
    impersonationSessionId?: string;
    impersonatorUserId?: string;
  }
  interface Session {
    user: {
      userId: string;
      email: string;
      name: string;
      role: Role;
      institutionId: string | null;
      qctoId: string | null;
      onboarding_completed?: boolean;
      // View As User fields (deprecated)
      viewingAsUserId?: string | null;
      viewingAsRole?: Role | null;
      viewingAsInstitutionId?: string | null;
      viewingAsQctoId?: string | null;
      // Impersonation fields
      impersonationSessionId?: string | null;
      impersonatorUserId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
    institutionId: string | null;
    qctoId: string | null;
    onboarding_completed?: boolean;
    // View As User fields
    viewingAsUserId?: string | null;
    viewingAsRole?: Role | null;
    viewingAsInstitutionId?: string | null;
    viewingAsQctoId?: string | null;
    // Impersonation fields
    impersonationSessionId?: string | null;
    impersonatorUserId?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Defaults for type satisfaction (will be overwritten by DB or Invite if present)
          role: "STUDENT" as Role,
          institutionId: null,
          qctoId: null,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { institution: true },
        });

        if (!user || !user.password_hash) {
          return null;
        }

        // Verify Password
        const isValid = await verifyPassword(credentials.password, user.password_hash);
        if (!isValid) {
          return null;
        }

        // 2FA Check
        if (user.two_factor_enabled) {
          const token = credentials.twoFactorCode;
          if (!token) {
            throw new Error("2FA_REQUIRED");
          }
          const { verifyTwoFactorToken } = await import("@/lib/auth/2fa");
          if (!verifyTwoFactorToken(token, user.two_factor_secret!)) {
            throw new Error("Invalid 2FA Code");
          }
        }

        // Check Status
        if (user.status !== "ACTIVE") {
          return null;
        }

        // Update last_active_at on login
        await prisma.user.update({
          where: { user_id: user.user_id },
          data: { last_active_at: new Date() },
        });

        return {
          id: user.user_id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          institutionId: user.institution_id,
          qctoId: user.qcto_id,
          onboarding_completed: user.onboarding_completed ?? false,
        };
      },
    }),
    CredentialsProvider({
      id: "impersonation",
      name: "Impersonation",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          return null;
        }

        try {
          // Validate impersonation token
          const session = await getImpersonationSessionByToken(credentials.token);

          // Update activity
          await updateImpersonationActivity(session.id);

          // Get target user
          const user = await prisma.user.findUnique({
            where: { user_id: session.target_user_id },
            include: { institution: true },
          });

          if (!user || user.status !== "ACTIVE") {
            return null;
          }

          // Return user with impersonation metadata
          return {
            id: user.user_id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
            institutionId: user.institution_id,
            qctoId: user.qcto_id,
            onboarding_completed: user.onboarding_completed ?? false,
            // Store impersonation session ID for later use
            impersonationSessionId: session.id,
            impersonatorUserId: session.impersonator_id,
          };
        } catch (error) {
          console.error("Impersonation authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow credentials and impersonation login flow to pass through
      if (account?.provider === "credentials" || account?.provider === "impersonation") {
        return true;
      }

      // 1. Check if user exists in DB
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      // 2. If user exists, verify they are allowed to sign in
      if (existingUser) {
        // Enforce status check (e.g. not blocked)
        if (existingUser.status !== "ACTIVE") {
          return false;
        }
        return true; // Allow sign in (NextAuth will link account if enabled)
      }

      // 3. User does NOT exist in DB completely (new Google sign in).
      // Check if they have a valid INVITE.
      const existingInvite = await prisma.invite.findFirst({
        where: {
          email: user.email,
          status: { in: ["SENT", "QUEUED", "SENDING"] }, // Allow pending statuses
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: "desc" },
      });

      if (existingInvite) {
        // 4. Provision the user from the invite
        const firstName = profile?.name ? profile.name.split(" ")[0] : "User";
        const lastName = profile?.name ? (profile.name.split(" ").slice(1).join(" ") || "") : "";

        try {
          await prisma.$transaction(async (tx) => {
            // Create User
            const newUser = await tx.user.create({
              data: {
                email: existingInvite.email,
                role: existingInvite.role,
                institution_id: existingInvite.institution_id,
                default_province: existingInvite.default_province,
                first_name: firstName,
                last_name: lastName,
                status: "ACTIVE",
                onboarding_completed: false, // Force onboarding
                emailVerified: new Date(),
                image: user.image,
              },
            });

            // Update Invite status
            await tx.invite.update({
              where: { invite_id: existingInvite.invite_id },
              data: {
                status: "ACCEPTED",
                accepted_at: new Date(),
              },
            });

            // If institution staff/admin, link user to institution in UserInstitution table
            if (existingInvite.institution_id) {
              await tx.userInstitution.create({
                data: {
                  user_id: newUser.user_id,
                  institution_id: existingInvite.institution_id,
                  role: existingInvite.role === "INSTITUTION_ADMIN" ? "ADMIN" : "STAFF",
                  is_primary: true,
                },
              });
            }
          });

          return true; // proceed
        } catch (err) {
          console.error("Failed to provision user from invite via Google:", err);
          return false;
        }
      }

      // 5. No user, No invite -> DENY
      return false;
    },
    async jwt({ token, user, trigger, session: sessionData }) {
      if (user) {
        // Initial login - set user data
        token.userId = user.id;
        token.role = user.role;
        token.institutionId = user.institutionId;
        token.qctoId = user.qctoId ?? null;
        token.onboarding_completed = (user as any).onboarding_completed ?? false;
        // Clear viewing as on new login
        token.viewingAsUserId = null;
        token.viewingAsRole = null;
        token.viewingAsInstitutionId = null;
        token.viewingAsQctoId = null;
        // Set impersonation fields if this is an impersonation login
        token.impersonationSessionId = (user as any).impersonationSessionId || null;
        token.impersonatorUserId = (user as any).impersonatorUserId || null;
      }

      // View As User state is read from cookies in requireAuth() API context
      // We don't set it here in JWT callback to avoid complexity
      // The viewing as state is checked on each API request via cookies

      // Handle session updates (client-side), e.g. after completing onboarding
      if (trigger === "update" && sessionData) {
        if ("viewingAsUserId" in sessionData) {
          token.viewingAsUserId = sessionData.viewingAsUserId as string | null;
          token.viewingAsRole = sessionData.viewingAsRole as Role | null;
          token.viewingAsInstitutionId = sessionData.viewingAsInstitutionId as string | null;
          token.viewingAsQctoId = sessionData.viewingAsQctoId as string | null;
        }
        if (typeof (sessionData as any).onboarding_completed === "boolean") {
          token.onboarding_completed = (sessionData as any).onboarding_completed;
        }
        if (typeof (sessionData as any).institutionId === "string" || (sessionData as any).institutionId === null) {
          token.institutionId = (sessionData as any).institutionId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.userId = token.userId as string;
        session.user.role = token.role as Role;
        session.user.institutionId = token.institutionId as string | null;
        session.user.qctoId = (token.qctoId as string | null) ?? null;
        session.user.onboarding_completed = token.onboarding_completed ?? false;
        // View As User fields (deprecated)
        session.user.viewingAsUserId = token.viewingAsUserId as string | null;
        session.user.viewingAsRole = token.viewingAsRole as Role | null;
        session.user.viewingAsInstitutionId = token.viewingAsInstitutionId as string | null;
        session.user.viewingAsQctoId = token.viewingAsQctoId as string | null;
        // Impersonation fields
        session.user.impersonationSessionId = token.impersonationSessionId as string | null;
        session.user.impersonatorUserId = token.impersonatorUserId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
