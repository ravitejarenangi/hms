import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const patientId = url.searchParams.get("patientId") || undefined;
    const testId = url.searchParams.get("testId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (testId) {
      where.testId = testId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate),
      };
    }

    // Get billing records
    const [billings, total] = await Promise.all([
      prisma.labBilling.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          test: {
            include: {
              testCatalog: true,
            },
          },
        },
      }),
      prisma.labBilling.count({ where }),
    ]);

    return NextResponse.json({
      billings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching lab billing records:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab billing records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      testId,
      patientId,
      amount,
      discount,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus,
      insuranceCovered,
      insuranceAmount,
      insuranceProvider,
      insurancePolicyNumber,
      notes,
    } = data;

    // Validate required fields
    if (!testId || !patientId || !amount || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    // Check if billing already exists for this test
    const existingBilling = await prisma.labBilling.findFirst({
      where: { testId },
    });

    if (existingBilling) {
      return NextResponse.json(
        { error: "Billing already exists for this test" },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `LAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create billing record
    const billing = await prisma.labBilling.create({
      data: {
        testId,
        patientId,
        invoiceNumber,
        amount,
        discount: discount || 0,
        tax: tax || 0,
        totalAmount,
        paymentMethod: paymentMethod || "CASH",
        paymentStatus: paymentStatus || "PENDING",
        insuranceCovered: insuranceCovered || false,
        insuranceAmount: insuranceAmount || 0,
        insuranceProvider,
        insurancePolicyNumber,
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

    // Create financial transaction record
    await prisma.financialTransaction.create({
      data: {
        transactionNumber: invoiceNumber,
        transactionType: "INCOME",
        amount: totalAmount,
        paymentMethod: paymentMethod || "CASH",
        status: paymentStatus || "PENDING",
        category: "LABORATORY",
        description: `Laboratory test: ${test.testCatalog.name}`,
        patientId,
        departmentId: "LABORATORY", // Assuming department ID for laboratory
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(billing, { status: 201 });
  } catch (error) {
    console.error("Error creating lab billing record:", error);
    return NextResponse.json(
      { error: "Failed to create lab billing record" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      id,
      discount,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus,
      insuranceCovered,
      insuranceAmount,
      insuranceProvider,
      insurancePolicyNumber,
      notes,
    } = data;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Billing ID is required" },
        { status: 400 }
      );
    }

    // Check if billing exists
    const existingBilling = await prisma.labBilling.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            testCatalog: true,
          },
        },
      },
    });

    if (!existingBilling) {
      return NextResponse.json(
        { error: "Billing record not found" },
        { status: 404 }
      );
    }

    // Update billing record
    const updatedBilling = await prisma.labBilling.update({
      where: { id },
      data: {
        discount,
        tax,
        totalAmount,
        paymentMethod,
        paymentStatus,
        insuranceCovered,
        insuranceAmount,
        insuranceProvider,
        insurancePolicyNumber,
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

    // Update financial transaction if payment status changed
    if (paymentStatus && paymentStatus !== existingBilling.paymentStatus) {
      await prisma.financialTransaction.updateMany({
        where: { transactionNumber: existingBilling.invoiceNumber },
        data: {
          status: paymentStatus,
          amount: totalAmount || existingBilling.totalAmount,
          paymentMethod: paymentMethod || existingBilling.paymentMethod,
        },
      });
    }

    return NextResponse.json(updatedBilling);
  } catch (error) {
    console.error("Error updating lab billing record:", error);
    return NextResponse.json(
      { error: "Failed to update lab billing record" },
      { status: 500 }
    );
  }
}
