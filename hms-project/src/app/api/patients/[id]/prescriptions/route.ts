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

// GET /api/patients/[id]/prescriptions - Get a patient's prescriptions
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
    const isMedicalStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse', 'pharmacist']);
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
    const status = searchParams.get('status') || '';
    const active = searchParams.get('active') === 'true';
    
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

    // Build where clause for filtering
    let where: any = { patientId };
    
    if (status) {
      where.status = status;
    }
    
    if (active) {
      const today = new Date();
      where.endDate = {
        gte: today
      };
      where.status = {
        not: 'cancelled'
      };
    }

    // Get total count for pagination
    const totalPrescriptions = await prisma.prescription.count({ where });

    // Get prescriptions with pagination
    const prescriptions = await prisma.prescription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        medications: {
          include: {
            medication: true
          }
        },
        dispensations: {
          orderBy: { dispensedAt: 'desc' },
          take: 1
        }
      }
    });

    // Format the response
    const formattedPrescriptions = prescriptions.map(prescription => ({
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      prescribedDate: prescription.prescribedDate,
      startDate: prescription.startDate,
      endDate: prescription.endDate,
      status: prescription.status,
      instructions: prescription.instructions,
      diagnosis: prescription.diagnosis,
      doctorId: prescription.doctorId,
      doctorName: prescription.doctor?.user.name || 'Unknown',
      medications: prescription.medications.map(med => ({
        id: med.id,
        medicationId: med.medicationId,
        medicationName: med.medication.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        route: med.route,
        instructions: med.instructions,
        quantity: med.quantity
      })),
      dispensed: prescription.dispensations.length > 0,
      dispensedAt: prescription.dispensations[0]?.dispensedAt || null,
      dispensedBy: prescription.dispensations[0]?.dispensedBy || null,
      createdAt: prescription.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patientName: patient.user.name,
        prescriptions: formattedPrescriptions,
        pagination: {
          total: totalPrescriptions,
          page,
          limit,
          pages: Math.ceil(totalPrescriptions / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/prescriptions - Create a new prescription for a patient
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

    // Only doctors can create prescriptions
    const isDoctor = await hasPermission(session, ['doctor', 'admin', 'superadmin']);
    if (!isDoctor) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only doctors can create prescriptions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      doctorId, 
      prescribedDate, 
      startDate, 
      endDate, 
      instructions, 
      diagnosis, 
      medications 
    } = body;

    // Validate required fields
    if (!doctorId || !prescribedDate || !medications || !medications.length) {
      return NextResponse.json(
        { success: false, error: 'Doctor, prescribed date, and medications are required' },
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

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Generate prescription number
    const prescriptionNumber = await generatePrescriptionNumber();

    // Create the prescription with medications
    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNumber,
        patientId,
        doctorId,
        prescribedDate: new Date(prescribedDate),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: 'active',
        instructions,
        diagnosis,
        medications: {
          create: medications.map((med: any) => ({
            medicationId: med.medicationId,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            route: med.route,
            instructions: med.instructions,
            quantity: med.quantity
          }))
        }
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        medications: {
          include: {
            medication: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        prescribedDate: prescription.prescribedDate,
        startDate: prescription.startDate,
        endDate: prescription.endDate,
        status: prescription.status,
        instructions: prescription.instructions,
        diagnosis: prescription.diagnosis,
        doctorId: prescription.doctorId,
        doctorName: prescription.doctor?.user.name || 'Unknown',
        medications: prescription.medications.map(med => ({
          id: med.id,
          medicationId: med.medicationId,
          medicationName: med.medication.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          route: med.route,
          instructions: med.instructions,
          quantity: med.quantity
        })),
        createdAt: prescription.createdAt
      },
      message: 'Prescription created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}

// Helper function to generate a unique prescription number
async function generatePrescriptionNumber(): Promise<string> {
  const prefix = 'RX';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Get the count of prescriptions created today
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  
  const prescriptionCount = await prisma.prescription.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });
  
  // Generate a sequential number with leading zeros
  const sequentialNumber = (prescriptionCount + 1).toString().padStart(3, '0');
  
  return `${prefix}${year}${month}${day}${sequentialNumber}`;
}
