import { NextRequest, NextResponse } from 'next/server';

// Mock data for appointments today
const mockAppointmentsToday = {
  total: 15,
  completed: 8,
  upcoming: 7,
  appointments: [
    { 
      id: 1, 
      patientName: 'John Smith', 
      time: '08:30', 
      status: 'completed', 
      type: 'Follow-up',
      duration: 15,
      notes: 'Blood pressure check'
    },
    { 
      id: 2, 
      patientName: 'Sarah Johnson', 
      time: '09:15', 
      status: 'completed', 
      type: 'New Patient',
      duration: 30,
      notes: 'Initial consultation'
    },
    { 
      id: 3, 
      patientName: 'Michael Brown', 
      time: '09:45', 
      status: 'completed', 
      type: 'Follow-up',
      duration: 15,
      notes: 'Medication review'
    },
    { 
      id: 4, 
      patientName: 'Emily Davis', 
      time: '10:30', 
      status: 'completed', 
      type: 'Emergency',
      duration: 45,
      notes: 'Acute abdominal pain'
    },
    { 
      id: 5, 
      patientName: 'Robert Wilson', 
      time: '11:00', 
      status: 'completed', 
      type: 'Follow-up',
      duration: 15,
      notes: 'Joint pain assessment'
    },
    { 
      id: 6, 
      patientName: 'Jennifer Lee', 
      time: '11:30', 
      status: 'completed', 
      type: 'New Patient',
      duration: 30,
      notes: 'Headache evaluation'
    },
    { 
      id: 7, 
      patientName: 'David Martinez', 
      time: '14:15', 
      status: 'completed', 
      type: 'Follow-up',
      duration: 15,
      notes: 'Respiratory assessment'
    },
    { 
      id: 8, 
      patientName: 'Lisa Anderson', 
      time: '15:00', 
      status: 'completed', 
      type: 'New Patient',
      duration: 30,
      notes: 'Mental health evaluation'
    },
    { 
      id: 9, 
      patientName: 'James Taylor', 
      time: '15:30', 
      status: 'waiting', 
      type: 'Follow-up',
      duration: 15,
      notes: 'Medication adjustment'
    },
    { 
      id: 10, 
      patientName: 'Patricia Thomas', 
      time: '16:00', 
      status: 'scheduled', 
      type: 'Follow-up',
      duration: 15,
      notes: 'Thyroid function review'
    },
    { 
      id: 11, 
      patientName: 'Richard Harris', 
      time: '16:30', 
      status: 'scheduled', 
      type: 'New Patient',
      duration: 30,
      notes: 'Digestive issues'
    },
    { 
      id: 12, 
      patientName: 'Mary Robinson', 
      time: '17:00', 
      status: 'scheduled', 
      type: 'Emergency',
      duration: 45,
      notes: 'Wrist injury'
    },
    { 
      id: 13, 
      patientName: 'Charles Wilson', 
      time: '17:45', 
      status: 'scheduled', 
      type: 'Follow-up',
      duration: 15,
      notes: 'Post-surgery check'
    },
    { 
      id: 14, 
      patientName: 'Susan Miller', 
      time: '18:15', 
      status: 'scheduled', 
      type: 'New Patient',
      duration: 30,
      notes: 'Skin condition'
    },
    { 
      id: 15, 
      patientName: 'Thomas Clark', 
      time: '18:45', 
      status: 'scheduled', 
      type: 'Follow-up',
      duration: 15,
      notes: 'Medication review'
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch this data from the database
    // using Prisma or another ORM
    
    return NextResponse.json({
      success: true,
      data: mockAppointmentsToday,
    });
  } catch (error) {
    console.error('Error fetching appointments data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments data' },
      { status: 500 }
    );
  }
}
