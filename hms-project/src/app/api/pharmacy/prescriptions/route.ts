import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/pharmacy/prescriptions - Get prescriptions with optional filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view prescriptions
    if (!await hasPermission(session.user.id, 'pharmacy:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const patientId = url.searchParams.get('patientId');
    const doctorId = url.searchParams.get('doctorId');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build filter object
    const filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;
    
    // Handle date range filtering
    if (startDate || endDate) {
      filter.prescribedDate = {};
      if (startDate) filter.prescribedDate.gte = new Date(startDate);
      if (endDate) filter.prescribedDate.lte = new Date(endDate);
    }

    // Get prescriptions with pagination
    const prescriptions = await prisma.prescription.findMany({
      where: filter,
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        medications: {
          include: {
            medication: true
          }
        },
        dispensations: true
      },
      skip: offset,
      take: limit,
      orderBy: {
        prescribedDate: 'desc'
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.prescription.count({
      where: filter
    });

    return NextResponse.json({
      prescriptions,
      pagination: {
        total: totalCount,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/pharmacy/prescriptions/dispense - Dispense medication for a prescription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to dispense medications
    if (!await hasPermission(session.user.id, 'pharmacy:dispense')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['prescriptionId', 'medications'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Check if prescription exists
    const prescription = await prisma.prescription.findUnique({
      where: { id: data.prescriptionId },
      include: {
        medications: true
      }
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Validate medications
    if (!Array.isArray(data.medications) || data.medications.length === 0) {
      return NextResponse.json({ error: 'Medications must be a non-empty array' }, { status: 400 });
    }

    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Create dispensation record
      const dispensation = await tx.medicationDispensation.create({
        data: {
          prescriptionId: data.prescriptionId,
          dispensedBy: session.user.id,
          notes: data.notes
        }
      });

      // Process each medication
      for (const med of data.medications) {
        if (!med.medicationId || !med.batchId || !med.quantity) {
          throw new Error('Each medication must have medicationId, batchId, and quantity');
        }

        // Check if this medication is part of the prescription
        const prescriptionMed = prescription.medications.find(m => m.medicationId === med.medicationId);
        if (!prescriptionMed) {
          throw new Error(`Medication ${med.medicationId} is not part of this prescription`);
        }

        // Check if batch exists and has enough stock
        const batch = await tx.medicineBatch.findUnique({
          where: { id: med.batchId }
        });

        if (!batch) {
          throw new Error(`Batch ${med.batchId} not found`);
        }

        if (batch.quantity < med.quantity) {
          throw new Error(`Insufficient stock for batch ${batch.batchNumber}. Available: ${batch.quantity}, Requested: ${med.quantity}`);
        }

        // Update batch quantity
        await tx.medicineBatch.update({
          where: { id: med.batchId },
          data: {
            quantity: {
              decrement: med.quantity
            },
            status: batch.quantity - med.quantity <= 0 ? 'OUT_OF_STOCK' : undefined
          }
        });

        // Update inventory
        const inventory = await tx.pharmacyInventory.findFirst({
          where: { medicineId: med.medicationId }
        });

        if (inventory) {
          await tx.pharmacyInventory.update({
            where: { id: inventory.id },
            data: {
              currentStock: {
                decrement: med.quantity
              },
              lastStockUpdate: new Date()
            }
          });

          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              transactionType: 'SALE',
              quantity: med.quantity,
              batchId: med.batchId,
              referenceId: dispensation.id,
              referenceType: 'DISPENSATION',
              notes: `Dispensed for prescription ${prescription.prescriptionNumber}`,
              performedBy: session.user.id
            }
          });
        }
      }

      // Create pharmacy sale record if billing is enabled
      if (data.createSale) {
        const saleItems = data.medications.map(med => ({
          medicineId: med.medicationId,
          batchId: med.batchId,
          quantity: med.quantity,
          unitPrice: med.unitPrice,
          totalPrice: med.unitPrice * med.quantity,
          discount: med.discount || 0,
          tax: med.tax || 0,
          netPrice: (med.unitPrice * med.quantity) - (med.discount || 0) + (med.tax || 0)
        }));

        const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const discountAmount = saleItems.reduce((sum, item) => sum + item.discount, 0);
        const taxAmount = saleItems.reduce((sum, item) => sum + item.tax, 0);
        const netAmount = totalAmount - discountAmount + taxAmount;

        const sale = await tx.pharmacySale.create({
          data: {
            saleNumber: `SALE-${Date.now()}`,
            patientId: prescription.patientId,
            prescriptionId: prescription.id,
            totalAmount,
            discountAmount,
            taxAmount,
            netAmount,
            paymentMethod: data.paymentMethod || 'CASH',
            paymentStatus: data.paymentStatus || 'PAID',
            invoiceId: data.invoiceId,
            notes: data.saleNotes,
            soldBy: session.user.id,
            items: {
              create: saleItems
            }
          }
        });

        return { dispensation, sale };
      }

      return { dispensation };
    });

    // Update prescription status if all medications have been dispensed
    if (data.updatePrescriptionStatus) {
      await prisma.prescription.update({
        where: { id: data.prescriptionId },
        data: {
          status: data.prescriptionStatus || 'COMPLETED'
        }
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error dispensing medication:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
}
