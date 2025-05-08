import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// Paths that don't require authentication
const publicPaths = [
  '/api/auth/login',
  '/api/health',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for non-API routes and public API routes
  if (!pathname.startsWith('/api') || publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Get token from request
  const token = getTokenFromRequest(request);
  
  // If no token or invalid token, return 401
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const payload = verifyToken(token);
  
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
  
  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes except for public paths
    '/api/:path*',
  ],
};
