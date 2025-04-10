import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { generate2FASecret } from '@/lib/auth';
import prisma from '@/lib/db';

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
    
    // Generate 2FA secret
    const { secret, qrCode } = await generate2FASecret(session.user.email);
    
    // Store the secret temporarily (not enabling 2FA yet)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
      },
    });
    
    return NextResponse.json(
      { secret, qrCode },
      { status: 200 }
    );
  } catch (error) {
    console.error('Generate 2FA error:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
