import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/appointments/referrals - Get referrals with filtering
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

    // Parse query parameters
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const referringDoctorId = url.searchParams.get('referringDoctorId');
    const receivingDoctorId = url.searchParams.get('receivingDoctorId');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    
    if (patientId) where.patientId = patientId;
    if (referringDoctorId) where.referringDoctorId = referringDoctorId;
    if (receivingDoctorId) where.receivingDoctorId = receivingDoctorId;
    if (status) where.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get referrals with pagination
    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          referringDoctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          receivingDoctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          originalAppointment: true,
          newAppointment: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.referral.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        referrals,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}

// POST /api/appointments/referrals - Create a new referral
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

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['patientId', 'referringDoctorId', 'receivingDoctorId', 'reason', 'originalAppointmentId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if the patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if the referring doctor exists
    const referringDoctor = await prisma.doctor.findUnique({
      where: { id: data.referringDoctorId }
    });

    if (!referringDoctor) {
      return NextResponse.json(
        { success: false, error: 'Referring doctor not found' },
        { status: 404 }
      );
    }

    // Check if the receiving doctor exists
    const receivingDoctor = await prisma.doctor.findUnique({
      where: { id: data.receivingDoctorId }
    });

    if (!receivingDoctor) {
      return NextResponse.json(
        { success: false, error: 'Receiving doctor not found' },
        { status: 404 }
      );
    }

    // Check if the original appointment exists
    const originalAppointment = await prisma.appointment.findUnique({
      where: { id: data.originalAppointmentId },
      include: {
        appointmentType: true
      }
    });

    if (!originalAppointment) {
      return NextResponse.json(
        { success: false, error: 'Original appointment not found' },
        { status: 404 }
      );
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Create the referral
      const referral = await prisma.referral.create({
        data: {
          patientId: data.patientId,
          referringDoctorId: data.referringDoctorId,
          receivingDoctorId: data.receivingDoctorId,
          reason: data.reason,
          notes: data.notes,
          urgency: data.urgency || 'NORMAL',
          status: 'PENDING',
          originalAppointmentId: data.originalAppointmentId,
          createdBy: session.user.id
        }
      });

      // Create a new appointment for the receiving doctor if requested
      let newAppointment = null;
      if (data.createNewAppointment) {
        // Determine the appointment date and time
        let appointmentDate;
        if (data.appointmentDate) {
          appointmentDate = new Date(data.appointmentDate);
        } else {
          // Default to next business day if not specified
          appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() + 1);
          // Skip weekends
          const dayOfWeek = appointmentDate.getDay();
          if (dayOfWeek === 0) appointmentDate.setDate(appointmentDate.getDate() + 1); // Sunday -> Monday
          if (dayOfWeek === 6) appointmentDate.setDate(appointmentDate.getDate() + 2); // Saturday -> Monday
        }

        // Set the appointment time if provided
        if (data.appointmentTime) {
          const [hours, minutes] = data.appointmentTime.split(':').map(Number);
          appointmentDate.setHours(hours, minutes, 0, 0);
        } else {
          // Default to 9:00 AM if not specified
          appointmentDate.setHours(9, 0, 0, 0);
        }

        // Calculate end time based on duration
        const duration = data.duration || originalAppointment.duration || 30; // Default to 30 minutes
        const endTime = new Date(appointmentDate);
        endTime.setMinutes(endTime.getMinutes() + duration);

        // Create the new appointment
        newAppointment = await prisma.appointment.create({
          data: {
            patientId: data.patientId,
            doctorId: data.receivingDoctorId,
            departmentId: receivingDoctor.department || null,
            appointmentTypeId: data.appointmentTypeId || originalAppointment.appointmentTypeId,
            title: `Referral: ${originalAppointment.title}`,
            description: data.reason,
            startTime: appointmentDate,
            endTime: endTime,
            duration: duration,
            location: data.location || null,
            notes: `Referral from Dr. ${referringDoctor.user?.name || 'Unknown'}\n\n${data.notes || ''}`,
            createdBy: session.user.id,
            status: 'SCHEDULED',
            confirmationStatus: 'PENDING'
          }
        });

        // Update the referral with the new appointment
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            newAppointmentId: newAppointment.id,
            status: 'SCHEDULED'
          }
        });

        // Create reminders for the new appointment
        await prisma.appointmentReminder.create({
          data: {
            appointmentId: newAppointment.id,
            reminderType: 'INITIAL',
            scheduledTime: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
            channel: 'EMAIL',
            content: `You have been referred to Dr. ${receivingDoctor.user?.name || 'Unknown'} by Dr. ${referringDoctor.user?.name || 'Unknown'}. Your appointment is scheduled for ${appointmentDate.toLocaleString()}.`,
            status: 'PENDING'
          }
        });

        // Create a notification for the receiving doctor
        await prisma.notification.create({
          data: {
            userId: receivingDoctor.userId,
            title: 'New Patient Referral',
            message: `You have received a patient referral from Dr. ${referringDoctor.user?.name || 'Unknown'} for patient ${patient.user?.name || 'Unknown'}.`,
            type: 'REFERRAL',
            isRead: false,
            link: `/appointments/${newAppointment.id}`
          }
        });
      }

      // Create a notification for the referring doctor
      await prisma.notification.create({
        data: {
          userId: referringDoctor.userId,
          title: 'Referral Sent',
          message: `Your referral for patient ${patient.user?.name || 'Unknown'} to Dr. ${receivingDoctor.user?.name || 'Unknown'} has been ${newAppointment ? 'scheduled' : 'created'}.`,
          type: 'REFERRAL',
          isRead: false,
          link: `/referrals/${referral.id}`
        }
      });

      // Add a note to the original appointment
      await prisma.appointmentNote.create({
        data: {
          appointmentId: originalAppointment.id,
          note: `Patient referred to Dr. ${receivingDoctor.user?.name || 'Unknown'} for ${data.reason}${newAppointment ? `. New appointment scheduled for ${appointmentDate.toLocaleString()}.` : '.'}`,
          createdBy: session.user.id
        }
      });

      return { referral, newAppointment };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: result.newAppointment 
        ? "Referral created and new appointment scheduled successfully" 
        : "Referral created successfully"
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create referral' },
      { status: 500 }
    );
  }
}
