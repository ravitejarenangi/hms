import NextAuth from "next-auth/next";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

// Define custom session and user types
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    doctorId?: string;
    patientId?: string;
    isAdmin?: boolean;
  }

  interface Session {
    user: User;
  }
}

export const authOptions: NextAuthOptions = {
  // We're using JWT strategy instead of the database adapter
  // adapter: PrismaAdapter(prisma),
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
          include: {
            UserRole: {
              include: {
                Role: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if the user is active
        if (user.status !== "active") {
          throw new Error("Your account is not active. Please contact an administrator.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.UserRole.map((r) => r.Role.name),
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles as string[];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[] || [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.JWT_SECRET,
};

// Create the handler with the auth options
const handler = NextAuth(authOptions);

// Export the handler for the App Router API routes
export { handler as GET, handler as POST };
