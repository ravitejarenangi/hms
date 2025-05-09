import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isOwnPatientRecord } from "@/lib/permissions";

// Helper function to send WhatsApp reminder (mock implementation)
async function sendWhatsAppReminder(phoneNumber: string, message: string) {
  // In a real implementation, this would integrate with WhatsApp Business API
  console.log(`Sending WhatsApp message to ${phoneNumber}: ${message}`);
  return true;
}

// GET /api/patients/[id]/medications/reminders - Get a patient's medication reminders
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
    const status = searchParams.get('status') || undefined;
    const upcoming = searchParams.get('upcoming') === 'true';
    const past = searchParams.get('past') === 'true';
    
    // Calculate pagination
    const skip = (page - 1) * limit;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            name: true,
            phone: true
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
      schedule: {
        prescription: {
          patientId
        }
      }
    };
    
    if (status) {
      where.status = status;
    }
    
    if (upcoming) {
      where.scheduledTime = {
        gte: new Date()
      };
    }
    
    if (past) {
      where.scheduledTime = {
        lt: new Date()
      };
    }

    // Get total count for pagination
    const totalReminders = await prisma.medicationReminder.count({ where });

    // Get medication reminders with pagination
    const reminders = await prisma.medicationReminder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledTime: 'asc' },
      include: {
        schedule: {
          include: {
            prescription: {
              include: {
                medications: {
                  include: {
                    medication: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Format the response
    const formattedReminders = reminders.map(reminder => ({
      id: reminder.id,
      scheduleId: reminder.scheduleId,
      prescriptionId: reminder.schedule.prescriptionId,
      medications: reminder.schedule.prescription.medications.map(med => ({
        id: med.id,
        name: med.medication.name,
        dosage: med.dosage,
        instructions: med.instructions
      })),
      scheduledTime: reminder.scheduledTime,
      sentTime: reminder.sentTime,
      status: reminder.status,
      channel: reminder.channel,
      confirmationTime: reminder.confirmationTime,
      confirmationStatus: reminder.confirmationStatus,
      createdAt: reminder.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patientName: patient.user.name,
        patientPhone: patient.user.phone,
        reminders: formattedReminders,
        pagination: {
          total: totalReminders,
          page,
          limit,
          pages: Math.ceil(totalReminders / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching medication reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medication reminders' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/medications/reminders/send - Send medication reminders
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

    // Only medical staff can send reminders
    const isMedicalStaff = await hasPermission(session, ['doctor', 'nurse', 'pharmacist', 'admin', 'superadmin']);
    if (!isMedicalStaff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only medical staff can send medication reminders' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reminderId } = body;

    // Validate required fields
    if (!reminderId) {
      return NextResponse.json(
        { success: false, error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    // Get the reminder and check if it belongs to the patient
    const reminder = await prisma.medicationReminder.findFirst({
      where: {
        id: reminderId,
        schedule: {
          prescription: {
            patientId
          }
        }
      },
      include: {
        schedule: {
          include: {
            prescription: {
              include: {
                medications: {
                  include: {
                    medication: true
                  }
                },
                patient: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found or does not belong to this patient' },
        { status: 404 }
      );
    }

    // Check if the reminder has already been sent
    if (reminder.status === 'SENT') {
      return NextResponse.json(
        { success: false, error: 'Reminder has already been sent' },
        { status: 400 }
      );
    }

    // Get patient's phone number
    const phoneNumber = reminder.schedule.prescription.patient.user.phone;
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Patient does not have a phone number' },
        { status: 400 }
      );
    }

    // Prepare the message
    const medications = reminder.schedule.prescription.medications.map(med => 
      `${med.medication.name} ${med.dosage}`
    ).join(', ');
    
    const message = `Reminder: Time to take your medication(s): ${medications}. Please reply 'TAKEN' to confirm.`;

    // Send the WhatsApp message
    const sent = await sendWhatsAppReminder(phoneNumber, message);

    if (!sent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send WhatsApp reminder' },
        { status: 500 }
      );
    }

    // Update the reminder status
    const updatedReminder = await prisma.medicationReminder.update({
      where: { id: reminderId },
      data: {
        status: 'SENT',
        sentTime: new Date(),
        content: message
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedReminder.id,
        status: updatedReminder.status,
        sentTime: updatedReminder.sentTime,
        message
      }
    });
  } catch (error) {
    console.error('Error sending medication reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send medication reminder' },
      { status: 500 }
    );
  }
}

// PATCH /api/patients/[id]/medications/reminders/confirm - Confirm medication taken
export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { reminderId, confirmationStatus, notes } = body;

    // Validate required fields
    if (!reminderId || !confirmationStatus) {
      return NextResponse.json(
        { success: false, error: 'Reminder ID and confirmation status are required' },
        { status: 400 }
      );
    }

    // Check if the confirmation status is valid
    const validStatuses = ['CONFIRMED', 'MISSED', 'SKIPPED'];
    if (!validStatuses.includes(confirmationStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid confirmation status' },
        { status: 400 }
      );
    }

    // Get the reminder and check if it belongs to the patient
    const reminder = await prisma.medicationReminder.findFirst({
      where: {
        id: reminderId,
        schedule: {
          prescription: {
            patientId
          }
        }
      }
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found or does not belong to this patient' },
        { status: 404 }
      );
    }

    // Update the reminder confirmation status
    const updatedReminder = await prisma.medicationReminder.update({
      where: { id: reminderId },
      data: {
        confirmationStatus,
        confirmationTime: new Date(),
        content: notes ? `${reminder.content || ''}\nNotes: ${notes}` : reminder.content
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedReminder.id,
        confirmationStatus: updatedReminder.confirmationStatus,
        confirmationTime: updatedReminder.confirmationTime
      }
    });
  } catch (error) {
    console.error('Error confirming medication reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm medication reminder' },
      { status: 500 }
    );
  }
}
