import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch all subsidy schemes or a specific one
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (isActive === "true") whereClause.isActive = true;
    if (isActive === "false") whereClause.isActive = false;

    if (id) {
      // Fetch specific subsidy scheme
      const subsidyScheme = await prisma.subsidyScheme.findUnique({
        where: { id },
        include: {
          eligibilityCriteria: true,
          subsidyCoverage: true,
        },
      });

      if (!subsidyScheme) {
        return NextResponse.json(
          { error: "Subsidy scheme not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(subsidyScheme);
    } else {
      // Fetch all subsidy schemes with pagination
      const [subsidySchemes, total] = await Promise.all([
        prisma.subsidyScheme.findMany({
          where: whereClause,
          include: {
            eligibilityCriteria: true,
            subsidyCoverage: {
              take: 5, // Limit the number of coverage items for list view
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.subsidyScheme.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        data: subsidySchemes,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching subsidy schemes:", error);
    return NextResponse.json(
      { error: "Failed to fetch subsidy schemes" },
      { status: 500 }
    );
  }
}

// POST: Create a new subsidy scheme
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      schemeName,
      schemeCode,
      description,
      sponsoringAuthority,
      startDate,
      endDate,
      maxBeneficiaries,
      totalBudget,
      isActive,
      eligibilityCriteria,
      subsidyCoverage,
    } = data;

    // Validate required fields
    if (!schemeName || !schemeCode || !sponsoringAuthority || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create subsidy scheme with nested eligibility criteria and coverage
    const subsidyScheme = await prisma.subsidyScheme.create({
      data: {
        schemeName,
        schemeCode,
        description,
        sponsoringAuthority,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxBeneficiaries,
        totalBudget,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        eligibilityCriteria: {
          create: eligibilityCriteria?.map((criteria: any) => ({
            criteriaType: criteria.criteriaType,
            criteriaValue: criteria.criteriaValue,
            description: criteria.description,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })) || [],
        },
        subsidyCoverage: {
          create: subsidyCoverage?.map((coverage: any) => ({
            serviceType: coverage.serviceType,
            serviceId: coverage.serviceId,
            coverageType: coverage.coverageType,
            coverageValue: coverage.coverageValue,
            maxAmount: coverage.maxAmount,
            description: coverage.description,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })) || [],
        },
      },
      include: {
        eligibilityCriteria: true,
        subsidyCoverage: true,
      },
    });

    return NextResponse.json(subsidyScheme, { status: 201 });
  } catch (error) {
    console.error("Error creating subsidy scheme:", error);
    return NextResponse.json(
      { error: "Failed to create subsidy scheme" },
      { status: 500 }
    );
  }
}

// PUT: Update a subsidy scheme
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      id,
      eligibilityCriteria,
      subsidyCoverage,
      ...updateData
    } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Subsidy scheme ID is required" },
        { status: 400 }
      );
    }

    // Update subsidy scheme
    const updatedScheme = await prisma.subsidyScheme.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    // Handle eligibility criteria if provided
    if (eligibilityCriteria) {
      // Delete existing criteria
      await prisma.subsidyEligibilityCriteria.deleteMany({
        where: { subsidySchemeId: id },
      });

      // Create new criteria
      if (eligibilityCriteria.length > 0) {
        await prisma.subsidyEligibilityCriteria.createMany({
          data: eligibilityCriteria.map((criteria: any) => ({
            subsidySchemeId: id,
            criteriaType: criteria.criteriaType,
            criteriaValue: criteria.criteriaValue,
            description: criteria.description,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })),
        });
      }
    }

    // Handle subsidy coverage if provided
    if (subsidyCoverage) {
      // Delete existing coverage
      await prisma.subsidyCoverage.deleteMany({
        where: { subsidySchemeId: id },
      });

      // Create new coverage
      if (subsidyCoverage.length > 0) {
        await prisma.subsidyCoverage.createMany({
          data: subsidyCoverage.map((coverage: any) => ({
            subsidySchemeId: id,
            serviceType: coverage.serviceType,
            serviceId: coverage.serviceId,
            coverageType: coverage.coverageType,
            coverageValue: coverage.coverageValue,
            maxAmount: coverage.maxAmount,
            description: coverage.description,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })),
        });
      }
    }

    // Return the updated subsidy scheme with criteria and coverage
    const subsidyScheme = await prisma.subsidyScheme.findUnique({
      where: { id },
      include: {
        eligibilityCriteria: true,
        subsidyCoverage: true,
      },
    });

    return NextResponse.json(subsidyScheme);
  } catch (error) {
    console.error("Error updating subsidy scheme:", error);
    return NextResponse.json(
      { error: "Failed to update subsidy scheme" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a subsidy scheme
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
        { error: "Subsidy scheme ID is required" },
        { status: 400 }
      );
    }

    // Check if subsidy scheme is being used in any patient subsidies
    const patientSubsidiesCount = await prisma.patientSubsidy.count({
      where: { subsidySchemeId: id },
    });

    if (patientSubsidiesCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete subsidy scheme as it is associated with patient subsidies",
        },
        { status: 400 }
      );
    }

    // Delete eligibility criteria
    await prisma.subsidyEligibilityCriteria.deleteMany({
      where: { subsidySchemeId: id },
    });

    // Delete subsidy coverage
    await prisma.subsidyCoverage.deleteMany({
      where: { subsidySchemeId: id },
    });

    // Delete subsidy scheme
    await prisma.subsidyScheme.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Subsidy scheme deleted successfully" });
  } catch (error) {
    console.error("Error deleting subsidy scheme:", error);
    return NextResponse.json(
      { error: "Failed to delete subsidy scheme" },
      { status: 500 }
    );
  }
}

// POST: Check patient eligibility for subsidy
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { patientId, subsidySchemeId } = data;

    if (!patientId || !subsidySchemeId) {
      return NextResponse.json(
        { error: "Patient ID and subsidy scheme ID are required" },
        { status: 400 }
      );
    }

    // Get patient details
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        patientProfile: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Get subsidy scheme with eligibility criteria
    const subsidyScheme = await prisma.subsidyScheme.findUnique({
      where: { id: subsidySchemeId },
      include: {
        eligibilityCriteria: true,
      },
    });

    if (!subsidyScheme) {
      return NextResponse.json(
        { error: "Subsidy scheme not found" },
        { status: 404 }
      );
    }

    // Check if the subsidy scheme is active
    if (!subsidyScheme.isActive) {
      return NextResponse.json(
        { eligible: false, reason: "Subsidy scheme is not active" }
      );
    }

    // Check if the maximum beneficiaries limit is reached
    if (subsidyScheme.maxBeneficiaries) {
      const currentBeneficiaries = await prisma.patientSubsidy.count({
        where: { subsidySchemeId },
      });

      if (currentBeneficiaries >= subsidyScheme.maxBeneficiaries) {
        return NextResponse.json({
          eligible: false,
          reason: "Maximum beneficiaries limit reached",
        });
      }
    }

    // Check eligibility criteria
    let eligible = true;
    let failedCriteria = [];

    for (const criteria of subsidyScheme.eligibilityCriteria) {
      let criteriaMatch = false;

      switch (criteria.criteriaType) {
        case "AGE":
          const patientAge = calculateAge(patient.dateOfBirth);
          const ageRange = criteria.criteriaValue.split("-");
          if (ageRange.length === 2) {
            const minAge = parseInt(ageRange[0]);
            const maxAge = parseInt(ageRange[1]);
            criteriaMatch = patientAge >= minAge && patientAge <= maxAge;
          }
          break;
        case "INCOME":
          if (patient.patientProfile?.annualIncome) {
            const incomeLimit = parseFloat(criteria.criteriaValue);
            criteriaMatch = patient.patientProfile.annualIncome <= incomeLimit;
          }
          break;
        case "LOCATION":
          const locations = criteria.criteriaValue.split(",");
          criteriaMatch = locations.includes(patient.city) || locations.includes(patient.state);
          break;
        case "GENDER":
          criteriaMatch = criteria.criteriaValue === patient.gender;
          break;
        // Add more criteria types as needed
        default:
          criteriaMatch = true;
      }

      if (!criteriaMatch) {
        eligible = false;
        failedCriteria.push({
          type: criteria.criteriaType,
          description: criteria.description,
        });
      }
    }

    if (eligible) {
      // Create patient subsidy record
      const patientSubsidy = await prisma.patientSubsidy.create({
        data: {
          patientId,
          subsidySchemeId,
          enrollmentDate: new Date(),
          status: "ACTIVE",
          approvedBy: session.user.id,
          createdBy: session.user.id,
          updatedBy: session.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        eligible: true,
        patientSubsidy,
        message: "Patient is eligible for the subsidy scheme",
      });
    } else {
      return NextResponse.json({
        eligible: false,
        failedCriteria,
        message: "Patient does not meet eligibility criteria",
      });
    }
  } catch (error) {
    console.error("Error checking subsidy eligibility:", error);
    return NextResponse.json(
      { error: "Failed to check subsidy eligibility" },
      { status: 500 }
    );
  }
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
