import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { hasPermission } from '@/lib/auth';

/**
 * GET /api/admin/roles
 * Fetch all roles with their permissions
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
    const hasAccess = await hasPermission(session.user.id, 'view_roles');
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to view roles' },
        { status: 403 }
      );
    }
    
    // Fetch roles with permissions
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Transform roles to include permission names
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.rolePermissions.map(rp => rp.permission),
    }));
    
    return NextResponse.json({ roles: transformedRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * Create a new role with permissions
 */
export async function POST(request) {
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
    const hasAccess = await hasPermission(session.user.id, 'create_roles');
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to create roles' },
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
    
    // Check if role already exists
    const existingRole = await prisma.role.findFirst({
      where: { name },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { message: 'Role with this name already exists' },
        { status: 400 }
      );
    }
    
    // Create role with permissions
    const role = await prisma.$transaction(async (tx) => {
      // Create role
      const newRole = await tx.role.create({
        data: {
          name,
          description,
          isSystem: false,
        },
      });
      
      // Create role permissions
      if (permissionIds && permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map(permissionId =>
            tx.rolePermission.create({
              data: {
                roleId: newRole.id,
                permissionId,
              },
            })
          )
        );
      }
      
      return newRole;
    });
    
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
