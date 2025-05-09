import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

// GET /api/patients/[id]/medications - Get a patient's medications
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
    const isMedicalStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse', 'pharmacist']);
    const isOwnRecord = session.user.id === patientId;

    if (!isMedicalStaff && !isOwnRecord) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get patient's prescriptions with medications
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

    // Find all prescriptions for this patient
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        medications: {
          include: {
            medication: true
          }
        },
        schedules: {
          include: {
            reminders: true
          }
        },
        dispensations: true
      },
      orderBy: {
        prescribedDate: 'desc'
      }
    });

    // Get active medications (from active prescriptions)
    const activeMedications = prescriptions
      .filter(prescription => prescription.status === 'ACTIVE')
      .flatMap(prescription => prescription.medications.map(med => ({
        ...med,
        prescriptionId: prescription.id,
        prescribedDate: prescription.prescribedDate,
        doctorName: prescription.doctor.user.name
      })));

    return NextResponse.json({
      success: true,
      data: {
        prescriptions,
        activeMedications
      }
    });
  } catch (error) {
    console.error('Error fetching patient medications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient medications' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/medications/schedule - Create medication schedule
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

    // Check authorization - only medical staff can create medication schedules
    const isMedicalStaff = await hasPermission(session, ['admin', 'superadmin', 'doctor', 'nurse', 'pharmacist']);
    
    if (!isMedicalStaff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!data.prescriptionId || !data.startDate || !data.timeOfDay || !data.daysOfWeek) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: prescriptionId, startDate, timeOfDay, daysOfWeek' },
        { status: 400 }
      );
    }

    // Check if prescription exists and belongs to this patient
    const prescription = await prisma.prescription.findFirst({
      where: { 
        id: data.prescriptionId,
        patientId: patientId
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription not found or does not belong to this patient' },
        { status: 404 }
      );
    }

    // Create new medication schedule
    const schedule = await prisma.medicationSchedule.create({
      data: {
        prescriptionId: data.prescriptionId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        timeOfDay: data.timeOfDay,
        daysOfWeek: data.daysOfWeek,
        instructions: data.instructions
      }
    });

    // Create reminders for the schedule
    const reminders = [];
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // If no end date, create reminders for 30 days

    // Get all dates between start and end date
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Check if the day of week is in the daysOfWeek array
      if (data.daysOfWeek.includes(currentDate.getDay())) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create reminders for each date and time
    for (const date of dates) {
      for (const time of data.timeOfDay) {
        const [hours, minutes] = time.split(':').map(Number);
        const reminderTime = new Date(date);
        reminderTime.setHours(hours, minutes, 0, 0);
        
        // Only create reminders for future times
        if (reminderTime > new Date()) {
          const reminder = await prisma.medicationReminder.create({
            data: {
              scheduleId: schedule.id,
              scheduledTime: reminderTime,
              status: 'PENDING',
              channel: data.reminderChannel || 'SMS',
              content: data.reminderContent || `Time to take your medication: ${prescription.instructions}`,
              confirmationStatus: 'PENDING'
            }
          });
          reminders.push(reminder);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        schedule,
        reminders
      }
    });
  } catch (error) {
    console.error('Error creating medication schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create medication schedule' },
      { status: 500 }
    );
  }
}
