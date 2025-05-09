import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/permissions';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to update pharmacy alerts
    const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:write');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const alertId = params.id;
    
    // Check if alert exists
    const alert = await prisma.pharmacyAlert.findUnique({
      where: { id: alertId }
    });
    
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    // Get request body
    const data = await req.json();
    
    // Update alert
    const updatedAlert = await prisma.pharmacyAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        notes: data.notes || null
      }
    });
    
    return NextResponse.json({ alert: updatedAlert });
    
  } catch (error: any) {
    console.error('Error resolving pharmacy alert:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert: ' + error.message },
      { status: 500 }
    );
  }
}
