import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { notifyAvailabilityChange } from './sse/route';

/**
 * GET /api/doctors/availability
 * 
 * Fetch doctor availability slots
 * 
 * Query parameters:
 * - doctorId: Doctor ID
 * - startDate: Start date for filtering (optional)
 * - endDate: End date for filtering (optional)
 * - dayOfWeek: Day of week for filtering (optional, 0-6 for Sunday-Saturday)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const doctorId = url.searchParams.get('doctorId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const dayOfWeek = url.searchParams.get('dayOfWeek');
    
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to view availability
    if (doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Build filter conditions
    const where: any = {
      doctorId
    };
    
    if (dayOfWeek) {
      where.dayOfWeek = parseInt(dayOfWeek);
    }
    
    if (startDate) {
      where.OR = [
        {
          isRecurring: true
        },
        {
          isRecurring: false,
          date: {
            gte: new Date(startDate)
          }
        }
      ];
    }
    
    if (endDate) {
      where.OR = [
        ...(where.OR || []),
        {
          isRecurring: false,
          date: {
            lte: new Date(endDate)
          }
        }
      ];
    }
    
    // Fetch availability slots
    const availability = await prisma.doctorAvailability.findMany({
      where,
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
        { date: 'asc' }
      ]
    });
    
    // Fetch doctor basic info
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        user: {
          select: {
            name: true
          }
        },
        availableFrom: true,
        availableTo: true,
        availableDays: true,
        maxAppointmentsPerDay: true
      }
    });
    
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    
    // Fetch appointments for the specified date range to check availability
    let appointments = [];
    if (startDate && endDate) {
      appointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          startTime: {
            gte: new Date(startDate)
          },
          endTime: {
            lte: new Date(endDate)
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS']
          }
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        availability,
        doctor,
        appointments
      }
    });
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctor availability' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctors/availability
 * 
 * Create a new availability slot for a doctor
 * 
 * Request body:
 * - doctorId: Doctor ID
 * - dayOfWeek: Day of week (0-6 for Sunday-Saturday)
 * - startTime: Start time (HH:MM format)
 * - endTime: End time (HH:MM format)
 * - isRecurring: Whether the slot is recurring (default: true)
 * - date: Specific date for non-recurring slots
 * - isAvailable: Whether the slot is available (default: true)
 * - slotDuration: Duration of each slot in minutes (default: 30)
 * - maxPatients: Maximum patients per slot (default: 0, unlimited)
 * - notes: Additional notes
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const {
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring = true,
      date,
      isAvailable = true,
      slotDuration = 30,
      maxPatients = 0,
      notes
    } = body;
    
    // Validate required fields
    if (!doctorId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to create availability
    if (doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });
    
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    
    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time format. Use HH:MM format (24-hour)' },
        { status: 400 }
      );
    }
    
    // Validate day of week
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { success: false, error: 'Invalid day of week. Use 0-6 for Sunday-Saturday' },
        { status: 400 }
      );
    }
    
    // Validate date for non-recurring slots
    if (!isRecurring && !date) {
      return NextResponse.json(
        { success: false, error: 'Date is required for non-recurring slots' },
        { status: 400 }
      );
    }
    
    // Check for overlapping slots
    const existingSlot = await prisma.doctorAvailability.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        OR: [
          {
            startTime: {
              lte: startTime
            },
            endTime: {
              gt: startTime
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
              gte: startTime
            },
            endTime: {
              lte: endTime
            }
          }
        ],
        ...(date ? { date: new Date(date) } : {})
      }
    });
    
    if (existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Overlapping availability slot exists' },
        { status: 409 }
      );
    }
    
    // Create the availability slot
    const availability = await prisma.doctorAvailability.create({
      data: {
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
        date: date ? new Date(date) : null,
        isAvailable,
        slotDuration,
        maxPatients,
        notes
      }
    });
    
    // Notify connected clients about the new availability
    await notifyAvailabilityChange(doctorId, 'create', availability);
    
    return NextResponse.json({
      success: true,
      data: { availability }
    });
  } catch (error) {
    console.error('Error creating doctor availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create doctor availability' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/doctors/availability
 * 
 * Update an existing availability slot
 * 
 * Request body:
 * - id: Availability slot ID
 * - dayOfWeek: Day of week (0-6 for Sunday-Saturday)
 * - startTime: Start time (HH:MM format)
 * - endTime: End time (HH:MM format)
 * - isRecurring: Whether the slot is recurring
 * - date: Specific date for non-recurring slots
 * - isAvailable: Whether the slot is available
 * - slotDuration: Duration of each slot in minutes
 * - maxPatients: Maximum patients per slot
 * - notes: Additional notes
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
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      date,
      isAvailable,
      slotDuration,
      maxPatients,
      notes
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Availability slot ID is required' },
        { status: 400 }
      );
    }
    
    // Find the availability slot
    const availabilitySlot = await prisma.doctorAvailability.findUnique({
      where: { id },
      include: {
        doctor: true
      }
    });
    
    if (!availabilitySlot) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update availability
    if (availabilitySlot.doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Validate time format if provided
    if (startTime || endTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if ((startTime && !timeRegex.test(startTime)) || (endTime && !timeRegex.test(endTime))) {
        return NextResponse.json(
          { success: false, error: 'Invalid time format. Use HH:MM format (24-hour)' },
          { status: 400 }
        );
      }
    }
    
    // Validate day of week if provided
    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return NextResponse.json(
        { success: false, error: 'Invalid day of week. Use 0-6 for Sunday-Saturday' },
        { status: 400 }
      );
    }
    
    // Check for overlapping slots if changing time or day
    if ((dayOfWeek !== undefined && dayOfWeek !== availabilitySlot.dayOfWeek) ||
        (startTime && startTime !== availabilitySlot.startTime) ||
        (endTime && endTime !== availabilitySlot.endTime) ||
        (date && new Date(date).toISOString() !== availabilitySlot.date?.toISOString())) {
      
      const existingSlot = await prisma.doctorAvailability.findFirst({
        where: {
          id: { not: id },
          doctorId: availabilitySlot.doctorId,
          dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : availabilitySlot.dayOfWeek,
          OR: [
            {
              startTime: {
                lte: startTime || availabilitySlot.startTime
              },
              endTime: {
                gt: startTime || availabilitySlot.startTime
              }
            },
            {
              startTime: {
                lt: endTime || availabilitySlot.endTime
              },
              endTime: {
                gte: endTime || availabilitySlot.endTime
              }
            },
            {
              startTime: {
                gte: startTime || availabilitySlot.startTime
              },
              endTime: {
                lte: endTime || availabilitySlot.endTime
              }
            }
          ],
          ...(date ? { date: new Date(date) } : availabilitySlot.date ? { date: availabilitySlot.date } : {})
        }
      });
      
      if (existingSlot) {
        return NextResponse.json(
          { success: false, error: 'Overlapping availability slot exists' },
          { status: 409 }
        );
      }
    }
    
    // Update the availability slot
    const updatedAvailability = await prisma.doctorAvailability.update({
      where: { id },
      data: {
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        isRecurring: isRecurring !== undefined ? isRecurring : undefined,
        date: date ? new Date(date) : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        slotDuration: slotDuration !== undefined ? slotDuration : undefined,
        maxPatients: maxPatients !== undefined ? maxPatients : undefined,
        notes: notes !== undefined ? notes : undefined
      }
    });
    
    // Notify connected clients about the updated availability
    await notifyAvailabilityChange(availabilitySlot.doctorId, 'update', updatedAvailability);
    
    return NextResponse.json({
      success: true,
      data: { availability: updatedAvailability }
    });
  } catch (error) {
    console.error('Error updating doctor availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update doctor availability' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doctors/availability
 * 
 * Delete an availability slot
 * 
 * Request body:
 * - id: Availability slot ID
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Availability slot ID is required' },
        { status: 400 }
      );
    }
    
    // Find the availability slot
    const availabilitySlot = await prisma.doctorAvailability.findUnique({
      where: { id }
    });
    
    if (!availabilitySlot) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete availability
    if (availabilitySlot.doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if there are any appointments scheduled during this slot
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: availabilitySlot.doctorId,
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS']
        },
        OR: [
          {
            startTime: {
              gte: new Date()
            },
            AND: [
              {
                startTime: {
                  gte: availabilitySlot.date || new Date()
                }
              }
            ]
          }
        ]
      }
    });
    
    // Filter appointments that fall within this slot
    const conflictingAppointments = appointments.filter(appointment => {
      const appointmentDay = appointment.startTime.getDay();
      const appointmentStartTime = `${appointment.startTime.getHours().toString().padStart(2, '0')}:${appointment.startTime.getMinutes().toString().padStart(2, '0')}`;
      const appointmentEndTime = `${appointment.endTime.getHours().toString().padStart(2, '0')}:${appointment.endTime.getMinutes().toString().padStart(2, '0')}`;
      
      // For recurring slots, check if the appointment falls on the same day of week and time range
      if (availabilitySlot.isRecurring) {
        return (
          appointmentDay === availabilitySlot.dayOfWeek &&
          (
            (appointmentStartTime >= availabilitySlot.startTime && appointmentStartTime < availabilitySlot.endTime) ||
            (appointmentEndTime > availabilitySlot.startTime && appointmentEndTime <= availabilitySlot.endTime) ||
            (appointmentStartTime <= availabilitySlot.startTime && appointmentEndTime >= availabilitySlot.endTime)
          )
        );
      }
      
      // For non-recurring slots, check if the appointment falls on the same date and time range
      if (availabilitySlot.date) {
        const slotDate = availabilitySlot.date;
        return (
          appointment.startTime.getFullYear() === slotDate.getFullYear() &&
          appointment.startTime.getMonth() === slotDate.getMonth() &&
          appointment.startTime.getDate() === slotDate.getDate() &&
          (
            (appointmentStartTime >= availabilitySlot.startTime && appointmentStartTime < availabilitySlot.endTime) ||
            (appointmentEndTime > availabilitySlot.startTime && appointmentEndTime <= availabilitySlot.endTime) ||
            (appointmentStartTime <= availabilitySlot.startTime && appointmentEndTime >= availabilitySlot.endTime)
          )
        );
      }
      
      return false;
    });
    
    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete availability slot with scheduled appointments',
          data: { appointments: conflictingAppointments }
        },
        { status: 409 }
      );
    }
    
    // Delete the availability slot
    await prisma.doctorAvailability.delete({
      where: { id }
    });
    
    // Notify connected clients about the deleted availability
    await notifyAvailabilityChange(availabilitySlot.doctorId, 'delete', { id });
    
    return NextResponse.json({
      success: true,
      data: { message: 'Availability slot deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting doctor availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete doctor availability' },
      { status: 500 }
    );
  }
}
