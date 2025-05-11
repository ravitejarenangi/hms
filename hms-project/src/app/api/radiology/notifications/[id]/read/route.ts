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
 * PUT handler to mark a notification as read
 */
export async function PUT(
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
    
    // Find the notification
    const notificationIndex = userNotifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    // Mark as read
    userNotifications[notificationIndex].read = true;
    global.notifications[userId] = userNotifications;
    
    return NextResponse.json({
      id: notificationId,
      read: true,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
