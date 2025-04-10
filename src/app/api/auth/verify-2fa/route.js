import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { verify2FAToken } from '@/lib/auth';
import prisma from '@/lib/db';
import { WhatsApp } from '@/lib/whatsapp';

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { token, secret } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { message: 'Verification code is required' },
        { status: 400 }
      );
    }
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Use the secret from the request or from the user record
    const secretToVerify = secret || user.twoFactorSecret;
    
    if (!secretToVerify) {
      return NextResponse.json(
        { message: '2FA secret not found' },
        { status: 400 }
      );
    }
    
    // Verify the token
    const isValid = verify2FAToken(token, secretToVerify);
    
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    // Enable 2FA for the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
      },
    });
    
    // Send WhatsApp notification if user has a phone number
    if (user.phoneNumber) {
      try {
        await WhatsApp.notifications.send2FAEnabled(
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
      { message: '2FA has been enabled for your account' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify 2FA error:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
