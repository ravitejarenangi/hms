import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Fetch bed tracking data (current allocations, expected discharges, etc.)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'current'; // current, discharge, history
    const patientId = searchParams.get('patientId');
    const ward = searchParams.get('ward');
    const floor = searchParams.get('floor');
    const date = searchParams.get('date'); // For discharge planning

    // Build base filters for allocations
    let allocationFilters: any = {};
    let bedFilters: any = {};
    let roomFilters: any = {};
    
    if (patientId) {
      allocationFilters.patientId = patientId;
    }
    
    // Add room/bed filters if provided
    if (ward) {
      roomFilters.wing = ward;
    }
    
    if (floor) {
      roomFilters.floor = floor;
    }

    // Determine what data to fetch based on the view
    let allocations;
    
    if (view === 'current') {
      // Current allocations
      allocations = await prisma.bedAllocation.findMany({
        where: {
          ...allocationFilters,
          status: 'CURRENT',
          bed: {
            ...bedFilters,
            room: roomFilters
          }
        },
        include: {
          bed: {
            include: {
              room: true
            }
          }
        },
        orderBy: {
          allocatedAt: 'desc'
        }
      });
    } else if (view === 'discharge') {
      // Expected discharges
      const targetDate = date ? new Date(date) : new Date();
      
      // Set time to end of day for the target date
      targetDate.setHours(23, 59, 59, 999);
      
      allocations = await prisma.bedAllocation.findMany({
        where: {
          ...allocationFilters,
          status: 'CURRENT',
          expectedDischarge: {
            lte: targetDate
          },
          bed: {
            ...bedFilters,
            room: roomFilters
          }
        },
        include: {
          bed: {
            include: {
              room: true
            }
          }
        },
        orderBy: {
          expectedDischarge: 'asc'
        }
      });
    } else if (view === 'history') {
      // Historical allocations (discharged or transferred)
      allocations = await prisma.bedAllocation.findMany({
        where: {
          ...allocationFilters,
          status: {
            in: ['DISCHARGED', 'TRANSFERRED']
          },
          bed: {
            ...bedFilters,
            room: roomFilters
          }
        },
        include: {
          bed: {
            include: {
              room: true
            }
          }
        },
        orderBy: {
          dischargedAt: 'desc'
        },
        take: 100 // Limit to recent 100 records
      });
    }

    // Fetch patient details for each allocation
    const trackingData = await Promise.all(
      allocations.map(async (allocation) => {
        const patient = await prisma.patient.findUnique({
          where: { id: allocation.patientId },
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true
              }
            },
            mrn: true,
            dateOfBirth: true,
            gender: true,
            contactPhone: true,
            emergencyContact: true
          }
        });

        // Fetch admission data if available
        let admission = null;
        if (allocation.admissionId) {
          admission = await prisma.admission.findUnique({
            where: { id: allocation.admissionId },
            select: {
              id: true,
              admissionDate: true,
              admissionReason: true,
              admittingDoctor: true,
              department: true,
              expectedStayDuration: true
            }
          });
        }

        // Fetch billing data if available
        const billing = await prisma.bedBilling.findUnique({
          where: { allocationId: allocation.id },
          select: {
            id: true,
            baseRate: true,
            totalDays: true,
            additionalCharges: true,
            discounts: true,
            totalAmount: true,
            billingStatus: true,
            paidAmount: true
          }
        });

        // Calculate length of stay
        const allocatedAt = new Date(allocation.allocatedAt);
        const dischargedAt = allocation.dischargedAt ? new Date(allocation.dischargedAt) : new Date();
        const lengthOfStay = Math.ceil((dischargedAt.getTime() - allocatedAt.getTime()) / (1000 * 60 * 60 * 24));

        return {
          allocation: {
            id: allocation.id,
            status: allocation.status,
            allocatedAt: allocation.allocatedAt,
            dischargedAt: allocation.dischargedAt,
            expectedDischarge: allocation.expectedDischarge,
            notes: allocation.notes,
            lengthOfStay
          },
          patient: patient ? {
            id: patient.id,
            name: patient.user.name,
            email: patient.user.email,
            mrn: patient.mrn,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            contactPhone: patient.contactPhone,
            emergencyContact: patient.emergencyContact,
            age: patient.dateOfBirth 
              ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
              : null
          } : null,
          bed: {
            id: allocation.bed.id,
            bedNumber: allocation.bed.bedNumber,
            bedType: allocation.bed.bedType,
            status: allocation.bed.status,
            features: allocation.bed.features
          },
          room: {
            id: allocation.bed.room.id,
            roomNumber: allocation.bed.room.roomNumber,
            floor: allocation.bed.room.floor,
            wing: allocation.bed.room.wing,
            roomType: allocation.bed.room.roomType,
            capacity: allocation.bed.room.capacity
          },
          admission: admission,
          billing: billing
        };
      })
    );

    return NextResponse.json(trackingData);
  } catch (error) {
    console.error('Error fetching bed tracking data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Update discharge planning for a bed allocation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { 
      allocationId, 
      expectedDischarge, 
      notes 
    } = data;

    // Validate required fields
    if (!allocationId) {
      return NextResponse.json(
        { error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    // Check if the allocation exists
    const allocation = await prisma.bedAllocation.findUnique({
      where: { id: allocationId },
      include: {
        bed: {
          include: {
            room: true
          }
        }
      }
    });

    if (!allocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    // Check if the allocation is current
    if (allocation.status !== 'CURRENT') {
      return NextResponse.json(
        { error: 'Can only update discharge planning for current allocations' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (expectedDischarge) {
      updateData.expectedDischarge = new Date(expectedDischarge);
    }
    
    if (notes) {
      updateData.notes = notes;
    }

    // Update the allocation
    const updatedAllocation = await prisma.bedAllocation.update({
      where: { id: allocationId },
      data: updateData,
      include: {
        bed: {
          include: {
            room: true
          }
        }
      }
    });

    // Fetch patient details
    const patient = await prisma.patient.findUnique({
      where: { id: updatedAllocation.patientId },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        mrn: true,
        dateOfBirth: true,
        gender: true,
        contactPhone: true,
        emergencyContact: true
      }
    });

    // Fetch admission data if available
    let admission = null;
    if (updatedAllocation.admissionId) {
      admission = await prisma.admission.findUnique({
        where: { id: updatedAllocation.admissionId },
        select: {
          id: true,
          admissionDate: true,
          admissionReason: true,
          admittingDoctor: true,
          department: true,
          expectedStayDuration: true
        }
      });
    }

    // Calculate length of stay
    const allocatedAt = new Date(updatedAllocation.allocatedAt);
    const expectedDischargeDate = updatedAllocation.expectedDischarge ? new Date(updatedAllocation.expectedDischarge) : null;
    const lengthOfStay = expectedDischargeDate 
      ? Math.ceil((expectedDischargeDate.getTime() - allocatedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Return the updated allocation with details
    return NextResponse.json({
      allocation: {
        id: updatedAllocation.id,
        status: updatedAllocation.status,
        allocatedAt: updatedAllocation.allocatedAt,
        dischargedAt: updatedAllocation.dischargedAt,
        expectedDischarge: updatedAllocation.expectedDischarge,
        notes: updatedAllocation.notes,
        lengthOfStay
      },
      patient: patient ? {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        mrn: patient.mrn,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        contactPhone: patient.contactPhone,
        emergencyContact: patient.emergencyContact,
        age: patient.dateOfBirth 
          ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
          : null
      } : null,
      bed: {
        id: updatedAllocation.bed.id,
        bedNumber: updatedAllocation.bed.bedNumber,
        bedType: updatedAllocation.bed.bedType,
        status: updatedAllocation.bed.status,
        features: updatedAllocation.bed.features
      },
      room: {
        id: updatedAllocation.bed.room.id,
        roomNumber: updatedAllocation.bed.room.roomNumber,
        floor: updatedAllocation.bed.room.floor,
        wing: updatedAllocation.bed.room.wing,
        roomType: updatedAllocation.bed.room.roomType,
        capacity: updatedAllocation.bed.room.capacity
      },
      admission: admission
    });
  } catch (error) {
    console.error('Error updating discharge planning:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT: Discharge a patient from a bed
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { 
      allocationId, 
      dischargeNotes,
      billingComplete
    } = data;

    // Validate required fields
    if (!allocationId) {
      return NextResponse.json(
        { error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    // Check if the allocation exists
    const allocation = await prisma.bedAllocation.findUnique({
      where: { id: allocationId },
      include: {
        bed: true,
        billing: true
      }
    });

    if (!allocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    // Check if the allocation is current
    if (allocation.status !== 'CURRENT') {
      return NextResponse.json(
        { error: 'Can only discharge current allocations' },
        { status: 400 }
      );
    }

    // Check if billing is complete if required
    if (billingComplete === true && allocation.billing) {
      if (allocation.billing.billingStatus !== 'PAID') {
        return NextResponse.json(
          { error: 'Billing must be completed before discharge' },
          { status: 400 }
        );
      }
    }

    // Perform the discharge in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the allocation to discharged
      const updatedAllocation = await tx.bedAllocation.update({
        where: { id: allocationId },
        data: {
          status: 'DISCHARGED',
          dischargedAt: new Date(),
          dischargedBy: session.user.id,
          notes: dischargeNotes || allocation.notes
        }
      });

      // Update the bed status to available
      await tx.bed.update({
        where: { id: allocation.bedId },
        data: {
          status: 'AVAILABLE'
        }
      });

      // If there's an admission record, update it to discharged
      if (allocation.admissionId) {
        await tx.admission.update({
          where: { id: allocation.admissionId },
          data: {
            dischargeDate: new Date(),
            status: 'DISCHARGED',
            dischargeNotes: dischargeNotes || ''
          }
        });
      }

      return updatedAllocation;
    });

    // Fetch the complete updated allocation with all related data
    const updatedAllocation = await prisma.bedAllocation.findUnique({
      where: { id: allocationId },
      include: {
        bed: {
          include: {
            room: true
          }
        }
      }
    });

    // Fetch patient details
    const patient = await prisma.patient.findUnique({
      where: { id: updatedAllocation.patientId },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        mrn: true,
        dateOfBirth: true,
        gender: true
      }
    });

    // Calculate length of stay
    const allocatedAt = new Date(updatedAllocation.allocatedAt);
    const dischargedAt = new Date(updatedAllocation.dischargedAt);
    const lengthOfStay = Math.ceil((dischargedAt.getTime() - allocatedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Return the updated allocation with details
    return NextResponse.json({
      allocation: {
        id: updatedAllocation.id,
        status: updatedAllocation.status,
        allocatedAt: updatedAllocation.allocatedAt,
        dischargedAt: updatedAllocation.dischargedAt,
        expectedDischarge: updatedAllocation.expectedDischarge,
        notes: updatedAllocation.notes,
        lengthOfStay
      },
      patient: patient ? {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        mrn: patient.mrn,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        age: patient.dateOfBirth 
          ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
          : null
      } : null,
      bed: {
        id: updatedAllocation.bed.id,
        bedNumber: updatedAllocation.bed.bedNumber,
        bedType: updatedAllocation.bed.bedType,
        status: 'AVAILABLE', // Already updated in the transaction
        features: updatedAllocation.bed.features
      },
      room: {
        id: updatedAllocation.bed.room.id,
        roomNumber: updatedAllocation.bed.room.roomNumber,
        floor: updatedAllocation.bed.room.floor,
        wing: updatedAllocation.bed.room.wing,
        roomType: updatedAllocation.bed.room.roomType
      },
      message: 'Patient successfully discharged'
    });
  } catch (error) {
    console.error('Error discharging patient:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
