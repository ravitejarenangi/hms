import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/doctors/analytics/co-consultations
 * Get co-consultation analytics for a doctor
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const url = new URL(req.url);
  const doctorId = url.searchParams.get('doctorId');
  const period = url.searchParams.get('period') || 'month'; // 'week', 'month', 'year', 'all'
  
  if (!doctorId) {
    return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
  }
  
  try {
    // Check if user has permission to view this doctor's analytics
    const userId = session.user.id;
    const requestingDoctor = await prisma.doctor.findUnique({
      where: { userId }
    });
    
    const isOwnAnalytics = requestingDoctor && requestingDoctor.id === doctorId;
    const isAdmin = session.user.isAdmin;
    
    if (!isOwnAnalytics && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Define date range based on period
    let startDate: Date | null = null;
    const now = new Date();
    
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    // Get co-consultations where doctor is primary or secondary
    const coConsultations = await prisma.doctorCoConsultation.findMany({
      where: {
        OR: [
          { primaryDoctorId: doctorId },
          { secondaryDoctorId: doctorId }
        ],
        ...(startDate ? { scheduledTime: { gte: startDate } } : {}),
      },
      include: {
        primaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        secondaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        billingDistribution: true,
        patient: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledTime: 'desc'
      }
    });
    
    // Calculate analytics
    const totalCoConsultations = coConsultations.length;
    const asPrimaryDoctor = coConsultations.filter(cc => cc.primaryDoctorId === doctorId).length;
    const asSecondaryDoctor = coConsultations.filter(cc => cc.secondaryDoctorId === doctorId).length;
    
    // Calculate revenue from co-consultations
    let totalRevenue = 0;
    
    coConsultations.forEach(cc => {
      if (cc.billingDistribution) {
        if (cc.primaryDoctorId === doctorId) {
          totalRevenue += cc.billingDistribution.primaryDoctorAmount;
        } else {
          totalRevenue += cc.billingDistribution.secondaryDoctorAmount;
        }
      }
    });
    
    // Get most frequent collaborators
    const collaboratorCounts: Record<string, { count: number, name: string }> = {};
    
    coConsultations.forEach(cc => {
      let collaboratorId, collaboratorName;
      
      if (cc.primaryDoctorId === doctorId) {
        collaboratorId = cc.secondaryDoctorId;
        collaboratorName = cc.secondaryDoctor.user.name;
      } else {
        collaboratorId = cc.primaryDoctorId;
        collaboratorName = cc.primaryDoctor.user.name;
      }
      
      if (!collaboratorCounts[collaboratorId]) {
        collaboratorCounts[collaboratorId] = { count: 0, name: collaboratorName };
      }
      
      collaboratorCounts[collaboratorId].count += 1;
    });
    
    const topCollaborators = Object.entries(collaboratorCounts)
      .map(([id, { count, name }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Group co-consultations by status
    const byStatus = {
      pending: coConsultations.filter(cc => cc.status === 'PENDING').length,
      confirmed: coConsultations.filter(cc => cc.status === 'CONFIRMED').length,
      completed: coConsultations.filter(cc => cc.status === 'COMPLETED').length,
      cancelled: coConsultations.filter(cc => cc.status === 'CANCELLED').length
    };
    
    // Group by month for timeline data
    const timelineData: Record<string, number> = {};
    
    coConsultations.forEach(cc => {
      const date = new Date(cc.scheduledTime);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!timelineData[monthYear]) {
        timelineData[monthYear] = 0;
      }
      
      timelineData[monthYear] += 1;
    });
    
    // Format timeline data for chart
    const timeline = Object.entries(timelineData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCoConsultations,
          asPrimaryDoctor,
          asSecondaryDoctor,
          totalRevenue,
          byStatus
        },
        topCollaborators,
        timeline,
        recentCoConsultations: coConsultations.slice(0, 10) // Return only 10 most recent
      }
    });
    
  } catch (error) {
    console.error('Error fetching co-consultation analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
