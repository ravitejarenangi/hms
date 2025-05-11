import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * @swagger
 * /api/ambulances/history:
 *   get:
 *     summary: Get ambulance service history (maintenance and dispatch records)
 *     parameters:
 *       - name: ambulanceId
 *         in: query
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [MAINTENANCE, DISPATCH, ALL]
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Ambulance service history with maintenance and dispatch records
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ambulanceId = searchParams.get("ambulanceId");
    const type = searchParams.get("type") || "ALL";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (!ambulanceId) {
      return NextResponse.json(
        { error: "Ambulance ID is required" },
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

    // Prepare date filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Initialize with empty arrays
    let maintenanceRecords: any[] = [];
    let dispatchRecords: any[] = [];
    let totalMaintenance = 0;
    let totalDispatches = 0;

    // Fetch maintenance records if needed
    if (type === "MAINTENANCE" || type === "ALL") {
      const whereClause: any = {
        ambulanceId,
      };

      if (startDate || endDate) {
        whereClause.performedAt = dateFilter;
      }

      [maintenanceRecords, totalMaintenance] = await Promise.all([
        prisma.ambulanceMaintenanceRecord.findMany({
          where: whereClause,
          skip: type === "MAINTENANCE" ? skip : 0,
          take: type === "MAINTENANCE" ? limit : 100, // Limit to 100 when fetching both
          orderBy: { performedAt: "desc" },
        }),
        prisma.ambulanceMaintenanceRecord.count({
          where: whereClause,
        }),
      ]);
    }

    // Fetch dispatch records if needed
    if (type === "DISPATCH" || type === "ALL") {
      const whereClause: any = {
        ambulanceId,
      };

      if (startDate || endDate) {
        whereClause.requestedAt = dateFilter;
      }

      [dispatchRecords, totalDispatches] = await Promise.all([
        prisma.ambulanceDispatch.findMany({
          where: whereClause,
          skip: type === "DISPATCH" ? skip : 0,
          take: type === "DISPATCH" ? limit : 100, // Limit to 100 when fetching both
          orderBy: { requestedAt: "desc" },
          include: {
            AmbulanceDriver: {
              select: {
                driverId: true,
              },
            },
            AmbulanceBilling: {
              select: {
                totalAmount: true,
                paymentStatus: true,
              },
            },
          },
        }),
        prisma.ambulanceDispatch.count({
          where: whereClause,
        }),
      ]);
    }

    // Combine and sort records for ALL type
    let combinedHistory = [];
    if (type === "ALL") {
      // Convert maintenance records to a common format
      const formattedMaintenanceRecords = maintenanceRecords.map((record) => ({
        id: record.id,
        type: "MAINTENANCE",
        date: record.performedAt,
        details: {
          maintenanceType: record.maintenanceType,
          description: record.description,
          performedBy: record.performedBy,
          cost: record.cost,
        },
      }));

      // Convert dispatch records to a common format
      const formattedDispatchRecords = dispatchRecords.map((record) => ({
        id: record.id,
        type: "DISPATCH",
        date: record.requestedAt,
        details: {
          from: record.pickupLocation,
          to: record.dropLocation,
          status: record.status,
          driver: record.AmbulanceDriver?.driverId,
          billing: record.AmbulanceBilling
            ? {
                amount: record.AmbulanceBilling.totalAmount,
                status: record.AmbulanceBilling.paymentStatus,
              }
            : null,
        },
      }));

      // Combine and sort by date (descending)
      combinedHistory = [...formattedMaintenanceRecords, ...formattedDispatchRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Apply pagination to combined results
      combinedHistory = combinedHistory.slice(skip, skip + limit);
    }

    return NextResponse.json({
      data:
        type === "MAINTENANCE"
          ? maintenanceRecords
          : type === "DISPATCH"
          ? dispatchRecords
          : combinedHistory,
      meta: {
        total:
          type === "MAINTENANCE"
            ? totalMaintenance
            : type === "DISPATCH"
            ? totalDispatches
            : totalMaintenance + totalDispatches,
        page,
        limit,
        totalPages: Math.ceil(
          (type === "MAINTENANCE"
            ? totalMaintenance
            : type === "DISPATCH"
            ? totalDispatches
            : totalMaintenance + totalDispatches) / limit
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching ambulance history:", error);
    return NextResponse.json(
      { error: "Failed to fetch ambulance history" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/history:
 *   post:
 *     summary: Add a new maintenance record to ambulance history
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ambulanceId
 *               - maintenanceType
 *               - description
 *               - performedBy
 *               - performedAt
 *     responses:
 *       201:
 *         description: Maintenance record created successfully
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
      maintenanceType,
      description,
      performedBy,
      performedAt,
      cost,
      odometer,
      nextMaintenanceDue,
      notes,
    } = data;

    // Validate required fields
    if (!ambulanceId || !maintenanceType || !description || !performedBy || !performedAt) {
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

    // Create maintenance record
    const maintenanceRecord = await prisma.ambulanceMaintenanceRecord.create({
      data: {
        id: `ambmaint_${Date.now()}`, // Generate ID
        ambulanceId,
        maintenanceType,
        description,
        performedBy,
        performedAt: new Date(performedAt),
        cost: cost ? parseFloat(cost.toString()) : null,
        odometer: odometer ? parseInt(odometer.toString(), 10) : null,
        nextMaintenanceDue: nextMaintenanceDue ? new Date(nextMaintenanceDue) : null,
        notes,
        updatedAt: new Date(),
      },
    });

    // Update ambulance last maintenance and next maintenance dates
    await prisma.ambulance.update({
      where: { id: ambulanceId },
      data: {
        lastMaintenance: new Date(performedAt),
        nextMaintenance: nextMaintenanceDue ? new Date(nextMaintenanceDue) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(maintenanceRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance record" },
      { status: 500 }
    );
  }
}
