import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch all insurance claims
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (patientId) whereClause.patientId = patientId;
    if (status) whereClause.status = status;

    const [insuranceClaims, total] = await Promise.all([
      prisma.insuranceClaim.findMany({
        where: whereClause,
        include: {
          patient: true,
          invoice: true,
          insuranceProvider: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.insuranceClaim.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: insuranceClaims,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching insurance claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch insurance claims" },
      { status: 500 }
    );
  }
}

// POST: Create a new insurance claim
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      patientId,
      invoiceId,
      insuranceProviderId,
      policyNumber,
      claimAmount,
      coveragePercentage,
      approvedAmount,
      status,
      documents,
      notes,
    } = data;

    // Validate required fields
    if (!patientId || !invoiceId || !insuranceProviderId || !policyNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create insurance claim
    const insuranceClaim = await prisma.insuranceClaim.create({
      data: {
        patientId,
        invoiceId,
        insuranceProviderId,
        policyNumber,
        claimAmount,
        coveragePercentage,
        approvedAmount: approvedAmount || null,
        status: status || "SUBMITTED",
        documents: documents || [],
        notes: notes || "",
        submittedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        patient: true,
        invoice: true,
        insuranceProvider: true,
      },
    });

    return NextResponse.json(insuranceClaim, { status: 201 });
  } catch (error) {
    console.error("Error creating insurance claim:", error);
    return NextResponse.json(
      { error: "Failed to create insurance claim" },
      { status: 500 }
    );
  }
}

// PUT: Update an insurance claim
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
        { error: "Insurance claim ID is required" },
        { status: 400 }
      );
    }

    // Update insurance claim
    const updatedClaim = await prisma.insuranceClaim.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        patient: true,
        invoice: true,
        insuranceProvider: true,
      },
    });

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error("Error updating insurance claim:", error);
    return NextResponse.json(
      { error: "Failed to update insurance claim" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an insurance claim
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
        { error: "Insurance claim ID is required" },
        { status: 400 }
      );
    }

    // Delete insurance claim
    await prisma.insuranceClaim.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Insurance claim deleted successfully" });
  } catch (error) {
    console.error("Error deleting insurance claim:", error);
    return NextResponse.json(
      { error: "Failed to delete insurance claim" },
      { status: 500 }
    );
  }
}
