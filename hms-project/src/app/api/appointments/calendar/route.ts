import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/appointments/calendar - Get appointments for calendar view
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
    const view = url.searchParams.get('view') || 'month'; // day, week, month

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Build filter conditions
    const where: any = {
      startTime: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      status: {
        notIn: ['CANCELLED', 'NO_SHOW']
      }
    };
    
    if (doctorId) where.doctorId = doctorId;
    if (departmentId) where.departmentId = departmentId;

    // Get appointments for the calendar
    const appointments = await prisma.appointment.findMany({
      where,
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
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Format appointments for calendar display
    const calendarEvents = appointments.map(appointment => {
      return {
        id: appointment.id,
        title: `${appointment.title} - ${appointment.patient.name}`,
        start: appointment.startTime,
        end: appointment.endTime,
        status: appointment.status,
        confirmationStatus: appointment.confirmationStatus,
        color: appointment.appointmentType.color,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        departmentId: appointment.departmentId,
        location: appointment.location,
        allDay: false,
        extendedProps: {
          appointmentType: appointment.appointmentType.name,
          patientName: appointment.patient.name,
          patientEmail: appointment.patient.email,
          patientPhone: appointment.patient.phone,
          description: appointment.description,
          notes: appointment.notes
        }
      };
    });

    // If requested, also return doctor availability
    let availability = [];
    if (doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId }
      });

      if (doctor) {
        // Convert doctor's available days and times to calendar events
        const availableDays = doctor.availableDays || [];
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        for (let day = new Date(startDateObj); day <= endDateObj; day.setDate(day.getDate() + 1)) {
          const dayOfWeek = day.getDay(); // 0 for Sunday, 1 for Monday, etc.
          
          if (availableDays.includes(dayOfWeek)) {
            const availableFrom = doctor.availableFrom || '09:00';
            const availableTo = doctor.availableTo || '17:00';
            
            const [fromHours, fromMinutes] = availableFrom.split(':').map(Number);
            const [toHours, toMinutes] = availableTo.split(':').map(Number);
            
            const startTime = new Date(day);
            startTime.setHours(fromHours, fromMinutes, 0, 0);
            
            const endTime = new Date(day);
            endTime.setHours(toHours, toMinutes, 0, 0);
            
            availability.push({
              id: `availability-${day.toISOString()}-${doctorId}`,
              title: 'Available',
              start: startTime,
              end: endTime,
              color: '#e0f7fa', // Light blue
              rendering: 'background',
              allDay: false
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        events: calendarEvents,
        availability
      }
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
