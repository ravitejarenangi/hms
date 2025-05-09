import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/pharmacy/inventory - Get inventory status with optional filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view inventory
    if (!await hasPermission(session.user.id, 'pharmacy:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const medicineId = url.searchParams.get('medicineId');
    const lowStock = url.searchParams.get('lowStock') === 'true';
    const outOfStock = url.searchParams.get('outOfStock') === 'true';
    const expiringWithin = url.searchParams.get('expiringWithin'); // Number of days
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build filter object
    const filter: any = {};
    if (medicineId) filter.medicineId = medicineId;
    
    // Handle low stock filter
    if (lowStock) {
      filter.OR = filter.OR || [];
      filter.OR.push({
        currentStock: {
          lte: { reorderLevel: true }
        }
      });
    }

    // Handle out of stock filter
    if (outOfStock) {
      filter.OR = filter.OR || [];
      filter.OR.push({
        currentStock: 0
      });
    }

    // Get inventory with pagination
    const inventory = await prisma.pharmacyInventory.findMany({
      where: filter,
      include: {
        medicine: true,
        batch: true,
        transactions: {
          take: 5,
          orderBy: {
            performedAt: 'desc'
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: [
        { currentStock: 'asc' },
        { lastStockUpdate: 'desc' }
      ]
    });

    // Get total count for pagination
    const totalCount = await prisma.pharmacyInventory.count({
      where: filter
    });

    // If expiring within filter is applied, get batches that are expiring
    let expiringBatches = [];
    if (expiringWithin) {
      const days = parseInt(expiringWithin);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      expiringBatches = await prisma.medicineBatch.findMany({
        where: {
          expiryDate: {
            lte: expiryDate
          },
          status: 'AVAILABLE',
          quantity: {
            gt: 0
          }
        },
        include: {
          medicine: true
        },
        orderBy: {
          expiryDate: 'asc'
        }
      });
    }

    return NextResponse.json({
      inventory,
      expiringBatches: expiringWithin ? expiringBatches : undefined,
      pagination: {
        total: totalCount,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/pharmacy/inventory/adjust - Adjust inventory
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to adjust inventory
    if (!await hasPermission(session.user.id, 'pharmacy:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['inventoryId', 'transactionType', 'quantity'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Check if inventory exists
    const inventory = await prisma.pharmacyInventory.findUnique({
      where: { id: data.inventoryId }
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    // Validate transaction type
    const validTransactionTypes = ['ADJUSTMENT', 'TRANSFER', 'EXPIRED', 'DAMAGED'];
    if (!validTransactionTypes.includes(data.transactionType)) {
      return NextResponse.json({ 
        error: `Invalid transaction type. Must be one of: ${validTransactionTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Calculate new stock level
    let newStock = inventory.currentStock;
    if (['EXPIRED', 'DAMAGED', 'TRANSFER'].includes(data.transactionType)) {
      // These transaction types decrease inventory
      newStock -= data.quantity;
      if (newStock < 0) {
        return NextResponse.json({ 
          error: 'Cannot adjust inventory below zero' 
        }, { status: 400 });
      }
    } else if (data.transactionType === 'ADJUSTMENT') {
      // Adjustment can increase or decrease inventory
      if (data.adjustmentType === 'INCREASE') {
        newStock += data.quantity;
      } else if (data.adjustmentType === 'DECREASE') {
        newStock -= data.quantity;
        if (newStock < 0) {
          return NextResponse.json({ 
            error: 'Cannot adjust inventory below zero' 
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({ 
          error: 'For ADJUSTMENT transaction type, adjustmentType must be INCREASE or DECREASE' 
        }, { status: 400 });
      }
    }

    // Update inventory
    const updatedInventory = await prisma.pharmacyInventory.update({
      where: { id: data.inventoryId },
      data: {
        currentStock: newStock,
        lastStockUpdate: new Date()
      }
    });

    // Create inventory transaction record
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        inventoryId: data.inventoryId,
        transactionType: data.transactionType,
        quantity: data.quantity,
        batchId: data.batchId,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        notes: data.notes,
        performedBy: session.user.id
      }
    });

    // If the transaction is for a specific batch, update the batch quantity
    if (data.batchId) {
      await prisma.medicineBatch.update({
        where: { id: data.batchId },
        data: {
          quantity: {
            decrement: data.transactionType !== 'ADJUSTMENT' || data.adjustmentType === 'DECREASE' 
              ? data.quantity 
              : 0
          },
          status: newStock <= 0 ? 'OUT_OF_STOCK' : undefined
        }
      });
    }

    return NextResponse.json({
      inventory: updatedInventory,
      transaction
    }, { status: 200 });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
