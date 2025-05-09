import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to access pharmacy alerts
    const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:read');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'ALL';
    const status = searchParams.get('status') || 'ACTIVE';
    
    // Build query
    const query: any = {};
    
    if (type !== 'ALL') {
      query.type = type;
    }
    
    if (status !== 'ALL') {
      query.status = status;
    }
    
    // Get alerts
    const alerts = await prisma.pharmacyAlert.findMany({
      where: query,
      include: {
        medicine: true,
        batch: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ alerts });
    
  } catch (error: any) {
    console.error('Error fetching pharmacy alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to create pharmacy alerts
    const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:write');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.type || !data.message) {
      return NextResponse.json(
        { error: 'Type and message are required fields' },
        { status: 400 }
      );
    }
    
    // Create alert
    const alert = await prisma.pharmacyAlert.create({
      data: {
        type: data.type,
        message: data.message,
        status: 'ACTIVE',
        medicineId: data.medicineId,
        batchId: data.batchId,
        createdBy: session.user.id
      }
    });
    
    return NextResponse.json({ alert }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating pharmacy alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert: ' + error.message },
      { status: 500 }
    );
  }
}
