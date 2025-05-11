import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Fetch all bed billing records
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const allocationId = searchParams.get('allocationId');

    // Build the query filters
    let filters: any = {};
    
    if (status) {
      filters.billingStatus = status;
    }
    
    if (allocationId) {
      filters.allocationId = allocationId;
    }
    
    // For patient filtering, we need to join with allocation
    let patientFilter = {};
    if (patientId) {
      patientFilter = {
        patientId
      };
    }

    // Fetch billing records with filters
    const billingRecords = await prisma.bedBilling.findMany({
      where: filters,
      include: {
        allocation: {
          where: patientFilter,
          include: {
            bed: {
              include: {
                room: true
              }
            }
          }
        }
      },
      orderBy: {
        billedAt: 'desc'
      }
    });

    // Filter out records where allocation doesn't match patient filter
    const filteredRecords = billingRecords.filter(record => record.allocation !== null);

    // Fetch patient details for each billing record
    const recordsWithDetails = await Promise.all(
      filteredRecords.map(async (record) => {
        const patient = await prisma.patient.findUnique({
          where: { id: record.allocation.patientId },
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

        return {
          ...record,
          patient: patient ? {
            id: patient.id,
            name: patient.user.name,
            email: patient.user.email,
            mrn: patient.mrn
          } : null,
          bed: record.allocation.bed ? {
            id: record.allocation.bed.id,
            bedNumber: record.allocation.bed.bedNumber,
            bedType: record.allocation.bed.bedType,
            roomNumber: record.allocation.bed.room.roomNumber,
            floor: record.allocation.bed.room.floor,
            wing: record.allocation.bed.room.wing,
            roomType: record.allocation.bed.room.roomType
          } : null,
          allocationPeriod: {
            allocatedAt: record.allocation.allocatedAt,
            dischargedAt: record.allocation.dischargedAt,
            expectedDischarge: record.allocation.expectedDischarge
          }
        };
      })
    );

    return NextResponse.json(recordsWithDetails);
  } catch (error) {
    console.error('Error fetching bed billing records:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create or update a bed billing record
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { 
      allocationId, 
      baseRate, 
      additionalCharges, 
      discounts, 
      totalDays,
      notes 
    } = data;

    // Validate required fields
    if (!allocationId || baseRate === undefined || totalDays === undefined) {
      return NextResponse.json(
        { error: 'Allocation ID, Base Rate, and Total Days are required' },
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

    // Calculate total amount
    const totalAmount = parseFloat(baseRate) * totalDays + 
      (additionalCharges ? parseFloat(additionalCharges) : 0) - 
      (discounts ? parseFloat(discounts) : 0);

    // Check if a billing record already exists for this allocation
    const existingBilling = await prisma.bedBilling.findUnique({
      where: { allocationId }
    });

    let billingRecord;

    if (existingBilling) {
      // Update existing billing record
      billingRecord = await prisma.bedBilling.update({
        where: { id: existingBilling.id },
        data: {
          baseRate: parseFloat(baseRate),
          totalDays,
          additionalCharges: additionalCharges ? parseFloat(additionalCharges) : 0,
          discounts: discounts ? parseFloat(discounts) : 0,
          totalAmount,
          notes: notes || existingBilling.notes,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new billing record
      billingRecord = await prisma.bedBilling.create({
        data: {
          allocationId,
          baseRate: parseFloat(baseRate),
          totalDays,
          additionalCharges: additionalCharges ? parseFloat(additionalCharges) : 0,
          discounts: discounts ? parseFloat(discounts) : 0,
          totalAmount,
          billingStatus: 'PENDING',
          billedBy: session.user.id,
          notes
        }
      });
    }

    // Fetch patient details
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
        mrn: true
      }
    });

    // Return the billing record with details
    return NextResponse.json({
      ...billingRecord,
      patient: patient ? {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        mrn: patient.mrn
      } : null,
      bed: allocation.bed ? {
        id: allocation.bed.id,
        bedNumber: allocation.bed.bedNumber,
        bedType: allocation.bed.bedType,
        roomNumber: allocation.bed.room.roomNumber,
        floor: allocation.bed.room.floor,
        wing: allocation.bed.room.wing,
        roomType: allocation.bed.room.roomType
      } : null,
      allocationPeriod: {
        allocatedAt: allocation.allocatedAt,
        dischargedAt: allocation.dischargedAt,
        expectedDischarge: allocation.expectedDischarge
      }
    });
  } catch (error) {
    console.error('Error creating/updating bed billing record:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT: Update billing status (PENDING, INVOICED, PAID, CANCELLED)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { 
      id, 
      billingStatus, 
      invoiceNumber, 
      paidAmount, 
      paidAt,
      notes 
    } = data;

    // Validate required fields
    if (!id || !billingStatus) {
      return NextResponse.json(
        { error: 'Billing ID and Billing Status are required' },
        { status: 400 }
      );
    }

    // Check if the billing record exists
    const billing = await prisma.bedBilling.findUnique({
      where: { id },
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

    if (!billing) {
      return NextResponse.json(
        { error: 'Billing record not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    const validStatuses = ['PENDING', 'INVOICED', 'PAID', 'CANCELLED'];
    if (!validStatuses.includes(billingStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: PENDING, INVOICED, PAID, CANCELLED' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      billingStatus,
      notes: notes || billing.notes
    };

    // Add invoice number if provided and status is INVOICED
    if (billingStatus === 'INVOICED' && invoiceNumber) {
      updateData.invoiceNumber = invoiceNumber;
    }

    // Add payment details if provided and status is PAID
    if (billingStatus === 'PAID') {
      if (paidAmount !== undefined) {
        updateData.paidAmount = parseFloat(paidAmount);
      }
      
      if (paidAt) {
        updateData.paidAt = new Date(paidAt);
      } else {
        updateData.paidAt = new Date();
      }
    }

    // Update the billing record
    const updatedBilling = await prisma.bedBilling.update({
      where: { id },
      data: updateData
    });

    // Fetch patient details
    const patient = await prisma.patient.findUnique({
      where: { id: billing.allocation.patientId },
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

    // Return the updated billing record with details
    return NextResponse.json({
      ...updatedBilling,
      patient: patient ? {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        mrn: patient.mrn
      } : null,
      bed: billing.allocation.bed ? {
        id: billing.allocation.bed.id,
        bedNumber: billing.allocation.bed.bedNumber,
        bedType: billing.allocation.bed.bedType,
        roomNumber: billing.allocation.bed.room.roomNumber,
        floor: billing.allocation.bed.room.floor,
        wing: billing.allocation.bed.room.wing,
        roomType: billing.allocation.bed.room.roomType
      } : null,
      allocationPeriod: {
        allocatedAt: billing.allocation.allocatedAt,
        dischargedAt: billing.allocation.dischargedAt,
        expectedDischarge: billing.allocation.expectedDischarge
      }
    });
  } catch (error) {
    console.error('Error updating billing status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
