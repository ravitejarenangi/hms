import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Dashboard API is working!',
    timestamp: new Date().toISOString(),
    dashboardComponents: [
      'WaitingTimeGauge',
      'PatientSeenWidget',
      'AppointmentsWidget',
      'InpatientsWidget'
    ]
  });
}
