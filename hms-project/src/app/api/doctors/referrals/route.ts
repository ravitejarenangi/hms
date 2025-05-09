import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/doctors/referrals
 * 
 * Fetch doctor referrals
 * 
 * Query parameters:
 * - doctorId: Doctor ID (optional, if not provided, will return referrals for the current doctor)
 * - type: Type of referrals to fetch (sent, received, all)
 * - status: Filter by status (PENDING, ACCEPTED, REJECTED, COMPLETED)
 * - startDate: Start date for filtering
 * - endDate: End date for filtering
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
    const doctorId = url.searchParams.get('doctorId') || session.user.doctorId;
    const type = url.searchParams.get('type') || 'all';
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to view referrals
    if (doctorId !== session.user.doctorId && !hasPermission(session, 'doctors.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Build filter conditions
    const where: any = {};
    
    if (type === 'sent') {
      where.referringDoctorId = doctorId;
    } else if (type === 'received') {
      where.receivingDoctorId = doctorId;
    } else {
      // All referrals (sent or received)
      where.OR = [
        { referringDoctorId: doctorId },
        { receivingDoctorId: doctorId }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate)
      };
    }
    
    // Get total count for pagination
    const totalCount = await prisma.doctorReferral.count({ where });
    
    // Fetch referrals
    const referrals = await prisma.doctorReferral.findMany({
      where,
      include: {
        referringDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        receivingDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientId: true,
            gender: true,
            dateOfBirth: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    return NextResponse.json({
      success: true,
      data: {
        referrals,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor referrals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctor referrals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctors/referrals
 * 
 * Create a new doctor referral
 * 
 * Request body:
 * - referringDoctorId: Referring doctor ID
 * - receivingDoctorId: Receiving doctor ID
 * - patientId: Patient ID
 * - reason: Reason for referral
 * - notes: Additional notes
 * - urgency: Urgency level (LOW, MEDIUM, HIGH)
 * - appointmentId: Related appointment ID (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const {
      referringDoctorId,
      receivingDoctorId,
      patientId,
      reason,
      notes,
      urgency = 'MEDIUM',
      appointmentId
    } = body;
    
    // Validate required fields
    if (!referringDoctorId || !receivingDoctorId || !patientId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to create referrals
    if (referringDoctorId !== session.user.doctorId && !hasPermission(session, 'doctors.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if referring doctor exists
    const referringDoctor = await prisma.doctor.findUnique({
      where: { id: referringDoctorId }
    });
    
    if (!referringDoctor) {
      return NextResponse.json({ success: false, error: 'Referring doctor not found' }, { status: 404 });
    }
    
    // Check if receiving doctor exists
    const receivingDoctor = await prisma.doctor.findUnique({
      where: { id: receivingDoctorId }
    });
    
    if (!receivingDoctor) {
      return NextResponse.json({ success: false, error: 'Receiving doctor not found' }, { status: 404 });
    }
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }
    
    // Check if appointment exists if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });
      
      if (!appointment) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
      }
    }
    
    // Create the referral
    const referral = await prisma.doctorReferral.create({
      data: {
        referringDoctorId,
        receivingDoctorId,
        patientId,
        reason,
        notes,
        urgency,
        appointmentId,
        status: 'PENDING',
        createdBy: session.user.id
      },
      include: {
        referringDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        receivingDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientId: true,
            gender: true,
            dateOfBirth: true
          }
        }
      }
    });
    
    // Update doctor's referral count
    await prisma.doctor.update({
      where: { id: referringDoctorId },
      data: {
        referralCount: {
          increment: 1
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { referral }
    });
  } catch (error) {
    console.error('Error creating doctor referral:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create doctor referral' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/doctors/referrals
 * 
 * Update a doctor referral
 * 
 * Request body:
 * - id: Referral ID
 * - status: New status (PENDING, ACCEPTED, REJECTED, COMPLETED)
 * - notes: Additional notes
 * - appointmentId: Related appointment ID (optional)
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
      status,
      notes,
      appointmentId
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Referral ID is required' },
        { status: 400 }
      );
    }
    
    // Find the referral
    const referral = await prisma.doctorReferral.findUnique({
      where: { id }
    });
    
    if (!referral) {
      return NextResponse.json(
        { success: false, error: 'Referral not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update referrals
    if (referral.receivingDoctorId !== session.user.doctorId && 
        referral.referringDoctorId !== session.user.doctorId && 
        !hasPermission(session, 'doctors.update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if appointment exists if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });
      
      if (!appointment) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
      }
    }
    
    // Update the referral
    const updatedReferral = await prisma.doctorReferral.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        appointmentId: appointmentId || undefined,
        updatedAt: new Date()
      },
      include: {
        referringDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        receivingDoctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            specialization: true,
            department: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientId: true,
            gender: true,
            dateOfBirth: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { referral: updatedReferral }
    });
  } catch (error) {
    console.error('Error updating doctor referral:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update doctor referral' },
      { status: 500 }
    );
  }
}
