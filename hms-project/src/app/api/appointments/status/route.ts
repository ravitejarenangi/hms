import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/appointments/status - Update appointment status
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
    if (!data.appointmentId || !data.status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: appointmentId and status' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the existing appointment
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: data.status,
      updatedAt: new Date()
    };

    // Add status-specific fields
    switch (data.status) {
      case 'CHECKED_IN':
        updateData.checkInTime = new Date();
        break;
      case 'COMPLETED':
        updateData.checkOutTime = new Date();
        break;
      case 'CANCELLED':
        updateData.cancelledAt = new Date();
        updateData.cancelReason = data.reason || 'No reason provided';
        break;
      case 'NO_SHOW':
        updateData.noShow = true;
        break;
      case 'CONFIRMED':
        updateData.confirmationStatus = 'CONFIRMED';
        updateData.confirmationTime = new Date();
        break;
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: updateData,
      include: {
        appointmentType: true,
        waitingList: true
      }
    });

    // Update waiting list status if applicable
    if (updatedAppointment.waitingList && ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(data.status)) {
      const waitingStatus = data.status === 'CHECKED_IN' ? 'CALLED' :
                           data.status === 'IN_PROGRESS' ? 'SERVING' :
                           data.status === 'COMPLETED' ? 'COMPLETED' :
                           'CANCELLED';

      await prisma.waitingList.update({
        where: { id: updatedAppointment.waitingList.id },
        data: {
          status: waitingStatus,
          updatedAt: new Date()
        }
      });
    }

    // Create an appointment note about the status change
    if (data.notes || data.reason) {
      await prisma.appointmentNote.create({
        data: {
          appointmentId: data.appointmentId,
          note: `Status changed to ${data.status}${data.reason ? `: ${data.reason}` : ''}${data.notes ? `\nNotes: ${data.notes}` : ''}`,
          createdBy: session.user.id
        }
      });
    }

    // Handle follow-up appointment if requested
    if (data.status === 'COMPLETED' && data.followUpNeeded) {
      // Update the current appointment with follow-up info
      await prisma.appointment.update({
        where: { id: data.appointmentId },
        data: {
          followUpNeeded: true,
          followUpNotes: data.followUpNotes || 'Follow-up appointment needed'
        }
      });

      // Create a follow-up appointment if details are provided
      if (data.followUpDate) {
        const followUpDate = new Date(data.followUpDate);
        const followUpDuration = data.followUpDuration || existingAppointment.duration;
        
        const followUpEndTime = new Date(followUpDate);
        followUpEndTime.setMinutes(followUpEndTime.getMinutes() + followUpDuration);

        await prisma.appointment.create({
          data: {
            patientId: existingAppointment.patientId,
            doctorId: existingAppointment.doctorId,
            departmentId: existingAppointment.departmentId,
            appointmentTypeId: existingAppointment.appointmentTypeId,
            title: `Follow-up: ${existingAppointment.title}`,
            description: data.followUpNotes || 'Follow-up appointment',
            startTime: followUpDate,
            endTime: followUpEndTime,
            duration: followUpDuration,
            location: existingAppointment.location,
            createdBy: session.user.id,
            status: 'SCHEDULED',
            confirmationStatus: 'PENDING',
            notes: `Follow-up for appointment on ${existingAppointment.startTime.toLocaleDateString()}`
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment: updatedAppointment
      },
      message: `Appointment status successfully updated to ${data.status}`
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment status' },
      { status: 500 }
    );
  }
}

// GET /api/appointments/status - Get appointment status statistics
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
    const departmentId = url.searchParams.get('departmentId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build filter conditions
    const where: any = {};
    
    if (doctorId) where.doctorId = doctorId;
    if (departmentId) where.departmentId = departmentId;
    
    // Date range filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    // Get appointment status counts
    const statusCounts = await prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    });

    // Format the results
    const formattedCounts = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    // Get total appointments
    const totalAppointments = await prisma.appointment.count({ where });

    // Get no-show rate
    const noShowCount = formattedCounts['NO_SHOW'] || 0;
    const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments) * 100 : 0;

    // Get cancellation rate
    const cancelledCount = formattedCounts['CANCELLED'] || 0;
    const cancellationRate = totalAppointments > 0 ? (cancelledCount / totalAppointments) * 100 : 0;

    // Get completion rate
    const completedCount = formattedCounts['COMPLETED'] || 0;
    const completionRate = totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        statusCounts: formattedCounts,
        totalAppointments,
        noShowRate: parseFloat(noShowRate.toFixed(2)),
        cancellationRate: parseFloat(cancellationRate.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error fetching appointment status statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment status statistics' },
      { status: 500 }
    );
  }
}
