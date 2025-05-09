import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/pharmacy/batches - Get all medicine batches with optional filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view medicine batches
    if (!await hasPermission(session.user.id, 'pharmacy:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const medicineId = url.searchParams.get('medicineId');
    const batchNumber = url.searchParams.get('batchNumber');
    const status = url.searchParams.get('status');
    const expiryBefore = url.searchParams.get('expiryBefore');
    const expiryAfter = url.searchParams.get('expiryAfter');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build filter object
    const filter: any = {};
    if (medicineId) filter.medicineId = medicineId;
    if (batchNumber) filter.batchNumber = { contains: batchNumber, mode: 'insensitive' };
    if (status) filter.status = status;
    
    // Handle expiry date filtering
    if (expiryBefore || expiryAfter) {
      filter.expiryDate = {};
      if (expiryBefore) filter.expiryDate.lt = new Date(expiryBefore);
      if (expiryAfter) filter.expiryDate.gt = new Date(expiryAfter);
    }

    // Get batches with pagination
    const batches = await prisma.medicineBatch.findMany({
      where: filter,
      include: {
        medicine: true
      },
      skip: offset,
      take: limit,
      orderBy: [
        { status: 'asc' },
        { expiryDate: 'asc' }
      ]
    });

    // Get total count for pagination
    const totalCount = await prisma.medicineBatch.count({
      where: filter
    });

    return NextResponse.json({
      batches,
      pagination: {
        total: totalCount,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching medicine batches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/pharmacy/batches - Create a new medicine batch
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create medicine batches
    if (!await hasPermission(session.user.id, 'pharmacy:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    
    // Validate required fields
    const requiredFields = [
      'medicineId', 'batchNumber', 'expiryDate', 'manufacturingDate', 
      'quantity', 'unitPrice', 'sellingPrice', 'supplier', 'receivedDate'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Check if medicine exists
    const medicine = await prisma.medicine.findUnique({
      where: { id: data.medicineId }
    });

    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    // Create new medicine batch
    const batch = await prisma.medicineBatch.create({
      data: {
        medicineId: data.medicineId,
        batchNumber: data.batchNumber,
        expiryDate: new Date(data.expiryDate),
        manufacturingDate: new Date(data.manufacturingDate),
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        sellingPrice: data.sellingPrice,
        supplier: data.supplier,
        receivedDate: new Date(data.receivedDate),
        receivedBy: session.user.id,
        location: data.location || 'Main Storage',
        status: data.status || 'AVAILABLE',
        notes: data.notes
      }
    });

    // Update inventory if it exists, or create a new inventory record
    const inventory = await prisma.pharmacyInventory.findFirst({
      where: { medicineId: data.medicineId }
    });

    if (inventory) {
      await prisma.pharmacyInventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: { increment: data.quantity },
          lastStockUpdate: new Date()
        }
      });

      // Create inventory transaction record
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          transactionType: 'PURCHASE',
          quantity: data.quantity,
          batchId: batch.id,
          referenceId: data.purchaseOrderId,
          referenceType: 'PURCHASE_ORDER',
          notes: `Batch ${data.batchNumber} received`,
          performedBy: session.user.id
        }
      });
    } else {
      // Create new inventory record
      const newInventory = await prisma.pharmacyInventory.create({
        data: {
          medicineId: data.medicineId,
          batchId: batch.id,
          currentStock: data.quantity,
          minStockLevel: data.minStockLevel || 10,
          maxStockLevel: data.maxStockLevel || 100,
          reorderLevel: data.reorderLevel || 20,
          location: data.location || 'Main Storage',
          lastStockUpdate: new Date()
        }
      });

      // Create inventory transaction record
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: newInventory.id,
          transactionType: 'PURCHASE',
          quantity: data.quantity,
          batchId: batch.id,
          referenceId: data.purchaseOrderId,
          referenceType: 'PURCHASE_ORDER',
          notes: `Initial stock for batch ${data.batchNumber}`,
          performedBy: session.user.id
        }
      });
    }

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating medicine batch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
