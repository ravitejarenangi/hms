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
    const searchQuery = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || undefined;
    const isActive = url.searchParams.get("isActive") === "true" ? true : undefined;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { code: { contains: searchQuery, mode: "insensitive" } },
      ],
    };

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [tests, total] = await Promise.all([
      prisma.testCatalog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          referenceRanges: true,
        },
      }),
      prisma.testCatalog.count({ where }),
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
    console.error("Error fetching test catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch test catalog" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const data = await req.json();
    const {
      name,
      code,
      category,
      description,
      price,
      duration,
      preparation,
      sampleRequired,
      sampleType,
      reportTemplate,
      department,
      referenceRanges,
    } = data;

    // Validate required fields
    if (!name || !code || !category || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if test code already exists
    const existingTest = await prisma.testCatalog.findUnique({
      where: { code },
    });

    if (existingTest) {
      return NextResponse.json(
        { error: "Test code already exists" },
        { status: 400 }
      );
    }

    // Create test catalog entry with reference ranges if provided
    const test = await prisma.testCatalog.create({
      data: {
        name,
        code,
        category,
        description,
        price,
        duration,
        preparation,
        sampleRequired,
        sampleType,
        reportTemplate,
        department,
        ...(referenceRanges && {
          referenceRanges: {
            createMany: {
              data: referenceRanges,
            },
          },
        }),
      },
      include: {
        referenceRanges: true,
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating test catalog entry:", error);
    return NextResponse.json(
      { error: "Failed to create test catalog entry" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const data = await req.json();
    const {
      id,
      name,
      code,
      category,
      description,
      price,
      duration,
      preparation,
      sampleRequired,
      sampleType,
      reportTemplate,
      department,
      isActive,
    } = data;

    // Validate required fields
    if (!id || !name || !code || !category || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if test exists
    const existingTest = await prisma.testCatalog.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    // Check if updated code conflicts with another test
    if (code !== existingTest.code) {
      const codeConflict = await prisma.testCatalog.findUnique({
        where: { code },
      });

      if (codeConflict) {
        return NextResponse.json(
          { error: "Test code already in use" },
          { status: 400 }
        );
      }
    }

    // Update test catalog entry
    const updatedTest = await prisma.testCatalog.update({
      where: { id },
      data: {
        name,
        code,
        category,
        description,
        price,
        duration,
        preparation,
        sampleRequired,
        sampleType,
        reportTemplate,
        department,
        isActive,
      },
    });

    return NextResponse.json(updatedTest);
  } catch (error) {
    console.error("Error updating test catalog entry:", error);
    return NextResponse.json(
      { error: "Failed to update test catalog entry" },
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
    const existingTest = await prisma.testCatalog.findUnique({
      where: { id },
      include: {
        tests: true,
      },
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    // If test is in use, don't delete it but mark as inactive
    if (existingTest.tests.length > 0) {
      await prisma.testCatalog.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "Test has been marked as inactive as it is in use",
      });
    }

    // Delete reference ranges first
    await prisma.referenceRange.deleteMany({
      where: { testCatalogId: id },
    });

    // Delete test catalog entry
    await prisma.testCatalog.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Test catalog entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test catalog entry:", error);
    return NextResponse.json(
      { error: "Failed to delete test catalog entry" },
      { status: 500 }
    );
  }
}
