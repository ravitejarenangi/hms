import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/appointments/co-consultations/notes
 * 
 * Fetch co-consultation notes for a specific appointment
 * 
 * Query parameters:
 * - appointmentId: Appointment ID
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'appointments.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const url = new URL(req.url);
    const appointmentId = url.searchParams.get('appointmentId');
    
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }
    
    // Check if appointment exists and is a co-consultation
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { isCoConsultation: true }
    });
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    if (!appointment.isCoConsultation) {
      return NextResponse.json(
        { success: false, error: 'Appointment is not a co-consultation' },
        { status: 400 }
      );
    }
    
    // Fetch co-consultation notes
    const notes = await prisma.coConsultationNote.findMany({
      where: { appointmentId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        sections: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true
              }
            },
            updatedBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { notes }
    });
  } catch (error) {
    console.error('Error fetching co-consultation notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch co-consultation notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments/co-consultations/notes
 * 
 * Create or update a co-consultation note
 * 
 * Request body:
 * - appointmentId: Appointment ID
 * - content: Note content
 * - sectionTitle: Section title (optional)
 * - sectionContent: Section content (optional)
 * - doctorId: Doctor ID for the section (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'appointments.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    
    const {
      appointmentId,
      content,
      sectionTitle,
      sectionContent,
      doctorId
    } = body;
    
    // Validate required fields
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }
    
    // Check if appointment exists and is a co-consultation
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        coConsultingDoctors: true,
        doctor: true
      }
    });
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    if (!appointment.isCoConsultation) {
      return NextResponse.json(
        { success: false, error: 'Appointment is not a co-consultation' },
        { status: 400 }
      );
    }
    
    // Check if the user is involved in the co-consultation
    const userIsPrimaryDoctor = appointment.doctorId === session.user.doctorId;
    const userIsCoConsultingDoctor = appointment.coConsultingDoctors.some(
      (doc) => doc.doctorId === session.user.doctorId
    );
    
    if (!userIsPrimaryDoctor && !userIsCoConsultingDoctor && !hasPermission(session, 'appointments.admin')) {
      return NextResponse.json(
        { success: false, error: 'You are not involved in this co-consultation' },
        { status: 403 }
      );
    }
    
    // Find or create the main note
    let note = await prisma.coConsultationNote.findFirst({
      where: { appointmentId }
    });
    
    if (!note) {
      note = await prisma.coConsultationNote.create({
        data: {
          appointmentId,
          content: content || '',
          createdById: session.user.id
        }
      });
    } else if (content) {
      // Update the main note content if provided
      note = await prisma.coConsultationNote.update({
        where: { id: note.id },
        data: {
          content,
          updatedAt: new Date()
        }
      });
    }
    
    // Create a new section if section data is provided
    if (sectionTitle && sectionContent) {
      // Validate doctor ID if provided
      if (doctorId) {
        const isValidDoctor = appointment.doctorId === doctorId || 
          appointment.coConsultingDoctors.some((doc) => doc.doctorId === doctorId);
        
        if (!isValidDoctor) {
          return NextResponse.json(
            { success: false, error: 'Invalid doctor ID for this co-consultation' },
            { status: 400 }
          );
        }
      }
      
      // Create the section
      await prisma.coConsultationNoteSection.create({
        data: {
          noteId: note.id,
          title: sectionTitle,
          content: sectionContent,
          doctorId: doctorId || session.user.doctorId,
          createdById: session.user.id,
          updatedById: session.user.id
        }
      });
    }
    
    // Fetch the updated note with all sections
    const updatedNote = await prisma.coConsultationNote.findUnique({
      where: { id: note.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        sections: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true
              }
            },
            updatedBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    
    // Create notifications for all doctors involved
    const doctorIds = [
      appointment.doctorId,
      ...appointment.coConsultingDoctors.map((doc) => doc.doctorId)
    ].filter((id) => id !== session.user.doctorId);
    
    if (doctorIds.length > 0) {
      await prisma.notification.createMany({
        data: doctorIds.map((id) => ({
          userId: id,
          type: 'APPOINTMENT',
          title: 'Co-Consultation Note Updated',
          message: `A note has been updated for the co-consultation appointment on ${appointment.startTime.toLocaleString()}`,
          relatedId: appointment.id,
          createdBy: session.user.id
        }))
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { note: updatedNote }
    });
  } catch (error) {
    console.error('Error updating co-consultation note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update co-consultation note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/co-consultations/notes
 * 
 * Delete a co-consultation note section
 * 
 * Request body:
 * - sectionId: Section ID to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'appointments.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    const { sectionId } = body;
    
    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }
    
    // Find the section
    const section = await prisma.coConsultationNoteSection.findUnique({
      where: { id: sectionId },
      include: {
        note: {
          include: {
            appointment: {
              include: {
                doctor: true,
                coConsultingDoctors: true
              }
            }
          }
        }
      }
    });
    
    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is involved in the co-consultation
    const appointment = section.note.appointment;
    const userIsPrimaryDoctor = appointment.doctorId === session.user.doctorId;
    const userIsCoConsultingDoctor = appointment.coConsultingDoctors.some(
      (doc) => doc.doctorId === session.user.doctorId
    );
    
    // Check if the user created the section or has admin permissions
    const userCreatedSection = section.createdById === session.user.id;
    const userIsAdmin = hasPermission(session, 'appointments.admin');
    
    if ((!userIsPrimaryDoctor && !userIsCoConsultingDoctor) || (!userCreatedSection && !userIsAdmin)) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this section' },
        { status: 403 }
      );
    }
    
    // Delete the section
    await prisma.coConsultationNoteSection.delete({
      where: { id: sectionId }
    });
    
    return NextResponse.json({
      success: true,
      data: { message: 'Section deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting co-consultation note section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete co-consultation note section' },
      { status: 500 }
    );
  }
}
