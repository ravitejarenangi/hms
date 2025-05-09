import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/doctors/shared-notes
 * Get shared notes for a co-consultation
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const url = new URL(req.url);
  const coConsultationId = url.searchParams.get('coConsultationId');
  
  if (!coConsultationId) {
    return NextResponse.json({ error: 'Co-consultation ID is required' }, { status: 400 });
  }
  
  try {
    // Get the co-consultation
    const coConsultation = await prisma.doctorCoConsultation.findUnique({
      where: { id: coConsultationId },
      include: {
        sharedNotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!coConsultation) {
      return NextResponse.json({ error: 'Co-consultation not found' }, { status: 404 });
    }
    
    // Check if user is one of the doctors involved in the co-consultation
    const userId = session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { userId }
    });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    const isDoctorInvolved = 
      coConsultation.primaryDoctorId === doctor.id || 
      coConsultation.secondaryDoctorId === doctor.id;
    
    if (!isDoctorInvolved && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      data: { sharedNotes: coConsultation.sharedNotes }
    });
    
  } catch (error) {
    console.error('Error fetching shared notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/doctors/shared-notes
 * Create a new shared note for a co-consultation
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { coConsultationId, content } = await req.json();
    
    if (!coConsultationId || !content) {
      return NextResponse.json({ 
        error: 'Co-consultation ID and content are required' 
      }, { status: 400 });
    }
    
    // Get the co-consultation
    const coConsultation = await prisma.doctorCoConsultation.findUnique({
      where: { id: coConsultationId }
    });
    
    if (!coConsultation) {
      return NextResponse.json({ error: 'Co-consultation not found' }, { status: 404 });
    }
    
    // Check if user is one of the doctors involved in the co-consultation
    const userId = session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { userId }
    });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    const isDoctorInvolved = 
      coConsultation.primaryDoctorId === doctor.id || 
      coConsultation.secondaryDoctorId === doctor.id;
    
    if (!isDoctorInvolved && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Create the shared note
    const sharedNote = await prisma.doctorSharedNote.create({
      data: {
        coConsultationId,
        doctorId: doctor.id,
        content,
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { sharedNote }
    });
    
  } catch (error) {
    console.error('Error creating shared note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/doctors/shared-notes
 * Update a shared note
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { noteId, content } = await req.json();
    
    if (!noteId || !content) {
      return NextResponse.json({ 
        error: 'Note ID and content are required' 
      }, { status: 400 });
    }
    
    // Get the shared note
    const sharedNote = await prisma.doctorSharedNote.findUnique({
      where: { id: noteId },
      include: { coConsultation: true }
    });
    
    if (!sharedNote) {
      return NextResponse.json({ error: 'Shared note not found' }, { status: 404 });
    }
    
    // Check if user is one of the doctors involved in the co-consultation
    const userId = session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { userId }
    });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    // Only the doctor who created the note or admin can update it
    if (sharedNote.doctorId !== doctor.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Update the shared note
    const updatedNote = await prisma.doctorSharedNote.update({
      where: { id: noteId },
      data: { content }
    });
    
    return NextResponse.json({
      success: true,
      data: { sharedNote: updatedNote }
    });
    
  } catch (error) {
    console.error('Error updating shared note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/doctors/shared-notes
 * Delete a shared note
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const url = new URL(req.url);
  const noteId = url.searchParams.get('noteId');
  
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }
  
  try {
    // Get the shared note
    const sharedNote = await prisma.doctorSharedNote.findUnique({
      where: { id: noteId }
    });
    
    if (!sharedNote) {
      return NextResponse.json({ error: 'Shared note not found' }, { status: 404 });
    }
    
    // Check if user is one of the doctors involved in the co-consultation
    const userId = session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { userId }
    });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    // Only the doctor who created the note or admin can delete it
    if (sharedNote.doctorId !== doctor.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete the shared note
    await prisma.doctorSharedNote.delete({
      where: { id: noteId }
    });
    
    return NextResponse.json({
      success: true,
      data: { message: 'Shared note deleted successfully' }
    });
    
  } catch (error) {
    console.error('Error deleting shared note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
