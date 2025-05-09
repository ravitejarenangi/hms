import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/doctors/profile
 * 
 * Fetch doctor profile information
 * 
 * Query parameters:
 * - id: Doctor ID (optional, if not provided, returns the profile of the current user if they are a doctor)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    // If ID is provided, check if user has permission to view other doctor profiles
    if (id && id !== session.user.doctorId && !hasPermission(session, 'doctors.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // If no ID is provided, use the current user's doctor ID if they are a doctor
    const doctorId = id || session.user.doctorId;
    
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'No doctor ID provided and current user is not a doctor' },
        { status: 400 }
      );
    }
    
    // Fetch doctor profile with related information
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profile: true
          }
        },
        departments: {
          include: {
            department: true
          }
        },
        specialities: {
          include: {
            speciality: true
          }
        },
        availability: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        performanceMetrics: {
          take: 1,
          orderBy: {
            endDate: 'desc'
          }
        }
      }
    });
    
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    
    // Calculate additional statistics
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get appointments for the current month
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });
    
    // Calculate appointment statistics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length;
    
    // Get patient assignments
    const patientAssignments = await prisma.patientAssignment.count({
      where: {
        doctorId: doctor.id,
        status: 'ACTIVE'
      }
    });
    
    // Prepare the response
    const response = {
      ...doctor,
      currentMonthStats: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0
      },
      activePatients: patientAssignments
    };
    
    return NextResponse.json({ success: true, data: { doctor: response } });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctor profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/doctors/profile
 * 
 * Update doctor profile information
 * 
 * Request body:
 * - id: Doctor ID (optional, if not provided, updates the profile of the current user if they are a doctor)
 * - licenseNumber: License number
 * - specialization: Specialization
 * - department: Department
 * - qualification: Qualification
 * - experience: Experience in years
 * - consultationFee: Consultation fee
 * - availableFrom: Available from time (HH:MM)
 * - availableTo: Available to time (HH:MM)
 * - availableDays: Available days (array of 0-6 for Sunday-Saturday)
 * - maxAppointmentsPerDay: Maximum appointments per day
 * - isAvailableForOnline: Whether available for online consultations
 * - about: About information
 * - specialtyFocus: Areas of specialty focus
 * - certifications: Professional certifications
 * - languages: Languages spoken
 * - isAcceptingNewPatients: Whether accepting new patients
 * - maxPatientsPerDay: Maximum patients per day
 * - billingRate: Hourly billing rate
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const {
      id,
      licenseNumber,
      specialization,
      department,
      qualification,
      experience,
      consultationFee,
      availableFrom,
      availableTo,
      availableDays,
      maxAppointmentsPerDay,
      isAvailableForOnline,
      about,
      specialtyFocus,
      certifications,
      languages,
      isAcceptingNewPatients,
      maxPatientsPerDay,
      billingRate
    } = body;
    
    // If ID is provided, check if user has permission to update other doctor profiles
    if (id && id !== session.user.doctorId && !hasPermission(session, 'doctors.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // If no ID is provided, use the current user's doctor ID if they are a doctor
    const doctorId = id || session.user.doctorId;
    
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'No doctor ID provided and current user is not a doctor' },
        { status: 400 }
      );
    }
    
    // Check if doctor exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });
    
    if (!existingDoctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    
    // Update doctor profile
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        licenseNumber: licenseNumber || undefined,
        specialization: specialization || undefined,
        department: department || undefined,
        qualification: qualification || undefined,
        experience: experience !== undefined ? experience : undefined,
        consultationFee: consultationFee !== undefined ? consultationFee : undefined,
        availableFrom: availableFrom || undefined,
        availableTo: availableTo || undefined,
        availableDays: availableDays || undefined,
        maxAppointmentsPerDay: maxAppointmentsPerDay !== undefined ? maxAppointmentsPerDay : undefined,
        isAvailableForOnline: isAvailableForOnline !== undefined ? isAvailableForOnline : undefined,
        about: about || undefined,
        specialtyFocus: specialtyFocus || undefined,
        certifications: certifications || undefined,
        languages: languages || undefined,
        isAcceptingNewPatients: isAcceptingNewPatients !== undefined ? isAcceptingNewPatients : undefined,
        maxPatientsPerDay: maxPatientsPerDay !== undefined ? maxPatientsPerDay : undefined,
        billingRate: billingRate !== undefined ? billingRate : undefined
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { doctor: updatedDoctor }
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update doctor profile' },
      { status: 500 }
    );
  }
}
