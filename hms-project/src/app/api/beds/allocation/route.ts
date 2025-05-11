import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Fetch all bed allocations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const bedId = searchParams.get('bedId');

    // Build the query filters
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (patientId) {
      filters.patientId = patientId;
    }
    
    if (bedId) {
      filters.bedId = bedId;
    }

    // Fetch allocations with filters
    const allocations = await prisma.bedAllocation.findMany({
      where: filters,
      include: {
        bed: {
          include: {
            room: true
          }
        },
        billing: true
      },
      orderBy: {
        allocatedAt: 'desc'
      }
    });

    // Fetch patient details for each allocation
    const allocationsWithPatients = await Promise.all(
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
            gender: true
          }
        });

        return {
          ...allocation,
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
            ...allocation.bed,
            roomNumber: allocation.bed.room.roomNumber,
            floor: allocation.bed.room.floor,
            wing: allocation.bed.room.wing
          }
        };
      })
    );

    return NextResponse.json(allocationsWithPatients);
  } catch (error) {
    console.error('Error fetching bed allocations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new bed allocation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { bedId, patientId, expectedDischarge, notes } = data;

    // Validate required fields
    if (!bedId || !patientId) {
      return NextResponse.json(
        { error: 'Bed ID and Patient ID are required' },
        { status: 400 }
      );
    }

    // Check if the bed exists and is available
    const bed = await prisma.bed.findUnique({
      where: { id: bedId }
    });

    if (!bed) {
      return NextResponse.json(
        { error: 'Bed not found' },
        { status: 404 }
      );
    }

    if (bed.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Bed is not available for allocation' },
        { status: 400 }
      );
    }

    // Check if the patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if the patient is already allocated to another bed
    const existingAllocation = await prisma.bedAllocation.findFirst({
      where: {
        patientId,
        status: 'CURRENT'
      }
    });

    if (existingAllocation) {
      return NextResponse.json(
        { error: 'Patient is already allocated to another bed' },
        { status: 400 }
      );
    }

    // Create the allocation in a transaction
    const allocation = await prisma.$transaction(async (tx) => {
      // Update the bed status to OCCUPIED
      await tx.bed.update({
        where: { id: bedId },
        data: { status: 'OCCUPIED' }
      });

      // Create the allocation
      const newAllocation = await tx.bedAllocation.create({
        data: {
          bedId,
          patientId,
          expectedDischarge: expectedDischarge ? new Date(expectedDischarge) : null,
          notes,
          status: 'CURRENT',
          allocatedBy: session.user.id,
          allocatedAt: new Date()
        },
        include: {
          bed: {
            include: {
              room: true
            }
          }
        }
      });

      // Get bed pricing for billing
      const bedPricing = await tx.bedPricing.findFirst({
        where: {
          bedType: bed.bedType,
          roomType: newAllocation.bed.room.roomType,
          isActive: true
        },
        orderBy: {
          effectiveFrom: 'desc'
        }
      });

      // Create initial billing record if pricing exists
      if (bedPricing) {
        await tx.bedBilling.create({
          data: {
            allocationId: newAllocation.id,
            baseRate: bedPricing.baseRate,
            totalDays: 1, // Initial day
            totalAmount: bedPricing.baseRate, // Initial amount
            billingStatus: 'PENDING',
            billedBy: session.user.id
          }
        });
      }

      return newAllocation;
    });

    // Fetch patient details
    const patientDetails = await prisma.patient.findUnique({
      where: { id: patientId },
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

    // Return the allocation with patient details
    return NextResponse.json({
      ...allocation,
      patient: patientDetails ? {
        id: patientDetails.id,
        name: patientDetails.user.name,
        email: patientDetails.user.email,
        mrn: patientDetails.mrn,
        dateOfBirth: patientDetails.dateOfBirth,
        gender: patientDetails.gender,
        age: patientDetails.dateOfBirth 
          ? Math.floor((new Date().getTime() - new Date(patientDetails.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
          : null
      } : null,
      bed: {
        ...allocation.bed,
        roomNumber: allocation.bed.room.roomNumber,
        floor: allocation.bed.room.floor,
        wing: allocation.bed.room.wing
      }
    });
  } catch (error) {
    console.error('Error creating bed allocation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
