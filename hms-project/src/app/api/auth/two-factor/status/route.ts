import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;

    // Check if 2FA is enabled for the user
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          enabled: twoFactorAuth?.enabled || false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA status error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while checking 2FA status" },
      { status: 500 }
    );
  }
}
