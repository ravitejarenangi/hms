import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cache to store active ambulance locations and connected clients
const ambulanceLocations = new Map<string, any>();
const clients = new Map<string, ReadableStreamController<Uint8Array>>();

// Helper to update ambulance location
export const updateAmbulanceLocation = async (
  ambulanceId: string,
  latitude: number,
  longitude: number,
  speed: number,
  status: string
) => {
  // Update location data
  const locationData = {
    ambulanceId,
    latitude,
    longitude,
    speed,
    status,
    timestamp: new Date(),
  };

  // Store in our cache
  ambulanceLocations.set(ambulanceId, locationData);

  // Broadcast to all connected clients
  for (const [clientId, controller] of clients.entries()) {
    try {
      const data = `data: ${JSON.stringify(locationData)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      // Remove problematic client
      clients.delete(clientId);
    }
  }
};

/**
 * SSE endpoint for real-time ambulance location updates
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Generate a unique client ID
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Set appropriate headers for SSE
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Add client to our connected clients
  clients.set(clientId, responseStream.readable.getController());

  // Send initial data to the client
  const initialData = Array.from(ambulanceLocations.values());
  await writer.write(
    encoder.encode(`data: ${JSON.stringify({ type: "initial", locations: initialData })}\n\n`)
  );

  // Set up ping interval to keep connection alive
  const pingInterval = setInterval(async () => {
    try {
      await writer.write(encoder.encode("event: ping\ndata: ping\n\n"));
    } catch (error) {
      console.error("Error sending ping:", error);
      clearInterval(pingInterval);
      clients.delete(clientId);
    }
  }, 30000); // ping every 30 seconds

  // Clean up when the client disconnects
  req.signal.addEventListener("abort", () => {
    clearInterval(pingInterval);
    clients.delete(clientId);
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

/**
 * Simulate location update from ambulance device (POST)
 * In a real implementation, this would be receiving data from actual ambulance GPS trackers
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { ambulanceId, latitude, longitude, speed, status } = await req.json();

    if (!ambulanceId || latitude === undefined || longitude === undefined) {
      return new Response("Invalid location data", { status: 400 });
    }

    // Update ambulance location
    await updateAmbulanceLocation(
      ambulanceId,
      latitude,
      longitude,
      speed || 0,
      status || "IN_USE"
    );

    // Also save to database for historical tracking
    await prisma.ambulanceLocationHistory.create({
      data: {
        ambulanceId,
        latitude,
        longitude,
        speed: speed || 0,
        timestamp: new Date(),
      },
    });

    // Also update ambulance status if provided
    if (status) {
      await prisma.ambulance.update({
        where: { id: ambulanceId },
        data: {
          status,
          updatedAt: new Date(),
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating ambulance location:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
