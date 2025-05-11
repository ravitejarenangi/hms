import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const headersList = headers();
  const abortController = new AbortController();
  const { signal } = abortController;

  // Set up SSE headers
  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  };

  try {
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Send initial connection message
    const initialData = {
      type: 'connection',
      message: 'SSE connection established for bed status updates'
    };
    
    writer.write(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));

    // Set up interval to check for bed status changes
    const intervalId = setInterval(async () => {
      try {
        // Get all beds with their status
        const beds = await prisma.bed.findMany({
          select: {
            id: true,
            bedNumber: true,
            roomId: true,
            status: true,
            bedType: true,
            room: {
              select: {
                roomNumber: true,
                floor: true,
                wing: true
              }
            },
            allocations: {
              where: {
                status: 'CURRENT'
              },
              select: {
                patientId: true,
                allocatedAt: true,
                expectedDischarge: true
              },
              take: 1
            }
          }
        });

        // Format the data for the client
        const formattedBeds = beds.map(bed => ({
          id: bed.id,
          bedNumber: bed.bedNumber,
          roomId: bed.roomId,
          roomNumber: bed.room.roomNumber,
          floor: bed.room.floor,
          wing: bed.room.wing,
          bedType: bed.bedType,
          status: bed.status,
          patientId: bed.allocations[0]?.patientId || null,
          allocatedAt: bed.allocations[0]?.allocatedAt || null,
          expectedDischarge: bed.allocations[0]?.expectedDischarge || null
        }));

        // Send the data to the client
        writer.write(encoder.encode(`data: ${JSON.stringify(formattedBeds)}\n\n`));
      } catch (error) {
        console.error('Error fetching bed status:', error);
        writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Error fetching bed status' })}\n\n`));
      }
    }, 5000); // Update every 5 seconds

    // Set up event listener for bed status changes
    const setupBedStatusListener = async () => {
      try {
        // This would be implemented with a real-time database listener
        // For now, we'll use the interval above as a simulation
        console.log('Bed status listener set up');
      } catch (error) {
        console.error('Error setting up bed status listener:', error);
      }
    };

    setupBedStatusListener();

    // Handle client disconnect
    signal.addEventListener('abort', () => {
      clearInterval(intervalId);
      writer.close();
      console.log('Client disconnected from bed status SSE');
    });

    return new NextResponse(responseStream.readable, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error in bed status SSE:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
