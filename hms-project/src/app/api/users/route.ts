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

// GET /api/users - List all users with pagination and search
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    const isAdmin = await hasAdminPermission(session);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    let where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    // Role filtering requires a more complex query
    let roleFilter = undefined;
    if (role) {
      roleFilter = {
        roles: {
          some: {
            role: {
              name: role
            }
          }
        }
      };
      where = { ...where, ...roleFilter };
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });
    
    // Get users with pagination, sorting, and filtering
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        profile: true
      }
    });

    // Transform the data to remove sensitive information and format roles
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map(r => r.role.name),
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          total: totalUsers,
          page,
          limit,
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    const isAdmin = await hasAdminPermission(session);
    if (!isAdmin) {
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
      status = 'active',
      roles = ['patient'],
      profile = {}
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find role IDs for the provided role names
    const roleRecords = await prisma.role.findMany({
      where: {
        name: {
          in: roles
        }
      }
    });

    if (roleRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid roles provided' },
        { status: 400 }
      );
    }

    // Create the user with roles and profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        status,
        roles: {
          create: roleRecords.map(role => ({
            roleId: role.id
          }))
        },
        profile: {
          create: profile
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        profile: true
      }
    });

    // Format the response to exclude sensitive information
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map(r => r.role.name),
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedUser,
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
