import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

// Schema for creating a new patient billing record
const createPatientBillingSchema = z.object({
  patientId: z.string(),
  serviceType: z.enum(['CONSULTATION', 'PROCEDURE', 'MEDICATION', 'LABORATORY', 'RADIOLOGY', 'PACKAGE', 'OTHER']),
  serviceId: z.string().optional(),
  description: z.string(),
  amount: z.number().positive(),
  discount: z.number().min(0).default(0),
  taxable: z.boolean().default(true),
  gstRateType: z.enum(['EXEMPT', 'ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTYEIGHT']).default('EXEMPT'),
  departmentId: z.string().optional(),
  doctorId: z.string().optional(),
  notes: z.string().optional(),
  isInsuranceCovered: z.boolean().default(false),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceCoveragePercent: z.number().min(0).max(100).optional(),
  tpaId: z.string().optional(),
});

// GET handler - Get all patient billing records or a specific record
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
    const serviceType = searchParams.get('serviceType');
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
    
    if (serviceType) {
      where.serviceType = serviceType;
    }
    
    if (fromDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(fromDate),
      };
    }
    
    if (toDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(toDate),
      };
    }
    
    // If an ID is provided, return a specific billing record
    if (id) {
      const billingRecord = await prisma.patientBilling.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              uhid: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          tpa: true,
        },
      });
      
      if (!billingRecord) {
        return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
      }
      
      return NextResponse.json(billingRecord);
    }
    
    // Otherwise, return a paginated list of billing records
    const [billingRecords, totalCount] = await Promise.all([
      prisma.patientBilling.findMany({
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
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.patientBilling.count({ where }),
    ]);
    
    return NextResponse.json({
      data: billingRecords,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching patient billing records:', error);
    return NextResponse.json({ error: 'Failed to fetch billing records' }, { status: 500 });
  }
}

// POST handler - Create a new patient billing record
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
    const validatedData = createPatientBillingSchema.parse(body);
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    });
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    
    // Calculate tax amounts based on GST rate type
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    
    if (validatedData.taxable) {
      switch (validatedData.gstRateType) {
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
    }
    
    const taxableAmount = validatedData.amount - validatedData.discount;
    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const igstAmount = (taxableAmount * igstRate) / 100;
    const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;
    
    // Create the patient billing record
    const billingRecord = await prisma.patientBilling.create({
      data: {
        patientId: validatedData.patientId,
        serviceType: validatedData.serviceType,
        serviceId: validatedData.serviceId,
        description: validatedData.description,
        amount: validatedData.amount,
        discount: validatedData.discount,
        taxableAmount,
        gstRateType: validatedData.gstRateType,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        totalAmount,
        departmentId: validatedData.departmentId,
        doctorId: validatedData.doctorId,
        notes: validatedData.notes,
        isInsuranceCovered: validatedData.isInsuranceCovered,
        insuranceProvider: validatedData.insuranceProvider,
        insurancePolicyNumber: validatedData.insurancePolicyNumber,
        insuranceCoveragePercent: validatedData.insuranceCoveragePercent,
        tpaId: validatedData.tpaId,
        createdBy: session.user.id,
      },
    });
    
    return NextResponse.json(billingRecord, { status: 201 });
    
  } catch (error) {
    console.error('Error creating patient billing record:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create billing record' }, { status: 500 });
  }
}
