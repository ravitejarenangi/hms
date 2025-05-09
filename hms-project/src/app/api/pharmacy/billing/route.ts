import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to access pharmacy billing
    const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:read');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'PENDING';
    const patientId = searchParams.get('patientId');
    
    // Build query
    const query: any = {};
    
    if (status !== 'ALL') {
      query.paymentStatus = status;
    }
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    // Get bills
    const bills = await prisma.pharmacySale.findMany({
      where: query,
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        items: {
          include: {
            medicine: true,
            batch: true
          }
        },
        payments: true
      },
      orderBy: {
        billDate: 'desc'
      }
    });
    
    return NextResponse.json({ bills });
    
  } catch (error: any) {
    console.error('Error fetching pharmacy bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to create pharmacy bills
    const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:write');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.patientId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Patient ID and at least one item are required' },
        { status: 400 }
      );
    }
    
    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    const itemsData = data.items.map((item: any) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discount = Number(item.discount || 0);
      const tax = Number(item.tax || 0);
      
      const itemSubtotal = quantity * unitPrice;
      const itemDiscountAmount = itemSubtotal * (discount / 100);
      const itemTaxAmount = (itemSubtotal - itemDiscountAmount) * (tax / 100);
      const itemTotal = itemSubtotal - itemDiscountAmount + itemTaxAmount;
      
      subtotal += itemSubtotal;
      totalDiscount += itemDiscountAmount;
      totalTax += itemTaxAmount;
      
      return {
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity,
        unitPrice,
        discount,
        tax,
        total: itemTotal
      };
    });
    
    const totalAmount = subtotal - totalDiscount + totalTax;
    
    // Generate bill number
    const billNumber = `PH-${Date.now().toString().slice(-8)}`;
    
    // Create the bill
    const bill = await prisma.pharmacySale.create({
      data: {
        billNumber,
        patientId: data.patientId,
        prescriptionId: data.prescriptionId,
        billDate: new Date(),
        subtotal,
        discount: totalDiscount,
        tax: totalTax,
        totalAmount,
        paidAmount: 0,
        paymentStatus: 'PENDING',
        generatedBy: session.user.id,
        notes: data.notes,
        items: {
          create: itemsData
        }
      },
      include: {
        items: true
      }
    });
    
    // Update inventory for each item
    for (const item of bill.items) {
      // Decrease batch quantity
      await prisma.medicineBatch.update({
        where: { id: item.batchId },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      });
      
      // Update inventory
      const inventory = await prisma.pharmacyInventory.findFirst({
        where: { medicineId: item.medicineId }
      });
      
      if (inventory) {
        await prisma.pharmacyInventory.update({
          where: { id: inventory.id },
          data: {
            currentStock: {
              decrement: item.quantity
            },
            lastUpdated: new Date()
          }
        });
        
        // Create inventory transaction
        await prisma.inventoryTransaction.create({
          data: {
            medicineId: item.medicineId,
            batchId: item.batchId,
            type: 'SALE',
            quantity: item.quantity,
            balanceBefore: inventory.currentStock,
            balanceAfter: inventory.currentStock - item.quantity,
            reference: `Sale: ${bill.billNumber}`,
            performedBy: session.user.id
          }
        });
      }
    }
    
    return NextResponse.json({ bill }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating pharmacy bill:', error);
    return NextResponse.json(
      { error: 'Failed to create bill: ' + error.message },
      { status: 500 }
    );
  }
}
