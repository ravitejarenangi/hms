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
    const testId = url.searchParams.get("testId") || undefined;
    const sampleId = url.searchParams.get("sampleId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    if (testId) {
      where.testId = testId;
    }

    if (sampleId) {
      where.sampleId = sampleId;
    }

    if (status) {
      where.status = status;
    }

    const [samples, total] = await Promise.all([
      prisma.sample.findMany({
        where,
        skip,
        take: limit,
        orderBy: { collectedAt: "desc" },
        include: {
          test: {
            include: {
              testCatalog: true,
            },
          },
        },
      }),
      prisma.sample.count({ where }),
    ]);

    return NextResponse.json({
      samples,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching samples:", error);
    return NextResponse.json(
      { error: "Failed to fetch samples" },
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
      sampleType,
      sampleId,
      collectedBy,
      collectedAt,
      notes,
    } = data;

    // Validate required fields
    if (!testId || !sampleType || !sampleId || !collectedBy || !collectedAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    // Check if sample ID already exists
    const existingSample = await prisma.sample.findUnique({
      where: { sampleId },
    });

    if (existingSample) {
      return NextResponse.json(
        { error: "Sample ID already exists" },
        { status: 400 }
      );
    }

    // Create sample
    const sample = await prisma.sample.create({
      data: {
        testId,
        sampleType,
        sampleId,
        collectedBy,
        collectedAt: new Date(collectedAt),
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

    // Update test status
    await prisma.test.update({
      where: { id: testId },
      data: { status: "SAMPLE_COLLECTED" },
    });

    return NextResponse.json(sample, { status: 201 });
  } catch (error) {
    console.error("Error creating sample:", error);
    return NextResponse.json(
      { error: "Failed to create sample" },
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
      status,
      receivedBy,
      receivedAt,
      rejectionReason,
      notes,
    } = data;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }

    // Check if sample exists
    const existingSample = await prisma.sample.findUnique({
      where: { id },
      include: {
        test: true,
      },
    });

    if (!existingSample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }

    // Update sample
    const updateData: any = {
      status,
      notes,
    };

    if (status === "RECEIVED") {
      if (!receivedBy || !receivedAt) {
        return NextResponse.json(
          { error: "Received by and received at are required for received status" },
          { status: 400 }
        );
      }
      updateData.receivedBy = receivedBy;
      updateData.receivedAt = new Date(receivedAt);

      // Update test status
      await prisma.test.update({
        where: { id: existingSample.testId },
        data: { status: "IN_PROGRESS" },
      });
    } else if (status === "REJECTED") {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required for rejected status" },
          { status: 400 }
        );
      }
      updateData.rejectionReason = rejectionReason;
    } else if (status === "ANALYZED") {
      // Update test status
      await prisma.test.update({
        where: { id: existingSample.testId },
        data: { status: "COMPLETED" },
      });
    }

    const updatedSample = await prisma.sample.update({
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

    return NextResponse.json(updatedSample);
  } catch (error) {
    console.error("Error updating sample:", error);
    return NextResponse.json(
      { error: "Failed to update sample" },
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
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }

    // Check if sample exists
    const existingSample = await prisma.sample.findUnique({
      where: { id },
      include: {
        test: true,
      },
    });

    if (!existingSample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }

    // Only allow deletion if sample is in COLLECTED or REJECTED status
    if (existingSample.status !== "COLLECTED" && existingSample.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Cannot delete sample that is in processing or analyzed" },
        { status: 400 }
      );
    }

    // Delete sample
    await prisma.sample.delete({
      where: { id },
    });

    // If this was the only sample for the test, update test status back to REQUESTED
    const remainingSamples = await prisma.sample.count({
      where: { testId: existingSample.testId },
    });

    if (remainingSamples === 0) {
      await prisma.test.update({
        where: { id: existingSample.testId },
        data: { status: "REQUESTED" },
      });
    }

    return NextResponse.json({
      message: "Sample deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sample:", error);
    return NextResponse.json(
      { error: "Failed to delete sample" },
      { status: 500 }
    );
  }
}
