import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Mock user for testing
const mockUser = {
  id: '1',
  name: 'Super Admin User',
  email: 'superadmin@example.com',
  password: 'superadmin123', // In a real app, this would be hashed
  roles: ['superadmin'],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if the user exists and password matches
    if (email === mockUser.email && password === mockUser.password) {
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          roles: mockUser.roles,
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            roles: mockUser.roles,
          },
          token,
        },
        message: 'Login successful',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
