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
    const status = url.searchParams.get("status") || undefined;
    const priority = url.searchParams.get("priority") || undefined;
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

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (startDate && endDate) {
      where.requestedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.requestedAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.requestedAt = {
        lte: new Date(endDate),
      };
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: "desc" },
        include: {
          testCatalog: true,
          samples: true,
        },
      }),
      prisma.test.count({ where }),
    ]);

    return NextResponse.json({
      tests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching test requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch test requests" },
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
      testCatalogId,
      patientId,
      requestedBy,
      scheduledAt,
      priority,
      notes,
    } = data;

    // Validate required fields
    if (!testCatalogId || !patientId || !requestedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if test catalog exists
    const testCatalog = await prisma.testCatalog.findUnique({
      where: { id: testCatalogId },
    });

    if (!testCatalog) {
      return NextResponse.json(
        { error: "Test catalog not found" },
        { status: 404 }
      );
    }

    // Create test request
    const test = await prisma.test.create({
      data: {
        testCatalogId,
        patientId,
        requestedBy,
        scheduledAt,
        priority: priority || "ROUTINE",
        notes,
      },
      include: {
        testCatalog: true,
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating test request:", error);
    return NextResponse.json(
      { error: "Failed to create test request" },
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
      scheduledAt,
      status,
      priority,
      notes,
    } = data;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Check if test exists
    const existingTest = await prisma.test.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    // Update test request
    const updatedTest = await prisma.test.update({
      where: { id },
      data: {
        scheduledAt,
        status,
        priority,
        notes,
      },
      include: {
        testCatalog: true,
        samples: true,
      },
    });

    return NextResponse.json(updatedTest);
  } catch (error) {
    console.error("Error updating test request:", error);
    return NextResponse.json(
      { error: "Failed to update test request" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Check if test exists
    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: {
        samples: true,
        results: true,
        criticalValues: true,
      },
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    // If test has samples, results, or critical values, don't delete it but mark as cancelled
    if (
      existingTest.samples.length > 0 ||
      existingTest.results.length > 0 ||
      existingTest.criticalValues.length > 0
    ) {
      await prisma.test.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        message: "Test has been marked as cancelled as it has associated data",
      });
    }

    // Delete test
    await prisma.test.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Test request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test request:", error);
    return NextResponse.json(
      { error: "Failed to delete test request" },
      { status: 500 }
    );
  }
}
