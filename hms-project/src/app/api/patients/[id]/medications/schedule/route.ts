import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isOwnPatientRecord } from "@/lib/permissions";

// Helper function to generate medication reminders based on schedule
async function generateReminders(scheduleId: string, startDate: Date, endDate: Date | null, timeOfDay: string[], daysOfWeek: number[]) {
  const reminders = [];
  const currentDate = new Date(startDate);
  const maxEndDate = endDate || new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days if no end date

  while (currentDate <= maxEndDate) {
    const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    if (daysOfWeek.includes(dayOfWeek)) {
      for (const time of timeOfDay) {
        const [hours, minutes] = time.split(':').map(Number);
        const reminderDate = new Date(currentDate);
        reminderDate.setHours(hours, minutes, 0, 0);
        
        // Only create reminders for future dates
        if (reminderDate > new Date()) {
          reminders.push({
            scheduleId,
            scheduledTime: reminderDate,
            status: 'PENDING',
            channel: 'WHATSAPP', // Default to WhatsApp
            content: 'Time to take your medication. Please confirm when taken.',
          });
        }
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return reminders;
}

// GET /api/patients/[id]/medications/schedule - Get a patient's medication schedules
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
    const isOwn = await isOwnPatientRecord(session, patientId);
    
    if (!isMedicalStaff && !isOwn) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const active = searchParams.get('active') === 'true';
    
    // Calculate pagination
    const skip = (page - 1) * limit;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Build where clause for filtering
    let where: any = {
      prescription: {
        patientId
      }
    };
    
    if (active) {
      const today = new Date();
      where.endDate = {
        gte: today
      };
    }

    // Get total count for pagination
    const totalSchedules = await prisma.medicationSchedule.count({ where });

    // Get medication schedules with pagination
    const schedules = await prisma.medicationSchedule.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: 'desc' },
      include: {
        prescription: {
          include: {
            medications: {
              include: {
                medication: true
              }
            },
            doctor: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        reminders: {
          where: {
            scheduledTime: {
              gte: new Date()
            }
          },
          orderBy: {
            scheduledTime: 'asc'
          },
          take: 10
        }
      }
    });

    // Format the response
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      prescriptionId: schedule.prescriptionId,
      prescriptionNumber: schedule.prescription.prescriptionNumber,
      medications: schedule.prescription.medications.map(med => ({
        id: med.id,
        name: med.medication.name,
        dosage: med.dosage,
        frequency: med.frequency,
        route: med.route,
        instructions: med.instructions
      })),
      doctorName: schedule.prescription.doctor?.user.name || 'Unknown',
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      timeOfDay: schedule.timeOfDay,
      daysOfWeek: schedule.daysOfWeek,
      instructions: schedule.instructions,
      upcomingReminders: schedule.reminders.map(reminder => ({
        id: reminder.id,
        scheduledTime: reminder.scheduledTime,
        status: reminder.status,
        channel: reminder.channel,
        confirmationStatus: reminder.confirmationStatus
      })),
      createdAt: schedule.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patientName: patient.user.name,
        schedules: formattedSchedules,
        pagination: {
          total: totalSchedules,
          page,
          limit,
          pages: Math.ceil(totalSchedules / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching medication schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medication schedules' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/medications/schedule - Create a new medication schedule
export async function POST(
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

    // Only medical staff can create medication schedules
    const isMedicalStaff = await hasPermission(session, ['doctor', 'nurse', 'pharmacist', 'admin', 'superadmin']);
    if (!isMedicalStaff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only medical staff can create medication schedules' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      prescriptionId, 
      startDate, 
      endDate, 
      timeOfDay, 
      daysOfWeek, 
      instructions 
    } = body;

    // Validate required fields
    if (!prescriptionId || !startDate || !timeOfDay || !timeOfDay.length || !daysOfWeek || !daysOfWeek.length) {
      return NextResponse.json(
        { success: false, error: 'Prescription ID, start date, time of day, and days of week are required' },
        { status: 400 }
      );
    }

    // Check if prescription exists and belongs to the patient
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        patientId
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription not found or does not belong to this patient' },
        { status: 404 }
      );
    }

    // Create the medication schedule
    const schedule = await prisma.medicationSchedule.create({
      data: {
        prescriptionId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        timeOfDay,
        daysOfWeek,
        instructions
      }
    });

    // Generate reminders for the schedule
    const reminders = await generateReminders(
      schedule.id,
      new Date(startDate),
      endDate ? new Date(endDate) : null,
      timeOfDay,
      daysOfWeek
    );

    // Create reminders in the database
    if (reminders.length > 0) {
      await prisma.medicationReminder.createMany({
        data: reminders
      });
    }

    // Get the created schedule with reminders
    const createdSchedule = await prisma.medicationSchedule.findUnique({
      where: { id: schedule.id },
      include: {
        prescription: {
          include: {
            medications: {
              include: {
                medication: true
              }
            }
          }
        },
        reminders: {
          orderBy: {
            scheduledTime: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: createdSchedule.id,
        prescriptionId: createdSchedule.prescriptionId,
        medications: createdSchedule.prescription.medications.map(med => ({
          id: med.id,
          name: med.medication.name,
          dosage: med.dosage,
          frequency: med.frequency,
          route: med.route,
          instructions: med.instructions
        })),
        startDate: createdSchedule.startDate,
        endDate: createdSchedule.endDate,
        timeOfDay: createdSchedule.timeOfDay,
        daysOfWeek: createdSchedule.daysOfWeek,
        instructions: createdSchedule.instructions,
        reminders: createdSchedule.reminders.map(reminder => ({
          id: reminder.id,
          scheduledTime: reminder.scheduledTime,
          status: reminder.status,
          channel: reminder.channel
        })),
        createdAt: createdSchedule.createdAt
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
