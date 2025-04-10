import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { hasPermission } from '@/lib/auth';

/**
 * GET /api/admin/users/[id]/permissions
 * Fetch permissions for a specific user
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check permission
    const hasAccess = await hasPermission(session.user.id, 'view_users');
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to view user permissions' },
        { status: 403 }
      );
    }
    
    // Fetch user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
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
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    if (!user.role) {
      return NextResponse.json({ permissions: [] });
    }
    
    // Extract permissions
    const permissions = user.role.rolePermissions.map(rp => rp.permission);
    
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
