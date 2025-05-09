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

// GET /api/patients/[id]/medical-history - Get a patient's medical history
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

    // Get medical history with versions
    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!medicalHistory) {
      return NextResponse.json({
        success: true,
        data: {
          patientId,
          patientName: patient.user.name,
          medicalHistory: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patientName: patient.user.name,
        medicalHistory: {
          id: medicalHistory.id,
          chronicConditions: medicalHistory.chronicConditions,
          pastSurgeries: medicalHistory.pastSurgeries,
          currentMedications: medicalHistory.currentMedications,
          familyHistory: medicalHistory.familyHistory,
          lifestyle: medicalHistory.lifestyle,
          createdAt: medicalHistory.createdAt,
          updatedAt: medicalHistory.updatedAt,
          versions: medicalHistory.versions
        }
      }
    });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medical history' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/medical-history - Create or update a patient's medical history
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

    // Only medical staff can update medical history
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
      chronicConditions = [], 
      pastSurgeries = [], 
      currentMedications = [],
      familyHistory = '',
      lifestyle = '',
      notes = ''
    } = body;

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

    // Check if medical history already exists
    const existingMedicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId }
    });

    let medicalHistory;

    if (existingMedicalHistory) {
      // Create a version record of the current medical history
      await prisma.medicalHistoryVersion.create({
        data: {
          medicalHistoryId: existingMedicalHistory.id,
          chronicConditions: existingMedicalHistory.chronicConditions,
          pastSurgeries: existingMedicalHistory.pastSurgeries,
          currentMedications: existingMedicalHistory.currentMedications,
          familyHistory: existingMedicalHistory.familyHistory,
          lifestyle: existingMedicalHistory.lifestyle,
          updatedBy: session.user.id,
          notes
        }
      });

      // Update the medical history
      medicalHistory = await prisma.medicalHistory.update({
        where: { patientId },
        data: {
          chronicConditions,
          pastSurgeries,
          currentMedications,
          familyHistory,
          lifestyle
        }
      });
    } else {
      // Create new medical history
      medicalHistory = await prisma.medicalHistory.create({
        data: {
          patientId,
          chronicConditions,
          pastSurgeries,
          currentMedications,
          familyHistory,
          lifestyle,
          versions: {
            create: {
              chronicConditions,
              pastSurgeries,
              currentMedications,
              familyHistory,
              lifestyle,
              updatedBy: session.user.id,
              notes: 'Initial medical history record'
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: medicalHistory,
      message: existingMedicalHistory 
        ? 'Medical history updated successfully' 
        : 'Medical history created successfully'
    });
  } catch (error) {
    console.error('Error updating medical history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update medical history' },
      { status: 500 }
    );
  }
}
