import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Helper function to check if user has admin permissions
async function hasAdminPermission(session: any) {
  if (!session || !session.user) return false;
  
  const userRoles = session.user.roles || [];
  return userRoles.includes('admin') || userRoles.includes('superadmin');
}

// POST /api/users/roles - Assign roles to a user
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can assign roles
    const isAdmin = await hasAdminPermission(session);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, roleIds } = body;

    // Validate required fields
    if (!userId || !roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User ID and role IDs are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if all roles exist
    const roles = await prisma.role.findMany({
      where: {
        id: {
          in: roleIds
        }
      }
    });

    if (roles.length !== roleIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more roles not found' },
        { status: 404 }
      );
    }

    // Delete existing role assignments
    await prisma.userRole.deleteMany({
      where: { userId }
    });

    // Create new role assignments
    const userRoles = await Promise.all(
      roleIds.map(roleId =>
        prisma.userRole.create({
          data: {
            userId,
            roleId
          },
          include: {
            role: true
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        userId,
        roles: userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name
        }))
      },
      message: 'Roles assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign roles' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/roles - Remove a role from a user
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can remove roles
    const isAdmin = await hasAdminPermission(session);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');

    // Validate required parameters
    if (!userId || !roleId) {
      return NextResponse.json(
        { success: false, error: 'User ID and role ID are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has the role
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId
      }
    });

    if (!userRole) {
      return NextResponse.json(
        { success: false, error: 'User does not have this role' },
        { status: 404 }
      );
    }

    // Ensure user will still have at least one role after removal
    if (user.roles.length <= 1) {
      return NextResponse.json(
        { success: false, error: 'User must have at least one role' },
        { status: 400 }
      );
    }

    // Remove the role
    await prisma.userRole.delete({
      where: {
        id: userRole.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully'
    });
  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove role' },
      { status: 500 }
    );
  }
}
