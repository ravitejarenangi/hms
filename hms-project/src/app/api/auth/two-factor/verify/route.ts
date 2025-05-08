import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { verifyTotpToken } from "@/lib/auth-utils";

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
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Get the user's 2FA settings
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth) {
      return NextResponse.json(
        { success: false, error: "Two-factor authentication not set up" },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = verifyTotpToken(token, twoFactorAuth.secret);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Enable 2FA for the user
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Two-factor authentication enabled successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while verifying the token" },
      { status: 500 }
    );
  }
}
