import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Reference to the in-memory store from the parent route
// In a production environment, this would be a database
declare global {
  var notifications: Record<string, any[]>;
}

if (!global.notifications) {
  global.notifications = {};
}

/**
 * GET handler to retrieve a specific notification by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const notificationId = params.id;
    
    // Get user's notifications
    const userNotifications = global.notifications[userId] || [];
    
    // Find the specific notification
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error retrieving notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE handler to delete a specific notification by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const notificationId = params.id;
    
    // Get user's notifications
    const userNotifications = global.notifications[userId] || [];
    
    // Find the notification index
    const notificationIndex = userNotifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    // Remove the notification
    userNotifications.splice(notificationIndex, 1);
    global.notifications[userId] = userNotifications;
    
    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
