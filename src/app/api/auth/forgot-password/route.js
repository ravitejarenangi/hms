import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import prisma from '@/lib/db';
import { WhatsApp } from '@/lib/whatsapp';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-hospital-management-system';
const RESET_TOKEN_EXPIRES_IN = '1h';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not for security reasons
    if (!user) {
      return NextResponse.json(
        { message: 'If your email is registered, you will receive a password reset link' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES_IN }
    );

    // Store reset token in database
    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
      create: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Generate reset link
    const resetLink = `${BASE_URL}/auth/reset-password?token=${resetToken}`;

    // In a real application, send email with reset link
    console.log(`Password reset link for ${email}: ${resetLink}`);

    // If user has a phone number, send WhatsApp notification
    if (user.phoneNumber) {
      try {
        await WhatsApp.notifications.sendPasswordReset(
          user.phoneNumber,
          {
            userName: `${user.firstName} ${user.lastName}`,
            resetLink,
          }
        );
      } catch (error) {
        console.error('WhatsApp notification error:', error);
        // Don't fail if WhatsApp notification fails
      }
    }

    return NextResponse.json(
      { message: 'If your email is registered, you will receive a password reset link' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
