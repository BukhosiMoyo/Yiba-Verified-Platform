// NextAuth configuration
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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

        const isValid = await verifyPassword(credentials.password, user.password_hash);

        if (!isValid) {
          return null;
        }

        // Note: Email verification is disabled - users can log in immediately after signup
        // Only check if user status is ACTIVE (not blocked/deactivated)
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
