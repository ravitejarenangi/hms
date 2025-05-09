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

// GET /api/roles/[id] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get role with users count
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...role,
        usersCount: role._count.users
      }
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update a specific role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can update roles
    const isAdmin = await hasAdminPermission(session);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, permissions } = body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent updating system roles (superadmin, admin, etc.)
    const systemRoles = ['superadmin', 'admin', 'doctor', 'nurse', 'patient'];
    if (systemRoles.includes(existingRole.name)) {
      return NextResponse.json(
        { success: false, error: 'System roles cannot be modified' },
        { status: 403 }
      );
    }

    // Prepare update data
    let updateData: any = {};
    
    if (name) {
      // Check if name is already in use by another role
      const nameExists = await prisma.role.findUnique({
        where: { name }
      });
      
      if (nameExists && nameExists.id !== roleId) {
        return NextResponse.json(
          { success: false, error: 'Role name already in use' },
          { status: 400 }
        );
      }
      
      updateData.name = name;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    if (permissions !== undefined) {
      updateData.permissions = permissions;
    }

    // Update the role
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Delete a specific role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can delete roles
    const isAdmin = await hasAdminPermission(session);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent deleting system roles
    const systemRoles = ['superadmin', 'admin', 'doctor', 'nurse', 'patient'];
    if (systemRoles.includes(existingRole.name)) {
      return NextResponse.json(
        { success: false, error: 'System roles cannot be deleted' },
        { status: 403 }
      );
    }

    // Check if role is assigned to any users
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete role that is assigned to users' },
        { status: 400 }
      );
    }

    // Delete the role
    await prisma.role.delete({
      where: { id: roleId }
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
