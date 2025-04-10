import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { hasPermission } from '@/lib/auth';

/**
 * GET /api/admin/roles/[id]
 * Fetch a role by ID with its permissions
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
    const hasAccess = await hasPermission(session.user.id, 'view_roles');
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to view roles' },
        { status: 403 }
      );
    }
    
    // Fetch role with permissions
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Transform role to include permission names
    const transformedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.rolePermissions.map(rp => rp.permission),
      permissionIds: role.rolePermissions.map(rp => rp.permissionId),
    };
    
    return NextResponse.json({ role: transformedRole });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/roles/[id]
 * Update a role with permissions
 */
export async function PUT(request, { params }) {
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
    const hasAccess = await hasPermission(session.user.id, 'edit_roles');
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to edit roles' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { name, description, permissionIds } = await request.json();
    
    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Role name is required' },
        { status: 400 }
      );
    }
    
    // Get the role
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Check if it's a system role
    if (role.isSystem && role.name !== name) {
      return NextResponse.json(
        { message: 'Cannot change the name of a system role' },
        { status: 400 }
      );
    }
    
    // Check if another role with the same name exists
    if (name !== role.name) {
      const existingRole = await prisma.role.findFirst({
        where: { 
          name,
          id: { not: parseInt(id) },
        },
      });
      
      if (existingRole) {
        return NextResponse.json(
          { message: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update role with permissions
    await prisma.$transaction(async (tx) => {
      // Update role
      await tx.role.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
        },
      });
      
      // Delete existing role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: parseInt(id) },
      });
      
      // Create new role permissions
      if (permissionIds && permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map(permissionId =>
            tx.rolePermission.create({
              data: {
                roleId: parseInt(id),
                permissionId,
              },
            })
          )
        );
      }
    });
    
    // Fetch updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    
    // Transform role to include permission names
    const transformedRole = {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      isSystem: updatedRole.isSystem,
      permissions: updatedRole.rolePermissions.map(rp => rp.permission),
      permissionIds: updatedRole.rolePermissions.map(rp => rp.permissionId),
    };
    
    return NextResponse.json({ role: transformedRole });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/roles/[id]
 * Delete a role
 */
export async function DELETE(request, { params }) {
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
    const hasAccess = await hasPermission(session.user.id, 'delete_roles');
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to delete roles' },
        { status: 403 }
      );
    }
    
    // Get the role
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Check if it's a system role
    if (role.isSystem) {
      return NextResponse.json(
        { message: 'Cannot delete a system role' },
        { status: 400 }
      );
    }
    
    // Check if the role is assigned to any users
    const usersWithRole = await prisma.user.count({
      where: { roleId: parseInt(id) },
    });
    
    if (usersWithRole > 0) {
      return NextResponse.json(
        { message: 'Cannot delete a role that is assigned to users' },
        { status: 400 }
      );
    }
    
    // Delete role permissions and role
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId: parseInt(id) },
      });
      
      await tx.role.delete({
        where: { id: parseInt(id) },
      });
    });
    
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
