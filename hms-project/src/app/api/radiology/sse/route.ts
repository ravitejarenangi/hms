import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Server-Sent Events (SSE) endpoint for real-time radiology updates
 * This endpoint establishes a persistent connection with the client
 * and sends events when radiology-related updates occur
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Set up SSE headers
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Send initial connection message
    const initialMessage = encoder.encode(
      `data: ${JSON.stringify({ type: 'connection', message: 'Connected to radiology SSE' })}\n\n`
    );
    await writer.write(initialMessage);

    // Create a response with appropriate headers for SSE
    const response = new NextResponse(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });

    // Store the connection in a global connections map for sending events later
    // This would typically be managed by a connection manager in a production environment
    const userId = session.user.id;
    if (!global.sseConnections) {
      global.sseConnections = new Map();
    }
    
    global.sseConnections.set(userId, {
      writer,
      encoder,
      lastEventId: req.headers.get('Last-Event-ID') || '0',
    });

    // Set up cleanup when client disconnects
    response.body?.on('close', () => {
      if (global.sseConnections) {
        global.sseConnections.delete(userId);
      }
      writer.close();
    });

    return response;
  } catch (error) {
    console.error('SSE connection error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Helper function to send an SSE event to a specific user or all users
 * This would be called from other API routes when there's a new update
 */
export async function sendRadiologyEvent(
  event: {
    id: string;
    type: 'REPORT_READY' | 'IMAGE_UPLOADED' | 'REQUEST_STATUS_CHANGE' | 'CRITICAL_RESULT';
    title: string;
    message: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    metadata: {
      requestId?: string;
      reportId?: string;
      studyId?: string;
      patientId?: string;
      patientName?: string;
    };
  },
  userId?: string
) {
  if (!global.sseConnections) {
    return;
  }

  // Format the event data
  const eventData = `event: radiology-update\ndata: ${JSON.stringify({
    ...event,
    read: false,
  })}\nid: ${event.id}\n\n`;

  // If userId is provided, send only to that user
  if (userId && global.sseConnections.has(userId)) {
    const connection = global.sseConnections.get(userId);
    try {
      await connection.writer.write(connection.encoder.encode(eventData));
    } catch (error) {
      console.error(`Error sending event to user ${userId}:`, error);
      global.sseConnections.delete(userId);
    }
    return;
  }

  // Otherwise, broadcast to all connected users
  for (const [id, connection] of global.sseConnections.entries()) {
    try {
      await connection.writer.write(connection.encoder.encode(eventData));
    } catch (error) {
      console.error(`Error sending event to user ${id}:`, error);
      global.sseConnections.delete(id);
    }
  }
}
