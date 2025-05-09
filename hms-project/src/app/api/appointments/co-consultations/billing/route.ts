import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/appointments/co-consultations/billing
 * 
 * Fetch billing information for a co-consultation appointment
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
    if (!hasPermission(session, 'billing.view')) {
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
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            insuranceProvider: true,
            insurancePolicyNumber: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            consultationFee: true
          }
        },
        coConsultingDoctors: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                consultationFee: true
              }
            }
          }
        },
        appointmentType: true,
        billingItems: {
          include: {
            doctor: true
          }
        }
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
    
    // Calculate total billing amount
    const primaryDoctorFee = appointment.doctor.consultationFee || 0;
    const coConsultingDoctorsFees = appointment.coConsultingDoctors.reduce(
      (total, doc) => total + (doc.doctor.consultationFee || 0),
      0
    );
    
    // Calculate additional service fees from billing items
    const additionalServicesFees = appointment.billingItems.reduce(
      (total, item) => total + item.amount,
      0
    );
    
    const totalAmount = primaryDoctorFee + coConsultingDoctorsFees + additionalServicesFees;
    
    // Prepare billing breakdown
    const billingBreakdown = [
      {
        doctorId: appointment.doctor.id,
        doctorName: appointment.doctor.name,
        specialization: appointment.doctor.specialization,
        role: 'Primary Doctor',
        fee: primaryDoctorFee
      },
      ...appointment.coConsultingDoctors.map((doc) => ({
        doctorId: doc.doctor.id,
        doctorName: doc.doctor.name,
        specialization: doc.doctor.specialization,
        role: 'Co-Consulting Doctor',
        fee: doc.doctor.consultationFee || 0
      }))
    ];
    
    // Add additional services to the breakdown
    const servicesBreakdown = appointment.billingItems.map((item) => ({
      id: item.id,
      description: item.description,
      amount: item.amount,
      doctorId: item.doctorId,
      doctorName: item.doctor?.name || 'N/A'
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        patientName: appointment.patient.name,
        appointmentType: appointment.appointmentType.name,
        appointmentDate: appointment.startTime,
        primaryDoctorFee,
        coConsultingDoctorsFees,
        additionalServicesFees,
        totalAmount,
        billingBreakdown,
        servicesBreakdown,
        insuranceProvider: appointment.patient.insuranceProvider,
        insurancePolicyNumber: appointment.patient.insurancePolicyNumber
      }
    });
  } catch (error) {
    console.error('Error fetching co-consultation billing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch co-consultation billing' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments/co-consultations/billing
 * 
 * Add a billing item to a co-consultation appointment
 * 
 * Request body:
 * - appointmentId: Appointment ID
 * - doctorId: Doctor ID who provided the service
 * - description: Description of the service
 * - amount: Amount to charge
 * - insuranceCode: Insurance code for the service (optional)
 * - notes: Additional notes (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'billing.create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    
    const {
      appointmentId,
      doctorId,
      description,
      amount,
      insuranceCode,
      notes
    } = body;
    
    // Validate required fields
    if (!appointmentId || !doctorId || !description || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if appointment exists and is a co-consultation
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        coConsultingDoctors: true
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
    
    // Check if the doctor is involved in the co-consultation
    const isDoctorInvolved = appointment.doctorId === doctorId || 
      appointment.coConsultingDoctors.some((doc) => doc.doctorId === doctorId);
    
    if (!isDoctorInvolved) {
      return NextResponse.json(
        { success: false, error: 'Doctor is not involved in this co-consultation' },
        { status: 400 }
      );
    }
    
    // Create the billing item
    const billingItem = await prisma.billingItem.create({
      data: {
        appointmentId,
        doctorId,
        description,
        amount,
        insuranceCode,
        notes,
        createdBy: session.user.id
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { billingItem }
    });
  } catch (error) {
    console.error('Error adding co-consultation billing item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add co-consultation billing item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/co-consultations/billing
 * 
 * Delete a billing item from a co-consultation appointment
 * 
 * Request body:
 * - billingItemId: Billing item ID to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    if (!hasPermission(session, 'billing.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    const { billingItemId } = body;
    
    if (!billingItemId) {
      return NextResponse.json(
        { success: false, error: 'Billing item ID is required' },
        { status: 400 }
      );
    }
    
    // Find the billing item
    const billingItem = await prisma.billingItem.findUnique({
      where: { id: billingItemId },
      include: {
        appointment: true
      }
    });
    
    if (!billingItem) {
      return NextResponse.json(
        { success: false, error: 'Billing item not found' },
        { status: 404 }
      );
    }
    
    // Check if the user created the billing item or has admin permissions
    const userCreatedItem = billingItem.createdBy === session.user.id;
    const userIsAdmin = hasPermission(session, 'billing.admin');
    
    if (!userCreatedItem && !userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this billing item' },
        { status: 403 }
      );
    }
    
    // Delete the billing item
    await prisma.billingItem.delete({
      where: { id: billingItemId }
    });
    
    return NextResponse.json({
      success: true,
      data: { message: 'Billing item deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting co-consultation billing item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete co-consultation billing item' },
      { status: 500 }
    );
  }
}
