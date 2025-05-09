import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper function to generate random data for demo purposes
// In a real application, this would be replaced with actual database queries
function generateMockBedAvailabilityData() {
  const departments = [
    { name: 'General Ward', color: '#3b82f6' },
    { name: 'ICU', color: '#ef4444' },
    { name: 'Pediatrics', color: '#10b981' },
    { name: 'Maternity', color: '#f59e0b' },
    { name: 'Cardiology', color: '#8b5cf6' },
    { name: 'Neurology', color: '#ec4899' },
    { name: 'Orthopedics', color: '#6366f1' },
    { name: 'Emergency', color: '#f43f5e' },
  ];
  
  const departmentData = departments.map(dept => {
    const totalBeds = Math.floor(Math.random() * 50) + 20;
    const occupiedBeds = Math.floor(Math.random() * totalBeds);
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = (occupiedBeds / totalBeds) * 100;
    
    return {
      department: dept.name,
      color: dept.color,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: parseFloat(occupancyRate.toFixed(2))
    };
  });
  
  // Calculate overall statistics
  const totalBeds = departmentData.reduce((sum, dept) => sum + dept.totalBeds, 0);
  const occupiedBeds = departmentData.reduce((sum, dept) => sum + dept.occupiedBeds, 0);
  const availableBeds = totalBeds - occupiedBeds;
  const overallOccupancyRate = (occupiedBeds / totalBeds) * 100;
  
  return {
    departments: departmentData,
    overall: {
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: parseFloat(overallOccupancyRate.toFixed(2))
    }
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  try {
    // In a real application, you would query the database here
    // For now, we'll use mock data
    const data = generateMockBedAvailabilityData();
    
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching bed availability data:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
