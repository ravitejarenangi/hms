import { NextRequest, NextResponse } from 'next/server';

// Mock data for waiting time
const mockWaitingTimeData = {
  currentAverage: 25, // minutes
  threshold: {
    low: 15,
    medium: 30,
    high: 45
  },
  historical: [
    { date: '2023-05-01', average: 22 },
    { date: '2023-05-02', average: 18 },
    { date: '2023-05-03', average: 30 },
    { date: '2023-05-04', average: 27 },
    { date: '2023-05-05', average: 20 },
    { date: '2023-05-06', average: 15 },
    { date: '2023-05-07', average: 28 },
  ],
  queue: [
    { id: 1, patientName: 'John Smith', waitingTime: 35, status: 'waiting' },
    { id: 2, patientName: 'Sarah Johnson', waitingTime: 25, status: 'waiting' },
    { id: 3, patientName: 'Michael Brown', waitingTime: 15, status: 'waiting' },
    { id: 4, patientName: 'Emily Davis', waitingTime: 10, status: 'waiting' },
    { id: 5, patientName: 'Robert Wilson', waitingTime: 5, status: 'waiting' },
  ]
};

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch this data from the database
    // using Prisma or another ORM
    
    return NextResponse.json({
      success: true,
      data: mockWaitingTimeData,
    });
  } catch (error) {
    console.error('Error fetching waiting time data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waiting time data' },
      { status: 500 }
    );
  }
}
