import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/doctors/co-consultations
 * 
 * Fetch doctor co-consultations
 * 
 * Query parameters:
 * - doctorId: Doctor ID (optional, if not provided, will return co-consultations for the current doctor)
 * - status: Filter by status (PENDING, ACCEPTED, REJECTED, COMPLETED)
 * - startDate: Start date for filtering
 * - endDate: End date for filtering
 * - page: Page number for pagination
 * - limit: Number of items per page
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const doctorId = url.searchParams.get('doctorId') || session.user.doctorId;
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to view co-consultations
    if (doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Build filter conditions
    const where: any = {
      OR: [
        { primaryDoctorId: doctorId },
        { secondaryDoctorId: doctorId }
      ]
    };
    
    if (status) {
      where.status = status;
    }
    
    if (startDate) {
      where.scheduledTime = {
        ...where.scheduledTime,
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.scheduledTime = {
        ...where.scheduledTime,
        lte: new Date(endDate)
      };
    }
    
    // Get total count for pagination
    const totalCount = await prisma.doctorCoConsultation.count({ where });
    
    // Fetch co-consultations
    const coConsultations = await prisma.doctorCoConsultation.findMany({
      where,
      include: {
        primaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        secondaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientId: true,
            gender: true,
            dateOfBirth: true
          }
        },
        appointment: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'desc'
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
    console.error('Error fetching doctor co-consultations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctor co-consultations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctors/co-consultations
 * 
 * Create a new doctor co-consultation
 * 
 * Request body:
 * - primaryDoctorId: Primary doctor ID
 * - secondaryDoctorId: Secondary doctor ID
 * - patientId: Patient ID
 * - reason: Reason for co-consultation
 * - notes: Additional notes
 * - scheduledTime: Scheduled time for co-consultation
 * - duration: Duration in minutes
 * - appointmentId: Related appointment ID (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const {
      primaryDoctorId,
      secondaryDoctorId,
      patientId,
      reason,
      notes,
      scheduledTime,
      duration = 30,
      appointmentId
    } = body;
    
    // Validate required fields
    if (!primaryDoctorId || !secondaryDoctorId || !patientId || !reason || !scheduledTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to create co-consultations
    if (primaryDoctorId !== session.user.doctorId && !hasPermission(session, 'doctors.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if primary doctor exists
    const primaryDoctor = await prisma.doctor.findUnique({
      where: { id: primaryDoctorId }
    });
    
    if (!primaryDoctor) {
      return NextResponse.json({ success: false, error: 'Primary doctor not found' }, { status: 404 });
    }
    
    // Check if secondary doctor exists
    const secondaryDoctor = await prisma.doctor.findUnique({
      where: { id: secondaryDoctorId }
    });
    
    if (!secondaryDoctor) {
      return NextResponse.json({ success: false, error: 'Secondary doctor not found' }, { status: 404 });
    }
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }
    
    // Check if appointment exists if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });
      
      if (!appointment) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
      }
    }
    
    // Check if the secondary doctor is available at the scheduled time
    const scheduledDate = new Date(scheduledTime);
    const endTime = new Date(scheduledDate.getTime() + duration * 60000);
    const dayOfWeek = scheduledDate.getDay();
    
    // Format time strings for availability check
    const timeStr = `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`;
    const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    
    // Check for existing appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: secondaryDoctorId,
        OR: [
          {
            startTime: {
              lte: scheduledDate
            },
            endTime: {
              gt: scheduledDate
            }
          },
          {
            startTime: {
              lt: endTime
            },
            endTime: {
              gte: endTime
            }
          },
          {
            startTime: {
              gte: scheduledDate
            },
            endTime: {
              lte: endTime
            }
          }
        ],
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS']
        }
      }
    });
    
    if (existingAppointments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Secondary doctor has conflicting appointments at the scheduled time' },
        { status: 409 }
      );
    }
    
    // Check for availability slots
    const availabilitySlots = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: secondaryDoctorId,
        isAvailable: true,
        OR: [
          {
            isRecurring: true,
            dayOfWeek
          },
          {
            isRecurring: false,
            date: {
              gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
              lte: new Date(scheduledDate.setHours(23, 59, 59, 999))
            }
          }
        ]
      }
    });
    
    // Check if the scheduled time falls within any availability slot
    const isAvailable = availabilitySlots.some(slot => {
      return timeStr >= slot.startTime && endTimeStr <= slot.endTime;
    });
    
    if (!isAvailable && availabilitySlots.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Secondary doctor is not available at the scheduled time' },
        { status: 409 }
      );
    }
    
    // Create the co-consultation
    const coConsultation = await prisma.doctorCoConsultation.create({
      data: {
        primaryDoctorId,
        secondaryDoctorId,
        patientId,
        reason,
        notes,
        scheduledTime: scheduledDate,
        duration,
        appointmentId,
        status: 'PENDING',
        createdBy: session.user.id
      },
      include: {
        primaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        secondaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientId: true,
            gender: true,
            dateOfBirth: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { coConsultation }
    });
  } catch (error) {
    console.error('Error creating doctor co-consultation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create doctor co-consultation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/doctors/co-consultations
 * 
 * Update a doctor co-consultation
 * 
 * Request body:
 * - id: Co-consultation ID
 * - status: New status (PENDING, ACCEPTED, REJECTED, COMPLETED)
 * - notes: Additional notes
 * - scheduledTime: Updated scheduled time
 * - duration: Updated duration
 * - appointmentId: Related appointment ID (optional)
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const {
      id,
      status,
      notes,
      scheduledTime,
      duration,
      appointmentId
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Co-consultation ID is required' },
        { status: 400 }
      );
    }
    
    // Find the co-consultation
    const coConsultation = await prisma.doctorCoConsultation.findUnique({
      where: { id }
    });
    
    if (!coConsultation) {
      return NextResponse.json(
        { success: false, error: 'Co-consultation not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update co-consultations
    if (coConsultation.primaryDoctorId !== session.user.doctorId && 
        coConsultation.secondaryDoctorId !== session.user.doctorId && 
        !hasPermission(session, 'doctors.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if appointment exists if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });
      
      if (!appointment) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
      }
    }
    
    // Check if the scheduled time is being updated
    if (scheduledTime) {
      const scheduledDate = new Date(scheduledTime);
      const newDuration = duration || coConsultation.duration;
      const endTime = new Date(scheduledDate.getTime() + newDuration * 60000);
      
      // Check for existing appointments for the secondary doctor
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: coConsultation.secondaryDoctorId,
          id: {
            not: coConsultation.appointmentId || ''
          },
          OR: [
            {
              startTime: {
                lte: scheduledDate
              },
              endTime: {
                gt: scheduledDate
              }
            },
            {
              startTime: {
                lt: endTime
              },
              endTime: {
                gte: endTime
              }
            },
            {
              startTime: {
                gte: scheduledDate
              },
              endTime: {
                lte: endTime
              }
            }
          ],
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS']
          }
        }
      });
      
      if (existingAppointments.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Secondary doctor has conflicting appointments at the scheduled time' },
          { status: 409 }
        );
      }
    }
    
    // Update the co-consultation
    const updatedCoConsultation = await prisma.doctorCoConsultation.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        duration: duration || undefined,
        appointmentId: appointmentId || undefined,
        updatedAt: new Date()
      },
      include: {
        primaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        secondaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientId: true,
            gender: true,
            dateOfBirth: true
          }
        },
        appointment: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { coConsultation: updatedCoConsultation }
    });
  } catch (error) {
    console.error('Error updating doctor co-consultation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update doctor co-consultation' },
      { status: 500 }
    );
  }
}
