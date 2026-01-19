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
  }
  interface Session {
    user: {
      userId: string;
      email: string;
      name: string;
      role: Role;
      institutionId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
    institutionId: string | null;
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
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.institutionId = user.institutionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.userId = token.userId as string;
        session.user.role = token.role as Role;
        session.user.institutionId = token.institutionId as string | null;
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
