import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { prisma } from './prisma';

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
      roles: {
        include: {
          role: true,
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
