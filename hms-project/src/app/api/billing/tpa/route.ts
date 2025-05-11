import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch all TPA providers or a specific one
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (id) {
      // Fetch specific TPA provider
      const tpaProvider = await prisma.tpaProvider.findUnique({
        where: { id },
        include: {
          insuranceClaims: true,
        },
      });

      if (!tpaProvider) {
        return NextResponse.json(
          { error: "TPA provider not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(tpaProvider);
    } else {
      // Fetch all TPA providers with pagination
      const [tpaProviders, total] = await Promise.all([
        prisma.tpaProvider.findMany({
          skip,
          take: limit,
          orderBy: { name: "asc" },
        }),
        prisma.tpaProvider.count(),
      ]);

      return NextResponse.json({
        data: tpaProviders,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching TPA providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch TPA providers" },
      { status: 500 }
    );
  }
}

// POST: Create a new TPA provider
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      name,
      code,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      apiEndpoint,
      apiKey,
      isActive,
    } = data;

    // Validate required fields
    if (!name || !code || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create TPA provider
    const tpaProvider = await prisma.tpaProvider.create({
      data: {
        name,
        code,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        country: country || "India",
        apiEndpoint,
        apiKey,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(tpaProvider, { status: 201 });
  } catch (error) {
    console.error("Error creating TPA provider:", error);
    return NextResponse.json(
      { error: "Failed to create TPA provider" },
      { status: 500 }
    );
  }
}

// PUT: Update a TPA provider
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
        { error: "TPA provider ID is required" },
        { status: 400 }
      );
    }

    // Update TPA provider
    const updatedProvider = await prisma.tpaProvider.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error("Error updating TPA provider:", error);
    return NextResponse.json(
      { error: "Failed to update TPA provider" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a TPA provider
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
        { error: "TPA provider ID is required" },
        { status: 400 }
      );
    }

    // Check if TPA provider is being used in any insurance claims
    const claimsCount = await prisma.insuranceClaim.count({
      where: { tpaProviderId: id },
    });

    if (claimsCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete TPA provider as it is associated with insurance claims",
        },
        { status: 400 }
      );
    }

    // Delete TPA provider
    await prisma.tpaProvider.delete({
      where: { id },
    });

    return NextResponse.json({ message: "TPA provider deleted successfully" });
  } catch (error) {
    console.error("Error deleting TPA provider:", error);
    return NextResponse.json(
      { error: "Failed to delete TPA provider" },
      { status: 500 }
    );
  }
}

// POST: Process claim with TPA
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { claimId, action } = data;

    if (!claimId || !action) {
      return NextResponse.json(
        { error: "Claim ID and action are required" },
        { status: 400 }
      );
    }

    // Get the claim
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: claimId },
      include: {
        tpaProvider: true,
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Insurance claim not found" },
        { status: 404 }
      );
    }

    // Process the claim based on the action
    let updatedClaim;
    switch (action) {
      case "SUBMIT_TO_TPA":
        updatedClaim = await prisma.insuranceClaim.update({
          where: { id: claimId },
          data: {
            status: "SUBMITTED_TO_TPA",
            tpaSubmissionDate: new Date(),
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
        });
        break;
      case "APPROVE":
        updatedClaim = await prisma.insuranceClaim.update({
          where: { id: claimId },
          data: {
            status: "APPROVED",
            tpaApprovalDate: new Date(),
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
        });
        break;
      case "REJECT":
        updatedClaim = await prisma.insuranceClaim.update({
          where: { id: claimId },
          data: {
            status: "REJECTED",
            tpaRejectionDate: new Date(),
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
        });
        break;
      case "REQUEST_INFO":
        updatedClaim = await prisma.insuranceClaim.update({
          where: { id: claimId },
          data: {
            status: "INFO_REQUESTED",
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error("Error processing TPA claim:", error);
    return NextResponse.json(
      { error: "Failed to process TPA claim" },
      { status: 500 }
    );
  }
}
