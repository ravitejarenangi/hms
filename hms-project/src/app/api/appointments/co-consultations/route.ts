import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
// Define AppointmentStatus enum if not available from prisma client
enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

/**
 * GET /api/appointments/co-consultations
 * 
 * Fetch co-consultations with optional filtering
 * 
 * Query parameters:
 * - doctorId: Filter by doctor ID
 * - patientId: Filter by patient ID
 * - status: Filter by status
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - page: Page number for pagination
 * - limit: Number of items per page
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'read:appointments')) { // Update permission check
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const url = new URL(req.url);
    
    // Extract query parameters
    const doctorId = url.searchParams.get('doctorId');
    const patientId = url.searchParams.get('patientId');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {
      isCoConsultation: true
    };
    
    if (doctorId) {
      where.OR = [
        { doctorId },
        { coConsultingDoctors: { some: { doctorId } } }
      ];
    }
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate) {
      where.startTime = {
        ...where.startTime,
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.endTime = {
        ...where.endTime,
        lte: new Date(endDate)
      };
    }
    
    // Get total count for pagination
    const totalCount = await prisma.appointment.count({ where });
    
    // Fetch co-consultations
    const coConsultations = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            department: true
          }
        },
        appointmentType: true,
        coConsultingDoctors: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                department: true
              }
            }
          }
        },
        coConsultationNotes: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      skip,
      take: limit
    });
    
    return NextResponse.json({
      success: true,
      data: {
        coConsultations,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching co-consultations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch co-consultations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments/co-consultations
 * 
 * Create a new co-consultation appointment
 * 
 * Request body:
 * - patientId: Patient ID
 * - primaryDoctorId: Primary doctor ID
 * - coConsultingDoctorIds: Array of co-consulting doctor IDs
 * - appointmentTypeId: Appointment type ID
 * - title: Appointment title
 * - description: Appointment description
 * - startTime: Start time
 * - endTime: End time
 * - location: Location
 * - notes: Notes
 * - urgency: Urgency level (LOW, MEDIUM, HIGH)
 * - reason: Reason for co-consultation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'read:appointments')) { // Update permission check
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    
    const {
      patientId,
      primaryDoctorId,
      coConsultingDoctorIds,
      appointmentTypeId,
      title,
      description,
      startTime,
      endTime,
      location,
      notes,
      urgency,
      reason
    } = body;
    
    // Validate required fields
    if (!patientId || !primaryDoctorId || !coConsultingDoctorIds || !appointmentTypeId || !title || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate co-consulting doctors array
    if (!Array.isArray(coConsultingDoctorIds) || coConsultingDoctorIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one co-consulting doctor is required' },
        { status: 400 }
      );
    }
    
    // Check if patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    // Check if primary doctor exists
    const primaryDoctor = await prisma.doctor.findUnique({
      where: { id: primaryDoctorId }
    });
    
    if (!primaryDoctor) {
      return NextResponse.json(
        { success: false, error: 'Primary doctor not found' },
        { status: 404 }
      );
    }
    
    // Check if all co-consulting doctors exist
    const coConsultingDoctors = await prisma.doctor.findMany({
      where: {
        id: { in: coConsultingDoctorIds }
      }
    });
    
    if (coConsultingDoctors.length !== coConsultingDoctorIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more co-consulting doctors not found' },
        { status: 404 }
      );
    }
    
    // Check for scheduling conflicts for primary doctor
    const primaryDoctorConflicts = await prisma.appointment.findMany({
      where: {
        doctorId: primaryDoctorId,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
        OR: [
          {
            startTime: { lte: new Date(startTime) },
            endTime: { gt: new Date(startTime) }
          },
          {
            startTime: { lt: new Date(endTime) },
            endTime: { gte: new Date(endTime) }
          },
          {
            startTime: { gte: new Date(startTime) },
            endTime: { lte: new Date(endTime) }
          }
        ]
      }
    });
    
    if (primaryDoctorConflicts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Primary doctor has scheduling conflicts' },
        { status: 409 }
      );
    }
    
    // Check for scheduling conflicts for co-consulting doctors
    const coConsultingDoctorConflicts = await prisma.appointment.findMany({
      where: {
        OR: [
          {
            doctorId: { in: coConsultingDoctorIds },
          },
          {
            coConsultingDoctors: {
              some: {
                doctorId: { in: coConsultingDoctorIds }
              }
            }
          }
        ],
        status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
        OR: [
          {
            startTime: { lte: new Date(startTime) },
            endTime: { gt: new Date(startTime) }
          },
          {
            startTime: { lt: new Date(endTime) },
            endTime: { gte: new Date(endTime) }
          },
          {
            startTime: { gte: new Date(startTime) },
            endTime: { lte: new Date(endTime) }
          }
        ]
      }
    });
    
    if (coConsultingDoctorConflicts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'One or more co-consulting doctors have scheduling conflicts' },
        { status: 409 }
      );
    }
    
    // Create the co-consultation appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: primaryDoctorId,
        appointmentTypeId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: AppointmentStatus.SCHEDULED,
        location,
        isCoConsultation: true,
        createdBy: session.user.id,
        coConsultingDoctors: {
          create: coConsultingDoctorIds.map((doctorId: string) => ({
            doctorId,
            role: 'CONSULTANT',
            createdBy: session.user.id
          }))
        },
        coConsultationNotes: {
          create: {
            content: notes || '',
            reason: reason || '',
            urgency: urgency || 'MEDIUM',
            createdBy: {
              connect: {
                id: session.user.id
              }
            }
          }
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            department: true
          }
        },
        appointmentType: true,
        coConsultingDoctors: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                department: true
              }
            }
          }
        },
        coConsultationNotes: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    // Create notifications for all doctors involved
    await prisma.notification.createMany({
      data: [
        {
          userId: primaryDoctorId,
          type: 'APPOINTMENT',
          title: 'New Co-Consultation Appointment',
          message: `You have been scheduled as the primary doctor for a co-consultation appointment with ${patient.name} on ${new Date(startTime).toLocaleString()}`,
          relatedId: appointment.id,
          createdBy: session.user.id
        },
        ...coConsultingDoctorIds.map((doctorId: string) => ({
          userId: doctorId,
          type: 'APPOINTMENT',
          title: 'New Co-Consultation Appointment',
          message: `You have been requested to join a co-consultation appointment with ${patient.name} on ${new Date(startTime).toLocaleString()}`,
          relatedId: appointment.id,
          createdBy: session.user.id
        }))
      ]
    });
    
    return NextResponse.json({
      success: true,
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Error creating co-consultation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create co-consultation' },
      { status: 500 }
    );
  }
}
