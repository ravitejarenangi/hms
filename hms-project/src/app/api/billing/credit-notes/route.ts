import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new credit note
const createCreditNoteSchema = z.object({
  invoiceId: z.string(),
  reason: z.string(),
  subtotal: z.number().positive(),
  cgstAmount: z.number().default(0),
  sgstAmount: z.number().default(0),
  igstAmount: z.number().default(0),
  totalAmount: z.number().positive(),
  refundMethod: z.enum([
    'CASH', 
    'CREDIT_CARD', 
    'DEBIT_CARD', 
    'UPI', 
    'NETBANKING', 
    'CHEQUE', 
    'INSURANCE', 
    'WALLET',
    'ADJUST_FUTURE_INVOICE'
  ]).optional(),
  refundTransactionId: z.string().optional(),
  creditNoteItems: z.array(
    z.object({
      invoiceItemId: z.string(),
      description: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      taxableAmount: z.number().positive(),
      cgstPercentage: z.number().default(0),
      cgstAmount: z.number().default(0),
      sgstPercentage: z.number().default(0),
      sgstAmount: z.number().default(0),
      igstPercentage: z.number().default(0),
      igstAmount: z.number().default(0),
      totalAmount: z.number().positive(),
      hsnSacCode: z.string(),
    })
  ),
});

// Schema for updating a credit note
const updateCreditNoteSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  status: z.enum(['ISSUED', 'ADJUSTED', 'REFUNDED']).optional(),
  refundMethod: z.enum([
    'CASH', 
    'CREDIT_CARD', 
    'DEBIT_CARD', 
    'UPI', 
    'NETBANKING', 
    'CHEQUE', 
    'INSURANCE', 
    'WALLET',
    'ADJUST_FUTURE_INVOICE'
  ]).optional(),
  refundTransactionId: z.string().optional(),
});

// Generate credit note number
async function generateCreditNoteNumber() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  // Get the count of credit notes for the current month
  const creditNoteCount = await prisma.creditNote.count({
    where: {
      issueDate: {
        gte: new Date(`${year}-${month}-01`),
        lt: new Date(month === '12' ? `${year + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`),
      },
    },
  });
  
  // Format: CN-YYYYMM-XXXX (e.g., CN-202305-0001)
  return `CN-${year}${month}-${String(creditNoteCount + 1).padStart(4, '0')}`;
}

// GET handler - Get all credit notes or a specific credit note
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status');
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
    
    if (status) {
      where.status = status;
    }
    
    if (fromDate && toDate) {
      where.issueDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    } else if (fromDate) {
      where.issueDate = {
        gte: new Date(fromDate),
      };
    } else if (toDate) {
      where.issueDate = {
        lte: new Date(toDate),
      };
    }
    
    // If an ID is provided, return a specific credit note with its items
    if (id) {
      const creditNote = await prisma.creditNote.findUnique({
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
                  contactNumber: true,
                  email: true,
                  address: true,
                },
              },
            },
          },
          creditNoteItems: true,
        },
      });
      
      if (!creditNote) {
        return NextResponse.json({ error: 'Credit note not found' }, { status: 404 });
      }
      
      return NextResponse.json(creditNote);
    }
    
    // Otherwise, return a paginated list of credit notes
    const [creditNotes, totalCount] = await Promise.all([
      prisma.creditNote.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              patientId: true,
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
          issueDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.creditNote.count({ where }),
    ]);
    
    return NextResponse.json({
      data: creditNotes,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching credit notes:', error);
    return NextResponse.json({ error: 'Failed to fetch credit notes' }, { status: 500 });
  }
}

// POST handler - Create a new credit note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createCreditNoteSchema.parse(body);
    
    // Check if invoice exists
    const invoice = await prisma.taxInvoice.findUnique({
      where: { id: validatedData.invoiceId },
      include: {
        invoiceItems: true,
      },
    });
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Validate credit note items against invoice items
    for (const item of validatedData.creditNoteItems) {
      const invoiceItem = invoice.invoiceItems.find(i => i.id === item.invoiceItemId);
      
      if (!invoiceItem) {
        return NextResponse.json(
          { error: `Invoice item with ID ${item.invoiceItemId} not found in the invoice` },
          { status: 400 }
        );
      }
      
      if (item.quantity > invoiceItem.quantity) {
        return NextResponse.json(
          { error: `Credit note quantity (${item.quantity}) exceeds invoice item quantity (${invoiceItem.quantity})` },
          { status: 400 }
        );
      }
    }
    
    // Generate credit note number
    const creditNoteNumber = await generateCreditNoteNumber();
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Create the credit note with its items
      const creditNote = await prisma.creditNote.create({
        data: {
          creditNoteNumber,
          invoiceId: validatedData.invoiceId,
          reason: validatedData.reason,
          subtotal: validatedData.subtotal,
          cgstAmount: validatedData.cgstAmount,
          sgstAmount: validatedData.sgstAmount,
          igstAmount: validatedData.igstAmount,
          totalAmount: validatedData.totalAmount,
          status: 'ISSUED',
          refundMethod: validatedData.refundMethod,
          refundTransactionId: validatedData.refundTransactionId,
          createdBy: session.user.id,
          creditNoteItems: {
            create: validatedData.creditNoteItems.map(item => ({
              invoiceItemId: item.invoiceItemId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxableAmount: item.taxableAmount,
              cgstPercentage: item.cgstPercentage,
              cgstAmount: item.cgstAmount,
              sgstPercentage: item.sgstPercentage,
              sgstAmount: item.sgstAmount,
              igstPercentage: item.igstPercentage,
              igstAmount: item.igstAmount,
              totalAmount: item.totalAmount,
              hsnSacCode: item.hsnSacCode,
            })),
          },
        },
        include: {
          creditNoteItems: true,
        },
      });
      
      // Update the invoice balance if the credit note is for a refund
      if (validatedData.refundMethod) {
        // Calculate new balance
        const newPaidAmount = invoice.paidAmount - validatedData.totalAmount;
        const newBalanceAmount = invoice.totalAmount - newPaidAmount;
        
        // Determine the new status
        let newStatus;
        if (newPaidAmount <= 0) {
          newStatus = 'PENDING';
        } else if (newBalanceAmount > 0) {
          newStatus = 'PARTIALLY_PAID';
        } else {
          newStatus = 'PAID';
        }
        
        // Update the invoice
        await prisma.taxInvoice.update({
          where: { id: validatedData.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus,
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
        });
        
        // Update credit note status
        await prisma.creditNote.update({
          where: { id: creditNote.id },
          data: {
            status: 'REFUNDED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
          },
        });
      }
      
      return creditNote;
    });
    
    // Create a journal entry for the credit note
    // This would be implemented in a real application
    // For now, we'll just return the created credit note
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error creating credit note:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create credit note' }, { status: 500 });
  }
}

// PATCH handler - Update a credit note
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateCreditNoteSchema.parse(body);
    
    // Check if credit note exists
    const creditNote = await prisma.creditNote.findUnique({
      where: { id: validatedData.id },
      include: {
        invoice: true,
      },
    });
    
    if (!creditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 });
    }
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Update the credit note
      const updatedCreditNote = await prisma.creditNote.update({
        where: { id: validatedData.id },
        data: {
          reason: validatedData.reason,
          status: validatedData.status,
          refundMethod: validatedData.refundMethod,
          refundTransactionId: validatedData.refundTransactionId,
          updatedAt: new Date(),
        },
      });
      
      // If status is changed to REFUNDED, update the invoice
      if (validatedData.status === 'REFUNDED' && creditNote.status !== 'REFUNDED') {
        // Calculate new balance
        const newPaidAmount = creditNote.invoice.paidAmount - creditNote.totalAmount;
        const newBalanceAmount = creditNote.invoice.totalAmount - newPaidAmount;
        
        // Determine the new status
        let newStatus;
        if (newPaidAmount <= 0) {
          newStatus = 'PENDING';
        } else if (newBalanceAmount > 0) {
          newStatus = 'PARTIALLY_PAID';
        } else {
          newStatus = 'PAID';
        }
        
        // Update the invoice
        await prisma.taxInvoice.update({
          where: { id: creditNote.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus,
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
        });
        
        // Update credit note with approval details
        await prisma.creditNote.update({
          where: { id: creditNote.id },
          data: {
            approvedBy: session.user.id,
            approvedAt: new Date(),
          },
        });
      }
      
      return updatedCreditNote;
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error updating credit note:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update credit note' }, { status: 500 });
  }
}

// DELETE handler - Reverse a credit note
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
      return NextResponse.json({ error: 'Credit note ID is required' }, { status: 400 });
    }
    
    if (!reason) {
      return NextResponse.json({ error: 'Reason for reversal is required' }, { status: 400 });
    }
    
    // Check if credit note exists
    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });
    
    if (!creditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 });
    }
    
    // Only ISSUED credit notes can be reversed
    if (creditNote.status !== 'ISSUED') {
      return NextResponse.json(
        { error: `Cannot reverse a credit note with status ${creditNote.status}` },
        { status: 400 }
      );
    }
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Update the credit note status
      const reversedCreditNote = await prisma.creditNote.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversedBy: session.user.id,
          reversedAt: new Date(),
        },
      });
      
      return { message: 'Credit note reversed successfully', creditNote: reversedCreditNote };
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error reversing credit note:', error);
    return NextResponse.json({ error: 'Failed to reverse credit note' }, { status: 500 });
  }
}
