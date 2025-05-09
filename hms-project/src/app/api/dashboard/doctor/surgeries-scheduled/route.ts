import { NextRequest, NextResponse } from 'next/server';

// Mock data for surgeries scheduled today
const mockSurgeriesScheduled = {
  total: 5,
  byType: [
    { type: 'Orthopedic', count: 2 },
    { type: 'Cardiac', count: 1 },
    { type: 'General', count: 1 },
    { type: 'Neurological', count: 1 },
  ],
  surgeries: [
    { 
      id: 1, 
      patientName: 'John Smith', 
      time: '09:00', 
      location: 'OR-1', 
      type: 'Orthopedic', 
      procedure: 'Total Knee Replacement',
      duration: 120,
      status: 'Prepared',
      team: [
        { name: 'Dr. Sarah Johnson', role: 'Anesthesiologist' },
        { name: 'Dr. Michael Brown', role: 'Assistant Surgeon' },
        { name: 'Nurse Emily Davis', role: 'Scrub Nurse' }
      ]
    },
    { 
      id: 2, 
      patientName: 'Sarah Johnson', 
      time: '11:30', 
      location: 'OR-2', 
      type: 'Cardiac', 
      procedure: 'Coronary Artery Bypass',
      duration: 240,
      status: 'Preparing',
      team: [
        { name: 'Dr. Robert Wilson', role: 'Anesthesiologist' },
        { name: 'Dr. Jennifer Lee', role: 'Assistant Surgeon' },
        { name: 'Nurse David Martinez', role: 'Scrub Nurse' }
      ]
    },
    { 
      id: 3, 
      patientName: 'Michael Brown', 
      time: '14:00', 
      location: 'OR-1', 
      type: 'General', 
      procedure: 'Appendectomy',
      duration: 60,
      status: 'Not Started',
      team: [
        { name: 'Dr. Lisa Anderson', role: 'Anesthesiologist' },
        { name: 'Dr. James Taylor', role: 'Assistant Surgeon' },
        { name: 'Nurse Patricia Thomas', role: 'Scrub Nurse' }
      ]
    },
    { 
      id: 4, 
      patientName: 'Emily Davis', 
      time: '15:30', 
      location: 'OR-3', 
      type: 'Orthopedic', 
      procedure: 'Hip Replacement',
      duration: 150,
      status: 'Not Started',
      team: [
        { name: 'Dr. Richard Harris', role: 'Anesthesiologist' },
        { name: 'Dr. Mary Robinson', role: 'Assistant Surgeon' },
        { name: 'Nurse Charles Wilson', role: 'Scrub Nurse' }
      ]
    },
    { 
      id: 5, 
      patientName: 'Robert Wilson', 
      time: '17:00', 
      location: 'OR-2', 
      type: 'Neurological', 
      procedure: 'Lumbar Discectomy',
      duration: 180,
      status: 'Not Started',
      team: [
        { name: 'Dr. Susan Miller', role: 'Anesthesiologist' },
        { name: 'Dr. Thomas Clark', role: 'Assistant Surgeon' },
        { name: 'Nurse Nancy Walker', role: 'Scrub Nurse' }
      ]
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch this data from the database
    // using Prisma or another ORM
    
    return NextResponse.json({
      success: true,
      data: mockSurgeriesScheduled,
    });
  } catch (error) {
    console.error('Error fetching surgeries scheduled data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch surgeries scheduled data' },
      { status: 500 }
    );
  }
}
