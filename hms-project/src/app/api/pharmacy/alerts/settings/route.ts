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
    
    // Check if user has permission to access pharmacy settings
    const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:read');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get user's notification settings
    const settings = await prisma.pharmacyNotificationSettings.findUnique({
      where: { userId: session.user.id }
    });
    
    // If no settings exist, return default settings
    if (!settings) {
      return NextResponse.json({
        settings: {
          lowStockThreshold: 10,
          expiryWarningDays: 30,
          emailNotifications: true,
          inAppNotifications: true,
          dailyDigest: true
        }
      });
    }
    
    return NextResponse.json({ settings });
    
  } catch (error: any) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings: ' + error.message },
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
    
    // Check if user has permission to update pharmacy settings
    const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:write');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Validate data
    if (data.lowStockThreshold !== undefined && (isNaN(data.lowStockThreshold) || data.lowStockThreshold < 0)) {
      return NextResponse.json(
        { error: 'Low stock threshold must be a positive number' },
        { status: 400 }
      );
    }
    
    if (data.expiryWarningDays !== undefined && (isNaN(data.expiryWarningDays) || data.expiryWarningDays < 0)) {
      return NextResponse.json(
        { error: 'Expiry warning days must be a positive number' },
        { status: 400 }
      );
    }
    
    // Update or create settings
    const settings = await prisma.pharmacyNotificationSettings.upsert({
      where: { userId: session.user.id },
      update: {
        lowStockThreshold: data.lowStockThreshold !== undefined ? data.lowStockThreshold : undefined,
        expiryWarningDays: data.expiryWarningDays !== undefined ? data.expiryWarningDays : undefined,
        emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : undefined,
        inAppNotifications: data.inAppNotifications !== undefined ? data.inAppNotifications : undefined,
        dailyDigest: data.dailyDigest !== undefined ? data.dailyDigest : undefined
      },
      create: {
        userId: session.user.id,
        lowStockThreshold: data.lowStockThreshold || 10,
        expiryWarningDays: data.expiryWarningDays || 30,
        emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true,
        inAppNotifications: data.inAppNotifications !== undefined ? data.inAppNotifications : true,
        dailyDigest: data.dailyDigest !== undefined ? data.dailyDigest : true
      }
    });
    
    return NextResponse.json({ settings });
    
  } catch (error: any) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings: ' + error.message },
      { status: 500 }
    );
  }
}
