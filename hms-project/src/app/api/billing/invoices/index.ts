import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// Schema for creating a new invoice
const createInvoiceSchema = z.object({
  patientId: z.string(),
  dueDate: z.string().transform(str => new Date(str)),
  items: z.array(
    z.object({
      itemType: z.string(),
      itemId: z.string().optional(),
      description: z.string(),
      hsnSacCode: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      discountPercent: z.number().min(0).max(100).default(0),
      discountAmount: z.number().min(0).default(0),
      gstRateType: z.enum(['EXEMPT', 'ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTYEIGHT']),
      departmentId: z.string().optional(),
      doctorId: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  isGSTRegistered: z.boolean().default(true),
  customerGSTIN: z.string().optional(),
  placeOfSupply: z.string(),
  hospitalGSTIN: z.string(),
  sendEmail: z.boolean().default(false),
  sendWhatsApp: z.boolean().default(false),
});

// Function to generate invoice number
async function generateInvoiceNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Get the count of invoices for the current month
  const invoiceCount = await prisma.taxInvoice.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-${month}-01`),
        lt: new Date(month === '12' ? `${year + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`),
      },
    },
  });
  
  // Generate invoice number in format: INV-YYYYMM-XXXX
  return `INV-${year}${month}-${String(invoiceCount + 1).padStart(4, '0')}`;
}

// GET handler - Get all invoices or a specific invoice
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
    
    if (fromDate) {
      where.invoiceDate = {
        ...where.invoiceDate,
        gte: new Date(fromDate),
      };
    }
    
    if (toDate) {
      where.invoiceDate = {
        ...where.invoiceDate,
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
    
    // Check permissions
    if (!hasPermission(session, 'billing.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createInvoiceSchema.parse(body);
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Calculate invoice totals
    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalTaxableAmount = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;
    let totalIgstAmount = 0;
    
    const invoiceItems = validatedData.items.map(item => {
      // Calculate discount amount if percentage is provided
      const discountAmount = item.discountAmount || (item.unitPrice * item.quantity * item.discountPercent / 100);
      
      // Calculate taxable amount
      const taxableAmount = (item.unitPrice * item.quantity) - discountAmount;
      
      // Calculate GST rates and amounts
      let cgstRate = 0;
      let sgstRate = 0;
      let igstRate = 0;
      
      switch (item.gstRateType) {
        case 'FIVE':
          cgstRate = 2.5;
          sgstRate = 2.5;
          break;
        case 'TWELVE':
          cgstRate = 6;
          sgstRate = 6;
          break;
        case 'EIGHTEEN':
          cgstRate = 9;
          sgstRate = 9;
          break;
        case 'TWENTYEIGHT':
          cgstRate = 14;
          sgstRate = 14;
          break;
        default:
          cgstRate = 0;
          sgstRate = 0;
      }
      
      const cgstAmount = (taxableAmount * cgstRate) / 100;
      const sgstAmount = (taxableAmount * sgstRate) / 100;
      const igstAmount = (taxableAmount * igstRate) / 100;
      const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;
      
      // Update invoice totals
      subtotal += item.unitPrice * item.quantity;
      totalDiscountAmount += discountAmount;
      totalTaxableAmount += taxableAmount;
      totalCgstAmount += cgstAmount;
      totalSgstAmount += sgstAmount;
      totalIgstAmount += igstAmount;
      
      return {
        itemType: item.itemType,
        itemId: item.itemId,
        description: item.description,
        hsnSacCode: item.hsnSacCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        discountAmount,
        taxableAmount,
        gstRateType: item.gstRateType,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        totalAmount,
        departmentId: item.departmentId,
        doctorId: item.doctorId,
      };
    });
    
    const totalAmount = totalTaxableAmount + totalCgstAmount + totalSgstAmount + totalIgstAmount;
    
    // Create the invoice with its items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const newInvoice = await tx.taxInvoice.create({
        data: {
          invoiceNumber,
          patientId: validatedData.patientId,
          invoiceDate: new Date(),
          dueDate: validatedData.dueDate,
          status: 'PENDING',
          subtotal,
          discountAmount: totalDiscountAmount,
          taxableAmount: totalTaxableAmount,
          cgstAmount: totalCgstAmount,
          sgstAmount: totalSgstAmount,
          igstAmount: totalIgstAmount,
          totalAmount,
          paidAmount: 0,
          balanceAmount: totalAmount,
          notes: validatedData.notes,
          termsAndConditions: validatedData.termsAndConditions,
          isGSTRegistered: validatedData.isGSTRegistered,
          customerGSTIN: validatedData.customerGSTIN,
          placeOfSupply: validatedData.placeOfSupply,
          hospitalGSTIN: validatedData.hospitalGSTIN,
          createdBy: session.user.id,
          invoiceItems: {
            create: invoiceItems,
          },
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
      
      // Create a journal entry for the invoice
      await tx.journalEntry.create({
        data: {
          entryNumber: `JE-${invoiceNumber}`,
          entryDate: new Date(),
          financialYearId: '1', // This should be dynamically determined based on current date
          reference: newInvoice.id,
          referenceType: 'INVOICE',
          description: `Invoice ${invoiceNumber} for patient ${patient.firstName} ${patient.lastName}`,
          totalDebit: totalAmount,
          totalCredit: totalAmount,
          status: 'POSTED',
          createdBy: session.user.id,
          invoices: {
            connect: {
              id: newInvoice.id,
            },
          },
          journalItems: {
            create: [
              {
                accountId: '1', // Accounts Receivable account ID
                description: `Invoice ${invoiceNumber}`,
                debitAmount: totalAmount,
                creditAmount: 0,
              },
              {
                accountId: '2', // Revenue account ID
                description: `Invoice ${invoiceNumber}`,
                debitAmount: 0,
                creditAmount: totalTaxableAmount,
              },
              {
                accountId: '3', // CGST account ID
                description: `Invoice ${invoiceNumber}`,
                debitAmount: 0,
                creditAmount: totalCgstAmount,
              },
              {
                accountId: '4', // SGST account ID
                description: `Invoice ${invoiceNumber}`,
                debitAmount: 0,
                creditAmount: totalSgstAmount,
              },
              {
                accountId: '5', // IGST account ID
                description: `Invoice ${invoiceNumber}`,
                debitAmount: 0,
                creditAmount: totalIgstAmount,
              },
            ],
          },
        },
      });
      
      return newInvoice;
    });
    
    // Send invoice via email if requested
    if (validatedData.sendEmail && patient.user.email) {
      await sendEmail({
        to: patient.user.email,
        subject: `Invoice ${invoiceNumber} from Hospital Management System`,
        text: `Dear ${patient.firstName} ${patient.lastName},\n\nPlease find attached your invoice ${invoiceNumber} for the amount of ${totalAmount.toFixed(2)}.\n\nThank you for choosing our services.\n\nRegards,\nHospital Management System`,
        html: `<p>Dear ${patient.firstName} ${patient.lastName},</p><p>Please find attached your invoice ${invoiceNumber} for the amount of ${totalAmount.toFixed(2)}.</p><p>Thank you for choosing our services.</p><p>Regards,<br>Hospital Management System</p>`,
        attachments: [
          {
            filename: `Invoice_${invoiceNumber}.pdf`,
            content: 'PDF_CONTENT_HERE', // This would be the actual PDF content
          },
        ],
      });
    }
    
    // Send invoice via WhatsApp if requested
    if (validatedData.sendWhatsApp && patient.user.phone) {
      await sendWhatsAppMessage({
        to: patient.user.phone,
        template: 'invoice_generated',
        parameters: [
          { type: 'text', text: `${patient.firstName} ${patient.lastName}` },
          { type: 'text', text: invoiceNumber },
          { type: 'text', text: totalAmount.toFixed(2) },
          { type: 'text', text: new Date().toLocaleDateString() },
        ],
        documentUrl: 'DOCUMENT_URL_HERE', // This would be the actual PDF URL
      });
    }
    
    return NextResponse.json(invoice, { status: 201 });
    
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
