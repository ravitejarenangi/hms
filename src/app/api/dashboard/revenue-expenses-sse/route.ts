import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper function to generate random data for demo purposes
// In a real application, this would be replaced with actual database queries
function generateMockRevenueExpensesData(timeframe: string) {
  const categories = [
    { name: 'Consultations', color: '#3b82f6' },
    { name: 'Procedures', color: '#10b981' },
    { name: 'Laboratory', color: '#f59e0b' },
    { name: 'Pharmacy', color: '#ef4444' },
    { name: 'Radiology', color: '#8b5cf6' },
    { name: 'Inpatient', color: '#ec4899' },
    { name: 'Emergency', color: '#6366f1' },
  ];
  
  const expenseCategories = [
    { name: 'Salaries', color: '#3b82f6' },
    { name: 'Supplies', color: '#10b981' },
    { name: 'Medications', color: '#f59e0b' },
    { name: 'Equipment', color: '#ef4444' },
    { name: 'Utilities', color: '#8b5cf6' },
    { name: 'Maintenance', color: '#ec4899' },
    { name: 'Administrative', color: '#6366f1' },
  ];
  
  // Generate revenue data
  const revenueData = categories.map(category => ({
    name: category.name,
    value: Math.floor(Math.random() * 50000) + 10000,
    color: category.color
  }));
  
  // Generate expense data
  const expenseData = expenseCategories.map(category => ({
    name: category.name,
    value: Math.floor(Math.random() * 40000) + 5000,
    color: category.color
  }));
  
  // Calculate totals
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = (profit / totalRevenue) * 100;
  
  return {
    revenue: revenueData,
    expenses: expenseData,
    summary: {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: parseFloat(profitMargin.toFixed(2))
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
  
  // Set headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  };
  
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();
  
  // Parse query parameters
  const url = new URL(req.url);
  const timeframe = url.searchParams.get('timeframe') || 'monthly';
  
  // Function to send SSE data
  const sendSSEData = async () => {
    try {
      // In a real application, you would query the database here
      // For now, we'll use mock data
      const data = generateMockRevenueExpensesData(timeframe);
      
      // Send the data as an SSE event
      await writer.write(
        new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
      );
      
      // In a real application with real-time updates, you might set up a timer
      // to periodically send updates or use a database subscription
    } catch (error) {
      console.error('Error generating revenue/expenses data:', error);
      await writer.write(
        new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`)
      );
    }
  };
  
  // Send initial data
  await sendSSEData();
  
  // Set up interval for periodic updates (every 30 seconds)
  const intervalId = setInterval(async () => {
    await sendSSEData();
  }, 30000);
  
  // Handle client disconnection
  req.signal.addEventListener('abort', () => {
    clearInterval(intervalId);
    writer.close();
  });
  
  return new NextResponse(transformStream.readable, { headers });
}
