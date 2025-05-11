import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// In-memory store for notifications (would be replaced with a database in production)
let notifications: Record<string, any[]> = {};

/**
 * GET handler to retrieve notifications for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const readFilter = url.searchParams.get('read');
    
    // Get user's notifications
    const userNotifications = notifications[userId] || [];
    
    // Apply filters
    let filteredNotifications = [...userNotifications];
    if (readFilter !== null) {
      const isRead = readFilter === 'true';
      filteredNotifications = filteredNotifications.filter(
        notification => notification.read === isRead
      );
    }
    
    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    
    // Prepare pagination metadata
    const totalCount = filteredNotifications.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      notifications: paginatedNotifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: endIndex < totalCount,
        hasPrevious: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST handler to create a new notification
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow staff or admin to create notifications
    if (!session.user.role || !['ADMIN', 'DOCTOR', 'RADIOLOGIST', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.userId || !data.type || !data.title || !data.message || !data.priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create notification
    const notification = {
      id: uuidv4(),
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: new Date().toISOString(),
      read: false,
      priority: data.priority,
      metadata: data.metadata || {}
    };
    
    // Add to user's notifications
    if (!notifications[data.userId]) {
      notifications[data.userId] = [];
    }
    notifications[data.userId].unshift(notification);
    
    // Import the SSE helper function to send real-time update
    const { sendRadiologyEvent } = await import('../sse/route');
    await sendRadiologyEvent(notification, data.userId);
    
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE handler to delete all notifications for the authenticated user
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Clear user's notifications
    notifications[userId] = [];
    
    return NextResponse.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
