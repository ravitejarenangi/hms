import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return successResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    }, 'System is healthy');
  } catch (error) {
    return successResponse({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'System is degraded');
  }
}
