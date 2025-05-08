import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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

    // Disable 2FA for the user
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled: false },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Two-factor authentication disabled successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while disabling 2FA" },
      { status: 500 }
    );
  }
}
