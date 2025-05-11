import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new invoice
const createInvoiceSchema = z.object({
  patientId: z.string(),
  dueDate: z.string().transform(str => new Date(str)),
  subtotal: z.number().positive(),
  discountAmount: z.number().default(0),
  taxableAmount: z.number().positive(),
  cgstAmount: z.number().default(0),
  sgstAmount: z.number().default(0),
  igstAmount: z.number().default(0),
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
  isGSTRegistered: z.boolean().default(true),
  customerGSTIN: z.string().optional(),
  placeOfSupply: z.string(),
  hospitalGSTIN: z.string(),
  invoiceItems: z.array(
    z.object({
      serviceId: z.string().optional(),
      packageId: z.string().optional(),
      description: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      discountPercentage: z.number().default(0),
      discountAmount: z.number().default(0),
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

// Schema for updating an invoice
const updateInvoiceSchema = z.object({
  id: z.string(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  discountAmount: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']).optional(),
});

// Generate invoice number
async function generateInvoiceNumber() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  // Get the count of invoices for the current month
  const invoiceCount = await prisma.taxInvoice.count({
    where: {
      invoiceDate: {
        gte: new Date(`${year}-${month}-01`),
        lt: new Date(month === '12' ? `${year + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`),
      },
    },
  });
  
  // Format: INV-YYYYMM-XXXX (e.g., INV-202305-0001)
  return `INV-${year}${month}-${String(invoiceCount + 1).padStart(4, '0')}`;
}

// GET handler - Get all invoices or a specific invoice
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const patientId = searchParams.get('patientId');
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
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (fromDate && toDate) {
      where.invoiceDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    } else if (fromDate) {
      where.invoiceDate = {
        gte: new Date(fromDate),
      };
    } else if (toDate) {
      where.invoiceDate = {
        lte: new Date(toDate),
      };
    }
    
    // If an ID is provided, return a specific invoice with its items
    if (id) {
      const invoice = await prisma.taxInvoice.findUnique({
        where: { id },
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
          invoiceItems: true,
          payments: true,
          creditNotes: true,
        },
      });
      
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      
      return NextResponse.json(invoice);
    }
    
    // Otherwise, return a paginated list of invoices
    const [invoices, totalCount] = await Promise.all([
      prisma.taxInvoice.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              uhid: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMethod: true,
            },
          },
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.taxInvoice.count({ where }),
    ]);
    
    return NextResponse.json({
      data: invoices,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST handler - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createInvoiceSchema.parse(body);
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Calculate balance amount
    const balanceAmount = validatedData.totalAmount;
    
    // Create the invoice with its items
    const invoice = await prisma.taxInvoice.create({
      data: {
        invoiceNumber,
        patientId: validatedData.patientId,
        dueDate: validatedData.dueDate,
        subtotal: validatedData.subtotal,
        discountAmount: validatedData.discountAmount,
        taxableAmount: validatedData.taxableAmount,
        cgstAmount: validatedData.cgstAmount,
        sgstAmount: validatedData.sgstAmount,
        igstAmount: validatedData.igstAmount,
        totalAmount: validatedData.totalAmount,
        balanceAmount,
        notes: validatedData.notes,
        createdBy: session.user.id,
        isGSTRegistered: validatedData.isGSTRegistered,
        customerGSTIN: validatedData.customerGSTIN,
        placeOfSupply: validatedData.placeOfSupply,
        hospitalGSTIN: validatedData.hospitalGSTIN,
        invoiceItems: {
          create: validatedData.invoiceItems.map(item => ({
            serviceId: item.serviceId,
            packageId: item.packageId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: item.discountPercentage,
            discountAmount: item.discountAmount,
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
        invoiceItems: true,
      },
    });
    
    // Create a journal entry for the invoice
    // This would be implemented in a real application
    // For now, we'll just return the created invoice
    
    return NextResponse.json(invoice, { status: 201 });
    
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

// PATCH handler - Update an invoice
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateInvoiceSchema.parse(body);
    
    // Check if invoice exists
    const existingInvoice = await prisma.taxInvoice.findUnique({
      where: { id: validatedData.id },
    });
    
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Update the invoice
    const updatedInvoice = await prisma.taxInvoice.update({
      where: { id: validatedData.id },
      data: {
        dueDate: validatedData.dueDate,
        discountAmount: validatedData.discountAmount,
        notes: validatedData.notes,
        status: validatedData.status,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        invoiceItems: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedInvoice);
    
  } catch (error) {
    console.error('Error updating invoice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE handler - Cancel an invoice (not actually deleting it)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
    
    // Check if invoice exists
    const existingInvoice = await prisma.taxInvoice.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });
    
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Check if the invoice has payments
    if (existingInvoice.payments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot cancel an invoice with payments. Create a credit note instead.' },
        { status: 400 }
      );
    }
    
    // Cancel the invoice (not actually deleting it)
    const cancelledInvoice = await prisma.taxInvoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ message: 'Invoice cancelled successfully', invoice: cancelledInvoice });
    
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json({ error: 'Failed to cancel invoice' }, { status: 500 });
  }
}
