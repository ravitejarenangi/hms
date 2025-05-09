import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Helper function to check if user has admin permissions
async function hasAdminPermission(session: any) {
  if (!session || !session.user) return false;
  
  const userRoles = session.user.roles || [];
  return userRoles.includes('admin') || userRoles.includes('superadmin');
}

// Helper function to check if user is accessing their own data
function isOwnProfile(session: any, userId: string) {
  if (!session || !session.user) return false;
  return session.user.id === userId;
}

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization - admin or own profile
    const isAdmin = await hasAdminPermission(session);
    const isOwn = isOwnProfile(session, userId);
    
    if (!isAdmin && !isOwn) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get user with roles and profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        profile: true,
        doctor: true,
        nurse: true,
        patient: true,
        staff: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Format the response to exclude sensitive information
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map(r => r.role.name),
      profile: user.profile,
      doctor: user.doctor,
      nurse: user.nurse,
      patient: user.patient,
      staff: user.staff,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedUser
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a specific user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization - admin or own profile
    const isAdmin = await hasAdminPermission(session);
    const isOwn = isOwnProfile(session, userId);
    
    if (!isAdmin && !isOwn) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      phone, 
      status,
      roles,
      profile = {}
    } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    let updateData: any = {};
    
    if (name) updateData.name = name;
    if (email && email !== existingUser.email) {
      // Check if email is already in use by another user
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      
      if (emailExists && emailExists.id !== userId) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
      
      updateData.email = email;
    }
    if (phone) updateData.phone = phone;
    
    // Only admins can change status
    if (status && isAdmin) {
      updateData.status = status;
    }
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user profile if provided
    if (Object.keys(profile).length > 0) {
      // Check if profile exists
      const existingProfile = await prisma.profile.findUnique({
        where: { userId }
      });

      if (existingProfile) {
        await prisma.profile.update({
          where: { userId },
          data: profile
        });
      } else {
        await prisma.profile.create({
          data: {
            ...profile,
            userId
          }
        });
      }
    }

    // Update roles if provided and user is admin
    if (roles && isAdmin) {
      // Get role records for the provided role names
      const roleRecords = await prisma.role.findMany({
        where: {
          name: {
            in: roles
          }
        }
      });

      if (roleRecords.length > 0) {
        // Delete existing role assignments
        await prisma.userRole.deleteMany({
          where: { userId }
        });

        // Create new role assignments
        for (const role of roleRecords) {
          await prisma.userRole.create({
            data: {
              userId,
              roleId: role.id
            }
          });
        }
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true
          }
        },
        profile: true
      }
    });

    // Format the response
    const formattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      status: updatedUser.status,
      roles: updatedUser.roles.map(r => r.role.name),
      profile: updatedUser.profile,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a specific user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can delete users
    const isAdmin = await hasAdminPermission(session);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the user (Prisma will cascade delete related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
