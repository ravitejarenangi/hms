import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Helper function to check if user has required permissions
async function hasPermission(session: any, requiredRoles: string[] = []) {
  if (!session || !session.user) return false;
  
  const userRoles = session.user.roles || [];
  
  // If no specific roles are required, just check if user is authenticated
  if (requiredRoles.length === 0) return true;
  
  // Check if user has any of the required roles
  return userRoles.some(role => requiredRoles.includes(role));
}

// GET /api/patients - List all patients with pagination and search
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view patients
    const canViewPatients = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist']);
    if (!canViewPatients) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const gender = searchParams.get('gender') || '';
    const bloodGroup = searchParams.get('bloodGroup') || '';
    const ageFrom = searchParams.get('ageFrom') ? parseInt(searchParams.get('ageFrom') || '0') : null;
    const ageTo = searchParams.get('ageTo') ? parseInt(searchParams.get('ageTo') || '100') : null;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    let where: any = {};
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
        { patientId: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (gender) {
      where.gender = gender;
    }
    
    if (bloodGroup) {
      where.bloodGroup = bloodGroup;
    }
    
    // Age filtering requires date calculation
    if (ageFrom !== null || ageTo !== null) {
      const now = new Date();
      
      if (ageFrom !== null) {
        const oldestDate = new Date(now);
        oldestDate.setFullYear(now.getFullYear() - ageFrom);
        where.dateOfBirth = { ...(where.dateOfBirth || {}), lte: oldestDate };
      }
      
      if (ageTo !== null) {
        const youngestDate = new Date(now);
        youngestDate.setFullYear(now.getFullYear() - ageTo - 1);
        youngestDate.setDate(youngestDate.getDate() + 1);
        where.dateOfBirth = { ...(where.dateOfBirth || {}), gt: youngestDate };
      }
    }

    // Get total count for pagination
    const totalPatients = await prisma.patient.count({ where });
    
    // Get patients with pagination, sorting, and filtering
    const patients = await prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          }
        },
        medicalHistory: true,
        allergies: true,
      }
    });

    // Transform the data to format it for the frontend
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      userId: patient.userId,
      patientId: patient.patientId,
      name: patient.user.name,
      email: patient.user.email,
      phone: patient.user.phone,
      status: patient.user.status,
      dateOfBirth: patient.dateOfBirth,
      age: calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      maritalStatus: patient.maritalStatus,
      occupation: patient.occupation,
      nationality: patient.nationality,
      emergencyContact: patient.emergencyContact,
      emergencyName: patient.emergencyName,
      emergencyRelation: patient.emergencyRelation,
      hasAllergies: patient.allergies.length > 0,
      allergiesCount: patient.allergies.length,
      hasMedicalHistory: !!patient.medicalHistory,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        patients: formattedPatients,
        pagination: {
          total: totalPatients,
          page,
          limit,
          pages: Math.ceil(totalPatients / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Register a new patient
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to create patients
    const canCreatePatients = await hasPermission(session, ['admin', 'superadmin', 'receptionist']);
    if (!canCreatePatients) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      phone, 
      dateOfBirth, 
      gender, 
      bloodGroup,
      maritalStatus,
      occupation,
      nationality,
      emergencyContact,
      emergencyName,
      emergencyRelation,
      address,
      city,
      state,
      country,
      postalCode,
      medicalHistory = {}
    } = body;

    // Validate required fields
    if (!name || !email || !password || !dateOfBirth || !gender) {
      return NextResponse.json(
        { success: false, error: 'Name, email, password, date of birth, and gender are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find patient role
    const patientRole = await prisma.role.findUnique({
      where: { name: 'patient' }
    });

    if (!patientRole) {
      return NextResponse.json(
        { success: false, error: 'Patient role not found' },
        { status: 500 }
      );
    }

    // Generate a unique patient ID
    const patientId = await generatePatientId();

    // Create the user with patient role and profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        status: 'active',
        roles: {
          create: {
            roleId: patientRole.id
          }
        },
        profile: {
          create: {
            address,
            city,
            state,
            country,
            postalCode
          }
        },
        patient: {
          create: {
            patientId,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            bloodGroup,
            maritalStatus,
            occupation,
            nationality,
            emergencyContact,
            emergencyName,
            emergencyRelation,
            ...(Object.keys(medicalHistory).length > 0 && {
              medicalHistory: {
                create: {
                  chronicConditions: medicalHistory.chronicConditions || [],
                  pastSurgeries: medicalHistory.pastSurgeries || [],
                  currentMedications: medicalHistory.currentMedications || [],
                  familyHistory: medicalHistory.familyHistory || '',
                  lifestyle: medicalHistory.lifestyle || ''
                }
              }
            })
          }
        }
      },
      include: {
        patient: true,
        profile: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.patient?.id,
        userId: user.id,
        patientId: user.patient?.patientId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.patient?.dateOfBirth,
        gender: user.patient?.gender,
        bloodGroup: user.patient?.bloodGroup,
        profile: user.profile
      },
      message: 'Patient registered successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register patient' },
      { status: 500 }
    );
  }
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to generate a unique patient ID
async function generatePatientId(): Promise<string> {
  const prefix = 'P';
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Get the count of patients created this year
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const patientCount = await prisma.patient.count({
    where: {
      createdAt: {
        gte: startOfYear
      }
    }
  });
  
  // Generate a sequential number with leading zeros
  const sequentialNumber = (patientCount + 1).toString().padStart(4, '0');
  
  return `${prefix}${year}${sequentialNumber}`;
}
