import { type DefaultSession, type NextAuthConfig, type User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "ADMIN";
    } & DefaultSession["user"];
  }
  interface User {
    role: "STUDENT" | "ADMIN";
    status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  }
}

interface AuthorizeResult extends NextAuthUser {
  role: "STUDENT" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as AuthorizeResult).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "ADMIN";
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isStudentRoute = nextUrl.pathname.startsWith("/dashboard");
      const isAuthRoute = nextUrl.pathname.startsWith("/auth");

      if (isAuthRoute) return true;
      if (!isLoggedIn && (isAdminRoute || isStudentRoute)) return false;
      if (isLoggedIn && isAdminRoute && auth.user.role !== "ADMIN") return false;
      return true;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials): Promise<AuthorizeResult | null> => {
        const { getUserByEmail, getUserByUsername } = await import("@/lib/auth-db");
        const bcrypt = await import("bcryptjs");

        // Try username login first
        const usernameParsed = z.object({
          username: z.string().min(1),
          password: z.string().min(1),
        }).safeParse({ username: credentials?.username, password: credentials?.password });

        if (usernameParsed.success && credentials?.username) {
          const user = await getUserByUsername(usernameParsed.data.username);
          if (user && user.passwordHash) {
            const valid = await bcrypt.compare(usernameParsed.data.password, user.passwordHash);
            if (valid && user.status === "ACTIVE") {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role as "STUDENT" | "ADMIN",
                status: user.status as "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION",
              };
            }
          }
        }

        // Try email login
        const emailParsed = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }).safeParse({ email: credentials?.email, password: credentials?.password });

        if (emailParsed.success && credentials?.email) {
          const user = await getUserByEmail(emailParsed.data.email);
          if (user && user.passwordHash) {
            const valid = await bcrypt.compare(emailParsed.data.password, user.passwordHash);
            if (valid && user.status === "ACTIVE") {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role as "STUDENT" | "ADMIN",
                status: user.status as "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION",
              };
            }
          }
        }

        return null;
      },
    }),
  ],
};
