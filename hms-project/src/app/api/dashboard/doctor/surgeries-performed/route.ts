import { NextRequest, NextResponse } from 'next/server';

// Mock data for surgeries performed today
const mockSurgeriesPerformed = {
  total: 3,
  byOutcome: [
    { outcome: 'Successful', count: 2 },
    { outcome: 'Complications', count: 1 },
    { outcome: 'Failed', count: 0 },
  ],
  surgeries: [
    { 
      id: 1, 
      patientName: 'John Smith', 
      time: '09:00 - 11:15', 
      location: 'OR-1', 
      type: 'Orthopedic', 
      procedure: 'Total Knee Replacement',
      duration: 135, // in minutes
      outcome: 'Successful',
      notes: 'Procedure went as planned. Patient stable during surgery.',
      postOpCare: [
        'Pain management with IV analgesics',
        'Physical therapy to begin tomorrow',
        'Monitor for signs of infection'
      ]
    },
    { 
      id: 2, 
      patientName: 'Sarah Johnson', 
      time: '11:30 - 15:45', 
      location: 'OR-2', 
      type: 'Cardiac', 
      procedure: 'Coronary Artery Bypass',
      duration: 255, // in minutes
      outcome: 'Complications',
      notes: 'Patient experienced arrhythmia during procedure. Stabilized with medication.',
      postOpCare: [
        'ICU monitoring for 48 hours',
        'Cardiac monitoring',
        'Anticoagulation therapy',
        'Respiratory support as needed'
      ]
    },
    { 
      id: 3, 
      patientName: 'Michael Brown', 
      time: '14:00 - 15:05', 
      location: 'OR-1', 
      type: 'General', 
      procedure: 'Appendectomy',
      duration: 65, // in minutes
      outcome: 'Successful',
      notes: 'Uncomplicated procedure. Minimal blood loss.',
      postOpCare: [
        'Antibiotics for 5 days',
        'Pain management',
        'Early ambulation',
        'Diet advancement as tolerated'
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
      data: mockSurgeriesPerformed,
    });
  } catch (error) {
    console.error('Error fetching surgeries performed data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch surgeries performed data' },
      { status: 500 }
    );
  }
}
