import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * @swagger
 * /api/ambulances/dispatch:
 *   get:
 *     summary: Get ambulance dispatch requests with optional filtering
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [REQUESTED, ASSIGNED, DISPATCHED, ARRIVED, COMPLETED, CANCELLED]
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of dispatch requests with pagination metadata
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const id = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Check if a specific dispatch is requested
    if (id) {
      const dispatch = await prisma.ambulanceDispatch.findUnique({
        where: { id },
        include: {
          Ambulance: true,
          AmbulanceDriver: true,
          AmbulanceBilling: true,
          PatientVital: true,
        },
      });

      if (!dispatch) {
        return NextResponse.json(
          { error: "Dispatch request not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(dispatch);
    }

    // Build filter
    const where: any = {};
    if (status) where.status = status;

    // Fetch dispatch requests with pagination
    const [dispatches, total] = await Promise.all([
      prisma.ambulanceDispatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: "desc" },
        include: {
          Ambulance: true,
          AmbulanceDriver: {
            select: {
              id: true,
              driverId: true,
              licenseNumber: true,
              isAvailable: true,
            },
          },
          AmbulanceBilling: {
            select: {
              id: true,
              totalAmount: true,
              paymentStatus: true,
            },
          },
        },
      }),
      prisma.ambulanceDispatch.count({ where }),
    ]);

    return NextResponse.json({
      data: dispatches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching dispatches:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispatch requests" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/dispatch:
 *   post:
 *     summary: Create a new ambulance dispatch request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupLocation
 *               - dropLocation
 *               - purpose
 *               - requestedBy
 *     responses:
 *       201:
 *         description: Dispatch request created successfully
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      pickupLocation,
      dropLocation,
      purpose,
      priority,
      patientId,
      requestedBy,
      notes,
    } = data;

    // Validate required fields
    if (!pickupLocation || !dropLocation || !purpose || !requestedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Implement ambulance assignment algorithm
    const availableAmbulance = await findBestAvailableAmbulance(purpose, priority);

    if (!availableAmbulance) {
      return NextResponse.json(
        { error: "No available ambulances found" },
        { status: 404 }
      );
    }

    // Find an available driver for this ambulance
    const driver = await prisma.ambulanceDriver.findFirst({
      where: {
        ambulanceId: availableAmbulance.id,
        isAvailable: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "No available drivers found for the selected ambulance" },
        { status: 404 }
      );
    }

    // Create dispatch request
    const dispatchRequest = await prisma.ambulanceDispatch.create({
      data: {
        id: `disp_${Date.now()}`, // Generate ID
        ambulanceId: availableAmbulance.id,
        driverId: driver.id,
        patientId,
        requestedBy,
        pickupLocation,
        dropLocation,
        purpose,
        priority: priority || "NORMAL",
        notes,
        updatedAt: new Date(),
        // Status starts as REQUESTED, will be updated to ASSIGNED
        status: "ASSIGNED",
      },
    });

    // Update ambulance status
    await prisma.ambulance.update({
      where: { id: availableAmbulance.id },
      data: {
        status: "IN_USE",
        updatedAt: new Date(),
      },
    });

    // Update driver availability
    await prisma.ambulanceDriver.update({
      where: { id: driver.id },
      data: {
        isAvailable: false,
        updatedAt: new Date(),
      },
    });

    // Send WhatsApp alert for emergency dispatch if priority is high
    if (priority === "HIGH" || priority === "EMERGENCY") {
      await sendWhatsAppAlert(dispatchRequest, availableAmbulance, driver);
    }

    return NextResponse.json(dispatchRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating dispatch request:", error);
    return NextResponse.json(
      { error: "Failed to create dispatch request" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/dispatch:
 *   put:
 *     summary: Update an ambulance dispatch request status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *     responses:
 *       200:
 *         description: Dispatch request updated successfully
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { id, status, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Dispatch ID is required" },
        { status: 400 }
      );
    }

    // Get the current dispatch
    const currentDispatch = await prisma.ambulanceDispatch.findUnique({
      where: { id },
      include: {
        Ambulance: true,
        AmbulanceDriver: true,
      },
    });

    if (!currentDispatch) {
      return NextResponse.json(
        { error: "Dispatch not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const dispatchUpdate: any = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Update status and timestamp based on the status change
    if (status) {
      dispatchUpdate.status = status;

      switch (status) {
        case "DISPATCHED":
          dispatchUpdate.dispatchedAt = new Date();
          break;
        case "ARRIVED":
          dispatchUpdate.arrivedAt = new Date();
          break;
        case "COMPLETED":
          dispatchUpdate.completedAt = new Date();
          
          // Free up the ambulance and driver
          await Promise.all([
            prisma.ambulance.update({
              where: { id: currentDispatch.ambulanceId },
              data: {
                status: "AVAILABLE",
                updatedAt: new Date(),
              },
            }),
            prisma.ambulanceDriver.update({
              where: { id: currentDispatch.driverId },
              data: {
                isAvailable: true,
                updatedAt: new Date(),
              },
            }),
          ]);

          // Generate billing if not already created
          const existingBilling = await prisma.ambulanceBilling.findUnique({
            where: { dispatchId: id },
          });

          if (!existingBilling) {
            // Calculate estimated distance and charges
            const baseCharge = 500; // Base charge in INR
            const distanceCharge = calculateDistanceCharge(
              currentDispatch.pickupLocation,
              currentDispatch.dropLocation
            );

            await prisma.ambulanceBilling.create({
              data: {
                id: `ambill_${Date.now()}`,
                dispatchId: id,
                baseCharge,
                distanceCharge,
                totalAmount: baseCharge + distanceCharge,
                paymentStatus: "PENDING",
                updatedAt: new Date(),
              },
            });
          }
          break;
        case "CANCELLED":
          // Free up the ambulance and driver
          await Promise.all([
            prisma.ambulance.update({
              where: { id: currentDispatch.ambulanceId },
              data: {
                status: "AVAILABLE",
                updatedAt: new Date(),
              },
            }),
            prisma.ambulanceDriver.update({
              where: { id: currentDispatch.driverId },
              data: {
                isAvailable: true,
                updatedAt: new Date(),
              },
            }),
          ]);
          break;
      }
    }

    // Update the dispatch
    const updatedDispatch = await prisma.ambulanceDispatch.update({
      where: { id },
      data: dispatchUpdate,
      include: {
        Ambulance: true,
        AmbulanceDriver: true,
        AmbulanceBilling: true,
      },
    });

    return NextResponse.json(updatedDispatch);
  } catch (error) {
    console.error("Error updating dispatch:", error);
    return NextResponse.json(
      { error: "Failed to update dispatch" },
      { status: 500 }
    );
  }
}

// Helper function: Find the best available ambulance based on purpose and priority
async function findBestAvailableAmbulance(purpose: string, priority: string = "NORMAL") {
  let vehicleType = null;

  // Determine required vehicle type based on purpose
  if (purpose.toLowerCase().includes("emergency") || 
      purpose.toLowerCase().includes("critical") ||
      priority === "EMERGENCY") {
    vehicleType = "ADVANCED_LIFE_SUPPORT";
  } else if (purpose.toLowerCase().includes("newborn") || 
            purpose.toLowerCase().includes("neonatal")) {
    vehicleType = "NEONATAL";
  } else if (purpose.toLowerCase().includes("icu") || 
            purpose.toLowerCase().includes("intensive care")) {
    vehicleType = "MOBILE_ICU";
  }

  // First try to find ambulance of the required type
  let ambulance = null;
  
  if (vehicleType) {
    ambulance = await prisma.ambulance.findFirst({
      where: {
        status: "AVAILABLE",
        vehicleType,
      },
      orderBy: {
        lastMaintenance: "desc", // Prioritize recently maintained ambulances
      },
    });
  }

  // If no specific type ambulance found, or no specific type required, 
  // fall back to any available ambulance
  if (!ambulance) {
    ambulance = await prisma.ambulance.findFirst({
      where: {
        status: "AVAILABLE",
      },
      orderBy: {
        // For high priority, prioritize advanced life support
        ...(priority === "HIGH" || priority === "EMERGENCY" 
          ? { vehicleType: "desc" } 
          : { lastMaintenance: "desc" }),
      },
    });
  }

  return ambulance;
}

// Helper function: Send WhatsApp alert for emergency dispatch
async function sendWhatsAppAlert(dispatch: any, ambulance: any, driver: any) {
  // In a real implementation, this would integrate with WhatsApp Business API
  console.log("EMERGENCY ALERT: Sending WhatsApp notification for dispatch", dispatch.id);
  
  // This is a mock implementation
  // In production, you would use an actual WhatsApp API client
  // For example, using Twilio:
  /*
  const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `EMERGENCY DISPATCH ALERT: 
      Ambulance ${ambulance.registrationNumber} has been dispatched to ${dispatch.pickupLocation}.
      Driver: ${driver.name}, Purpose: ${dispatch.purpose}, Priority: ${dispatch.priority}`,
    from: 'whatsapp:+14155238886',  // Your Twilio WhatsApp number
    to: 'whatsapp:+919876543210'    // Hospital emergency team WhatsApp
  });
  */
  
  return true;
}

// Helper function: Calculate distance-based charges
function calculateDistanceCharge(pickupLocation: string, dropLocation: string) {
  // In a real implementation, this would use Google Maps Distance Matrix API
  // or a similar service to calculate actual distance and charge accordingly
  
  // For now, we'll use a random value between 100 and 500
  const distanceCharge = Math.floor(Math.random() * 400) + 100;
  return distanceCharge;
}
