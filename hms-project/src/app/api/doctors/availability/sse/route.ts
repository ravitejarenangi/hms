import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// Store connected clients
const clients = new Map<string, {
  controller: ReadableStreamDefaultController;
  doctorId: string;
}>();

// Function to send updates to all connected clients for a specific doctor
export async function sendAvailabilityUpdate(doctorId: string, data: any) {
  const encoder = new TextEncoder();
  
  // Send updates to all clients subscribed to this doctor
  for (const [clientId, client] of clients.entries()) {
    if (client.doctorId === doctorId) {
      try {
        const encodedData = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
        client.controller.enqueue(encodedData);
      } catch (error) {
        console.error(`Error sending update to client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const url = new URL(req.url);
  const doctorId = url.searchParams.get('doctorId');
  
  if (!doctorId) {
    return new Response('Doctor ID is required', { status: 400 });
  }
  
  // Check if user has permission to view availability
  if (doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.view')) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Check if doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });
  
  if (!doctor) {
    return new Response('Doctor not found', { status: 404 });
  }
  
  // Create a unique client ID
  const clientId = crypto.randomUUID();
  
  // Set up SSE stream
  const stream = new ReadableStream({
    start(controller) {
      clients.set(clientId, { controller, doctorId });
      
      // Send initial message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to availability updates' })}\n\n`));
    },
    cancel() {
      clients.delete(clientId);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Helper function to be called when availability changes
export async function notifyAvailabilityChange(doctorId: string, action: 'create' | 'update' | 'delete', data: any) {
  await sendAvailabilityUpdate(doctorId, {
    type: 'availability',
    action,
    data
  });
}
