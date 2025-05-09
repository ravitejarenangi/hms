import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/appointments/history - Get appointment history with filtering and reporting
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
    const reportType = url.searchParams.get('reportType'); // 'patient', 'doctor', 'department', 'status'
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

    // If no report type is specified, return paginated appointment history
    if (!reportType) {
      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            appointmentType: true,
            appointmentNotes: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
          orderBy: {
            startTime: 'desc'
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
    }

    // Generate reports based on reportType
    let reportData;

    switch (reportType) {
      case 'patient':
        // Report on appointments by patient
        reportData = await prisma.appointment.groupBy({
          by: ['patientId'],
          where,
          _count: {
            id: true
          },
          _min: {
            startTime: true
          },
          _max: {
            startTime: true
          }
        });

        // Enhance with patient details
        const patientIds = reportData.map(item => item.patientId);
        const patients = await prisma.user.findMany({
          where: {
            id: {
              in: patientIds
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        });

        // Map patient details to report data
        reportData = reportData.map(item => {
          const patient = patients.find(p => p.id === item.patientId);
          return {
            patientId: item.patientId,
            patientName: patient?.name || 'Unknown',
            patientEmail: patient?.email || 'Unknown',
            patientPhone: patient?.phone || 'Unknown',
            appointmentCount: item._count.id,
            firstAppointment: item._min.startTime,
            lastAppointment: item._max.startTime
          };
        });
        break;

      case 'doctor':
        // Report on appointments by doctor
        reportData = await prisma.appointment.groupBy({
          by: ['doctorId'],
          where,
          _count: {
            id: true
          },
          _min: {
            startTime: true
          },
          _max: {
            startTime: true
          }
        });

        // Enhance with doctor details
        const doctorIds = reportData.map(item => item.doctorId);
        const doctors = await prisma.doctor.findMany({
          where: {
            id: {
              in: doctorIds
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        // Map doctor details to report data
        reportData = reportData.map(item => {
          const doctor = doctors.find(d => d.id === item.doctorId);
          return {
            doctorId: item.doctorId,
            doctorName: doctor?.user?.name || 'Unknown',
            doctorEmail: doctor?.user?.email || 'Unknown',
            specialization: doctor?.specialization || 'Unknown',
            appointmentCount: item._count.id,
            firstAppointment: item._min.startTime,
            lastAppointment: item._max.startTime
          };
        });
        break;

      case 'department':
        // Report on appointments by department
        reportData = await prisma.appointment.groupBy({
          by: ['departmentId'],
          where,
          _count: {
            id: true
          },
          _min: {
            startTime: true
          },
          _max: {
            startTime: true
          }
        });

        // Filter out null departmentIds
        reportData = reportData.filter(item => item.departmentId !== null);

        // Enhance with department details if needed
        // This would require a Department model which might not exist yet
        break;

      case 'status':
        // Report on appointments by status
        reportData = await prisma.appointment.groupBy({
          by: ['status'],
          where,
          _count: {
            id: true
          },
          _min: {
            startTime: true
          },
          _max: {
            startTime: true
          }
        });

        // Calculate percentages
        const totalAppointments = reportData.reduce((sum, item) => sum + item._count.id, 0);
        
        reportData = reportData.map(item => ({
          status: item.status,
          count: item._count.id,
          percentage: totalAppointments > 0 ? (item._count.id / totalAppointments) * 100 : 0,
          firstOccurrence: item._min.startTime,
          lastOccurrence: item._max.startTime
        }));
        break;

      case 'time':
        // Report on appointments by time of day
        const timeSlots = [
          { label: 'Morning (6AM-12PM)', start: 6, end: 12 },
          { label: 'Afternoon (12PM-5PM)', start: 12, end: 17 },
          { label: 'Evening (5PM-9PM)', start: 17, end: 21 },
          { label: 'Night (9PM-6AM)', start: 21, end: 6 }
        ];

        // Get all appointments within the filter
        const allAppointments = await prisma.appointment.findMany({
          where,
          select: {
            id: true,
            startTime: true,
            status: true
          }
        });

        // Group appointments by time slot
        reportData = timeSlots.map(slot => {
          const appointmentsInSlot = allAppointments.filter(appointment => {
            const hour = appointment.startTime.getHours();
            if (slot.start < slot.end) {
              return hour >= slot.start && hour < slot.end;
            } else {
              // Handle overnight slot (e.g., 9PM-6AM)
              return hour >= slot.start || hour < slot.end;
            }
          });

          return {
            timeSlot: slot.label,
            count: appointmentsInSlot.length,
            percentage: allAppointments.length > 0 ? (appointmentsInSlot.length / allAppointments.length) * 100 : 0,
            completedCount: appointmentsInSlot.filter(a => a.status === 'COMPLETED').length,
            cancelledCount: appointmentsInSlot.filter(a => a.status === 'CANCELLED').length,
            noShowCount: appointmentsInSlot.filter(a => a.status === 'NO_SHOW').length
          };
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        reportData
      }
    });
  } catch (error) {
    console.error('Error generating appointment history report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate appointment history report' },
      { status: 500 }
    );
  }
}
