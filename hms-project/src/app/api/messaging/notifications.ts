import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Firebase Admin initialization
let adminApp;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'hms-messaging',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    }),
  });
} else {
  adminApp = getApps()[0];
}

const adminDb = getFirestore(adminApp);
const adminMessaging = getMessaging(adminApp);

// Type definitions
interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: 'MESSAGE' | 'MENTION' | 'INVITE' | 'SYSTEM';
  senderId?: string;
  threadId?: string;
  actionUrl?: string;
}

interface PushNotificationTokens {
  userId: string;
  tokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Handler for GET request to fetch user notifications
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = session.user.id;

    // Get user notifications
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Handler for POST request to create new notification
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get request body
    const body: NotificationRequest = await request.json();

    // Validate required fields
    if (!body.userId || !body.title || !body.message || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = {
      userId: body.userId,
      title: body.title,
      message: body.message,
      type: body.type,
      senderId: body.senderId || session.user.id,
      senderName: session.user.name,
      senderAvatar: session.user.image,
      threadId: body.threadId,
      actionUrl: body.actionUrl,
      timestamp: new Date(),
      read: false,
    };

    // Add to Firestore
    const notificationRef = await adminDb.collection('notifications').add(notification);

    // Send push notification if user has registered tokens
    await sendPushNotification(body.userId, notification);

    return NextResponse.json({
      id: notificationRef.id,
      ...notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// Handler for DELETE request to clear user notifications
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all notifications for the user
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .get();

    // Delete notifications in batches (Firestore limits)
    const batchSize = notificationsSnapshot.size;
    if (batchSize === 0) {
      return NextResponse.json({ message: 'No notifications to delete' });
    }

    // Create batches (max 500 operations per batch)
    const batches = [];
    let currentBatch = adminDb.batch();
    let operationCount = 0;
    const MAX_OPERATIONS = 500;

    notificationsSnapshot.docs.forEach(doc => {
      if (operationCount >= MAX_OPERATIONS) {
        batches.push(currentBatch);
        currentBatch = adminDb.batch();
        operationCount = 0;
      }
      currentBatch.delete(doc.ref);
      operationCount++;
    });

    // Add the last batch if it contains operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    await Promise.all(batches.map(batch => batch.commit()));

    return NextResponse.json({
      message: `Successfully deleted ${batchSize} notifications`,
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}

// PUT request to update notification (mark as read)
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { notificationId, read } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Get notification to verify it belongs to user
    const notificationDoc = await adminDb
      .collection('notifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();
    if (notificationData?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this notification' },
        { status: 403 }
      );
    }

    // Update notification
    await notificationDoc.ref.update({
      read: read === undefined ? true : read,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: 'Notification updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// Function to send push notification
async function sendPushNotification(userId: string, notification: any) {
  try {
    // Get user's FCM tokens
    const tokenDoc = await adminDb
      .collection('pushNotificationTokens')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (tokenDoc.empty) {
      // User has no registered tokens
      return;
    }

    const tokens = tokenDoc.docs[0].data().tokens;
    if (!tokens || tokens.length === 0) {
      return;
    }

    // Prepare the message
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        threadId: notification.threadId || '',
        senderId: notification.senderId || '',
        notificationId: notification.id || '',
        actionUrl: notification.actionUrl || '',
        timestamp: notification.timestamp.toISOString(),
      },
      tokens: tokens,
    };

    // Send the message
    const response = await adminMessaging.sendMulticast(message);
    console.log(`${response.successCount} messages were sent successfully`);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      // Remove failed tokens
      if (failedTokens.length > 0) {
        const validTokens = tokens.filter(token => !failedTokens.includes(token));
        await adminDb
          .collection('pushNotificationTokens')
          .doc(tokenDoc.docs[0].id)
          .update({
            tokens: validTokens,
            updatedAt: new Date(),
          });
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
