import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/appointments/notifications - Get pending notifications
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
    const status = url.searchParams.get('status') || 'PENDING';
    const channel = url.searchParams.get('channel');
    const reminderType = url.searchParams.get('reminderType');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      status
    };
    
    if (channel) where.channel = channel;
    if (reminderType) where.reminderType = reminderType;

    // Get reminders with pagination
    const [reminders, total] = await Promise.all([
      prisma.appointmentReminder.findMany({
        where,
        include: {
          appointment: {
            include: {
              appointmentType: true,
              patient: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledTime: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.appointmentReminder.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reminders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching appointment notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment notifications' },
      { status: 500 }
    );
  }
}

// POST /api/appointments/notifications - Create or update notification
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
    if (!data.appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: appointmentId' },
        { status: 400 }
      );
    }

    // Check if the appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        appointmentType: true
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Handle different operations
    if (data.operation === 'create') {
      // Create a new reminder
      if (!data.reminderType || !data.channel || !data.scheduledTime) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields for reminder creation: reminderType, channel, scheduledTime' },
          { status: 400 }
        );
      }

      const scheduledTime = new Date(data.scheduledTime);
      
      // Generate content if not provided
      const content = data.content || generateReminderContent(appointment, data.reminderType, data.channel);

      const reminder = await prisma.appointmentReminder.create({
        data: {
          appointmentId: data.appointmentId,
          reminderType: data.reminderType,
          scheduledTime,
          channel: data.channel,
          content,
          status: 'PENDING'
        }
      });

      return NextResponse.json({
        success: true,
        data: { reminder },
        message: 'Appointment reminder created successfully'
      });
    } else if (data.operation === 'update') {
      // Update an existing reminder
      if (!data.reminderId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: reminderId' },
          { status: 400 }
        );
      }

      const existingReminder = await prisma.appointmentReminder.findUnique({
        where: { id: data.reminderId }
      });

      if (!existingReminder) {
        return NextResponse.json(
          { success: false, error: 'Reminder not found' },
          { status: 404 }
        );
      }

      // Prepare update data
      const updateData: any = {};
      
      if (data.scheduledTime) updateData.scheduledTime = new Date(data.scheduledTime);
      if (data.content) updateData.content = data.content;
      if (data.status) updateData.status = data.status;
      if (data.channel) updateData.channel = data.channel;
      if (data.reminderType) updateData.reminderType = data.reminderType;

      // Update the reminder
      const updatedReminder = await prisma.appointmentReminder.update({
        where: { id: data.reminderId },
        data: updateData
      });

      return NextResponse.json({
        success: true,
        data: { reminder: updatedReminder },
        message: 'Appointment reminder updated successfully'
      });
    } else if (data.operation === 'send') {
      // Simulate sending a reminder
      if (!data.reminderId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: reminderId' },
          { status: 400 }
        );
      }

      const reminder = await prisma.appointmentReminder.findUnique({
        where: { id: data.reminderId },
        include: {
          appointment: {
            include: {
              patient: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!reminder) {
        return NextResponse.json(
          { success: false, error: 'Reminder not found' },
          { status: 404 }
        );
      }

      // In a real implementation, you would send the actual notification here
      // For now, we'll just update the status
      const updatedReminder = await prisma.appointmentReminder.update({
        where: { id: data.reminderId },
        data: {
          status: 'SENT',
          sentTime: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        data: { reminder: updatedReminder },
        message: `Appointment reminder sent via ${reminder.channel}`
      });
    } else if (data.operation === 'cancel') {
      // Cancel a reminder
      if (!data.reminderId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: reminderId' },
          { status: 400 }
        );
      }

      const reminder = await prisma.appointmentReminder.findUnique({
        where: { id: data.reminderId }
      });

      if (!reminder) {
        return NextResponse.json(
          { success: false, error: 'Reminder not found' },
          { status: 404 }
        );
      }

      // Update the reminder status
      const updatedReminder = await prisma.appointmentReminder.update({
        where: { id: data.reminderId },
        data: {
          status: 'CANCELLED'
        }
      });

      return NextResponse.json({
        success: true,
        data: { reminder: updatedReminder },
        message: 'Appointment reminder cancelled successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid operation. Must be one of: create, update, send, cancel' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing appointment notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage appointment notification' },
      { status: 500 }
    );
  }
}

// Helper function to generate reminder content
function generateReminderContent(appointment: any, reminderType: string, channel: string): string {
  const patientName = appointment.patient?.name || 'Patient';
  const appointmentDate = appointment.startTime.toLocaleDateString();
  const appointmentTime = appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const appointmentType = appointment.appointmentType?.name || 'appointment';
  const location = appointment.location || 'our facility';

  switch (reminderType) {
    case 'INITIAL':
      return `Hello ${patientName}, this is a reminder for your ${appointmentType} scheduled on ${appointmentDate} at ${appointmentTime} at ${location}. Please confirm your attendance.`;
    
    case 'FOLLOWUP':
      return `Reminder: ${patientName}, your ${appointmentType} is coming up on ${appointmentDate} at ${appointmentTime}. We look forward to seeing you at ${location}.`;
    
    case 'CONFIRMATION':
      return `Thank you ${patientName} for confirming your ${appointmentType} on ${appointmentDate} at ${appointmentTime}. We'll see you at ${location}.`;
    
    case 'RESCHEDULE':
      return `${patientName}, your ${appointmentType} has been rescheduled to ${appointmentDate} at ${appointmentTime} at ${location}. Please confirm this new time works for you.`;
    
    default:
      return `Reminder for your appointment on ${appointmentDate} at ${appointmentTime}.`;
  }
}
