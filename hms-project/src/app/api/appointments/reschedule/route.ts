import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/appointments/reschedule - Reschedule an existing appointment
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
    const requiredFields = ['appointmentId', 'startTime', 'endTime', 'duration'];
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

    // Get the existing appointment
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        appointmentType: true,
        reminders: true
      }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if the appointment can be rescheduled
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(existingAppointment.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot reschedule an appointment with status: ${existingAppointment.status}` },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: existingAppointment.doctorId,
        id: { not: data.appointmentId }, // Exclude the current appointment
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

    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Scheduling conflict with existing appointment' },
        { status: 409 }
      );
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: {
        startTime,
        endTime,
        duration: data.duration,
        status: 'RESCHEDULED',
        confirmationStatus: 'PENDING',
        updatedAt: new Date(),
        notes: data.notes ? `${existingAppointment.notes || ''}\n\nRescheduled: ${data.notes}` : existingAppointment.notes
      },
      include: {
        appointmentType: true
      }
    });

    // Cancel existing reminders
    await prisma.appointmentReminder.updateMany({
      where: {
        appointmentId: data.appointmentId,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED'
      }
    });

    // Create new reminders for the rescheduled appointment
    if (data.createReminders !== false) {
      // Create email reminder (24 hours before)
      await prisma.appointmentReminder.create({
        data: {
          appointmentId: updatedAppointment.id,
          reminderType: 'RESCHEDULE',
          scheduledTime: new Date(startTime.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
          channel: 'EMAIL',
          content: `Your appointment has been rescheduled to ${startTime.toLocaleString()}`,
          status: 'PENDING'
        }
      });

      // Create SMS reminder (2 hours before)
      await prisma.appointmentReminder.create({
        data: {
          appointmentId: updatedAppointment.id,
          reminderType: 'RESCHEDULE',
          scheduledTime: new Date(startTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          channel: 'SMS',
          content: `Reminder: Your rescheduled appointment is in 2 hours at ${startTime.toLocaleTimeString()}`,
          status: 'PENDING'
        }
      });
    }

    // Create an appointment note about the reschedule
    await prisma.appointmentNote.create({
      data: {
        appointmentId: updatedAppointment.id,
        note: `Appointment rescheduled from ${existingAppointment.startTime.toLocaleString()} to ${startTime.toLocaleString()} by ${session.user.name}`,
        createdBy: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        appointment: updatedAppointment
      },
      message: "Appointment successfully rescheduled"
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reschedule appointment' },
      { status: 500 }
    );
  }
}
