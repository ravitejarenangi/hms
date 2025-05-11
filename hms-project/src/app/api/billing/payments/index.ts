import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

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
    'WALLET',
    'OTHER'
  ]),
  amount: z.number().positive(),
  transactionId: z.string().optional(),
  chequeNumber: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
  sendReceipt: z.boolean().default(false),
  sendReceiptVia: z.enum(['EMAIL', 'WHATSAPP', 'BOTH']).optional(),
});

// Function to generate receipt number
async function generateReceiptNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Get the count of payments for the current month
  const paymentCount = await prisma.payment.count({
    where: {
      paymentDate: {
        gte: new Date(`${year}-${month}-01`),
        lt: new Date(month === '12' ? `${year + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`),
      },
    },
  });
  
  // Generate receipt number in format: RCPT-YYYYMM-XXXX
  return `RCPT-${year}${month}-${String(paymentCount + 1).padStart(4, '0')}`;
}

// GET handler - Get all payments or a specific payment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'billing.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    
    if (fromDate) {
      where.paymentDate = {
        ...where.paymentDate,
        gte: new Date(fromDate),
      };
    }
    
    if (toDate) {
      where.paymentDate = {
        ...where.paymentDate,
        lte: new Date(toDate),
      };
    }
    
    // If an ID is provided, return a specific payment
    if (id) {
      const payment = await prisma.payment.findUnique({
        where: { id },
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
                  user: {
                    select: {
                      email: true,
                      phone: true,
                    },
                  },
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
    
    // Check permissions
    if (!hasPermission(session, 'billing.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createPaymentSchema.parse(body);
    
    // Check if invoice exists and is not cancelled
    const invoice = await prisma.taxInvoice.findUnique({
      where: { id: validatedData.invoiceId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    if (invoice.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot add payment to a cancelled invoice' }, { status: 400 });
    }
    
    // Check if payment amount is valid
    if (validatedData.amount > invoice.balanceAmount) {
      return NextResponse.json({ error: 'Payment amount exceeds the remaining balance' }, { status: 400 });
    }
    
    // Generate receipt number
    const receiptNumber = await generateReceiptNumber();
    
    // Create the payment and update the invoice in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: validatedData.invoiceId,
          paymentDate: new Date(),
          paymentMethod: validatedData.paymentMethod,
          amount: validatedData.amount,
          transactionId: validatedData.transactionId,
          chequeNumber: validatedData.chequeNumber,
          bankName: validatedData.bankName,
          notes: validatedData.notes,
          receivedBy: session.user.id,
          receiptNumber,
        },
      });
      
      // Update the invoice
      const updatedInvoice = await tx.taxInvoice.update({
        where: { id: validatedData.invoiceId },
        data: {
          paidAmount: {
            increment: validatedData.amount,
          },
          balanceAmount: {
            decrement: validatedData.amount,
          },
          status: {
            set: invoice.totalAmount === validatedData.amount ? 'PAID' : 
                 invoice.paidAmount + validatedData.amount >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID',
          },
          updatedBy: session.user.id,
        },
      });
      
      // Create a journal entry for the payment
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNumber: `JE-${receiptNumber}`,
          entryDate: new Date(),
          financialYearId: '1', // This should be dynamically determined based on current date
          reference: payment.id,
          referenceType: 'PAYMENT',
          description: `Payment ${receiptNumber} for invoice ${invoice.invoiceNumber}`,
          totalDebit: validatedData.amount,
          totalCredit: validatedData.amount,
          status: 'POSTED',
          createdBy: session.user.id,
          payments: {
            connect: {
              id: payment.id,
            },
          },
          journalItems: {
            create: [
              {
                accountId: validatedData.paymentMethod === 'CASH' ? '6' : '7', // Cash or Bank account ID
                description: `Payment ${receiptNumber}`,
                debitAmount: validatedData.amount,
                creditAmount: 0,
              },
              {
                accountId: '1', // Accounts Receivable account ID
                description: `Payment ${receiptNumber}`,
                debitAmount: 0,
                creditAmount: validatedData.amount,
              },
            ],
          },
        },
      });
      
      // Update the payment with the journal entry ID
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          journalEntryId: journalEntry.id,
        },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
      
      return { payment: updatedPayment, invoice: updatedInvoice };
    });
    
    // Send receipt via email if requested
    if (validatedData.sendReceipt && 
        (validatedData.sendReceiptVia === 'EMAIL' || validatedData.sendReceiptVia === 'BOTH') && 
        invoice.patient.user.email) {
      await sendEmail({
        to: invoice.patient.user.email,
        subject: `Payment Receipt ${receiptNumber} from Hospital Management System`,
        text: `Dear ${invoice.patient.firstName} ${invoice.patient.lastName},\n\nThank you for your payment of ${validatedData.amount.toFixed(2)} towards invoice ${invoice.invoiceNumber}.\n\nYour receipt number is ${receiptNumber}.\n\nRegards,\nHospital Management System`,
        html: `<p>Dear ${invoice.patient.firstName} ${invoice.patient.lastName},</p><p>Thank you for your payment of ${validatedData.amount.toFixed(2)} towards invoice ${invoice.invoiceNumber}.</p><p>Your receipt number is ${receiptNumber}.</p><p>Regards,<br>Hospital Management System</p>`,
        attachments: [
          {
            filename: `Receipt_${receiptNumber}.pdf`,
            content: 'PDF_CONTENT_HERE', // This would be the actual PDF content
          },
        ],
      });
    }
    
    // Send receipt via WhatsApp if requested
    if (validatedData.sendReceipt && 
        (validatedData.sendReceiptVia === 'WHATSAPP' || validatedData.sendReceiptVia === 'BOTH') && 
        invoice.patient.user.phone) {
      await sendWhatsAppMessage({
        to: invoice.patient.user.phone,
        template: 'payment_received',
        parameters: [
          { type: 'text', text: `${invoice.patient.firstName} ${invoice.patient.lastName}` },
          { type: 'text', text: receiptNumber },
          { type: 'text', text: validatedData.amount.toFixed(2) },
          { type: 'text', text: invoice.invoiceNumber },
          { type: 'text', text: new Date().toLocaleDateString() },
        ],
        documentUrl: 'DOCUMENT_URL_HERE', // This would be the actual PDF URL
      });
    }
    
    return NextResponse.json(result.payment, { status: 201 });
    
  } catch (error) {
    console.error('Error creating payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
