import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { prisma } from './prisma';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Extend next-auth types
declare module 'next-auth' {
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

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

export async function generateToken(userId: string, email: string, roles: string[]): Promise<string> {
  const payload: JwtPayload = {
    userId,
    email,
    roles,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

export async function getUserFromRequest(request: NextRequest) {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return null;
  }
  
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      UserRole: {
        include: {
          Role: true,
        },
      },
    },
  });
  
  return user;
}

export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Auth options for NextAuth
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
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
                Role: true
              }
            }
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await comparePasswords(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Get user roles
        const roles = user.UserRole.map((ur: any) => ur.Role.name);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: roles
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;  // user already has extracted roles from authorize
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt' as const
  },
  secret: process.env.NEXTAUTH_SECRET || JWT_SECRET
};
