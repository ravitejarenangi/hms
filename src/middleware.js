import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from './lib/db';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/error',
];

// Define permission-based route access
const routePermissions = {
  // Admin routes
  '/admin': ['view_users', 'view_roles'],
  '/admin/users': ['view_users'],
  '/admin/users/create': ['create_users'],
  '/admin/users/edit': ['edit_users'],
  '/admin/roles': ['view_roles'],
  '/admin/roles/create': ['create_roles'],
  '/admin/roles/edit': ['edit_roles'],
  '/admin/settings': ['view_settings'],
  
  // Patient routes
  '/patients': ['view_all_patients', 'view_assigned_patients'],
  '/patients/create': ['create_patients'],
  '/patients/edit': ['edit_patients'],
  
  // Doctor routes
  '/doctors': ['view_all_doctors'],
  '/doctors/create': ['create_doctors'],
  '/doctors/edit': ['edit_doctors'],
  '/doctors/approve': ['approve_doctors'],
  
  // Appointment routes
  '/appointments': ['view_all_appointments', 'view_assigned_appointments'],
  '/appointments/create': ['create_appointments'],
  '/appointments/edit': ['edit_appointments'],
  
  // Pharmacy routes
  '/pharmacy': ['view_medicines'],
  '/pharmacy/medicines': ['view_medicines'],
  '/pharmacy/medicines/create': ['create_medicines'],
  '/pharmacy/medicines/edit': ['edit_medicines'],
  '/pharmacy/inventory': ['manage_inventory'],
  
  // Laboratory routes
  '/laboratory': ['view_all_lab_reports', 'view_assigned_lab_reports'],
  '/laboratory/create': ['create_lab_reports'],
  '/laboratory/edit': ['edit_lab_reports'],
  
  // Radiology routes
  '/radiology': ['view_all_radiology_reports', 'view_assigned_radiology_reports'],
  '/radiology/create': ['create_radiology_reports'],
  '/radiology/edit': ['edit_radiology_reports'],
  
  // Billing routes
  '/billing': ['view_all_invoices', 'view_assigned_invoices'],
  '/billing/create': ['create_invoices'],
  '/billing/edit': ['edit_invoices'],
  '/billing/payments': ['process_payments'],
  
  // Bed management routes
  '/beds': ['view_beds'],
  '/beds/create': ['create_beds'],
  '/beds/edit': ['edit_beds'],
  '/beds/assign': ['assign_beds'],
  
  // Report routes
  '/reports': ['view_reports'],
  '/reports/create': ['create_reports'],
  '/reports/export': ['export_reports'],
  
  // WhatsApp routes
  '/whatsapp': ['view_whatsapp_templates', 'send_whatsapp_messages'],
  '/whatsapp/templates': ['view_whatsapp_templates'],
  '/whatsapp/templates/create': ['create_whatsapp_templates'],
  '/whatsapp/templates/edit': ['edit_whatsapp_templates'],
};

/**
 * Check if a user has permission to access a route
 * @param {number} userId - User ID
 * @param {string} pathname - Route pathname
 * @returns {Promise<boolean>} Whether the user has permission
 */
async function hasRoutePermission(userId, pathname) {
  // Get user with role and permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.role) {
    return false;
  }

  // Get user permissions
  const userPermissions = user.role.rolePermissions.map(rp => rp.permission.name);

  // Check if the route requires permissions
  for (const [route, requiredPermissions] of Object.entries(routePermissions)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      // Check if the user has any of the required permissions
      return requiredPermissions.some(permission => userPermissions.includes(permission));
    }
  }

  // If the route is not in the routePermissions map, allow access
  return true;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is an API route
  if (pathname.startsWith('/api')) {
    // Allow NextAuth API routes
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    
    // For other API routes, check JWT token
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Continue for authenticated API requests
    return NextResponse.next();
  }
  
  // Check if the route is public
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }
  
  // Get the user's session token
  const token = await getToken({ req: request });
  
  // If no token and not on a public route, redirect to login
  if (!token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Check permission-based access for protected routes
  const hasPermission = await hasRoutePermission(token.id, pathname);
  
  if (!hasPermission) {
    // Redirect to unauthorized page if user doesn't have permission
    return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
  }
  
  // User is authenticated and authorized
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
