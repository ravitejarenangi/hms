import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Fetch analytics data for bed management
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const metric = searchParams.get('metric') || 'overview';
    const startDate = searchParams.get('startDate') || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const bedType = searchParams.get('bedType');
    const roomType = searchParams.get('roomType');
    const ward = searchParams.get('ward');
    const department = searchParams.get('department');

    // Parse dates
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    // Build filters
    const dateFilter = {
      gte: startDateTime,
      lte: endDateTime
    };

    // Determine which analytics to fetch based on the metric
    switch (metric) {
      case 'occupancy':
        return await getOccupancyAnalytics(startDateTime, endDateTime, bedType, ward);
      case 'los':
        return await getLengthOfStayAnalytics(startDateTime, endDateTime, department);
      case 'revenue':
        return await getRevenueAnalytics(startDateTime, endDateTime, bedType, roomType);
      case 'turnover':
        return await getTurnoverAnalytics(startDateTime, endDateTime, ward);
      case 'efficiency':
        return await getEfficiencyAnalytics(startDateTime, endDateTime, ward);
      case 'overview':
      default:
        return await getOverviewAnalytics(startDateTime, endDateTime);
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function to get occupancy analytics
async function getOccupancyAnalytics(startDate: Date, endDate: Date, bedType?: string, ward?: string) {
  try {
    // Build filters
    const bedFilter: any = {};
    if (bedType) {
      bedFilter.bedType = bedType;
    }

    const roomFilter: any = {};
    if (ward) {
      roomFilter.wing = ward;
    }

    // Get all beds with their allocations during the period
    const beds = await prisma.bed.findMany({
      where: {
        ...bedFilter,
        room: roomFilter
      },
      include: {
        room: true,
        allocations: {
          where: {
            OR: [
              {
                // Allocations that started before the period and ended during or after it
                allocatedAt: { lt: endDate },
                OR: [
                  { dischargedAt: { gte: startDate } },
                  { dischargedAt: null }
                ]
              },
              {
                // Allocations that started during the period
                allocatedAt: {
                  gte: startDate,
                  lte: endDate
                }
              }
            ]
          }
        }
      }
    });

    // Group beds by ward and bed type
    const wardBedTypeMap = new Map();
    
    beds.forEach(bed => {
      const ward = bed.room.wing;
      const bedType = bed.bedType;
      const key = `${ward}-${bedType}`;
      
      if (!wardBedTypeMap.has(key)) {
        wardBedTypeMap.set(key, {
          ward,
          bedType,
          totalBeds: 0,
          occupiedBeds: 0,
          occupancyRate: 0
        });
      }
      
      const group = wardBedTypeMap.get(key);
      group.totalBeds++;
      
      // Check if bed was occupied during the period
      if (bed.allocations.length > 0) {
        group.occupiedBeds++;
      }
    });

    // Calculate occupancy rates
    const occupancyData = Array.from(wardBedTypeMap.values()).map(group => {
      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        ward: group.ward,
        bedType: group.bedType,
        totalBeds: group.totalBeds,
        occupiedBeds: group.occupiedBeds,
        occupancyRate: group.totalBeds > 0 ? (group.occupiedBeds / group.totalBeds) * 100 : 0
      };
    });

    return NextResponse.json(occupancyData);
  } catch (error) {
    console.error('Error getting occupancy analytics:', error);
    throw error;
  }
}

// Helper function to get length of stay analytics
async function getLengthOfStayAnalytics(startDate: Date, endDate: Date, department?: string) {
  try {
    // Build filters
    const admissionFilter: any = {};
    if (department) {
      admissionFilter.department = department;
    }

    // Get all allocations that ended during the period
    const allocations = await prisma.bedAllocation.findMany({
      where: {
        dischargedAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['DISCHARGED', 'TRANSFERRED']
        },
        admission: admissionFilter
      },
      include: {
        admission: true
      }
    });

    // Group by department and diagnosis
    const departmentDiagnosisMap = new Map();
    
    for (const allocation of allocations) {
      // Skip if no admission data
      if (!allocation.admission) continue;
      
      const department = allocation.admission.department;
      const diagnosis = allocation.admission.admissionReason;
      const key = `${department}-${diagnosis}`;
      
      // Calculate length of stay in days
      const allocatedAt = new Date(allocation.allocatedAt);
      const dischargedAt = new Date(allocation.dischargedAt);
      const los = Math.ceil((dischargedAt.getTime() - allocatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (!departmentDiagnosisMap.has(key)) {
        departmentDiagnosisMap.set(key, {
          department,
          diagnosis,
          totalLOS: 0,
          minLOS: Infinity,
          maxLOS: 0,
          patientCount: 0
        });
      }
      
      const group = departmentDiagnosisMap.get(key);
      group.totalLOS += los;
      group.minLOS = Math.min(group.minLOS, los);
      group.maxLOS = Math.max(group.maxLOS, los);
      group.patientCount++;
    }

    // Calculate average LOS
    const losData = Array.from(departmentDiagnosisMap.values()).map(group => {
      return {
        department: group.department,
        diagnosis: group.diagnosis,
        averageLOS: group.patientCount > 0 ? group.totalLOS / group.patientCount : 0,
        minLOS: group.minLOS === Infinity ? 0 : group.minLOS,
        maxLOS: group.maxLOS,
        patientCount: group.patientCount
      };
    });

    return NextResponse.json(losData);
  } catch (error) {
    console.error('Error getting length of stay analytics:', error);
    throw error;
  }
}

// Helper function to get revenue analytics
async function getRevenueAnalytics(startDate: Date, endDate: Date, bedType?: string, roomType?: string) {
  try {
    // Build filters
    const bedFilter: any = {};
    if (bedType) {
      bedFilter.bedType = bedType;
    }

    const roomFilter: any = {};
    if (roomType) {
      roomFilter.roomType = roomType;
    }

    // Get all billing records for the period
    const billingRecords = await prisma.bedBilling.findMany({
      where: {
        billedAt: {
          gte: startDate,
          lte: endDate
        },
        allocation: {
          bed: {
            ...bedFilter,
            room: roomFilter
          }
        }
      },
      include: {
        allocation: {
          include: {
            bed: {
              include: {
                room: true
              }
            }
          }
        }
      }
    });

    // Group by room type and bed type
    const roomBedTypeMap = new Map();
    
    billingRecords.forEach(record => {
      const roomType = record.allocation.bed.room.roomType;
      const bedType = record.allocation.bed.bedType;
      const key = `${roomType}-${bedType}`;
      
      if (!roomBedTypeMap.has(key)) {
        roomBedTypeMap.set(key, {
          roomType,
          bedType,
          totalRevenue: 0,
          occupancyDays: 0,
          billingCount: 0
        });
      }
      
      const group = roomBedTypeMap.get(key);
      group.totalRevenue += parseFloat(record.totalAmount.toString());
      group.occupancyDays += record.totalDays;
      group.billingCount++;
    });

    // Calculate average rate per day
    const revenueData = Array.from(roomBedTypeMap.values()).map(group => {
      return {
        roomType: group.roomType,
        bedType: group.bedType,
        totalRevenue: group.totalRevenue,
        occupancyDays: group.occupancyDays,
        averageRatePerDay: group.occupancyDays > 0 ? group.totalRevenue / group.occupancyDays : 0
      };
    });

    return NextResponse.json(revenueData);
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    throw error;
  }
}

// Helper function to get turnover analytics
async function getTurnoverAnalytics(startDate: Date, endDate: Date, ward?: string) {
  try {
    // Build filters
    const roomFilter: any = {};
    if (ward) {
      roomFilter.wing = ward;
    }

    // Get all allocations that started or ended during the period
    const allocations = await prisma.bedAllocation.findMany({
      where: {
        OR: [
          {
            allocatedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            dischargedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        ],
        bed: {
          room: roomFilter
        }
      },
      include: {
        bed: {
          include: {
            room: true
          }
        }
      }
    });

    // Get all service requests for room cleaning during the period
    const serviceRequests = await prisma.roomServiceRequest.findMany({
      where: {
        requestType: 'HOUSEKEEPING',
        requestedAt: {
          gte: startDate,
          lte: endDate
        },
        completedAt: {
          not: null
        },
        room: roomFilter
      },
      include: {
        room: true
      }
    });

    // Group by ward
    const wardMap = new Map();
    
    // Process allocations
    allocations.forEach(allocation => {
      const ward = allocation.bed.room.wing;
      
      if (!wardMap.has(ward)) {
        wardMap.set(ward, {
          ward,
          admissions: 0,
          discharges: 0,
          cleaningTimes: [],
          turnoverTimes: []
        });
      }
      
      const group = wardMap.get(ward);
      
      // Count admissions during the period
      if (allocation.allocatedAt >= startDate && allocation.allocatedAt <= endDate) {
        group.admissions++;
      }
      
      // Count discharges during the period
      if (allocation.dischargedAt && allocation.dischargedAt >= startDate && allocation.dischargedAt <= endDate) {
        group.discharges++;
      }
    });

    // Process service requests to calculate cleaning times
    serviceRequests.forEach(request => {
      const ward = request.room.wing;
      
      if (!wardMap.has(ward)) {
        wardMap.set(ward, {
          ward,
          admissions: 0,
          discharges: 0,
          cleaningTimes: [],
          turnoverTimes: []
        });
      }
      
      const group = wardMap.get(ward);
      
      // Calculate cleaning time in minutes
      const requestedAt = new Date(request.requestedAt);
      const completedAt = new Date(request.completedAt);
      const cleaningTimeMinutes = (completedAt.getTime() - requestedAt.getTime()) / (1000 * 60);
      
      group.cleaningTimes.push(cleaningTimeMinutes);
    });

    // Calculate turnover times
    // For simplicity, we'll estimate turnover time as the time between a discharge and the next admission for the same bed
    const bedTurnoverMap = new Map();
    
    // Sort allocations by bed and time
    const sortedAllocations = [...allocations].sort((a, b) => {
      if (a.bedId !== b.bedId) {
        return a.bedId.localeCompare(b.bedId);
      }
      return new Date(a.allocatedAt).getTime() - new Date(b.allocatedAt).getTime();
    });
    
    // Find pairs of discharge and next admission
    for (let i = 0; i < sortedAllocations.length - 1; i++) {
      const current = sortedAllocations[i];
      const next = sortedAllocations[i + 1];
      
      // Skip if not the same bed or if current allocation wasn't discharged
      if (current.bedId !== next.bedId || !current.dischargedAt) continue;
      
      const dischargeTime = new Date(current.dischargedAt);
      const nextAdmissionTime = new Date(next.allocatedAt);
      
      // Skip if discharge was after the next admission (shouldn't happen in normal operation)
      if (dischargeTime >= nextAdmissionTime) continue;
      
      // Calculate turnover time in hours
      const turnoverTimeHours = (nextAdmissionTime.getTime() - dischargeTime.getTime()) / (1000 * 60 * 60);
      
      const ward = current.bed.room.wing;
      if (wardMap.has(ward)) {
        wardMap.get(ward).turnoverTimes.push(turnoverTimeHours);
      }
    }

    // Calculate averages
    const turnoverData = Array.from(wardMap.values()).map(group => {
      const avgCleaningTime = group.cleaningTimes.length > 0
        ? group.cleaningTimes.reduce((sum, time) => sum + time, 0) / group.cleaningTimes.length
        : 0;
        
      const avgTurnoverTime = group.turnoverTimes.length > 0
        ? group.turnoverTimes.reduce((sum, time) => sum + time, 0) / group.turnoverTimes.length
        : 0;
        
      return {
        ward: group.ward,
        averageTurnoverTime: avgTurnoverTime,
        admissions: group.admissions,
        discharges: group.discharges,
        cleaningTime: avgCleaningTime,
        preparationTime: avgCleaningTime * 0.5 // Estimate preparation time as half of cleaning time
      };
    });

    return NextResponse.json(turnoverData);
  } catch (error) {
    console.error('Error getting turnover analytics:', error);
    throw error;
  }
}

// Helper function to get efficiency analytics
async function getEfficiencyAnalytics(startDate: Date, endDate: Date, ward?: string) {
  try {
    // Build filters
    const roomFilter: any = {};
    if (ward) {
      roomFilter.wing = ward;
    }

    // Get all rooms with their beds
    const rooms = await prisma.room.findMany({
      where: roomFilter,
      include: {
        beds: {
          include: {
            allocations: {
              where: {
                OR: [
                  {
                    // Allocations that started before the period and ended during or after it
                    allocatedAt: { lt: endDate },
                    OR: [
                      { dischargedAt: { gte: startDate } },
                      { dischargedAt: null }
                    ]
                  },
                  {
                    // Allocations that started during the period
                    allocatedAt: {
                      gte: startDate,
                      lte: endDate
                    }
                  }
                ]
              }
            }
          }
        }
      }
    });

    // Get staff assignments by ward
    const staffAssignments = await prisma.staffAssignment.findMany({
      where: {
        assignmentDate: {
          gte: startDate,
          lte: endDate
        },
        ward: {
          in: rooms.map(room => room.wing)
        }
      },
      include: {
        staff: true
      }
    });

    // Get readmissions data
    const readmissions = await prisma.admission.findMany({
      where: {
        admissionDate: {
          gte: startDate,
          lte: endDate
        },
        isReadmission: true,
        department: {
          in: Array.from(new Set(rooms.map(room => room.department)))
        }
      }
    });

    // Group by ward
    const wardMap = new Map();
    
    // Initialize ward data
    rooms.forEach(room => {
      const ward = room.wing;
      
      if (!wardMap.has(ward)) {
        wardMap.set(ward, {
          ward,
          totalBeds: 0,
          occupiedBedDays: 0,
          totalBedDays: 0,
          staffCount: 0,
          patientCount: 0,
          totalLOS: 0,
          readmissionCount: 0,
          totalAdmissions: 0
        });
      }
      
      const group = wardMap.get(ward);
      group.totalBeds += room.beds.length;
      
      // Calculate bed days and occupancy
      room.beds.forEach(bed => {
        const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        group.totalBedDays += daysInPeriod;
        
        // Calculate occupied days for each allocation
        bed.allocations.forEach(allocation => {
          const allocStart = new Date(allocation.allocatedAt) < startDate ? startDate : new Date(allocation.allocatedAt);
          const allocEnd = allocation.dischargedAt && new Date(allocation.dischargedAt) < endDate 
            ? new Date(allocation.dischargedAt) 
            : endDate;
            
          const occupiedDays = Math.ceil((allocEnd.getTime() - allocStart.getTime()) / (1000 * 60 * 60 * 24));
          group.occupiedBedDays += occupiedDays;
          group.totalLOS += occupiedDays;
          group.patientCount++;
          
          // Count as an admission
          group.totalAdmissions++;
        });
      });
    });

    // Process staff assignments
    staffAssignments.forEach(assignment => {
      const ward = assignment.ward;
      
      if (wardMap.has(ward)) {
        wardMap.get(ward).staffCount++;
      }
    });

    // Process readmissions
    readmissions.forEach(readmission => {
      // Find which ward this department belongs to
      const wardsForDepartment = Array.from(wardMap.keys()).filter(ward => {
        return rooms.some(room => room.wing === ward && room.department === readmission.department);
      });
      
      wardsForDepartment.forEach(ward => {
        if (wardMap.has(ward)) {
          wardMap.get(ward).readmissionCount++;
        }
      });
    });

    // Calculate efficiency metrics
    const efficiencyData = Array.from(wardMap.values()).map(group => {
      const staffToPatientRatio = group.patientCount > 0 && group.staffCount > 0
        ? group.staffCount / group.patientCount
        : 0;
        
      const bedUtilization = group.totalBedDays > 0
        ? (group.occupiedBedDays / group.totalBedDays) * 100
        : 0;
        
      const averageLOS = group.patientCount > 0
        ? group.totalLOS / group.patientCount
        : 0;
        
      const readmissionRate = group.totalAdmissions > 0
        ? (group.readmissionCount / group.totalAdmissions) * 100
        : 0;
        
      return {
        ward: group.ward,
        staffToPatientRatio,
        bedUtilization,
        averageLOS,
        readmissionRate
      };
    });

    return NextResponse.json(efficiencyData);
  } catch (error) {
    console.error('Error getting efficiency analytics:', error);
    throw error;
  }
}

// Helper function to get overview analytics
async function getOverviewAnalytics(startDate: Date, endDate: Date) {
  try {
    // Get overall bed statistics
    const totalBeds = await prisma.bed.count();
    
    const occupiedBeds = await prisma.bed.count({
      where: {
        status: 'OCCUPIED'
      }
    });
    
    const maintenanceBeds = await prisma.bed.count({
      where: {
        status: 'MAINTENANCE'
      }
    });
    
    // Get allocation statistics
    const allocations = await prisma.bedAllocation.findMany({
      where: {
        OR: [
          {
            allocatedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            dischargedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        ]
      }
    });
    
    const admissions = allocations.filter(a => 
      a.allocatedAt >= startDate && a.allocatedAt <= endDate
    ).length;
    
    const discharges = allocations.filter(a => 
      a.dischargedAt && a.dischargedAt >= startDate && a.dischargedAt <= endDate
    ).length;
    
    // Calculate average length of stay
    let totalLOS = 0;
    let completedStays = 0;
    
    allocations.forEach(allocation => {
      if (allocation.dischargedAt) {
        const allocatedAt = new Date(allocation.allocatedAt);
        const dischargedAt = new Date(allocation.dischargedAt);
        const los = Math.ceil((dischargedAt.getTime() - allocatedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        totalLOS += los;
        completedStays++;
      }
    });
    
    const averageLOS = completedStays > 0 ? totalLOS / completedStays : 0;
    
    // Get revenue statistics
    const billingRecords = await prisma.bedBilling.findMany({
      where: {
        billedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    let totalRevenue = 0;
    let paidRevenue = 0;
    
    billingRecords.forEach(record => {
      totalRevenue += parseFloat(record.totalAmount.toString());
      paidRevenue += parseFloat(record.paidAmount.toString());
    });
    
    // Get service request statistics
    const serviceRequests = await prisma.roomServiceRequest.findMany({
      where: {
        requestedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    const pendingRequests = serviceRequests.filter(req => 
      req.status === 'PENDING' || req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS'
    ).length;
    
    const completedRequests = serviceRequests.filter(req => 
      req.status === 'COMPLETED'
    ).length;
    
    // Compile overview data
    const overviewData = {
      bedStats: {
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds - maintenanceBeds,
        maintenanceBeds,
        occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0
      },
      patientMovement: {
        admissions,
        discharges,
        averageLOS,
        netChange: admissions - discharges
      },
      financials: {
        totalRevenue,
        paidRevenue,
        outstandingRevenue: totalRevenue - paidRevenue,
        collectionRate: totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0
      },
      serviceRequests: {
        totalRequests: serviceRequests.length,
        pendingRequests,
        completedRequests,
        completionRate: serviceRequests.length > 0 ? (completedRequests / serviceRequests.length) * 100 : 0
      },
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        daysInPeriod: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    return NextResponse.json(overviewData);
  } catch (error) {
    console.error('Error getting overview analytics:', error);
    throw error;
  }
}
