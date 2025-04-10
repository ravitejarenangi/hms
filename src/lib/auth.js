import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from './db';
import rbac from './rbac';

// Constants
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-hospital-management-system';
const JWT_EXPIRES_IN = '7d';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return await hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} Whether the password matches
 */
export async function comparePassword(password, hashedPassword) {
  return await compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Generate a 2FA secret for a user
 * @param {string} email - User's email
 * @returns {Object} 2FA secret and QR code
 */
export async function generate2FASecret(email) {
  const secret = speakeasy.generateSecret({
    name: `Hospital Management System (${email})`,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
  };
}

/**
 * Verify a 2FA token
 * @param {string} token - 2FA token
 * @param {string} secret - User's 2FA secret
 * @returns {boolean} Whether the token is valid
 */
export function verify2FAToken(token, secret) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
  });
}

/**
 * Check if a user has permission for a specific action
 * @param {number} userId - User's ID
 * @param {string} permissionName - Permission to check
 * @returns {Promise<boolean>} Whether the user has permission
 */
export async function hasPermission(userId, permissionName) {
  return await rbac.hasPermission(userId, permissionName);
}

/**
 * Check if a user has any of the specified permissions
 * @param {number} userId - User's ID
 * @param {string[]} permissionNames - Permissions to check
 * @returns {Promise<boolean>} Whether the user has any of the permissions
 */
export async function hasAnyPermission(userId, permissionNames) {
  return await rbac.hasAnyPermission(userId, permissionNames);
}

/**
 * Get user by email
 * @param {string} email - User's email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
    },
  });
}

/**
 * Get user by ID
 * @param {number} id - User's ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
    },
  });
}

/**
 * Get user permissions
 * @param {number} userId - User's ID
 * @returns {Promise<string[]>} Array of permission names
 */
export async function getUserPermissions(userId) {
  return await rbac.getUserPermissions(userId);
}

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generate2FASecret,
  verify2FAToken,
  hasPermission,
  hasAnyPermission,
  getUserByEmail,
  getUserById,
  getUserPermissions,
};
