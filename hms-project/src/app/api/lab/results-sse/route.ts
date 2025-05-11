import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Store active connections
const clients = new Map();

// Function to send updates to all connected clients
export function sendUpdate(data: any) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Extract query parameters
  const url = new URL(req.url);
  const testId = url.searchParams.get("testId");

  // Set up SSE headers
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  };

  const stream = new ReadableStream({
    start(controller) {
      const clientId = Date.now().toString();
      const encoder = new TextEncoder();

      // Store the client connection
      clients.set(clientId, {
        write: (data: string) => {
          controller.enqueue(encoder.encode(data));
        },
        testId: testId || null,
      });

      // Send initial data
      const sendInitialData = async () => {
        try {
          // Query based on whether testId is provided
          const where = testId ? { testId } : {};
          
          const results = await prisma.testResult.findMany({
            where,
            include: {
              test: {
                include: {
                  testCatalog: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 50,
          });

          // Send initial data to this client only
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "initial", results })}\n\n`)
          );
        } catch (error) {
          console.error("Error fetching initial data:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Failed to fetch initial data" })}\n\n`)
          );
        }
      };

      // Send initial data
      sendInitialData();

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30000);

      // Clean up when connection is closed
      return () => {
        clearInterval(heartbeatInterval);
        clients.delete(clientId);
      };
    },
  });

  return new Response(stream, { headers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await req.json();
    const {
      testId,
      parameter,
      value,
      unit,
      referenceRange,
      interpretation,
      isAbnormal,
      isCritical,
      performedBy,
      notes,
    } = data;

    // Validate required fields
    if (!testId || !parameter || !value || !performedBy) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        testCatalog: true,
      },
    });

    if (!test) {
      return new Response(
        JSON.stringify({ error: "Test not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create test result
    const result = await prisma.testResult.create({
      data: {
        testId,
        parameter,
        value,
        unit,
        referenceRange,
        interpretation,
        isAbnormal: isAbnormal || false,
        isCritical: isCritical || false,
        performedBy,
        notes,
      },
      include: {
        test: {
          include: {
            testCatalog: true,
          },
        },
      },
    });

    // If critical value, create critical value record
    if (isCritical) {
      await prisma.criticalValue.create({
        data: {
          testId,
          parameter,
          value,
          reportedBy: performedBy,
          reportedTo: test.requestedBy,
        },
      });
    }

    // Update test status if not already completed
    if (test.status !== "COMPLETED" && test.status !== "REPORTED" && test.status !== "VERIFIED") {
      await prisma.test.update({
        where: { id: testId },
        data: { status: "COMPLETED" },
      });
    }

    // Send update to all connected clients
    sendUpdate({
      type: "new_result",
      result,
    });

    return new Response(
      JSON.stringify(result),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating test result:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create test result" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await req.json();
    const {
      id,
      value,
      unit,
      referenceRange,
      interpretation,
      isAbnormal,
      isCritical,
      verifiedBy,
      verifiedAt,
      notes,
    } = data;

    // Validate required fields
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Result ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if result exists
    const existingResult = await prisma.testResult.findUnique({
      where: { id },
      include: {
        test: true,
      },
    });

    if (!existingResult) {
      return new Response(
        JSON.stringify({ error: "Result not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update result
    const updateData: any = {
      value,
      unit,
      referenceRange,
      interpretation,
      isAbnormal,
      isCritical,
      notes,
    };

    if (verifiedBy && verifiedAt) {
      updateData.verifiedBy = verifiedBy;
      updateData.verifiedAt = new Date(verifiedAt);

      // Update test status to verified
      await prisma.test.update({
        where: { id: existingResult.testId },
        data: { status: "VERIFIED" },
      });
    }

    const updatedResult = await prisma.testResult.update({
      where: { id },
      data: updateData,
      include: {
        test: {
          include: {
            testCatalog: true,
          },
        },
      },
    });

    // If critical value status changed, update or create critical value record
    if (isCritical !== existingResult.isCritical) {
      if (isCritical) {
        await prisma.criticalValue.create({
          data: {
            testId: existingResult.testId,
            parameter: existingResult.parameter,
            value: value || existingResult.value,
            reportedBy: session.user.id,
            reportedTo: existingResult.test.requestedBy,
          },
        });
      } else {
        // Find and delete critical value record if exists
        const criticalValue = await prisma.criticalValue.findFirst({
          where: {
            testId: existingResult.testId,
            parameter: existingResult.parameter,
          },
        });

        if (criticalValue) {
          await prisma.criticalValue.delete({
            where: { id: criticalValue.id },
          });
        }
      }
    }

    // Send update to all connected clients
    sendUpdate({
      type: "updated_result",
      result: updatedResult,
    });

    return new Response(
      JSON.stringify(updatedResult),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating test result:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update test result" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
