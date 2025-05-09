import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/pharmacy/medicines - Get all medicines with optional filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view medicines
    if (!await hasPermission(session.user.id, 'pharmacy:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const genericName = url.searchParams.get('genericName');
    const brandName = url.searchParams.get('brandName');
    const manufacturer = url.searchParams.get('manufacturer');
    const prescriptionRequired = url.searchParams.get('prescriptionRequired');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build filter object
    const filter: any = {};
    if (name) filter.name = { contains: name, mode: 'insensitive' };
    if (genericName) filter.genericName = { contains: genericName, mode: 'insensitive' };
    if (brandName) filter.brandName = { contains: brandName, mode: 'insensitive' };
    if (manufacturer) filter.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    if (prescriptionRequired) filter.prescriptionRequired = prescriptionRequired === 'true';

    // Get medicines with pagination
    const medicines = await prisma.medicine.findMany({
      where: filter,
      include: {
        batches: {
          where: {
            status: 'AVAILABLE',
            expiryDate: {
              gt: new Date()
            }
          },
          orderBy: {
            expiryDate: 'asc'
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.medicine.count({
      where: filter
    });

    return NextResponse.json({
      medicines,
      pagination: {
        total: totalCount,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/pharmacy/medicines - Create a new medicine
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create medicines
    if (!await hasPermission(session.user.id, 'pharmacy:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'genericName', 'manufacturer', 'dosageForm', 'strength'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Create new medicine
    const medicine = await prisma.medicine.create({
      data: {
        name: data.name,
        genericName: data.genericName,
        brandName: data.brandName,
        manufacturer: data.manufacturer,
        description: data.description,
        dosageForm: data.dosageForm,
        strength: data.strength,
        therapeuticCategory: data.therapeuticCategory,
        prescriptionRequired: data.prescriptionRequired ?? true,
        code: data.code
      }
    });

    return NextResponse.json(medicine, { status: 201 });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
