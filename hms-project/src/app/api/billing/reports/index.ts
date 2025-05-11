import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

// Schema for generating financial reports
const generateReportSchema = z.object({
  reportType: z.enum([
    'REVENUE_SUMMARY', 
    'EXPENSE_SUMMARY', 
    'PROFIT_LOSS', 
    'BALANCE_SHEET', 
    'CASH_FLOW', 
    'GST_SUMMARY',
    'DEPARTMENT_REVENUE',
    'DOCTOR_REVENUE',
    'PATIENT_BILLING',
    'INSURANCE_CLAIMS',
    'OUTSTANDING_INVOICES',
    'PAYMENT_COLLECTION'
  ]),
  fromDate: z.string().transform(str => new Date(str)),
  toDate: z.string().transform(str => new Date(str)),
  departmentId: z.string().optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  insuranceProviderId: z.string().optional(),
  tpaId: z.string().optional(),
  format: z.enum(['JSON', 'CSV', 'PDF', 'EXCEL']).default('JSON'),
});

// POST handler - Generate financial reports
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'reports.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = generateReportSchema.parse(body);
    
    // Generate the requested report
    switch (validatedData.reportType) {
      case 'REVENUE_SUMMARY':
        return await generateRevenueSummaryReport(validatedData);
      case 'GST_SUMMARY':
        return await generateGSTSummaryReport(validatedData);
      case 'DEPARTMENT_REVENUE':
        return await generateDepartmentRevenueReport(validatedData);
      case 'DOCTOR_REVENUE':
        return await generateDoctorRevenueReport(validatedData);
      case 'PATIENT_BILLING':
        return await generatePatientBillingReport(validatedData);
      case 'OUTSTANDING_INVOICES':
        return await generateOutstandingInvoicesReport(validatedData);
      case 'PAYMENT_COLLECTION':
        return await generatePaymentCollectionReport(validatedData);
      default:
        return NextResponse.json({ error: 'Report type not implemented yet' }, { status: 501 });
    }
    
  } catch (error) {
    console.error('Error generating report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

// Function to generate revenue summary report
async function generateRevenueSummaryReport(params) {
  const { fromDate, toDate, format } = params;
  
  // Get all invoices in the date range
  const invoices = await prisma.taxInvoice.findMany({
    where: {
      invoiceDate: {
        gte: fromDate,
        lte: toDate,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      subtotal: true,
      discountAmount: true,
      taxableAmount: true,
      cgstAmount: true,
      sgstAmount: true,
      igstAmount: true,
      totalAmount: true,
      paidAmount: true,
      balanceAmount: true,
      status: true,
    },
  });
  
  // Get all payments in the date range
  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      id: true,
      receiptNumber: true,
      paymentDate: true,
      paymentMethod: true,
      amount: true,
      invoice: {
        select: {
          invoiceNumber: true,
        },
      },
    },
  });
  
  // Calculate summary statistics
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0);
  const totalDiscounts = invoices.reduce((sum, invoice) => sum + invoice.discountAmount, 0);
  const totalTaxes = invoices.reduce((sum, invoice) => sum + invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount, 0);
  
  // Group payments by payment method
  const paymentsByMethod = payments.reduce((acc, payment) => {
    const method = payment.paymentMethod;
    if (!acc[method]) {
      acc[method] = 0;
    }
    acc[method] += payment.amount;
    return acc;
  }, {});
  
  // Group invoices by status
  const invoicesByStatus = invoices.reduce((acc, invoice) => {
    const status = invoice.status;
    if (!acc[status]) {
      acc[status] = { count: 0, amount: 0 };
    }
    acc[status].count += 1;
    acc[status].amount += invoice.totalAmount;
    return acc;
  }, {});
  
  // Group invoices by month
  const invoicesByMonth = invoices.reduce((acc, invoice) => {
    const month = invoice.invoiceDate.toISOString().substring(0, 7); // YYYY-MM format
    if (!acc[month]) {
      acc[month] = { count: 0, amount: 0 };
    }
    acc[month].count += 1;
    acc[month].amount += invoice.totalAmount;
    return acc;
  }, {});
  
  // Prepare the report data
  const reportData = {
    reportType: 'REVENUE_SUMMARY',
    fromDate,
    toDate,
    summary: {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalDiscounts,
      totalTaxes,
      collectionRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
    },
    paymentsByMethod,
    invoicesByStatus,
    invoicesByMonth,
    invoices,
    payments,
  };
  
  // Return the report in the requested format
  if (format === 'JSON') {
    return NextResponse.json(reportData);
  } else {
    // For other formats, we would generate the appropriate file and return it
    // This is a placeholder for now
    return NextResponse.json({ error: 'Format not implemented yet' }, { status: 501 });
  }
}

// Function to generate GST summary report
async function generateGSTSummaryReport(params) {
  const { fromDate, toDate, format } = params;
  
  // Get all invoices in the date range
  const invoices = await prisma.taxInvoice.findMany({
    where: {
      invoiceDate: {
        gte: fromDate,
        lte: toDate,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      taxableAmount: true,
      cgstAmount: true,
      sgstAmount: true,
      igstAmount: true,
      totalAmount: true,
      status: true,
      isGSTRegistered: true,
      customerGSTIN: true,
      placeOfSupply: true,
      hospitalGSTIN: true,
      invoiceItems: {
        select: {
          id: true,
          description: true,
          hsnSacCode: true,
          quantity: true,
          unitPrice: true,
          taxableAmount: true,
          gstRateType: true,
          cgstRate: true,
          cgstAmount: true,
          sgstRate: true,
          sgstAmount: true,
          igstRate: true,
          igstAmount: true,
        },
      },
    },
  });
  
  // Group by GST rate type
  const gstSummaryByRate = {};
  
  invoices.forEach(invoice => {
    invoice.invoiceItems.forEach(item => {
      const rateType = item.gstRateType;
      if (!gstSummaryByRate[rateType]) {
        gstSummaryByRate[rateType] = {
          taxableAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTax: 0,
        };
      }
      
      gstSummaryByRate[rateType].taxableAmount += item.taxableAmount;
      gstSummaryByRate[rateType].cgstAmount += item.cgstAmount;
      gstSummaryByRate[rateType].sgstAmount += item.sgstAmount;
      gstSummaryByRate[rateType].igstAmount += item.igstAmount;
      gstSummaryByRate[rateType].totalTax += item.cgstAmount + item.sgstAmount + item.igstAmount;
    });
  });
  
  // Group by HSN/SAC code
  const gstSummaryByHsnSac = {};
  
  invoices.forEach(invoice => {
    invoice.invoiceItems.forEach(item => {
      const hsnSacCode = item.hsnSacCode;
      if (!gstSummaryByHsnSac[hsnSacCode]) {
        gstSummaryByHsnSac[hsnSacCode] = {
          taxableAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTax: 0,
        };
      }
      
      gstSummaryByHsnSac[hsnSacCode].taxableAmount += item.taxableAmount;
      gstSummaryByHsnSac[hsnSacCode].cgstAmount += item.cgstAmount;
      gstSummaryByHsnSac[hsnSacCode].sgstAmount += item.sgstAmount;
      gstSummaryByHsnSac[hsnSacCode].igstAmount += item.igstAmount;
      gstSummaryByHsnSac[hsnSacCode].totalTax += item.cgstAmount + item.sgstAmount + item.igstAmount;
    });
  });
  
  // Calculate total GST collected
  const totalTaxableAmount = invoices.reduce((sum, invoice) => sum + invoice.taxableAmount, 0);
  const totalCgstAmount = invoices.reduce((sum, invoice) => sum + invoice.cgstAmount, 0);
  const totalSgstAmount = invoices.reduce((sum, invoice) => sum + invoice.sgstAmount, 0);
  const totalIgstAmount = invoices.reduce((sum, invoice) => sum + invoice.igstAmount, 0);
  const totalGstAmount = totalCgstAmount + totalSgstAmount + totalIgstAmount;
  
  // Prepare the report data
  const reportData = {
    reportType: 'GST_SUMMARY',
    fromDate,
    toDate,
    summary: {
      totalTaxableAmount,
      totalCgstAmount,
      totalSgstAmount,
      totalIgstAmount,
      totalGstAmount,
    },
    gstSummaryByRate,
    gstSummaryByHsnSac,
    invoices,
  };
  
  // Return the report in the requested format
  if (format === 'JSON') {
    return NextResponse.json(reportData);
  } else {
    // For other formats, we would generate the appropriate file and return it
    // This is a placeholder for now
    return NextResponse.json({ error: 'Format not implemented yet' }, { status: 501 });
  }
}

// Function to generate department revenue report
async function generateDepartmentRevenueReport(params) {
  const { fromDate, toDate, departmentId, format } = params;
  
  // Build the where clause
  const where: any = {
    invoiceDate: {
      gte: fromDate,
      lte: toDate,
    },
    status: {
      not: 'CANCELLED',
    },
  };
  
  // Get all invoice items in the date range grouped by department
  const invoiceItems = await prisma.invoiceItem.findMany({
    where: {
      invoice: where,
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      invoice: {
        select: {
          invoiceNumber: true,
          invoiceDate: true,
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
  
  // Group by department
  const revenueByDepartment = {};
  
  invoiceItems.forEach(item => {
    const departmentId = item.departmentId || 'UNASSIGNED';
    const departmentName = item.department?.name || 'Unassigned';
    
    if (!revenueByDepartment[departmentId]) {
      revenueByDepartment[departmentId] = {
        departmentId,
        departmentName,
        itemCount: 0,
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: 0,
      };
    }
    
    revenueByDepartment[departmentId].itemCount += 1;
    revenueByDepartment[departmentId].taxableAmount += item.taxableAmount;
    revenueByDepartment[departmentId].cgstAmount += item.cgstAmount;
    revenueByDepartment[departmentId].sgstAmount += item.sgstAmount;
    revenueByDepartment[departmentId].igstAmount += item.igstAmount;
    revenueByDepartment[departmentId].totalAmount += item.totalAmount;
  });
  
  // Calculate total revenue
  const totalTaxableAmount = Object.values(revenueByDepartment).reduce((sum: number, dept: any) => sum + dept.taxableAmount, 0);
  const totalAmount = Object.values(revenueByDepartment).reduce((sum: number, dept: any) => sum + dept.totalAmount, 0);
  
  // Prepare the report data
  const reportData = {
    reportType: 'DEPARTMENT_REVENUE',
    fromDate,
    toDate,
    departmentId,
    summary: {
      totalDepartments: Object.keys(revenueByDepartment).length,
      totalTaxableAmount,
      totalAmount,
    },
    revenueByDepartment: Object.values(revenueByDepartment),
    details: departmentId ? invoiceItems : undefined,
  };
  
  // Return the report in the requested format
  if (format === 'JSON') {
    return NextResponse.json(reportData);
  } else {
    // For other formats, we would generate the appropriate file and return it
    // This is a placeholder for now
    return NextResponse.json({ error: 'Format not implemented yet' }, { status: 501 });
  }
}

// Function to generate doctor revenue report
async function generateDoctorRevenueReport(params) {
  // Implementation similar to department revenue report
  return NextResponse.json({ error: 'Report type not fully implemented yet' }, { status: 501 });
}

// Function to generate patient billing report
async function generatePatientBillingReport(params) {
  // Implementation for patient billing report
  return NextResponse.json({ error: 'Report type not fully implemented yet' }, { status: 501 });
}

// Function to generate outstanding invoices report
async function generateOutstandingInvoicesReport(params) {
  // Implementation for outstanding invoices report
  return NextResponse.json({ error: 'Report type not fully implemented yet' }, { status: 501 });
}

// Function to generate payment collection report
async function generatePaymentCollectionReport(params) {
  // Implementation for payment collection report
  return NextResponse.json({ error: 'Report type not fully implemented yet' }, { status: 501 });
}
