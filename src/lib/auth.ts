import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "./rate-limit";

if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET não está configurada.");

function truncatingAdapter(prismaClient: typeof prisma) {
  const base = PrismaAdapter(prismaClient) as any;
  return {
    ...base,
    createUser: async (user: any) => {
      if (user.name && typeof user.name === "string" && user.name.length > 100) {
        user.name = user.name.slice(0, 100);
      }
      if (user.email && typeof user.email === "string" && user.email.length > 254) {
        throw new Error("E-mail demasiado longo.");
      }
      return base.createUser(user);
    },
  };
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    roleCheckedAt?: number;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: truncatingAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "E-mail",  type: "email" },
        password: { label: "Senha",   type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const key = `login:${credentials.email.toLowerCase().trim()}`;
        if (!rateLimit(key, 10, 15 * 60 * 1000)) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
          token.role = dbUser?.role ?? "client";
        } else {
          token.role = user.role;
        }
        token.roleCheckedAt = Date.now();
      }
      // Re-sync role from DB every 5 minutes to pick up demotions/promotions
      const now = Date.now();
      const stale = !token.roleCheckedAt || now - token.roleCheckedAt > 5 * 60 * 1000;
      if (trigger === "update" || stale) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id }, select: { role: true } });
        if (dbUser) token.role = dbUser.role;
        token.roleCheckedAt = now;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
