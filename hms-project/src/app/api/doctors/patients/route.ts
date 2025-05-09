import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/doctors/patients
 * 
 * Fetch patients assigned to a doctor
 * 
 * Query parameters:
 * - doctorId: Doctor ID
 * - status: Filter by status (ACTIVE, INACTIVE, TRANSFERRED, COMPLETED)
 * - search: Search term for patient name or ID
 * - page: Page number for pagination
 * - limit: Number of items per page
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const doctorId = url.searchParams.get('doctorId');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to view patients
    if (doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Build filter conditions
    const where: any = {
      doctorId
    };
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        {
          patient: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          patient: {
            patientId: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.patientAssignment.count({ where });
    
    // Fetch patient assignments
    const patientAssignments = await prisma.patientAssignment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            patientId: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true
          }
        }
      },
      orderBy: [
        { isPrimaryDoctor: 'desc' },
        { assignmentDate: 'desc' }
      ],
      skip,
      take: limit
    });
    
    // Fetch upcoming appointments for these patients
    const patientIds = patientAssignments.map(assignment => assignment.patientId);
    
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        patientId: { in: patientIds },
        doctorId,
        startTime: {
          gte: new Date()
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      select: {
        id: true,
        patientId: true,
        startTime: true,
        endTime: true,
        title: true,
        status: true
      }
    });
    
    // Group appointments by patient
    const appointmentsByPatient: { [key: string]: any[] } = {};
    
    upcomingAppointments.forEach(appointment => {
      if (!appointmentsByPatient[appointment.patientId]) {
        appointmentsByPatient[appointment.patientId] = [];
      }
      appointmentsByPatient[appointment.patientId].push(appointment);
    });
    
    // Add upcoming appointments to patient assignments
    const enrichedAssignments = patientAssignments.map(assignment => ({
      ...assignment,
      upcomingAppointments: appointmentsByPatient[assignment.patientId] || []
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        patientAssignments: enrichedAssignments,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching patients assigned to doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients assigned to doctor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctors/patients
 * 
 * Assign a patient to a doctor
 * 
 * Request body:
 * - doctorId: Doctor ID
 * - patientId: Patient ID
 * - isPrimaryDoctor: Whether this doctor is the primary doctor for the patient
 * - notes: Additional notes
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const {
      doctorId,
      patientId,
      isPrimaryDoctor = false,
      notes
    } = body;
    
    // Validate required fields
    if (!doctorId || !patientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to assign patients
    if (!hasPermission(session, 'doctors.update') && !hasPermission(session, 'patients.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });
    
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }
    
    // Check if assignment already exists
    const existingAssignment = await prisma.patientAssignment.findUnique({
      where: {
        patientId_doctorId: {
          patientId,
          doctorId
        }
      }
    });
    
    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Patient is already assigned to this doctor' },
        { status: 409 }
      );
    }
    
    // If this is a primary doctor assignment, update any existing primary doctor assignments
    if (isPrimaryDoctor) {
      await prisma.patientAssignment.updateMany({
        where: {
          patientId,
          isPrimaryDoctor: true
        },
        data: {
          isPrimaryDoctor: false
        }
      });
    }
    
    // Create the patient assignment
    const patientAssignment = await prisma.patientAssignment.create({
      data: {
        doctorId,
        patientId,
        isPrimaryDoctor,
        status: 'ACTIVE',
        notes,
        createdBy: session.user.id
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            patientId: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true
          }
        }
      }
    });
    
    // Update doctor's total patients count
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        totalPatients: {
          increment: 1
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { patientAssignment }
    });
  } catch (error) {
    console.error('Error assigning patient to doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign patient to doctor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/doctors/patients
 * 
 * Update a patient assignment
 * 
 * Request body:
 * - id: Patient assignment ID
 * - isPrimaryDoctor: Whether this doctor is the primary doctor for the patient
 * - status: Assignment status (ACTIVE, INACTIVE, TRANSFERRED, COMPLETED)
 * - notes: Additional notes
 * - lastAppointment: Date of last appointment
 * - nextAppointment: Date of next appointment
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
      isPrimaryDoctor,
      status,
      notes,
      lastAppointment,
      nextAppointment
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Patient assignment ID is required' },
        { status: 400 }
      );
    }
    
    // Find the patient assignment
    const patientAssignment = await prisma.patientAssignment.findUnique({
      where: { id },
      include: {
        doctor: true,
        patient: true
      }
    });
    
    if (!patientAssignment) {
      return NextResponse.json(
        { success: false, error: 'Patient assignment not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update patient assignments
    if (patientAssignment.doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.update') && !hasPermission(session, 'patients.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // If this is a primary doctor assignment, update any existing primary doctor assignments
    if (isPrimaryDoctor && !patientAssignment.isPrimaryDoctor) {
      await prisma.patientAssignment.updateMany({
        where: {
          patientId: patientAssignment.patientId,
          isPrimaryDoctor: true
        },
        data: {
          isPrimaryDoctor: false
        }
      });
    }
    
    // Update the patient assignment
    const updatedAssignment = await prisma.patientAssignment.update({
      where: { id },
      data: {
        isPrimaryDoctor: isPrimaryDoctor !== undefined ? isPrimaryDoctor : undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        lastAppointment: lastAppointment ? new Date(lastAppointment) : undefined,
        nextAppointment: nextAppointment ? new Date(nextAppointment) : undefined
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            patientId: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true
          }
        }
      }
    });
    
    // If status is changed to INACTIVE, TRANSFERRED, or COMPLETED, decrement the doctor's total patients count
    if (status && ['INACTIVE', 'TRANSFERRED', 'COMPLETED'].includes(status) && patientAssignment.status === 'ACTIVE') {
      await prisma.doctor.update({
        where: { id: patientAssignment.doctorId },
        data: {
          totalPatients: {
            decrement: 1
          }
        }
      });
    }
    
    // If status is changed to ACTIVE from another status, increment the doctor's total patients count
    if (status === 'ACTIVE' && ['INACTIVE', 'TRANSFERRED', 'COMPLETED'].includes(patientAssignment.status)) {
      await prisma.doctor.update({
        where: { id: patientAssignment.doctorId },
        data: {
          totalPatients: {
            increment: 1
          }
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { patientAssignment: updatedAssignment }
    });
  } catch (error) {
    console.error('Error updating patient assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update patient assignment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doctors/patients
 * 
 * Remove a patient assignment
 * 
 * Request body:
 * - id: Patient assignment ID
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Patient assignment ID is required' },
        { status: 400 }
      );
    }
    
    // Find the patient assignment
    const patientAssignment = await prisma.patientAssignment.findUnique({
      where: { id }
    });
    
    if (!patientAssignment) {
      return NextResponse.json(
        { success: false, error: 'Patient assignment not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete patient assignments
    if (patientAssignment.doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.delete') && !hasPermission(session, 'patients.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if there are any upcoming appointments for this patient with this doctor
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        patientId: patientAssignment.patientId,
        doctorId: patientAssignment.doctorId,
        startTime: {
          gte: new Date()
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    });
    
    if (upcomingAppointments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot remove patient assignment with upcoming appointments',
          data: { appointments: upcomingAppointments }
        },
        { status: 409 }
      );
    }
    
    // Delete the patient assignment
    await prisma.patientAssignment.delete({
      where: { id }
    });
    
    // If the assignment was active, decrement the doctor's total patients count
    if (patientAssignment.status === 'ACTIVE') {
      await prisma.doctor.update({
        where: { id: patientAssignment.doctorId },
        data: {
          totalPatients: {
            decrement: 1
          }
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { message: 'Patient assignment removed successfully' }
    });
  } catch (error) {
    console.error('Error removing patient assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove patient assignment' },
      { status: 500 }
    );
  }
}
