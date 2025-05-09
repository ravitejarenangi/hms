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

// GET /api/patients/[id]/appointments - Get a patient's appointments
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

    // Build where clause for filtering
    let where: any = { patientId };
    
    if (status) {
      where.status = status;
    }
    
    if (fromDate || toDate) {
      where.appointmentDate = {};
      
      if (fromDate) {
        where.appointmentDate.gte = fromDate;
      }
      
      if (toDate) {
        where.appointmentDate.lte = toDate;
      }
    }

    // Get total count for pagination
    const totalAppointments = await prisma.appointment.count({ where });

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { appointmentDate: 'desc' },
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
        department: true,
        followUps: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Format the response
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      type: appointment.type,
      reason: appointment.reason,
      notes: appointment.notes,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor?.user.name || 'Unknown',
      departmentId: appointment.departmentId,
      departmentName: appointment.department?.name || 'Unknown',
      followUp: appointment.followUps.length > 0 ? {
        id: appointment.followUps[0].id,
        date: appointment.followUps[0].followUpDate,
        notes: appointment.followUps[0].notes
      } : null,
      createdAt: appointment.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patientName: patient.user.name,
        appointments: formattedAppointments,
        pagination: {
          total: totalAppointments,
          page,
          limit,
          pages: Math.ceil(totalAppointments / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/appointments - Book a new appointment for a patient
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

    // Check authorization - medical staff or own record
    const isMedicalStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist']);
    const isOwn = await isOwnPatientRecord(session, patientId);
    
    if (!isMedicalStaff && !isOwn) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      doctorId, 
      departmentId, 
      appointmentDate, 
      startTime, 
      endTime, 
      type, 
      reason, 
      notes 
    } = body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !startTime || !type) {
      return NextResponse.json(
        { success: false, error: 'Doctor, appointment date, start time, and type are required' },
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

    // Generate appointment number
    const appointmentNumber = await generateAppointmentNumber();

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId,
        doctorId,
        departmentId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime: endTime || startTime, // Default to start time if end time not provided
        type,
        reason,
        notes,
        status: 'scheduled',
        createdBy: session.user.id
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
        department: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        type: appointment.type,
        reason: appointment.reason,
        notes: appointment.notes,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctor?.user.name || 'Unknown',
        departmentId: appointment.departmentId,
        departmentName: appointment.department?.name || 'Unknown',
        createdAt: appointment.createdAt
      },
      message: 'Appointment booked successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}

// Helper function to generate a unique appointment number
async function generateAppointmentNumber(): Promise<string> {
  const prefix = 'APT';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Get the count of appointments created today
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  
  const appointmentCount = await prisma.appointment.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });
  
  // Generate a sequential number with leading zeros
  const sequentialNumber = (appointmentCount + 1).toString().padStart(3, '0');
  
  return `${prefix}${year}${month}${day}${sequentialNumber}`;
}
