import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the password reset token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!passwordReset) {
      return NextResponse.json(
        { success: false, error: "Invalid reset token" },
        { status: 400 }
      );
    }

    // Check if the token has expired
    if (passwordReset.expires < new Date()) {
      return NextResponse.json(
        { success: false, error: "Reset token has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Token is valid",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Validate token error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while validating the token" },
      { status: 500 }
    );
  }
}
