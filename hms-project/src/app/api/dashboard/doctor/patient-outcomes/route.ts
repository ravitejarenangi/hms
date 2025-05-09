import { NextRequest, NextResponse } from 'next/server';

// Mock data for patient outcomes
const mockPatientOutcomes = {
  recoveryRates: {
    doctor: 85, // percentage
    department: 82,
    hospital: 80
  },
  treatmentEffectiveness: {
    doctor: 88, // percentage
    department: 84,
    hospital: 82
  },
  byCondition: [
    { 
      condition: 'Hypertension', 
      recoveryRate: 90,
      treatmentEffectiveness: 92,
      patientCount: 45
    },
    { 
      condition: 'Diabetes', 
      recoveryRate: 85,
      treatmentEffectiveness: 88,
      patientCount: 38
    },
    { 
      condition: 'Asthma', 
      recoveryRate: 82,
      treatmentEffectiveness: 86,
      patientCount: 27
    },
    { 
      condition: 'Arthritis', 
      recoveryRate: 78,
      treatmentEffectiveness: 80,
      patientCount: 32
    },
    { 
      condition: 'Coronary Artery Disease', 
      recoveryRate: 75,
      treatmentEffectiveness: 78,
      patientCount: 24
    }
  ],
  trends: [
    { month: 'Jan', recoveryRate: 78, treatmentEffectiveness: 80 },
    { month: 'Feb', recoveryRate: 80, treatmentEffectiveness: 82 },
    { month: 'Mar', recoveryRate: 79, treatmentEffectiveness: 81 },
    { month: 'Apr', recoveryRate: 82, treatmentEffectiveness: 84 },
    { month: 'May', recoveryRate: 83, treatmentEffectiveness: 85 },
    { month: 'Jun', recoveryRate: 85, treatmentEffectiveness: 87 },
    { month: 'Jul', recoveryRate: 84, treatmentEffectiveness: 86 },
    { month: 'Aug', recoveryRate: 86, treatmentEffectiveness: 88 },
    { month: 'Sep', recoveryRate: 85, treatmentEffectiveness: 87 },
    { month: 'Oct', recoveryRate: 87, treatmentEffectiveness: 89 },
    { month: 'Nov', recoveryRate: 86, treatmentEffectiveness: 88 },
    { month: 'Dec', recoveryRate: 85, treatmentEffectiveness: 88 }
  ],
  patientSatisfaction: {
    average: 4.2, // out of 5
    distribution: [
      { rating: 1, percentage: 2 },
      { rating: 2, percentage: 5 },
      { rating: 3, percentage: 15 },
      { rating: 4, percentage: 38 },
      { rating: 5, percentage: 40 }
    ]
  }
};

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch this data from the database
    // using Prisma or another ORM
    
    return NextResponse.json({
      success: true,
      data: mockPatientOutcomes,
    });
  } catch (error) {
    console.error('Error fetching patient outcomes data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient outcomes data' },
      { status: 500 }
    );
  }
}
