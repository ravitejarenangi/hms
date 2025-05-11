import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Fetch all bed transfers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const fromBedId = searchParams.get('fromBedId');

    // Build the query filters
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (patientId) {
      filters.patientId = patientId;
    }
    
    if (fromBedId) {
      filters.fromBedId = fromBedId;
    }

    // Fetch transfers with filters
    const transfers = await prisma.bedTransfer.findMany({
      where: filters,
      include: {
        fromBed: {
          include: {
            room: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Fetch patient details and toBed details for each transfer
    const transfersWithDetails = await Promise.all(
      transfers.map(async (transfer) => {
        const patient = await prisma.patient.findUnique({
          where: { id: transfer.patientId },
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true
              }
            },
            mrn: true
          }
        });

        let toBed = null;
        if (transfer.toBedId) {
          toBed = await prisma.bed.findUnique({
            where: { id: transfer.toBedId },
            include: {
              room: true
            }
          });
        }

        return {
          ...transfer,
          patient: patient ? {
            id: patient.id,
            name: patient.user.name,
            email: patient.user.email,
            mrn: patient.mrn
          } : null,
          fromBed: {
            ...transfer.fromBed,
            roomNumber: transfer.fromBed.room.roomNumber,
            floor: transfer.fromBed.room.floor,
            wing: transfer.fromBed.room.wing
          },
          toBed: toBed ? {
            ...toBed,
            roomNumber: toBed.room.roomNumber,
            floor: toBed.room.floor,
            wing: toBed.room.wing
          } : null
        };
      })
    );

    return NextResponse.json(transfersWithDetails);
  } catch (error) {
    console.error('Error fetching bed transfers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new bed transfer request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { patientId, fromBedId, toBedId, transferReason, notes } = data;

    // Validate required fields
    if (!patientId || !fromBedId || !transferReason) {
      return NextResponse.json(
        { error: 'Patient ID, From Bed ID, and Transfer Reason are required' },
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

    // Check if the from bed exists
    const fromBed = await prisma.bed.findUnique({
      where: { id: fromBedId }
    });

    if (!fromBed) {
      return NextResponse.json(
        { error: 'From Bed not found' },
        { status: 404 }
      );
    }

    // Check if the patient is currently allocated to the from bed
    const currentAllocation = await prisma.bedAllocation.findFirst({
      where: {
        patientId,
        bedId: fromBedId,
        status: 'CURRENT'
      }
    });

    if (!currentAllocation) {
      return NextResponse.json(
        { error: 'Patient is not currently allocated to the specified bed' },
        { status: 400 }
      );
    }

    // If toBedId is provided, check if the to bed exists and is available
    if (toBedId) {
      const toBed = await prisma.bed.findUnique({
        where: { id: toBedId }
      });

      if (!toBed) {
        return NextResponse.json(
          { error: 'To Bed not found' },
          { status: 404 }
        );
      }

      if (toBed.status !== 'AVAILABLE') {
        return NextResponse.json(
          { error: 'To Bed is not available for allocation' },
          { status: 400 }
        );
      }
    }

    // Create the transfer request
    const transfer = await prisma.bedTransfer.create({
      data: {
        patientId,
        fromBedId,
        toBedId,
        transferReason,
        notes,
        requestedBy: session.user.id,
        authorizedBy: session.user.id, // In a real scenario, this might be different
        status: 'REQUESTED'
      },
      include: {
        fromBed: {
          include: {
            room: true
          }
        }
      }
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
        mrn: true
      }
    });

    // Fetch toBed details if provided
    let toBedDetails = null;
    if (toBedId) {
      toBedDetails = await prisma.bed.findUnique({
        where: { id: toBedId },
        include: {
          room: true
        }
      });
    }

    // Return the transfer with details
    return NextResponse.json({
      ...transfer,
      patient: patientDetails ? {
        id: patientDetails.id,
        name: patientDetails.user.name,
        email: patientDetails.user.email,
        mrn: patientDetails.mrn
      } : null,
      fromBed: {
        ...transfer.fromBed,
        roomNumber: transfer.fromBed.room.roomNumber,
        floor: transfer.fromBed.room.floor,
        wing: transfer.fromBed.room.wing
      },
      toBed: toBedDetails ? {
        ...toBedDetails,
        roomNumber: toBedDetails.room.roomNumber,
        floor: toBedDetails.room.floor,
        wing: toBedDetails.room.wing
      } : null
    });
  } catch (error) {
    console.error('Error creating bed transfer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT: Update a bed transfer (approve, complete, cancel)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { id, status, notes } = data;

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Transfer ID and Status are required' },
        { status: 400 }
      );
    }

    // Check if the transfer exists
    const transfer = await prisma.bedTransfer.findUnique({
      where: { id },
      include: {
        fromBed: true
      }
    });

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    const validStatuses = ['APPROVED', 'COMPLETED', 'CANCELLED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: APPROVED, COMPLETED, CANCELLED, REJECTED' },
        { status: 400 }
      );
    }

    // Handle the transfer based on the requested status
    let updatedTransfer;

    if (status === 'COMPLETED') {
      // Complete the transfer in a transaction
      updatedTransfer = await prisma.$transaction(async (tx) => {
        // Update the transfer status
        const updated = await tx.bedTransfer.update({
          where: { id },
          data: {
            status,
            notes: notes || transfer.notes,
            completedAt: new Date()
          },
          include: {
            fromBed: {
              include: {
                room: true
              }
            }
          }
        });

        // If there's a toBedId, perform the actual transfer
        if (transfer.toBedId) {
          // Get the current allocation
          const currentAllocation = await tx.bedAllocation.findFirst({
            where: {
              patientId: transfer.patientId,
              bedId: transfer.fromBedId,
              status: 'CURRENT'
            }
          });

          if (currentAllocation) {
            // Update the current allocation to TRANSFERRED
            await tx.bedAllocation.update({
              where: { id: currentAllocation.id },
              data: {
                status: 'TRANSFERRED',
                dischargedAt: new Date(),
                dischargedBy: session.user.id,
                notes: `Transferred to bed ID: ${transfer.toBedId}`
              }
            });

            // Create a new allocation for the new bed
            await tx.bedAllocation.create({
              data: {
                bedId: transfer.toBedId,
                patientId: transfer.patientId,
                allocatedBy: session.user.id,
                expectedDischarge: currentAllocation.expectedDischarge,
                notes: `Transferred from bed ID: ${transfer.fromBedId}`,
                status: 'CURRENT'
              }
            });

            // Update the bed statuses
            await tx.bed.update({
              where: { id: transfer.fromBedId },
              data: { status: 'AVAILABLE' }
            });

            await tx.bed.update({
              where: { id: transfer.toBedId },
              data: { status: 'OCCUPIED' }
            });
          }
        }

        return updated;
      });
    } else {
      // For other statuses, just update the transfer
      updatedTransfer = await prisma.bedTransfer.update({
        where: { id },
        data: {
          status,
          notes: notes || transfer.notes,
          completedAt: status === 'CANCELLED' || status === 'REJECTED' ? new Date() : null
        },
        include: {
          fromBed: {
            include: {
              room: true
            }
          }
        }
      });
    }

    // Fetch patient details
    const patientDetails = await prisma.patient.findUnique({
      where: { id: transfer.patientId },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        mrn: true
      }
    });

    // Fetch toBed details if provided
    let toBedDetails = null;
    if (transfer.toBedId) {
      toBedDetails = await prisma.bed.findUnique({
        where: { id: transfer.toBedId },
        include: {
          room: true
        }
      });
    }

    // Return the updated transfer with details
    return NextResponse.json({
      ...updatedTransfer,
      patient: patientDetails ? {
        id: patientDetails.id,
        name: patientDetails.user.name,
        email: patientDetails.user.email,
        mrn: patientDetails.mrn
      } : null,
      fromBed: {
        ...updatedTransfer.fromBed,
        roomNumber: updatedTransfer.fromBed.room.roomNumber,
        floor: updatedTransfer.fromBed.room.floor,
        wing: updatedTransfer.fromBed.room.wing
      },
      toBed: toBedDetails ? {
        ...toBedDetails,
        roomNumber: toBedDetails.room.roomNumber,
        floor: toBedDetails.room.floor,
        wing: toBedDetails.room.wing
      } : null
    });
  } catch (error) {
    console.error('Error updating bed transfer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
