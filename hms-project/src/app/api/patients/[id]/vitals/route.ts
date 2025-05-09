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

// GET /api/patients/[id]/vitals - Get a patient's vital signs
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from') as string) : undefined;
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to') as string) : undefined;
    
    // Calculate pagination
    const skip = (page - 1) * limit;

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

    // Build where clause for date filtering
    let where: any = { patientId };
    
    if (fromDate || toDate) {
      where.recordedAt = {};
      
      if (fromDate) {
        where.recordedAt.gte = fromDate;
      }
      
      if (toDate) {
        where.recordedAt.lte = toDate;
      }
    }

    // Get total count for pagination
    const totalVitals = await prisma.vitalSigns.count({ where });

    // Get vital signs with pagination
    const vitalSigns = await prisma.vitalSigns.findMany({
      where,
      skip,
      take: limit,
      orderBy: { recordedAt: 'desc' },
      include: {
        recordedByUser: {
          select: {
            name: true
          }
        }
      }
    });

    // Format the response
    const formattedVitals = vitalSigns.map(vital => ({
      id: vital.id,
      temperature: vital.temperature,
      heartRate: vital.heartRate,
      bloodPressureSystolic: vital.bloodPressureSystolic,
      bloodPressureDiastolic: vital.bloodPressureDiastolic,
      respiratoryRate: vital.respiratoryRate,
      oxygenSaturation: vital.oxygenSaturation,
      weight: vital.weight,
      height: vital.height,
      bmi: vital.bmi,
      painLevel: vital.painLevel,
      notes: vital.notes,
      recordedAt: vital.recordedAt,
      recordedBy: vital.recordedByUser?.name || 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patientName: patient.user.name,
        vitalSigns: formattedVitals,
        pagination: {
          total: totalVitals,
          page,
          limit,
          pages: Math.ceil(totalVitals / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vital signs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vital signs' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/vitals - Record vital signs for a patient
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

    // Only medical staff can record vital signs
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
      temperature,
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      painLevel,
      notes
    } = body;

    // Validate required fields - at least one vital sign is required
    if (!temperature && !heartRate && !bloodPressureSystolic && !respiratoryRate && 
        !oxygenSaturation && !weight && !height && !painLevel) {
      return NextResponse.json(
        { success: false, error: 'At least one vital sign measurement is required' },
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

    // Calculate BMI if both height and weight are provided
    let bmi = null;
    if (height && weight) {
      // BMI = weight(kg) / (height(m))²
      const heightInMeters = height / 100; // Convert cm to m
      bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
    }

    // Record vital signs
    const vitalSigns = await prisma.vitalSigns.create({
      data: {
        patientId,
        temperature,
        heartRate,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        respiratoryRate,
        oxygenSaturation,
        weight,
        height,
        bmi,
        painLevel,
        notes,
        recordedBy: session.user.id,
        recordedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: vitalSigns,
      message: 'Vital signs recorded successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording vital signs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record vital signs' },
      { status: 500 }
    );
  }
}
