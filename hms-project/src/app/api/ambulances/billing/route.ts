import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * @swagger
 * /api/ambulances/billing:
 *   get:
 *     summary: Get ambulance billing records with optional filtering
 *     parameters:
 *       - name: dispatchId
 *         in: query
 *         schema:
 *           type: string
 *       - name: paymentStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, PARTIAL, CANCELLED, INSURANCE_PENDING]
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
 *         description: List of ambulance billing records with pagination metadata
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const dispatchId = searchParams.get("dispatchId");
    const paymentStatus = searchParams.get("paymentStatus");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Check if a specific billing record is requested
    if (id) {
      const billingRecord = await prisma.ambulanceBilling.findUnique({
        where: { id },
        include: {
          AmbulanceDispatch: {
            include: {
              Ambulance: true,
              AmbulanceDriver: true,
            },
          },
        },
      });

      if (!billingRecord) {
        return NextResponse.json(
          { error: "Billing record not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(billingRecord);
    }

    // Build filter
    const where: any = {};
    if (dispatchId) where.dispatchId = dispatchId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    
    // Date filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch billing records with pagination
    const [billingRecords, total] = await Promise.all([
      prisma.ambulanceBilling.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          AmbulanceDispatch: {
            include: {
              Ambulance: {
                select: {
                  registrationNumber: true,
                  vehicleType: true,
                },
              },
            },
          },
        },
      }),
      prisma.ambulanceBilling.count({ where }),
    ]);

    return NextResponse.json({
      data: billingRecords,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching ambulance billing records:", error);
    return NextResponse.json(
      { error: "Failed to fetch ambulance billing records" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/billing:
 *   post:
 *     summary: Create a new ambulance billing record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dispatchId
 *               - baseCharge
 *               - distanceCharge
 *               - totalAmount
 *     responses:
 *       201:
 *         description: Billing record created successfully
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      dispatchId,
      baseCharge,
      distanceCharge,
      waitingCharge,
      equipmentCharge,
      totalAmount,
      insuranceCovered,
      insuranceProvider,
      insurancePolicyNumber,
      notes,
    } = data;

    // Validate required fields
    if (!dispatchId || baseCharge === undefined || distanceCharge === undefined || totalAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if dispatch exists
    const dispatch = await prisma.ambulanceDispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch) {
      return NextResponse.json(
        { error: "Dispatch not found" },
        { status: 404 }
      );
    }

    // Check if billing record already exists for this dispatch
    const existingBilling = await prisma.ambulanceBilling.findUnique({
      where: { dispatchId },
    });

    if (existingBilling) {
      return NextResponse.json(
        { error: "Billing record already exists for this dispatch" },
        { status: 409 }
      );
    }

    // Create billing record
    const billingRecord = await prisma.ambulanceBilling.create({
      data: {
        id: `ambulance_bill_${Date.now()}`, // Generate ID
        dispatchId,
        baseCharge: parseFloat(baseCharge.toString()),
        distanceCharge: parseFloat(distanceCharge.toString()),
        waitingCharge: waitingCharge ? parseFloat(waitingCharge.toString()) : null,
        equipmentCharge: equipmentCharge ? parseFloat(equipmentCharge.toString()) : null,
        totalAmount: parseFloat(totalAmount.toString()),
        insuranceCovered: insuranceCovered || false,
        insuranceProvider,
        insurancePolicyNumber,
        paymentStatus: insuranceCovered ? "INSURANCE_PENDING" : "PENDING",
        notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(billingRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating ambulance billing record:", error);
    return NextResponse.json(
      { error: "Failed to create ambulance billing record" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/billing:
 *   put:
 *     summary: Update an ambulance billing record
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
 *         description: Billing record updated successfully
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
        { error: "Billing record ID is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const billingUpdate: any = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Parse numeric values
    if (updateData.baseCharge !== undefined) {
      billingUpdate.baseCharge = parseFloat(updateData.baseCharge.toString());
    }
    if (updateData.distanceCharge !== undefined) {
      billingUpdate.distanceCharge = parseFloat(updateData.distanceCharge.toString());
    }
    if (updateData.waitingCharge !== undefined) {
      billingUpdate.waitingCharge = updateData.waitingCharge ? parseFloat(updateData.waitingCharge.toString()) : null;
    }
    if (updateData.equipmentCharge !== undefined) {
      billingUpdate.equipmentCharge = updateData.equipmentCharge ? parseFloat(updateData.equipmentCharge.toString()) : null;
    }
    if (updateData.totalAmount !== undefined) {
      billingUpdate.totalAmount = parseFloat(updateData.totalAmount.toString());
    }

    // Update billing record
    const updatedBillingRecord = await prisma.ambulanceBilling.update({
      where: { id },
      data: billingUpdate,
      include: {
        AmbulanceDispatch: {
          include: {
            Ambulance: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBillingRecord);
  } catch (error) {
    console.error("Error updating ambulance billing record:", error);
    return NextResponse.json(
      { error: "Failed to update ambulance billing record" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ambulances/billing/calculate:
 *   post:
 *     summary: Calculate ambulance billing based on various parameters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - distance
 *               - vehicleType
 *               - serviceLevel
 *               - timeOfDay
 *     responses:
 *       200:
 *         description: Calculated billing breakdown
 */
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  // Check if this is the /calculate endpoint
  const url = new URL(req.url);
  if (!url.pathname.endsWith("/calculate")) {
    // Forward to the default POST handler
    return POST(req);
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      distance,
      vehicleType,
      serviceLevel,
      timeOfDay,
      waitingTime,
      zone,
      equipment,
      medicalStaff,
      insuranceInfo,
    } = data;

    // Validate required fields
    if (distance === undefined || !vehicleType || !serviceLevel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate base rate based on vehicle type and service level
    let baseRate = getBaseRate(vehicleType, serviceLevel);

    // Calculate distance charge
    const distanceRate = getDistanceRate(vehicleType, zone);
    const distanceCharge = distance * distanceRate;

    // Apply time-of-day adjustment
    const timeAdjustment = getTimeAdjustment(timeOfDay);
    const adjustedBaseRate = baseRate * timeAdjustment;

    // Calculate waiting charge
    const waitingCharge = waitingTime ? waitingTime * 2 : 0; // ₹2 per minute

    // Calculate equipment charges
    const equipmentCharge = calculateEquipmentCharge(equipment);

    // Calculate medical staff charges
    const staffCharge = calculateStaffCharge(medicalStaff);

    // Calculate total amount
    const subtotal = adjustedBaseRate + distanceCharge + waitingCharge + equipmentCharge + staffCharge;

    // Calculate insurance coverage (if applicable)
    let insuranceCoverage = 0;
    let patientResponsibility = subtotal;

    if (insuranceInfo) {
      const { provider, policyNumber, coverageType } = insuranceInfo;
      const coverage = calculateInsuranceCoverage(subtotal, coverageType);
      insuranceCoverage = coverage.covered;
      patientResponsibility = coverage.patientResponsibility;
    }

    // Calculate taxes (GST)
    const gstRate = 0.05; // 5% GST for healthcare services
    const tax = patientResponsibility * gstRate;
    const totalAmount = patientResponsibility + tax;

    // Return billing breakdown
    return NextResponse.json({
      breakdown: {
        baseRate: adjustedBaseRate,
        distanceCharge,
        waitingCharge,
        equipmentCharge,
        staffCharge,
        subtotal,
        insuranceCoverage,
        patientResponsibility,
        tax,
        totalAmount,
      },
      rates: {
        baseRate,
        distanceRate,
        timeAdjustment,
        gstRate,
      },
    });
  } catch (error) {
    console.error("Error calculating ambulance billing:", error);
    return NextResponse.json(
      { error: "Failed to calculate ambulance billing" },
      { status: 500 }
    );
  }
}

// Helper functions for billing calculations

// Base rate based on vehicle type and service level
function getBaseRate(vehicleType: string, serviceLevel: string): number {
  const baseRates: { [key: string]: { [key: string]: number } } = {
    "BASIC_LIFE_SUPPORT": {
      "BASIC": 500,
      "STANDARD": 750,
      "PREMIUM": 1000,
    },
    "ADVANCED_LIFE_SUPPORT": {
      "BASIC": 1000,
      "STANDARD": 1500,
      "PREMIUM": 2000,
    },
    "PATIENT_TRANSPORT": {
      "BASIC": 300,
      "STANDARD": 500,
      "PREMIUM": 750,
    },
    "NEONATAL": {
      "BASIC": 1500,
      "STANDARD": 2000,
      "PREMIUM": 2500,
    },
    "MOBILE_ICU": {
      "BASIC": 2000,
      "STANDARD": 2500,
      "PREMIUM": 3000,
    },
  };

  return baseRates[vehicleType]?.[serviceLevel] || 500; // Default to 500 if not found
}

// Distance rate based on vehicle type and zone
function getDistanceRate(vehicleType: string, zone: string = "URBAN"): number {
  const distanceRates: { [key: string]: { [key: string]: number } } = {
    "BASIC_LIFE_SUPPORT": {
      "URBAN": 20,      // ₹20 per km in urban areas
      "SUBURBAN": 25,   // ₹25 per km in suburban areas
      "RURAL": 30,      // ₹30 per km in rural areas
      "HIGHWAY": 25,    // ₹25 per km on highways
    },
    "ADVANCED_LIFE_SUPPORT": {
      "URBAN": 25,
      "SUBURBAN": 30,
      "RURAL": 35,
      "HIGHWAY": 30,
    },
    "PATIENT_TRANSPORT": {
      "URBAN": 15,
      "SUBURBAN": 20,
      "RURAL": 25,
      "HIGHWAY": 20,
    },
    "NEONATAL": {
      "URBAN": 30,
      "SUBURBAN": 35,
      "RURAL": 40,
      "HIGHWAY": 35,
    },
    "MOBILE_ICU": {
      "URBAN": 35,
      "SUBURBAN": 40,
      "RURAL": 45,
      "HIGHWAY": 40,
    },
  };

  return distanceRates[vehicleType]?.[zone] || 20; // Default to ₹20 per km if not found
}

// Time-of-day adjustment factor
function getTimeAdjustment(timeOfDay: string = "NORMAL"): number {
  const adjustments: { [key: string]: number } = {
    "NORMAL": 1.0,     // 6:00 AM to 10:00 PM
    "NIGHT": 1.25,     // 10:00 PM to 6:00 AM
    "HOLIDAY": 1.5,    // Public holidays
  };

  return adjustments[timeOfDay] || 1.0;
}

// Calculate equipment charges
function calculateEquipmentCharge(equipment: string[] = []): number {
  const equipmentRates: { [key: string]: number } = {
    "OXYGEN": 200,
    "VENTILATOR": 500,
    "CARDIAC_MONITOR": 300,
    "DEFIBRILLATOR": 400,
    "INFUSION_PUMP": 250,
    "SUCTION_MACHINE": 150,
  };

  return equipment.reduce((total, item) => total + (equipmentRates[item] || 0), 0);
}

// Calculate medical staff charges
function calculateStaffCharge(staff: { type: string, count: number }[] = []): number {
  const staffRates: { [key: string]: number } = {
    "PARAMEDIC": 300,
    "NURSE": 500,
    "DOCTOR": 1000,
    "SPECIALIST": 2000,
  };

  return staff.reduce((total, item) => total + ((staffRates[item.type] || 0) * (item.count || 1)), 0);
}

// Calculate insurance coverage
function calculateInsuranceCoverage(amount: number, coverageType: string = "BASIC"): { covered: number, patientResponsibility: number } {
  const coverageRates: { [key: string]: number } = {
    "BASIC": 0.6,      // 60% coverage
    "STANDARD": 0.8,   // 80% coverage
    "PREMIUM": 0.9,    // 90% coverage
    "FULL": 1.0,       // 100% coverage
  };

  const coverageRate = coverageRates[coverageType] || 0.6;
  const covered = amount * coverageRate;
  const patientResponsibility = amount - covered;

  return { covered, patientResponsibility };
}
