import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * @swagger
 * /api/ambulances/inventory:
 *   get:
 *     summary: Get ambulance inventory with optional filtering
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE]
 *       - name: vehicleType
 *         in: query
 *         schema:
 *           type: string
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
 *         description: List of ambulances with pagination metadata
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const vehicleType = searchParams.get("vehicleType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (status) where.status = status;
    if (vehicleType) where.vehicleType = vehicleType;

    // Fetch ambulances with pagination
    const [ambulances, total] = await Promise.all([
      prisma.ambulance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          AmbulanceEquipment: true,
          AmbulanceDriver: {
            where: { isAvailable: true },
          },
          _count: {
            select: {
              AmbulanceMaintenanceRecord: true,
              AmbulanceDispatch: true,
            },
          },
        },
      }),
      prisma.ambulance.count({ where }),
    ]);

    return NextResponse.json({
      data: ambulances,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching ambulances:", error);
    return NextResponse.json(
      { error: "Failed to fetch ambulances" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/inventory:
 *   post:
 *     summary: Add a new ambulance to inventory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationNumber
 *               - vehicleModel
 *               - vehicleType
 *               - manufacturingYear
 *               - capacity
 *     responses:
 *       201:
 *         description: Ambulance created successfully
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      registrationNumber,
      vehicleModel,
      vehicleType,
      manufacturingYear,
      capacity,
      features,
      purchaseDate,
      insuranceExpiry,
    } = data;

    // Validate required fields
    if (
      !registrationNumber ||
      !vehicleModel ||
      !vehicleType ||
      !manufacturingYear ||
      !capacity
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if ambulance with same registration number exists
    const existingAmbulance = await prisma.ambulance.findUnique({
      where: { registrationNumber },
    });

    if (existingAmbulance) {
      return NextResponse.json(
        { error: "Ambulance with this registration number already exists" },
        { status: 409 }
      );
    }

    // Create ambulance
    const newAmbulance = await prisma.ambulance.create({
      data: {
        id: `amb_${Date.now()}`, // Generate ID
        registrationNumber,
        vehicleModel,
        vehicleType,
        manufacturingYear,
        capacity,
        features: features || [],
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        insuranceExpiry: insuranceExpiry
          ? new Date(insuranceExpiry)
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(newAmbulance, { status: 201 });
  } catch (error) {
    console.error("Error creating ambulance:", error);
    return NextResponse.json(
      { error: "Failed to create ambulance" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/inventory:
 *   put:
 *     summary: Update ambulance details
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
 *         description: Ambulance updated successfully
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
        { error: "Ambulance ID is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const ambulanceUpdate = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Update dates if provided
    if (updateData.purchaseDate) {
      ambulanceUpdate.purchaseDate = new Date(updateData.purchaseDate);
    }
    if (updateData.insuranceExpiry) {
      ambulanceUpdate.insuranceExpiry = new Date(updateData.insuranceExpiry);
    }
    if (updateData.lastMaintenance) {
      ambulanceUpdate.lastMaintenance = new Date(updateData.lastMaintenance);
    }
    if (updateData.nextMaintenance) {
      ambulanceUpdate.nextMaintenance = new Date(updateData.nextMaintenance);
    }

    // Update ambulance
    const updatedAmbulance = await prisma.ambulance.update({
      where: { id },
      data: ambulanceUpdate,
    });

    return NextResponse.json(updatedAmbulance);
  } catch (error) {
    console.error("Error updating ambulance:", error);
    return NextResponse.json(
      { error: "Failed to update ambulance" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/inventory:
 *   delete:
 *     summary: Delete an ambulance
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ambulance deleted successfully
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
        { error: "Ambulance ID is required" },
        { status: 400 }
      );
    }

    // Check if ambulance is in use
    const activeDispatch = await prisma.ambulanceDispatch.findFirst({
      where: {
        ambulanceId: id,
        status: {
          in: ["DISPATCHED", "IN_PROGRESS"],
        },
      },
    });

    if (activeDispatch) {
      return NextResponse.json(
        { error: "Cannot delete ambulance that is currently in use" },
        { status: 400 }
      );
    }

    // Delete related records first (cascade manually due to foreign key constraints)
    await prisma.$transaction([
      prisma.ambulanceEquipment.deleteMany({
        where: { ambulanceId: id },
      }),
      prisma.ambulanceMaintenanceRecord.deleteMany({
        where: { ambulanceId: id },
      }),
      prisma.ambulanceDriver.deleteMany({
        where: { ambulanceId: id },
      }),
      prisma.ambulance.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ambulance:", error);
    return NextResponse.json(
      { error: "Failed to delete ambulance" },
      { status: 500 }
    );
  }
}
