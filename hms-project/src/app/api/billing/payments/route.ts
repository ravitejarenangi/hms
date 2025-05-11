import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new payment
const createPaymentSchema = z.object({
  invoiceId: z.string(),
  paymentMethod: z.enum([
    'CASH', 
    'CREDIT_CARD', 
    'DEBIT_CARD', 
    'UPI', 
    'NETBANKING', 
    'CHEQUE', 
    'INSURANCE', 
    'WALLET'
  ]),
  amount: z.number().positive(),
  transactionId: z.string().optional(),
  chequeNumber: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
});

// Generate receipt number
async function generateReceiptNumber() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  // Get the count of payments for the current month
  const paymentCount = await prisma.payment.count({
    where: {
      paymentDate: {
        gte: new Date(`${year}-${month}-01`),
        lt: new Date(month === '12' ? `${year + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`),
      },
    },
  });
  
  // Format: RCPT-YYYYMM-XXXX (e.g., RCPT-202305-0001)
  return `RCPT-${year}${month}-${String(paymentCount + 1).padStart(4, '0')}`;
}

// GET handler - Get all payments or a specific payment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const invoiceId = searchParams.get('invoiceId');
    const paymentMethod = searchParams.get('paymentMethod');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    if (id) {
      where.id = id;
    }
    
    if (invoiceId) {
      where.invoiceId = invoiceId;
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    
    if (fromDate && toDate) {
      where.paymentDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    } else if (fromDate) {
      where.paymentDate = {
        gte: new Date(fromDate),
      };
    } else if (toDate) {
      where.paymentDate = {
        lte: new Date(toDate),
      };
    }
    
    // If an ID is provided, return a specific payment
    if (id) {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  uhid: true,
                },
              },
            },
          },
        },
      });
      
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      
      return NextResponse.json(payment);
    }
    
    // Otherwise, return a paginated list of payments
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              patientId: true,
              totalAmount: true,
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  uhid: true,
                },
              },
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);
    
    return NextResponse.json({
      data: payments,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST handler - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createPaymentSchema.parse(body);
    
    // Check if invoice exists and is not cancelled
    const invoice = await prisma.taxInvoice.findUnique({
      where: { id: validatedData.invoiceId },
    });
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    if (invoice.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot add payment to a cancelled invoice' }, { status: 400 });
    }
    
    // Check if payment amount is valid
    if (validatedData.amount > invoice.balanceAmount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds the balance amount of the invoice' },
        { status: 400 }
      );
    }
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Generate receipt number
      const receiptNumber = await generateReceiptNumber();
      
      // Create the payment
      const payment = await prisma.payment.create({
        data: {
          invoiceId: validatedData.invoiceId,
          paymentMethod: validatedData.paymentMethod,
          amount: validatedData.amount,
          transactionId: validatedData.transactionId,
          chequeNumber: validatedData.chequeNumber,
          bankName: validatedData.bankName,
          notes: validatedData.notes,
          receivedBy: session.user.id,
        },
      });
      
      // Update the invoice
      const newPaidAmount = invoice.paidAmount + validatedData.amount;
      const newBalanceAmount = invoice.totalAmount - newPaidAmount;
      
      // Determine the new status
      let newStatus;
      if (newBalanceAmount <= 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      } else {
        newStatus = invoice.status;
      }
      
      const updatedInvoice = await prisma.taxInvoice.update({
        where: { id: validatedData.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });
      
      return { payment, updatedInvoice };
    });
    
    // Create a journal entry for the payment
    // This would be implemented in a real application
    // For now, we'll just return the created payment and updated invoice
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error creating payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// DELETE handler - Reverse a payment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason');
    
    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }
    
    if (!reason) {
      return NextResponse.json({ error: 'Reason for reversal is required' }, { status: 400 });
    }
    
    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Update the invoice
      const newPaidAmount = payment.invoice.paidAmount - payment.amount;
      const newBalanceAmount = payment.invoice.totalAmount - newPaidAmount;
      
      // Determine the new status
      let newStatus;
      if (newPaidAmount <= 0) {
        newStatus = 'PENDING';
      } else if (newBalanceAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      } else {
        newStatus = 'PAID';
      }
      
      const updatedInvoice = await prisma.taxInvoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });
      
      // Create a credit note for the reversed payment
      // This would be implemented in a real application
      // For now, we'll just delete the payment
      
      // Delete the payment
      await prisma.payment.delete({
        where: { id },
      });
      
      return { message: 'Payment reversed successfully', updatedInvoice };
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error reversing payment:', error);
    return NextResponse.json({ error: 'Failed to reverse payment' }, { status: 500 });
  }
}
