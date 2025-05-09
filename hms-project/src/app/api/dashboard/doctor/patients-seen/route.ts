import { NextRequest, NextResponse } from 'next/server';

// Mock data for patients seen today
const mockPatientsSeen = {
  today: 12,
  dailyAverage: 15,
  breakdown: [
    { type: 'New Patients', count: 4 },
    { type: 'Follow-up', count: 6 },
    { type: 'Emergency', count: 2 },
  ],
  hourlyDistribution: [
    { hour: '8:00', count: 1 },
    { hour: '9:00', count: 2 },
    { hour: '10:00', count: 3 },
    { hour: '11:00', count: 2 },
    { hour: '12:00', count: 0 },
    { hour: '13:00', count: 0 },
    { hour: '14:00', count: 1 },
    { hour: '15:00', count: 2 },
    { hour: '16:00', count: 1 },
  ],
  patients: [
    { id: 1, name: 'John Smith', time: '08:30', type: 'Follow-up', diagnosis: 'Hypertension' },
    { id: 2, name: 'Sarah Johnson', time: '09:15', type: 'New Patient', diagnosis: 'Diabetes' },
    { id: 3, name: 'Michael Brown', time: '09:45', type: 'Follow-up', diagnosis: 'Asthma' },
    { id: 4, name: 'Emily Davis', time: '10:30', type: 'Emergency', diagnosis: 'Acute Appendicitis' },
    { id: 5, name: 'Robert Wilson', time: '11:00', type: 'Follow-up', diagnosis: 'Arthritis' },
    { id: 6, name: 'Jennifer Lee', time: '11:30', type: 'New Patient', diagnosis: 'Migraine' },
    { id: 7, name: 'David Martinez', time: '14:15', type: 'Follow-up', diagnosis: 'COPD' },
    { id: 8, name: 'Lisa Anderson', time: '15:00', type: 'New Patient', diagnosis: 'Anxiety' },
    { id: 9, name: 'James Taylor', time: '15:30', type: 'Follow-up', diagnosis: 'Depression' },
    { id: 10, name: 'Patricia Thomas', time: '16:00', type: 'Follow-up', diagnosis: 'Hypothyroidism' },
    { id: 11, name: 'Richard Harris', time: '10:00', type: 'New Patient', diagnosis: 'Gastritis' },
    { id: 12, name: 'Mary Robinson', time: '10:15', type: 'Emergency', diagnosis: 'Fracture' },
  ]
};

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch this data from the database
    // using Prisma or another ORM
    
    return NextResponse.json({
      success: true,
      data: mockPatientsSeen,
    });
  } catch (error) {
    console.error('Error fetching patients seen data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients seen data' },
      { status: 500 }
    );
  }
}
