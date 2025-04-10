import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-hospital-management-system';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Find reset token in database
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        userId: decoded.id,
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Token is valid', userId: decoded.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
