import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePasswords, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Check if the user is active
    if (user.status !== 'active') {
      return errorResponse('Your account is not active. Please contact an administrator.', 403);
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT token
    const roleNames = user.roles.map(r => r.role.name);
    const token = await generateToken(user.id, user.email, roleNames);

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: roleNames,
      },
      token,
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login');
  }
}
