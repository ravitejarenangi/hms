import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, generateQrCode, generateBackupCodes } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;
    const email = session.user.email as string;

    // Generate TOTP secret
    const { secret, otpauth_url } = generateTotpSecret(email);

    // Generate QR code
    const qrCode = await generateQrCode(otpauth_url);

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Store the secret and backup codes in the database (not enabled yet)
    await prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        secret,
        backupCodes,
        enabled: false,
      },
      create: {
        userId,
        secret,
        backupCodes,
        enabled: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          secret,
          qrCode,
          backupCodes,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while setting up 2FA" },
      { status: 500 }
    );
  }
}
