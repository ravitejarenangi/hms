import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to process payments
    const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:write');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const billId = params.id;
    
    // Check if bill exists
    const bill = await prisma.pharmacySale.findUnique({
      where: { id: billId }
    });
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    // Get request body
    const data = await req.json();
    
    // Validate payment amount
    const paymentAmount = Number(data.amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be a positive number' },
        { status: 400 }
      );
    }
    
    // Validate payment method
    if (!data.method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }
    
    // Calculate new paid amount
    const newPaidAmount = bill.paidAmount + paymentAmount;
    
    // Determine new payment status
    let newPaymentStatus = 'PENDING';
    
    if (newPaidAmount >= bill.totalAmount) {
      newPaymentStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'PARTIAL';
    }
    
    // Create payment record
    const payment = await prisma.pharmacyPayment.create({
      data: {
        saleId: billId,
        amount: paymentAmount,
        paymentMethod: data.method,
        paymentDate: new Date(),
        reference: data.reference || null,
        notes: data.notes || null,
        processedBy: session.user.id
      }
    });
    
    // Update bill payment status
    const updatedBill = await prisma.pharmacySale.update({
      where: { id: billId },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus
      },
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
        payments: true
      }
    });
    
    return NextResponse.json({ 
      bill: updatedBill,
      payment 
    });
    
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment: ' + error.message },
      { status: 500 }
    );
  }
}
