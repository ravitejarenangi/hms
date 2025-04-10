import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';
import { WhatsApp } from '@/lib/whatsapp';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-hospital-management-system';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
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

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    });

    // Delete used reset token
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id },
    });

    // Send WhatsApp notification if user has a phone number
    if (user.phoneNumber) {
      try {
        await WhatsApp.notifications.sendPasswordChanged(
          user.phoneNumber,
          {
            userName: `${user.firstName} ${user.lastName}`,
          }
        );
      } catch (error) {
        console.error('WhatsApp notification error:', error);
        // Don't fail if WhatsApp notification fails
      }
    }

    return NextResponse.json(
      { message: 'Password reset successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
