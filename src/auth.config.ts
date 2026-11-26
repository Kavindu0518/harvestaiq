import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth configuration shared between middleware and server auth.
 * Must not import Node-only modules (e.g., PrismaClient, bcryptjs).
 */
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userCode = user.userCode;
        token.role = user.role;
        token.assignedGreenhouses = user.assignedGreenhouses;
        token.defaultPath = user.defaultPath;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.userCode = token.userCode;
        session.user.role = token.role;
        session.user.assignedGreenhouses = token.assignedGreenhouses;
        session.user.defaultPath = token.defaultPath;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
