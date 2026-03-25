import type { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import {
  consumeSignInAttempt,
  resetSignInAttempts
} from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validation/auth";

export const authConfig = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/sign-in"
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? ""
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(rawCredentials) {
        const credentials = signInSchema.parse(rawCredentials);
        const email = credentials.email.toLowerCase();
        logActionStart("auth.sign-in", { email });
        const rateLimit = consumeSignInAttempt(credentials.email);

        if (!rateLimit.allowed) {
          logActionError("auth.sign-in", "rate-limited", { email });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user?.passwordHash) {
          logActionError("auth.sign-in", "missing-user-or-password", { email });
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          logActionError("auth.sign-in", "invalid-password", { email, userId: user.id });
          return null;
        }

        resetSignInAttempts(credentials.email);
        logActionSuccess("auth.sign-in", { email, userId: user.id, role: user.role });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: { role?: "USER" | "ADMIN" } }) {
      if (user) {
        token.role = user.role ?? "USER";
      }

      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "USER";
      }

      return session;
    }
  }
} satisfies NextAuthConfig;
