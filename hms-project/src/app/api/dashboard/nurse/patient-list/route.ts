import { NextRequest, NextResponse } from 'next/server';

// Mock data for nurse patient list
const mockPatientList = {
  total: 12,
  byWard: [
    { ward: 'General', count: 5 },
    { ward: 'ICU', count: 2 },
    { ward: 'Cardiology', count: 3 },
    { ward: 'Pediatrics', count: 1 },
    { ward: 'Orthopedics', count: 1 },
  ],
  patients: [
    { 
      id: 1, 
      name: 'John Smith', 
      age: 65, 
      gender: 'Male',
      ward: 'Cardiology', 
      room: '201', 
      bed: 'A',
      admissionDate: '2023-05-01', 
      diagnosis: 'Myocardial Infarction',
      status: 'Stable',
      priority: 'Medium',
      vitals: {
        temperature: 37.2,
        heartRate: 78,
        bloodPressure: '130/85',
        respiratoryRate: 16,
        oxygenSaturation: 96
      },
      alerts: ['Allergic to Penicillin'],
      tasks: [
        { id: 101, description: 'Administer medication', dueTime: '10:00', completed: true },
        { id: 102, description: 'Check vital signs', dueTime: '12:00', completed: false },
        { id: 103, description: 'Assist with lunch', dueTime: '13:00', completed: false }
      ]
    },
    { 
      id: 2, 
      name: 'Sarah Johnson', 
      age: 45, 
      gender: 'Female',
      ward: 'General', 
      room: '105', 
      bed: 'B',
      admissionDate: '2023-05-03', 
      diagnosis: 'Pneumonia',
      status: 'Improving',
      priority: 'Medium',
      vitals: {
        temperature: 38.1,
        heartRate: 85,
        bloodPressure: '125/80',
        respiratoryRate: 18,
        oxygenSaturation: 94
      },
      alerts: [],
      tasks: [
        { id: 104, description: 'Administer antibiotics', dueTime: '10:30', completed: true },
        { id: 105, description: 'Respiratory therapy', dueTime: '14:00', completed: false }
      ]
    },
    { 
      id: 3, 
      name: 'Michael Brown', 
      age: 72, 
      gender: 'Male',
      ward: 'ICU', 
      room: '301', 
      bed: 'A',
      admissionDate: '2023-05-05', 
      diagnosis: 'Respiratory Failure',
      status: 'Critical',
      priority: 'High',
      vitals: {
        temperature: 37.8,
        heartRate: 92,
        bloodPressure: '145/90',
        respiratoryRate: 22,
        oxygenSaturation: 89
      },
      alerts: ['DNR Order', 'Fall Risk'],
      tasks: [
        { id: 106, description: 'Ventilator check', dueTime: '09:00', completed: true },
        { id: 107, description: 'Suction airway', dueTime: '11:00', completed: true },
        { id: 108, description: 'Administer sedation', dueTime: '13:00', completed: false },
        { id: 109, description: 'Position change', dueTime: '15:00', completed: false }
      ]
    },
    { 
      id: 4, 
      name: 'Emily Davis', 
      age: 35, 
      gender: 'Female',
      ward: 'General', 
      room: '110', 
      bed: 'A',
      admissionDate: '2023-05-04', 
      diagnosis: 'Acute Appendicitis',
      status: 'Post-Op',
      priority: 'Medium',
      vitals: {
        temperature: 37.5,
        heartRate: 82,
        bloodPressure: '120/75',
        respiratoryRate: 16,
        oxygenSaturation: 97
      },
      alerts: [],
      tasks: [
        { id: 110, description: 'Pain assessment', dueTime: '10:00', completed: true },
        { id: 111, description: 'Wound care', dueTime: '12:00', completed: false },
        { id: 112, description: 'Ambulation', dueTime: '14:00', completed: false }
      ]
    },
    { 
      id: 5, 
      name: 'Robert Wilson', 
      age: 58, 
      gender: 'Male',
      ward: 'Cardiology', 
      room: '205', 
      bed: 'B',
      admissionDate: '2023-05-02', 
      diagnosis: 'Congestive Heart Failure',
      status: 'Stable',
      priority: 'Medium',
      vitals: {
        temperature: 36.9,
        heartRate: 75,
        bloodPressure: '135/85',
        respiratoryRate: 17,
        oxygenSaturation: 95
      },
      alerts: ['Fluid Restriction'],
      tasks: [
        { id: 113, description: 'Administer diuretics', dueTime: '09:30', completed: true },
        { id: 114, description: 'Weigh patient', dueTime: '11:00', completed: true },
        { id: 115, description: 'Monitor I/O', dueTime: '13:00', completed: false }
      ]
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // Get search and filter parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const ward = searchParams.get('ward') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    // Filter patients based on search and filter parameters
    let filteredPatients = mockPatientList.patients;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient => 
        patient.name.toLowerCase().includes(searchLower) || 
        patient.diagnosis.toLowerCase().includes(searchLower)
      );
    }
    
    if (ward) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.ward === ward
      );
    }
    
    if (status) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.status === status
      );
    }
    
    if (priority) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.priority === priority
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...mockPatientList,
        patients: filteredPatients,
        filtered: filteredPatients.length
      },
    });
  } catch (error) {
    console.error('Error fetching patient list data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient list data' },
      { status: 500 }
    );
  }
}
