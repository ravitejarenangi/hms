import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

// GET /api/patients/[id]/subsidy-schemes - Get a patient's subsidy schemes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization - medical staff or own record
    const isMedicalStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist']);
    const isOwnRecord = session.user.id === patientId;

    if (!isMedicalStaff && !isOwnRecord) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get patient's subsidy schemes
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Find all beneficiary records for this patient
    const beneficiaries = await prisma.schemeBeneficiary.findMany({
      where: { patientId: patientId },
      include: {
        scheme: true,
        documents: true,
        claims: {
          include: {
            service: true,
            documents: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        beneficiaries
      }
    });
  } catch (error) {
    console.error('Error fetching patient subsidy schemes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient subsidy schemes' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/subsidy-schemes - Enroll patient in a subsidy scheme
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;
    const data = await request.json();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization - only staff can enroll patients
    const isStaff = await hasPermission(session, ['admin', 'superadmin', 'receptionist']);
    
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!data.schemeId || !data.beneficiaryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schemeId, beneficiaryId' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if scheme exists
    const scheme = await prisma.subsidyScheme.findUnique({
      where: { id: data.schemeId }
    });

    if (!scheme) {
      return NextResponse.json(
        { success: false, error: 'Subsidy scheme not found' },
        { status: 404 }
      );
    }

    // Check if beneficiary ID is already in use
    const existingBeneficiary = await prisma.schemeBeneficiary.findUnique({
      where: { beneficiaryId: data.beneficiaryId }
    });

    if (existingBeneficiary) {
      return NextResponse.json(
        { success: false, error: 'Beneficiary ID is already in use' },
        { status: 400 }
      );
    }

    // Create new beneficiary record
    const beneficiary = await prisma.schemeBeneficiary.create({
      data: {
        schemeId: data.schemeId,
        patientId: patientId,
        beneficiaryId: data.beneficiaryId,
        enrollmentDate: new Date(),
        verificationStatus: data.verificationStatus || 'PENDING',
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        status: data.status || 'ACTIVE',
        notes: data.notes
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        beneficiary
      }
    });
  } catch (error) {
    console.error('Error enrolling patient in subsidy scheme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enroll patient in subsidy scheme' },
      { status: 500 }
    );
  }
}
