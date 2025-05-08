import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "./prisma";
import * as bcrypt from "bcrypt";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Compare a password with a hash
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Get the current session
export async function getSession() {
  return getServerSession(authOptions);
}

// Check if a user has a specific role
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        name: roleName,
      },
    },
  });

  return !!userRole;
}

// Check if a user has a specific permission
export async function hasPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
    },
    include: {
      role: true,
    },
  });

  for (const userRole of userRoles) {
    const permissions = userRole.role.permissions as string[] | null;
    if (permissions && permissions.includes(permissionName)) {
      return true;
    }
  }

  return false;
}

// Generate a TOTP secret for 2FA
export function generateTotpSecret(label: string, issuer: string = "HMS") {
  const secret = speakeasy.generateSecret({
    name: `${issuer}:${label}`,
  });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
}

// Generate a QR code for 2FA
export async function generateQrCode(otpauthUrl: string): Promise<string> {
  return qrcode.toDataURL(otpauthUrl);
}

// Verify a TOTP token
export function verifyTotpToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
  });
}

// Generate backup codes for 2FA
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate a random 8-character code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}
