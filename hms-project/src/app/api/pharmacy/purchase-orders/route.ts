import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/pharmacy/purchase-orders - Get all purchase orders with optional filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view purchase orders
    if (!await hasPermission(session.user.id, 'pharmacy:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const supplierId = url.searchParams.get('supplierId');
    const status = url.searchParams.get('status');
    const paymentStatus = url.searchParams.get('paymentStatus');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build filter object
    const filter: any = {};
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    // Handle date range filtering
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.gte = new Date(startDate);
      if (endDate) filter.orderDate.lte = new Date(endDate);
    }

    // Get purchase orders with pagination
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: filter,
      include: {
        supplier: true,
        items: {
          include: {
            medicine: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        orderDate: 'desc'
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.purchaseOrder.count({
      where: filter
    });

    return NextResponse.json({
      purchaseOrders,
      pagination: {
        total: totalCount,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/pharmacy/purchase-orders - Create a new purchase order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create purchase orders
    if (!await hasPermission(session.user.id, 'pharmacy:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['supplierId', 'items'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId }
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Validate items
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'Items must be a non-empty array' }, { status: 400 });
    }

    for (const item of data.items) {
      if (!item.medicineId || !item.quantity || !item.unitPrice) {
        return NextResponse.json({ 
          error: 'Each item must have medicineId, quantity, and unitPrice' 
        }, { status: 400 });
      }

      // Check if medicine exists
      const medicine = await prisma.medicine.findUnique({
        where: { id: item.medicineId }
      });

      if (!medicine) {
        return NextResponse.json({ 
          error: `Medicine with ID ${item.medicineId} not found` 
        }, { status: 404 });
      }
    }

    // Calculate total amount
    const totalAmount = data.items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice), 
      0
    );

    // Generate order number
    const orderNumber = `PO-${Date.now()}`;

    // Create purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : undefined,
        status: 'PENDING',
        totalAmount,
        paymentStatus: 'PENDING',
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        createdBy: session.user.id,
        items: {
          create: data.items.map((item: any) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            notes: item.notes
          }))
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            medicine: true
          }
        }
      }
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/pharmacy/purchase-orders/:id - Update purchase order status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update purchase orders
    if (!await hasPermission(session.user.id, 'pharmacy:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { id } = params;
    
    // Check if purchase order exists
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    // Validate status update
    if (data.status) {
      const validStatuses = ['PENDING', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];
      if (!validStatuses.includes(data.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Update purchase order
    const updateData: any = {};
    
    if (data.status) updateData.status = data.status;
    if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
    if (data.paymentDate) updateData.paymentDate = new Date(data.paymentDate);
    if (data.notes) updateData.notes = data.notes;
    
    // Handle approval
    if (data.status === 'APPROVED' && purchaseOrder.status === 'PENDING') {
      updateData.approvedBy = session.user.id;
      updateData.approvedAt = new Date();
    }
    
    // Handle receiving
    if (['PARTIALLY_RECEIVED', 'RECEIVED'].includes(data.status) && 
        !['PARTIALLY_RECEIVED', 'RECEIVED'].includes(purchaseOrder.status)) {
      updateData.receivedBy = session.user.id;
      updateData.receivedAt = new Date();
    }

    // Update purchase order
    const updatedPurchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        items: {
          include: {
            medicine: true
          }
        }
      }
    });

    return NextResponse.json(updatedPurchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
