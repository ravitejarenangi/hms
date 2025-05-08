import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Paths that don't require authentication
const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

// Paths that require specific roles
const rolePaths = {
  "/admin": ["admin", "superadmin"],
  "/doctor": ["doctor", "admin", "superadmin"],
  "/nurse": ["nurse", "admin", "superadmin"],
  "/pharmacist": ["pharmacist", "admin", "superadmin"],
  "/accountant": ["accountant", "admin", "superadmin"],
  "/receptionist": ["receptionist", "admin", "superadmin"],
  "/pathologist": ["pathologist", "admin", "superadmin"],
  "/radiologist": ["radiologist", "admin", "superadmin"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and public paths
  if (pathname.startsWith("/api") || publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.JWT_SECRET,
  });

  // If no token, redirect to login
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Check role-based access for protected paths
  for (const [path, roles] of Object.entries(rolePaths)) {
    if (pathname.startsWith(path)) {
      const userRoles = token.roles as string[];
      const hasRequiredRole = roles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        // Redirect to dashboard if user doesn't have the required role
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
