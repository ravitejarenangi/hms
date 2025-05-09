import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canAccessPatientData } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// GET /api/appointments - Get all appointments with filtering
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const doctorId = url.searchParams.get('doctorId');
    const patientId = url.searchParams.get('patientId');
    const departmentId = url.searchParams.get('departmentId');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    // Get appointments with pagination
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          appointmentType: true,
          waitingList: true,
          appointmentNotes: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          reminders: {
            orderBy: {
              scheduledTime: 'asc'
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.appointment.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
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

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['patientId', 'doctorId', 'appointmentTypeId', 'title', 'startTime', 'endTime', 'duration'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Format dates
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId }
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Check if appointment type exists
    const appointmentType = await prisma.appointmentType.findUnique({
      where: { id: data.appointmentTypeId }
    });

    if (!appointmentType) {
      return NextResponse.json(
        { success: false, error: 'Appointment type not found' },
        { status: 404 }
      );
    }

    // Check for scheduling conflicts
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: data.doctorId,
        status: {
          notIn: ['CANCELLED', 'RESCHEDULED', 'NO_SHOW']
        },
        OR: [
          {
            // Appointment starts during an existing appointment
            startTime: {
              gte: startTime,
              lt: endTime
            }
          },
          {
            // Appointment ends during an existing appointment
            endTime: {
              gt: startTime,
              lte: endTime
            }
          },
          {
            // Appointment encompasses an existing appointment
            startTime: {
              lte: startTime
            },
            endTime: {
              gte: endTime
            }
          }
        ]
      }
    });

    if (existingAppointments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Scheduling conflict with existing appointment' },
        { status: 409 }
      );
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        appointmentTypeId: data.appointmentTypeId,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        duration: data.duration,
        isRecurring: data.isRecurring || false,
        recurringPatternId: data.recurringPatternId,
        location: data.location,
        notes: data.notes,
        createdBy: session.user.id,
        status: data.status || 'SCHEDULED',
        confirmationStatus: data.confirmationStatus || 'PENDING'
      },
      include: {
        appointmentType: true
      }
    });

    // Create appointment reminders if needed
    if (data.createReminders) {
      // Create email reminder (24 hours before)
      await prisma.appointmentReminder.create({
        data: {
          appointmentId: appointment.id,
          reminderType: 'INITIAL',
          scheduledTime: new Date(startTime.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
          channel: 'EMAIL',
          content: `Reminder: You have an appointment scheduled for ${startTime.toLocaleString()}`,
          status: 'PENDING'
        }
      });

      // Create SMS reminder (2 hours before)
      await prisma.appointmentReminder.create({
        data: {
          appointmentId: appointment.id,
          reminderType: 'FOLLOWUP',
          scheduledTime: new Date(startTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          channel: 'SMS',
          content: `Reminder: Your appointment is in 2 hours at ${startTime.toLocaleTimeString()}`,
          status: 'PENDING'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment
      },
      message: "Appointment successfully created"
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
