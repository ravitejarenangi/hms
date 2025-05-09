import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/doctors/performance
 * 
 * Fetch doctor performance metrics
 * 
 * Query parameters:
 * - doctorId: Doctor ID
 * - period: Period (daily, weekly, monthly, quarterly, yearly)
 * - startDate: Start date for filtering
 * - endDate: End date for filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const doctorId = url.searchParams.get('doctorId');
    const period = url.searchParams.get('period') || 'monthly';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to view performance metrics
    if (doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Build filter conditions
    const where: any = {
      doctorId,
      period
    };
    
    if (startDate) {
      where.startDate = {
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.endDate = {
        lte: new Date(endDate)
      };
    }
    
    // Fetch performance metrics
    const metrics = await prisma.doctorPerformanceMetric.findMany({
      where,
      orderBy: {
        startDate: 'desc'
      }
    });
    
    // If no metrics are found, calculate them on the fly
    if (metrics.length === 0 && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Fetch appointments for the specified date range
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          startTime: {
            gte: start
          },
          endTime: {
            lte: end
          }
        }
      });
      
      // Calculate metrics
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;
      const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length;
      
      // Calculate average duration
      let totalDuration = 0;
      appointments.forEach(appointment => {
        const duration = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60); // in minutes
        totalDuration += duration;
      });
      const averageDuration = totalAppointments > 0 ? Math.round(totalDuration / totalAppointments) : 0;
      
      // Fetch referrals
      const referralsReceived = await prisma.doctorReferral.count({
        where: {
          receivingDoctorId: doctorId,
          createdAt: {
            gte: start,
            lte: end
          }
        }
      });
      
      const referralsMade = await prisma.doctorReferral.count({
        where: {
          referringDoctorId: doctorId,
          createdAt: {
            gte: start,
            lte: end
          }
        }
      });
      
      // Calculate revenue
      const billingItems = await prisma.billingItem.findMany({
        where: {
          doctorId,
          createdAt: {
            gte: start,
            lte: end
          }
        }
      });
      
      const revenueGenerated = billingItems.reduce((total, item) => total + Number(item.amount), 0);
      
      // Create a temporary metric object
      const calculatedMetric = {
        id: 'temp',
        doctorId,
        period,
        startDate: start,
        endDate: end,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        averageDuration,
        appointmentCompletionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        referralsReceived,
        referralsMade,
        revenueGenerated,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        data: {
          metrics: [calculatedMetric],
          isCalculated: true
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        metrics,
        isCalculated: false
      }
    });
  } catch (error) {
    console.error('Error fetching doctor performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctor performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctors/performance
 * 
 * Generate and store performance metrics for a doctor
 * 
 * Request body:
 * - doctorId: Doctor ID
 * - period: Period (daily, weekly, monthly, quarterly, yearly)
 * - startDate: Start date
 * - endDate: End date
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins or users with specific permissions can generate metrics
    if (!hasPermission(session, 'doctors.admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    
    const {
      doctorId,
      period,
      startDate,
      endDate
    } = body;
    
    // Validate required fields
    if (!doctorId || !period || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });
    
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if metrics already exist for this period
    const existingMetrics = await prisma.doctorPerformanceMetric.findFirst({
      where: {
        doctorId,
        period,
        startDate: start,
        endDate: end
      }
    });
    
    if (existingMetrics) {
      return NextResponse.json(
        { success: false, error: 'Performance metrics already exist for this period' },
        { status: 409 }
      );
    }
    
    // Fetch appointments for the specified date range
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: {
          gte: start
        },
        endTime: {
          lte: end
        }
      }
    });
    
    // Calculate metrics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length;
    
    // Calculate average duration
    let totalDuration = 0;
    appointments.forEach(appointment => {
      const duration = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60); // in minutes
      totalDuration += duration;
    });
    const averageDuration = totalAppointments > 0 ? Math.round(totalDuration / totalAppointments) : 0;
    
    // Fetch patient satisfaction (if available)
    // This would require a separate feedback or rating system
    // For now, we'll use a placeholder value
    const patientSatisfaction = null;
    
    // Fetch referrals
    const referralsReceived = await prisma.doctorReferral.count({
      where: {
        receivingDoctorId: doctorId,
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });
    
    const referralsMade = await prisma.doctorReferral.count({
      where: {
        referringDoctorId: doctorId,
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });
    
    // Calculate revenue
    const billingItems = await prisma.billingItem.findMany({
      where: {
        doctorId,
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });
    
    const revenueGenerated = billingItems.reduce((total, item) => total + Number(item.amount), 0);
    
    // Create the performance metric
    const metric = await prisma.doctorPerformanceMetric.create({
      data: {
        doctorId,
        period,
        startDate: start,
        endDate: end,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        averageDuration,
        patientSatisfaction,
        revenueGenerated,
        referralsReceived,
        referralsMade,
        notes: `Automatically generated metrics for ${period} period from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
      }
    });
    
    // Update doctor's total metrics
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        totalAppointments: doctor.totalAppointments + totalAppointments,
        appointmentCompletionRate: doctor.totalAppointments > 0 
          ? ((doctor.totalAppointments * (doctor.appointmentCompletionRate || 0) / 100) + completedAppointments) / (doctor.totalAppointments + totalAppointments) * 100
          : completedAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        averageAppointmentDuration: doctor.totalAppointments > 0
          ? Math.round(((doctor.totalAppointments * (doctor.averageAppointmentDuration || 0)) + (totalAppointments * averageDuration)) / (doctor.totalAppointments + totalAppointments))
          : averageDuration,
        referralCount: doctor.referralCount + referralsMade
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { metric }
    });
  } catch (error) {
    console.error('Error generating doctor performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate doctor performance metrics' },
      { status: 500 }
    );
  }
}
