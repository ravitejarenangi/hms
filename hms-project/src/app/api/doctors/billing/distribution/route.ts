import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/doctors/billing/distribution
 * Get billing distribution for a co-consultation
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
    // Get the co-consultation with billing distribution
    const coConsultation = await prisma.doctorCoConsultation.findUnique({
      where: { id: coConsultationId },
      include: {
        billingDistribution: true,
        primaryDoctor: {
          select: {
            id: true,
            consultationFee: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        secondaryDoctor: {
          select: {
            id: true,
            consultationFee: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!coConsultation) {
      return NextResponse.json({ error: 'Co-consultation not found' }, { status: 404 });
    }
    
    // Check if user is one of the doctors involved in the co-consultation or admin
    const userId = session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { userId }
    });
    
    if (!doctor && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    const isDoctorInvolved = doctor && (
      coConsultation.primaryDoctorId === doctor.id || 
      coConsultation.secondaryDoctorId === doctor.id
    );
    
    if (!isDoctorInvolved && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // If no billing distribution exists, create a default one (50/50)
    if (!coConsultation.billingDistribution) {
      // Calculate total fee
      const primaryFee = coConsultation.primaryDoctor?.consultationFee || 0;
      const secondaryFee = coConsultation.secondaryDoctor?.consultationFee || 0;
      const totalFee = Number(primaryFee) + Number(secondaryFee);
      
      // Create default distribution (50/50)
      const defaultDistribution = {
        primaryDoctorPercentage: 50,
        secondaryDoctorPercentage: 50,
        primaryDoctorAmount: totalFee * 0.5,
        secondaryDoctorAmount: totalFee * 0.5,
        totalAmount: totalFee,
        isCustom: false
      };
      
      return NextResponse.json({
        success: true,
        data: { 
          billingDistribution: defaultDistribution,
          primaryDoctor: coConsultation.primaryDoctor,
          secondaryDoctor: coConsultation.secondaryDoctor
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { 
        billingDistribution: coConsultation.billingDistribution,
        primaryDoctor: coConsultation.primaryDoctor,
        secondaryDoctor: coConsultation.secondaryDoctor
      }
    });
    
  } catch (error) {
    console.error('Error fetching billing distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/doctors/billing/distribution
 * Create or update billing distribution for a co-consultation
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { 
      coConsultationId, 
      primaryDoctorPercentage, 
      secondaryDoctorPercentage,
      isCustom = true
    } = await req.json();
    
    if (!coConsultationId) {
      return NextResponse.json({ 
        error: 'Co-consultation ID is required' 
      }, { status: 400 });
    }
    
    // Validate percentages
    if (primaryDoctorPercentage + secondaryDoctorPercentage !== 100) {
      return NextResponse.json({ 
        error: 'Percentages must add up to 100%' 
      }, { status: 400 });
    }
    
    // Get the co-consultation
    const coConsultation = await prisma.doctorCoConsultation.findUnique({
      where: { id: coConsultationId },
      include: {
        primaryDoctor: true,
        secondaryDoctor: true,
        billingDistribution: true
      }
    });
    
    if (!coConsultation) {
      return NextResponse.json({ error: 'Co-consultation not found' }, { status: 404 });
    }
    
    // Check if user is one of the doctors involved in the co-consultation or admin
    const userId = session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { userId }
    });
    
    // Only admin or primary doctor can set the billing distribution
    const isPrimaryDoctor = doctor && coConsultation.primaryDoctorId === doctor.id;
    
    if (!isPrimaryDoctor && !session.user.isAdmin) {
      return NextResponse.json({ 
        error: 'Only the primary doctor or admin can set billing distribution' 
      }, { status: 403 });
    }
    
    // Calculate amounts
    const primaryFee = coConsultation.primaryDoctor?.consultationFee || 0;
    const secondaryFee = coConsultation.secondaryDoctor?.consultationFee || 0;
    const totalAmount = Number(primaryFee) + Number(secondaryFee);
    
    const primaryDoctorAmount = (totalAmount * primaryDoctorPercentage) / 100;
    const secondaryDoctorAmount = (totalAmount * secondaryDoctorPercentage) / 100;
    
    // Create or update billing distribution
    let billingDistribution;
    
    if (coConsultation.billingDistribution) {
      // Update existing distribution
      billingDistribution = await prisma.doctorBillingDistribution.update({
        where: { id: coConsultation.billingDistribution.id },
        data: {
          primaryDoctorPercentage,
          secondaryDoctorPercentage,
          primaryDoctorAmount,
          secondaryDoctorAmount,
          totalAmount,
          isCustom
        }
      });
    } else {
      // Create new distribution
      billingDistribution = await prisma.doctorBillingDistribution.create({
        data: {
          coConsultationId,
          primaryDoctorPercentage,
          secondaryDoctorPercentage,
          primaryDoctorAmount,
          secondaryDoctorAmount,
          totalAmount,
          isCustom
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { billingDistribution }
    });
    
  } catch (error) {
    console.error('Error creating/updating billing distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
