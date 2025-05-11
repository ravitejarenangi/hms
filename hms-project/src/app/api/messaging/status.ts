import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient, UserStatusType } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import { firestore } from './firebase-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const prisma = new PrismaClient();

// Update user status in both Firebase (for real-time updates) and Prisma (for persistence)
interface StatusUpdateRequest {
  status: UserStatusType;
  customMessage?: string;
  deviceInfo?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { status, customMessage, deviceInfo } = await req.json() as StatusUpdateRequest;

    // Validate input
    if (!status || !['ONLINE', 'AWAY', 'BUSY', 'OFFLINE', 'IN_MEETING', 'ON_BREAK', 'CUSTOM'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Create Firebase real-time status document
    const statusRef = doc(firestore, 'userStatus', userId);
    await setDoc(statusRef, {
      status,
      customMessage: customMessage || null,
      lastActive: new Date().toISOString(),
      deviceInfo: deviceInfo || null,
      updatedAt: new Date().toISOString()
    });

    // Save or update status in database
    const existingStatus = await prisma.userStatus.findUnique({
      where: { userId }
    });

    if (existingStatus) {
      await prisma.userStatus.update({
        where: { userId },
        data: {
          status,
          customMessage,
          lastActive: new Date(),
          deviceInfo,
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.userStatus.create({
        data: {
          id: uuidv4(),
          userId,
          status,
          customMessage,
          lastActive: new Date(),
          deviceInfo,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

// Set availability scheduling
interface AvailabilityUpdateRequest {
  dutyStartTime?: string;
  dutyEndTime?: string;
  doNotDisturbUntil?: string;
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { dutyStartTime, dutyEndTime, doNotDisturbUntil } = await req.json() as AvailabilityUpdateRequest;

    // Update availability settings in database
    await prisma.userStatus.update({
      where: { userId },
      data: {
        dutyStartTime: dutyStartTime ? new Date(dutyStartTime) : null,
        dutyEndTime: dutyEndTime ? new Date(dutyEndTime) : null,
        doNotDisturbUntil: doNotDisturbUntil ? new Date(doNotDisturbUntil) : null,
        updatedAt: new Date()
      }
    });

    // Update Firebase real-time status with availability info
    const statusRef = doc(firestore, 'userStatus', userId);
    const statusDoc = await getDoc(statusRef);
    
    if (statusDoc.exists()) {
      const currentStatus = statusDoc.data();
      await setDoc(statusRef, {
        ...currentStatus,
        dutyStartTime: dutyStartTime || null,
        dutyEndTime: dutyEndTime || null,
        doNotDisturbUntil: doNotDisturbUntil || null,
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Availability update error:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}

// Get user status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    
    // If no specific user requested, get status for all users in the same department
    if (!targetUserId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          Staff: true
        }
      });

      if (!currentUser || !currentUser.Staff || !currentUser.Staff.departmentId) {
        return NextResponse.json({ error: 'Invalid user or department' }, { status: 400 });
      }

      const departmentId = currentUser.Staff.departmentId;
      
      const departmentUsers = await prisma.staff.findMany({
        where: { departmentId },
        include: {
          User: {
            include: {
              UserStatus: true
            }
          }
        }
      });

      return NextResponse.json({
        users: departmentUsers.map(staff => ({
          id: staff.User.id,
          name: staff.User.name,
          status: staff.User.UserStatus?.status || 'OFFLINE',
          customMessage: staff.User.UserStatus?.customMessage || null,
          lastActive: staff.User.UserStatus?.lastActive || null,
          dutyStartTime: staff.User.UserStatus?.dutyStartTime || null,
          dutyEndTime: staff.User.UserStatus?.dutyEndTime || null,
          doNotDisturbUntil: staff.User.UserStatus?.doNotDisturbUntil || null
        }))
      });
    } 
    
    // Get status for a specific user
    const userStatus = await prisma.userStatus.findUnique({
      where: { userId: targetUserId },
      include: {
        User: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!userStatus) {
      return NextResponse.json({
        id: targetUserId,
        status: 'OFFLINE',
        lastActive: null
      });
    }

    return NextResponse.json({
      id: userStatus.User.id,
      name: userStatus.User.name,
      status: userStatus.status,
      customMessage: userStatus.customMessage,
      lastActive: userStatus.lastActive,
      dutyStartTime: userStatus.dutyStartTime,
      dutyEndTime: userStatus.dutyEndTime,
      doNotDisturbUntil: userStatus.doNotDisturbUntil
    });
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
