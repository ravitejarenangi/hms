import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { hasPermission } from '@/lib/auth';

/**
 * GET /api/admin/permissions
 * Fetch all permissions
 */
export async function GET(request) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check permission
    const hasAccess = await hasPermission(session.user.id, 'view_permissions');
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to view permissions' },
        { status: 403 }
      );
    }
    
    // Fetch permissions
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
    
    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, permission) => {
      const category = permission.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {});
    
    return NextResponse.json({ 
      permissions,
      permissionsByCategory
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
