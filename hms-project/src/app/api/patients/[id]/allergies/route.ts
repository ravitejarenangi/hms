import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Helper function to check if user has required permissions
async function hasPermission(session: any, requiredRoles: string[] = []) {
  if (!session || !session.user) return false;
  
  const userRoles = session.user.roles || [];
  
  // If no specific roles are required, just check if user is authenticated
  if (requiredRoles.length === 0) return true;
  
  // Check if user has any of the required roles
  return userRoles.some(role => requiredRoles.includes(role));
}

// Helper function to check if user is accessing their own patient record
async function isOwnPatientRecord(session: any, patientId: string) {
  if (!session || !session.user) return false;
  
  // Get the patient record
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { userId: true }
  });
  
  if (!patient) return false;
  
  // Check if the patient's userId matches the session user's id
  return session.user.id === patient.userId;
}

// GET /api/patients/[id]/allergies - Get a patient's allergies
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
    const isMedicalStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse']);
    const isOwn = await isOwnPatientRecord(session, patientId);
    
    if (!isMedicalStaff && !isOwn) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get allergies
    const allergies = await prisma.allergy.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patientName: patient.user.name,
        allergies
      }
    });
  } catch (error) {
    console.error('Error fetching allergies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allergies' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/allergies - Add an allergy to a patient
export async function POST(
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

    // Only medical staff can add allergies
    const isMedicalStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse']);
    if (!isMedicalStaff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      allergen, 
      allergenType, 
      severity,
      reaction,
      notes
    } = body;

    // Validate required fields
    if (!allergen || !allergenType || !severity) {
      return NextResponse.json(
        { success: false, error: 'Allergen, allergen type, and severity are required' },
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

    // Check if allergy already exists
    const existingAllergy = await prisma.allergy.findFirst({
      where: {
        patientId,
        allergen: {
          equals: allergen,
          mode: 'insensitive'
        },
        allergenType
      }
    });

    if (existingAllergy) {
      return NextResponse.json(
        { success: false, error: 'This allergy is already recorded for the patient' },
        { status: 400 }
      );
    }

    // Create the allergy
    const allergy = await prisma.allergy.create({
      data: {
        patientId,
        allergen,
        allergenType,
        severity,
        reaction,
        notes,
        recordedBy: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: allergy,
      message: 'Allergy added successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding allergy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add allergy' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id]/allergies - Delete a patient's allergy
export async function DELETE(
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

    // Only medical staff can delete allergies
    const isMedicalStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse']);
    if (!isMedicalStaff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const allergyId = searchParams.get('allergyId');
    
    if (!allergyId) {
      return NextResponse.json(
        { success: false, error: 'Allergy ID is required' },
        { status: 400 }
      );
    }

    // Check if allergy exists and belongs to the patient
    const allergy = await prisma.allergy.findFirst({
      where: {
        id: allergyId,
        patientId
      }
    });

    if (!allergy) {
      return NextResponse.json(
        { success: false, error: 'Allergy not found or does not belong to this patient' },
        { status: 404 }
      );
    }

    // Delete the allergy
    await prisma.allergy.delete({
      where: { id: allergyId }
    });

    return NextResponse.json({
      success: true,
      message: 'Allergy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting allergy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete allergy' },
      { status: 500 }
    );
  }
}
