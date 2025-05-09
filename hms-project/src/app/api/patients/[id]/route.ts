import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Helper function to check if user has required permissions
async function hasPermission(session: any, requiredRoles: string[] = []) {
  if (!session || !session.user) return false;
  
  const userRoles = session.user.roles || [];
  
  // If no specific roles are required, just check if user is authenticated
  if (requiredRoles.length === 0) return true;
  
  // Check if user has any of the required roles
  return userRoles.some(role => requiredRoles.includes(role));
}

// Helper function to check if user is accessing their own patient record
async function isOwnPatientRecord(session: any, patientId: string) {
  if (!session || !session.user) return false;
  
  // Get the patient record
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { userId: true }
  });
  
  if (!patient) return false;
  
  // Check if the patient's userId matches the session user's id
  return session.user.id === patient.userId;
}

// GET /api/patients/[id] - Get a specific patient
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization - staff or own record
    const isStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist']);
    const isOwn = await isOwnPatientRecord(session, patientId);
    
    if (!isStaff && !isOwn) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get patient with related data
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            profile: true,
          }
        },
        medicalHistory: true,
        allergies: true,
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          take: 5
        },
        familyMembers: true,
        insurances: true,
        consents: true
      }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedPatient = {
      id: patient.id,
      userId: patient.userId,
      patientId: patient.patientId,
      name: patient.user.name,
      email: patient.user.email,
      phone: patient.user.phone,
      status: patient.user.status,
      profile: patient.user.profile,
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
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      documents: patient.documents,
      vitalSigns: patient.vitalSigns,
      familyMembers: patient.familyMembers,
      insurances: patient.insurances,
      consents: patient.consents,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedPatient
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - Update a specific patient
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization - staff or own record
    const isStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist']);
    const isOwn = await isOwnPatientRecord(session, patientId);
    
    if (!isStaff && !isOwn) {
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
      postalCode
    } = body;

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true
      }
    });

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Prepare user update data
    const userUpdateData: any = {};
    
    if (name) userUpdateData.name = name;
    if (phone) userUpdateData.phone = phone;
    
    // Only staff can update email
    if (email && isStaff && email !== existingPatient.user.email) {
      // Check if email is already in use by another user
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      
      if (emailExists && emailExists.id !== existingPatient.userId) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
      
      userUpdateData.email = email;
    }

    // Prepare patient update data
    const patientUpdateData: any = {};
    
    if (dateOfBirth) patientUpdateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) patientUpdateData.gender = gender;
    if (bloodGroup !== undefined) patientUpdateData.bloodGroup = bloodGroup;
    if (maritalStatus !== undefined) patientUpdateData.maritalStatus = maritalStatus;
    if (occupation !== undefined) patientUpdateData.occupation = occupation;
    if (nationality !== undefined) patientUpdateData.nationality = nationality;
    if (emergencyContact !== undefined) patientUpdateData.emergencyContact = emergencyContact;
    if (emergencyName !== undefined) patientUpdateData.emergencyName = emergencyName;
    if (emergencyRelation !== undefined) patientUpdateData.emergencyRelation = emergencyRelation;

    // Update profile if address information is provided
    if (address || city || state || country || postalCode) {
      const profileUpdateData: any = {};
      
      if (address !== undefined) profileUpdateData.address = address;
      if (city !== undefined) profileUpdateData.city = city;
      if (state !== undefined) profileUpdateData.state = state;
      if (country !== undefined) profileUpdateData.country = country;
      if (postalCode !== undefined) profileUpdateData.postalCode = postalCode;
      
      // Check if profile exists
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: existingPatient.userId }
      });
      
      if (existingProfile) {
        await prisma.profile.update({
          where: { userId: existingPatient.userId },
          data: profileUpdateData
        });
      } else {
        await prisma.profile.create({
          data: {
            ...profileUpdateData,
            userId: existingPatient.userId
          }
        });
      }
    }

    // Update user if there are changes
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: existingPatient.userId },
        data: userUpdateData
      });
    }

    // Update patient if there are changes
    if (Object.keys(patientUpdateData).length > 0) {
      await prisma.patient.update({
        where: { id: patientId },
        data: patientUpdateData
      });
    }

    // Get updated patient data
    const updatedPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            profile: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPatient?.id,
        userId: updatedPatient?.userId,
        patientId: updatedPatient?.patientId,
        name: updatedPatient?.user.name,
        email: updatedPatient?.user.email,
        phone: updatedPatient?.user.phone,
        profile: updatedPatient?.user.profile,
        dateOfBirth: updatedPatient?.dateOfBirth,
        gender: updatedPatient?.gender,
        bloodGroup: updatedPatient?.bloodGroup,
        maritalStatus: updatedPatient?.maritalStatus,
        occupation: updatedPatient?.occupation,
        nationality: updatedPatient?.nationality,
        emergencyContact: updatedPatient?.emergencyContact,
        emergencyName: updatedPatient?.emergencyName,
        emergencyRelation: updatedPatient?.emergencyRelation
      },
      message: 'Patient updated successfully'
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete a specific patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can delete patients
    const isAdmin = await hasPermission(session, ['admin', 'superadmin']);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { userId: true }
    });

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Delete the patient (this will cascade to related records)
    await prisma.patient.delete({
      where: { id: patientId }
    });

    // Delete the user account as well
    await prisma.user.delete({
      where: { id: existingPatient.userId }
    });

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete patient' },
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
