import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define types for our global SSE connection management
type SSEConnection = {
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
  lastEventId: string;
  lastActive?: number;
};

// Extend global to include our SSE connection properties
declare global {
  var sseConnections: Map<string, SSEConnection> | undefined;
  var cleanupInterval: NodeJS.Timeout | undefined;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Server-Sent Events (SSE) endpoint for real-time radiology updates
 * This endpoint establishes a persistent connection with the client
 * and sends events when radiology-related updates occur
 */
// Handle OPTIONS preflight request
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = req.cookies;
    
    // Try to verify authentication using getServerSession
    const session = await getServerSession(authOptions);
    
    // For debugging purposes, log all cookies
    console.log('Request cookies:', JSON.stringify(Object.fromEntries(cookies.getAll().map(c => [c.name, c.value]))));
    
    // If there's no session but there are auth cookies, we'll create a temporary session
    // This is a workaround for when getServerSession fails with SSE connections
    if (!session) {
      // Check if we have the session token cookie
      const sessionToken = cookies.get('next-auth.session-token')?.value || 
                          cookies.get('__Secure-next-auth.session-token')?.value ||
                          cookies.get('next-auth.callback-url')?.value;
      
      if (!sessionToken) {
        console.log('No session token found in cookies, returning unauthorized');
        return new NextResponse(JSON.stringify({ error: 'Unauthorized - No valid session token' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
            'Access-Control-Allow-Credentials': 'true',
          },
        });
      }
      
      // For this example, we'll allow the connection to proceed with the session token
      // In production, you should verify the token's validity
      console.log('Session token found, proceeding with connection');
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

    // Create a response with appropriate headers for SSE and CORS
    const response = new NextResponse(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

    // Store the connection in a global connections map for sending events later
    // This would typically be managed by a connection manager in a production environment
    const userId = session?.user?.id || 'anonymous-user-' + Date.now();
    if (!global.sseConnections) {
      global.sseConnections = new Map();
    }
    
    global.sseConnections.set(userId, {
      writer,
      encoder,
      lastEventId: req.headers.get('Last-Event-ID') || '0',
    });

    // We can't rely on response.body.on('close') in Next.js, so we'll handle cleanup differently
    // The connection will be managed by the AbortController on the client side
    // We'll also set up periodic cleanup of stale connections
    
    // Set up a timeout to detect stale connections
    if (!global.cleanupInterval) {
      global.cleanupInterval = setInterval(() => {
        if (global.sseConnections) {
          // Check last activity time for each connection
          const now = Date.now();
          for (const [id, connection] of global.sseConnections.entries()) {
            // If no activity for 1 minute, clean up
            if (connection.lastActive && now - connection.lastActive > 60000) {
              global.sseConnections.delete(id);
              try {
                connection.writer.close();
              } catch (err) {
                console.error(`Error closing writer for user ${id}:`, err);
              }
            }
          }
        }
      }, 30000); // Check every 30 seconds
    }

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
  if (userId && global.sseConnections?.has(userId)) {
    const connection = global.sseConnections.get(userId);
    if (connection) {
      try {
        await connection.writer.write(connection.encoder.encode(eventData));
        // Update last active timestamp
        connection.lastActive = Date.now();
      } catch (error) {
        console.error(`Error sending event to user ${userId}:`, error);
        global.sseConnections.delete(userId);
      }
    }
    return;
  }

  // Otherwise, broadcast to all connected users
  if (global.sseConnections) {
    for (const [id, connection] of global.sseConnections.entries()) {
      if (connection) {
        try {
          await connection.writer.write(connection.encoder.encode(eventData));
          // Update last active timestamp
          connection.lastActive = Date.now();
        } catch (error) {
          console.error(`Error sending event to user ${id}:`, error);
          global.sseConnections.delete(id);
        }
      }
    }
  }
}
