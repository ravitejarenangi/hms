import { NextRequest, NextResponse } from 'next/server';

// Mock data for vital signs monitoring
const mockVitalSigns = {
  patients: [
    {
      id: 1,
      name: 'John Smith',
      room: '201',
      bed: 'A',
      currentVitals: {
        temperature: 37.2,
        heartRate: 78,
        bloodPressure: '130/85',
        respiratoryRate: 16,
        oxygenSaturation: 96,
        pain: 2,
        lastUpdated: '2023-05-08T09:30:00Z'
      },
      vitalsTrend: [
        {
          timestamp: '2023-05-08T03:30:00Z',
          temperature: 37.0,
          heartRate: 76,
          bloodPressure: '128/82',
          respiratoryRate: 15,
          oxygenSaturation: 95,
          pain: 3
        },
        {
          timestamp: '2023-05-08T06:30:00Z',
          temperature: 37.1,
          heartRate: 77,
          bloodPressure: '129/84',
          respiratoryRate: 16,
          oxygenSaturation: 96,
          pain: 2
        },
        {
          timestamp: '2023-05-08T09:30:00Z',
          temperature: 37.2,
          heartRate: 78,
          bloodPressure: '130/85',
          respiratoryRate: 16,
          oxygenSaturation: 96,
          pain: 2
        }
      ],
      alerts: []
    },
    {
      id: 3,
      name: 'Michael Brown',
      room: '301',
      bed: 'A',
      currentVitals: {
        temperature: 37.8,
        heartRate: 92,
        bloodPressure: '145/90',
        respiratoryRate: 22,
        oxygenSaturation: 89,
        pain: 4,
        lastUpdated: '2023-05-08T09:15:00Z'
      },
      vitalsTrend: [
        {
          timestamp: '2023-05-08T03:15:00Z',
          temperature: 38.0,
          heartRate: 95,
          bloodPressure: '150/92',
          respiratoryRate: 24,
          oxygenSaturation: 87,
          pain: 5
        },
        {
          timestamp: '2023-05-08T06:15:00Z',
          temperature: 37.9,
          heartRate: 93,
          bloodPressure: '148/91',
          respiratoryRate: 23,
          oxygenSaturation: 88,
          pain: 4
        },
        {
          timestamp: '2023-05-08T09:15:00Z',
          temperature: 37.8,
          heartRate: 92,
          bloodPressure: '145/90',
          respiratoryRate: 22,
          oxygenSaturation: 89,
          pain: 4
        }
      ],
      alerts: [
        {
          type: 'Low Oxygen Saturation',
          value: 89,
          threshold: 92,
          timestamp: '2023-05-08T09:15:00Z'
        }
      ]
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      room: '105',
      bed: 'B',
      currentVitals: {
        temperature: 38.1,
        heartRate: 85,
        bloodPressure: '125/80',
        respiratoryRate: 18,
        oxygenSaturation: 94,
        pain: 3,
        lastUpdated: '2023-05-08T09:00:00Z'
      },
      vitalsTrend: [
        {
          timestamp: '2023-05-08T03:00:00Z',
          temperature: 38.3,
          heartRate: 88,
          bloodPressure: '128/82',
          respiratoryRate: 19,
          oxygenSaturation: 93,
          pain: 4
        },
        {
          timestamp: '2023-05-08T06:00:00Z',
          temperature: 38.2,
          heartRate: 86,
          bloodPressure: '126/81',
          respiratoryRate: 18,
          oxygenSaturation: 94,
          pain: 3
        },
        {
          timestamp: '2023-05-08T09:00:00Z',
          temperature: 38.1,
          heartRate: 85,
          bloodPressure: '125/80',
          respiratoryRate: 18,
          oxygenSaturation: 94,
          pain: 3
        }
      ],
      alerts: [
        {
          type: 'Elevated Temperature',
          value: 38.1,
          threshold: 38.0,
          timestamp: '2023-05-08T09:00:00Z'
        }
      ]
    }
  ],
  vitalRanges: {
    temperature: { min: 36.5, max: 37.5, unit: '°C' },
    heartRate: { min: 60, max: 100, unit: 'bpm' },
    systolicBP: { min: 90, max: 140, unit: 'mmHg' },
    diastolicBP: { min: 60, max: 90, unit: 'mmHg' },
    respiratoryRate: { min: 12, max: 20, unit: 'breaths/min' },
    oxygenSaturation: { min: 92, max: 100, unit: '%' },
    pain: { min: 0, max: 10, unit: 'scale' }
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get patient ID from the request if specified
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    
    let responseData = mockVitalSigns;
    
    // If a specific patient is requested, filter the data
    if (patientId) {
      const patient = mockVitalSigns.patients.find(p => p.id.toString() === patientId);
      if (patient) {
        responseData = {
          patients: [patient],
          vitalRanges: mockVitalSigns.vitalRanges
        };
      } else {
        return NextResponse.json(
          { success: false, error: 'Patient not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching vital signs data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vital signs data' },
      { status: 500 }
    );
  }
}
