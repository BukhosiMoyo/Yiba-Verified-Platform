// NextAuth configuration
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@/lib/rbac";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role: Role;
    institutionId: string | null;
    qctoId: string | null;
  }
  interface Session {
    user: {
      userId: string;
      email: string;
      name: string;
      role: Role;
      institutionId: string | null;
      qctoId: string | null;
      // View As User fields
      viewingAsUserId?: string | null;
      viewingAsRole?: Role | null;
      viewingAsInstitutionId?: string | null;
      viewingAsQctoId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
    institutionId: string | null;
    qctoId: string | null;
    // View As User fields
    viewingAsUserId?: string | null;
    viewingAsRole?: Role | null;
    viewingAsInstitutionId?: string | null;
    viewingAsQctoId?: string | null;
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

        return {
          id: user.user_id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          institutionId: user.institution_id,
          qctoId: user.qcto_id,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session: sessionData, req }) {
      if (user) {
        // Initial login - set user data
        token.userId = user.id;
        token.role = user.role;
        token.institutionId = user.institutionId;
        token.qctoId = user.qctoId ?? null;
        // Clear viewing as on new login
        token.viewingAsUserId = null;
        token.viewingAsRole = null;
        token.viewingAsInstitutionId = null;
        token.viewingAsQctoId = null;
      }

      // View As User state is read from cookies in requireAuth() API context
      // We don't set it here in JWT callback to avoid complexity
      // The viewing as state is checked on each API request via cookies

      // Handle View As User updates via session update (client-side)
      if (trigger === "update" && sessionData) {
        if ("viewingAsUserId" in sessionData) {
          token.viewingAsUserId = sessionData.viewingAsUserId as string | null;
          token.viewingAsRole = sessionData.viewingAsRole as Role | null;
          token.viewingAsInstitutionId = sessionData.viewingAsInstitutionId as string | null;
          token.viewingAsQctoId = sessionData.viewingAsQctoId as string | null;
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
        // View As User fields
        session.user.viewingAsUserId = token.viewingAsUserId as string | null;
        session.user.viewingAsRole = token.viewingAsRole as Role | null;
        session.user.viewingAsInstitutionId = token.viewingAsInstitutionId as string | null;
        session.user.viewingAsQctoId = token.viewingAsQctoId as string | null;
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
