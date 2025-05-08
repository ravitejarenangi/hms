import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Find the password reset token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!passwordReset) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
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

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
}

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
