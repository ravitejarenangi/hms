import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * @swagger
 * /api/ambulances/drivers:
 *   get:
 *     summary: Get ambulance drivers with optional filtering
 *     parameters:
 *       - name: ambulanceId
 *         in: query
 *         schema:
 *           type: string
 *       - name: available
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of ambulance drivers with pagination metadata
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ambulanceId = searchParams.get("ambulanceId");
    const id = searchParams.get("id");
    const available = searchParams.get("available");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Check if a specific driver is requested
    if (id) {
      const driver = await prisma.ambulanceDriver.findUnique({
        where: { id },
        include: {
          Ambulance: true,
          AmbulanceDispatch: {
            take: 5,
            orderBy: { requestedAt: "desc" },
          },
        },
      });

      if (!driver) {
        return NextResponse.json(
          { error: "Driver not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(driver);
    }

    // Build filter
    const where: any = {};
    if (ambulanceId) where.ambulanceId = ambulanceId;
    if (available !== null) where.isAvailable = available === "true";

    // Fetch drivers with pagination
    const [drivers, total] = await Promise.all([
      prisma.ambulanceDriver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          Ambulance: {
            select: {
              id: true,
              registrationNumber: true,
              vehicleModel: true,
              vehicleType: true,
            },
          },
          _count: {
            select: {
              AmbulanceDispatch: true,
            },
          },
        },
      }),
      prisma.ambulanceDriver.count({ where }),
    ]);

    return NextResponse.json({
      data: drivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching ambulance drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch ambulance drivers" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/drivers:
 *   post:
 *     summary: Assign a driver to an ambulance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ambulanceId
 *               - driverId
 *               - licenseNumber
 *     responses:
 *       201:
 *         description: Driver assigned successfully
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      ambulanceId,
      driverId,
      licenseNumber,
      licenseExpiry,
    } = data;

    // Validate required fields
    if (!ambulanceId || !driverId || !licenseNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if ambulance exists
    const ambulance = await prisma.ambulance.findUnique({
      where: { id: ambulanceId },
    });

    if (!ambulance) {
      return NextResponse.json(
        { error: "Ambulance not found" },
        { status: 404 }
      );
    }

    // Check if driver is already assigned to this ambulance
    const existingAssignment = await prisma.ambulanceDriver.findFirst({
      where: {
        ambulanceId,
        driverId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Driver is already assigned to this ambulance" },
        { status: 409 }
      );
    }

    // Create driver assignment
    const driverAssignment = await prisma.ambulanceDriver.create({
      data: {
        id: `ambdrv_${Date.now()}`, // Generate ID
        ambulanceId,
        driverId,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
        isAvailable: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(driverAssignment, { status: 201 });
  } catch (error) {
    console.error("Error assigning driver:", error);
    return NextResponse.json(
      { error: "Failed to assign driver" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/drivers:
 *   put:
 *     summary: Update driver assignment details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: Driver assignment updated successfully
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Driver assignment ID is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const driverUpdate = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Update license expiry if provided
    if (updateData.licenseExpiry) {
      driverUpdate.licenseExpiry = new Date(updateData.licenseExpiry);
    }

    // Update driver assignment
    const updatedDriver = await prisma.ambulanceDriver.update({
      where: { id },
      data: driverUpdate,
      include: {
        Ambulance: true,
      },
    });

    return NextResponse.json(updatedDriver);
  } catch (error) {
    console.error("Error updating driver assignment:", error);
    return NextResponse.json(
      { error: "Failed to update driver assignment" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/drivers:
 *   delete:
 *     summary: Remove a driver assignment
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Driver assignment removed successfully
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Driver assignment ID is required" },
        { status: 400 }
      );
    }

    // Check if driver is currently on dispatch
    const activeDispatch = await prisma.ambulanceDispatch.findFirst({
      where: {
        driverId: id,
        status: {
          in: ["DISPATCHED", "IN_PROGRESS"],
        },
      },
    });

    if (activeDispatch) {
      return NextResponse.json(
        { error: "Cannot remove driver that is currently on active dispatch" },
        { status: 400 }
      );
    }

    // Delete driver assignment
    await prisma.ambulanceDriver.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing driver assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove driver assignment" },
      { status: 500 }
    );
  }
}
