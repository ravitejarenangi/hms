import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canAccessPatientData, canManageDoctorAssignments, canAccessSpecificPatient } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Doctor = {
  id: string;
  name: string;
  specialty?: string;
  isPrimary?: boolean;
  lastAppointment?: Date;
};

// GET /api/patients/[id]/doctors - Get a patient's assigned doctors
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

    // Check authorization - medical staff or own record
    const hasAccess = canAccessSpecificPatient(session, patientId);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get patient's doctors
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get doctors who have appointments with this patient
    const doctorIds = await prisma.appointment.findMany({
      where: { patientId: patientId },
      distinct: ['doctorId'],
      select: { doctorId: true }
    });
    
    // Get all doctors (simplified approach)  
    const doctors = await prisma.doctor.findMany();
    
    // Get appointments for this patient
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patientId },
      orderBy: { startTime: 'desc' }
    });
    
    // Filter doctors who have appointments with this patient
    const doctorAppointments = new Map();
    
    appointments.forEach(appointment => {
      if (!doctorAppointments.has(appointment.doctorId)) {
        doctorAppointments.set(appointment.doctorId, {
          lastAppointment: appointment.startTime,
          isPrimary: false // We'll determine this later if needed
        });
      }
    });
    
    // Create the final doctor list with only those who have appointments with this patient
    const doctorsWithHistory = doctors
      .filter(doctor => doctorAppointments.has(doctor.id))
      .map(doctor => {
        const appointmentInfo = doctorAppointments.get(doctor.id);
        return {
          id: doctor.id,
          specialization: doctor.specialization || '',
          qualification: doctor.qualification || '',
          experience: doctor.experience || 0,
          lastAppointment: appointmentInfo.lastAppointment,
          isPrimary: appointmentInfo.isPrimary
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        doctors: doctorsWithHistory
      }
    });
  } catch (error) {
    console.error('Error fetching patient doctors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient doctors' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/doctors - Assign a primary doctor to a patient
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;
    const data = await request.json();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization - only doctors and admins can assign primary doctors
    const hasPermission = canManageDoctorAssignments(session);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!data.doctorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: doctorId' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId }
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Create a new appointment to establish the doctor-patient relationship
    // This is a placeholder appointment to establish the relationship
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientId,
        doctorId: data.doctorId,
        appointmentTypeId: data.appointmentTypeId || "initial-consultation", // Assuming a default appointment type
        title: "Initial Doctor Assignment",
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        duration: 30,
        status: "COMPLETED",
        createdBy: session.user.id,
        notes: "Doctor assigned as primary care physician"
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        appointment
      },
      message: "Doctor successfully assigned to patient"
    });
  } catch (error) {
    console.error('Error assigning doctor to patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign doctor to patient' },
      { status: 500 }
    );
  }
}
