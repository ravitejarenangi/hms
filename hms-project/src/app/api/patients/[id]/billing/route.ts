import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isOwnPatientRecord } from "@/lib/permissions";

// GET /api/patients/[id]/billing - Get a patient's billing history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization - billing staff, medical staff or own record
    const isBillingStaff = await hasPermission(session, ['admin', 'superadmin', 'accountant']);
    const isMedicalStaff = await hasPermission(session, ['doctor', 'nurse']);
    const isOwn = await isOwnPatientRecord(session, patientId);
    
    if (!isBillingStaff && !isMedicalStaff && !isOwn) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || undefined;
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from') as string) : undefined;
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to') as string) : undefined;
    
    // Calculate pagination
    const skip = (page - 1) * limit;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Build where clause for filtering
    const where: any = { patientId };
    
    if (status) {
      where.status = status;
    }
    
    if (fromDate || toDate) {
      where.issuedDate = {};
      
      if (fromDate) {
        where.issuedDate.gte = fromDate;
      }
      
      if (toDate) {
        where.issuedDate.lte = toDate;
      }
    }

    // Get total count for pagination
    const totalInvoices = await prisma.invoice.count({ where });

    // Get invoices with pagination
    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issuedDate: 'desc' },
      include: {
        items: true,
        payments: true,
        discounts: true
      }
    });

    // Format the response
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balance: parseFloat(invoice.totalAmount.toString()) - parseFloat(invoice.paidAmount.toString()),
      status: invoice.status,
      items: invoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount
      })),
      payments: invoice.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status
      })),
      discounts: invoice.discounts.map(discount => ({
        id: discount.id,
        amount: discount.amount,
        percentage: discount.percentage,
        discountType: discount.discountType,
        reason: discount.reason
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patientName: patient.user.name,
        invoices: formattedInvoices,
        pagination: {
          total: totalInvoices,
          page,
          limit,
          pages: Math.ceil(totalInvoices / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}
