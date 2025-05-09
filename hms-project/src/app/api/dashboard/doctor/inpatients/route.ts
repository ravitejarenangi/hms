import { NextRequest, NextResponse } from 'next/server';

// Mock data for inpatients
const mockInpatients = {
  total: 8,
  byWard: [
    { ward: 'General', count: 3 },
    { ward: 'ICU', count: 1 },
    { ward: 'Cardiology', count: 2 },
    { ward: 'Pediatrics', count: 1 },
    { ward: 'Orthopedics', count: 1 },
  ],
  patients: [
    { 
      id: 1, 
      name: 'John Smith', 
      age: 65, 
      ward: 'Cardiology', 
      room: '201', 
      admissionDate: '2023-05-01', 
      diagnosis: 'Myocardial Infarction',
      critical: true,
      lengthOfStay: 7
    },
    { 
      id: 2, 
      name: 'Sarah Johnson', 
      age: 45, 
      ward: 'General', 
      room: '105', 
      admissionDate: '2023-05-03', 
      diagnosis: 'Pneumonia',
      critical: false,
      lengthOfStay: 5
    },
    { 
      id: 3, 
      name: 'Michael Brown', 
      age: 72, 
      ward: 'ICU', 
      room: '301', 
      admissionDate: '2023-05-05', 
      diagnosis: 'Respiratory Failure',
      critical: true,
      lengthOfStay: 3
    },
    { 
      id: 4, 
      name: 'Emily Davis', 
      age: 35, 
      ward: 'General', 
      room: '110', 
      admissionDate: '2023-05-04', 
      diagnosis: 'Acute Appendicitis',
      critical: false,
      lengthOfStay: 4
    },
    { 
      id: 5, 
      name: 'Robert Wilson', 
      age: 58, 
      ward: 'Cardiology', 
      room: '205', 
      admissionDate: '2023-05-02', 
      diagnosis: 'Congestive Heart Failure',
      critical: false,
      lengthOfStay: 6
    },
    { 
      id: 6, 
      name: 'Jennifer Lee', 
      age: 8, 
      ward: 'Pediatrics', 
      room: '405', 
      admissionDate: '2023-05-04', 
      diagnosis: 'Asthma Exacerbation',
      critical: false,
      lengthOfStay: 4
    },
    { 
      id: 7, 
      name: 'David Martinez', 
      age: 42, 
      ward: 'General', 
      room: '115', 
      admissionDate: '2023-05-06', 
      diagnosis: 'Diabetic Ketoacidosis',
      critical: false,
      lengthOfStay: 2
    },
    { 
      id: 8, 
      name: 'Lisa Anderson', 
      age: 62, 
      ward: 'Orthopedics', 
      room: '305', 
      admissionDate: '2023-05-03', 
      diagnosis: 'Hip Fracture',
      critical: false,
      lengthOfStay: 5
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch this data from the database
    // using Prisma or another ORM
    
    return NextResponse.json({
      success: true,
      data: mockInpatients,
    });
  } catch (error) {
    console.error('Error fetching inpatients data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inpatients data' },
      { status: 500 }
    );
  }
}
