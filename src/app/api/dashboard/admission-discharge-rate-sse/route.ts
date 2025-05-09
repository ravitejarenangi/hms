import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper function to generate random data for demo purposes
// In a real application, this would be replaced with actual database queries
function generateMockAdmissionDischargeData(timeframe: string) {
  const now = new Date();
  const data: { date: string; admissions: number; discharges: number }[] = [];
  
  let days = 7;
  let format = 'day';
  
  if (timeframe === 'daily') {
    days = 7;
    format = 'day';
  } else if (timeframe === 'weekly') {
    days = 12;
    format = 'week';
  } else if (timeframe === 'monthly') {
    days = 12;
    format = 'month';
  }
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (days - i - 1));
    
    let dateLabel = '';
    if (format === 'day') {
      dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (format === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      dateLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (format === 'month') {
      dateLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    data.push({
      date: dateLabel,
      admissions: Math.floor(Math.random() * 50) + 10,
      discharges: Math.floor(Math.random() * 45) + 5,
    });
  }
  
  return data;
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
  const timeframe = url.searchParams.get('timeframe') || 'daily';
  const department = url.searchParams.get('department') || 'all';
  const doctor = url.searchParams.get('doctor') || 'all';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';
  
  // Function to send SSE data
  const sendSSEData = async () => {
    try {
      // In a real application, you would query the database here
      // For now, we'll use mock data
      const data = generateMockAdmissionDischargeData(timeframe);
      
      // Send the data as an SSE event
      await writer.write(
        new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
      );
      
      // In a real application with real-time updates, you might set up a timer
      // to periodically send updates or use a database subscription
    } catch (error) {
      console.error('Error generating admission/discharge data:', error);
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
