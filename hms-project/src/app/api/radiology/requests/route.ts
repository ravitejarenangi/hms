import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET handler for fetching radiology requests
 * @param req - The request object
 * @returns A response with the list of radiology requests
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const patientId = url.searchParams.get('patientId') || '';
    const doctorId = url.searchParams.get('doctorId') || '';
    const status = url.searchParams.get('status') || '';
    const priority = url.searchParams.get('priority') || '';
    const modalityType = url.searchParams.get('modalityType') || '';
    const fromDate = url.searchParams.get('fromDate') || '';
    const toDate = url.searchParams.get('toDate') || '';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (doctorId) {
      where.doctorId = doctorId;
    }
    
    if (status) {
      // Handle multiple statuses (comma-separated)
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (modalityType) {
      where.serviceCatalog = {
        modalityType
      };
    }
    
    if (fromDate && toDate) {
      where.requestedAt = {
        gte: new Date(fromDate),
        lte: new Date(toDate)
      };
    } else if (fromDate) {
      where.requestedAt = {
        gte: new Date(fromDate)
      };
    } else if (toDate) {
      where.requestedAt = {
        lte: new Date(toDate)
      };
    }
    
    // Fetch requests with pagination and include related data
    const [requests, totalCount] = await Promise.all([
      prisma.radiologyRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          serviceCatalog: true,
          radiologyStudy: {
            include: {
              report: true
            }
          }
        }
      }),
      prisma.radiologyRequest.count({ where })
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching radiology requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch radiology requests' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new radiology request
 * @param req - The request object
 * @returns A response with the created radiology request
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['patientId', 'doctorId', 'serviceCatalogId', 'reasonForExam'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    });
    
    if (!patient) {
      return NextResponse.json(
        { error: `Patient with ID ${data.patientId} not found` },
        { status: 404 }
      );
    }
    
    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId }
    });
    
    if (!doctor) {
      return NextResponse.json(
        { error: `Doctor with ID ${data.doctorId} not found` },
        { status: 404 }
      );
    }
    
    // Check if service exists
    const service = await prisma.radiologyServiceCatalog.findUnique({
      where: { id: data.serviceCatalogId }
    });
    
    if (!service) {
      return NextResponse.json(
        { error: `Service with ID ${data.serviceCatalogId} not found` },
        { status: 404 }
      );
    }
    
    // Create new request
    const newRequest = await prisma.radiologyRequest.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        serviceCatalogId: data.serviceCatalogId,
        reasonForExam: data.reasonForExam,
        clinicalInfo: data.clinicalInfo,
        allergies: data.allergies,
        previousExams: data.previousExams,
        notes: data.notes,
        isPregnant: data.isPregnant,
        weight: data.weight,
        height: data.height,
        priority: data.priority || 'ROUTINE',
        status: 'REQUESTED',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null
      }
    });
    
    return NextResponse.json(newRequest, { status: 201 });
    
  } catch (error) {
    console.error('Error creating radiology request:', error);
    return NextResponse.json(
      { error: 'Failed to create radiology request' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating an existing radiology request
 * @param req - The request object
 * @returns A response with the updated radiology request
 */
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    // Check if request exists
    const existingRequest = await prisma.radiologyRequest.findUnique({
      where: { id: data.id }
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: `Request with ID ${data.id} not found` },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Only allow updating specific fields
    if (data.serviceCatalogId) updateData.serviceCatalogId = data.serviceCatalogId;
    if (data.reasonForExam) updateData.reasonForExam = data.reasonForExam;
    if (data.clinicalInfo !== undefined) updateData.clinicalInfo = data.clinicalInfo;
    if (data.allergies !== undefined) updateData.allergies = data.allergies;
    if (data.previousExams !== undefined) updateData.previousExams = data.previousExams;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isPregnant !== undefined) updateData.isPregnant = data.isPregnant;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    
    // Update request
    const updatedRequest = await prisma.radiologyRequest.update({
      where: { id: data.id },
      data: updateData
    });
    
    return NextResponse.json(updatedRequest);
    
  } catch (error) {
    console.error('Error updating radiology request:', error);
    return NextResponse.json(
      { error: 'Failed to update radiology request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating the status of a radiology request
 * @param req - The request object
 * @returns A response with the updated radiology request
 */
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.id || !data.status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }
    
    // Check if request exists
    const existingRequest = await prisma.radiologyRequest.findUnique({
      where: { id: data.id }
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: `Request with ID ${data.id} not found` },
        { status: 404 }
      );
    }
    
    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'REQUESTED': ['SCHEDULED', 'CANCELLED'],
      'SCHEDULED': ['CHECKED_IN', 'CANCELLED'],
      'CHECKED_IN': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': ['REPORTED', 'CANCELLED'],
      'REPORTED': ['VERIFIED', 'CANCELLED'],
      'VERIFIED': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': ['CANCELLED'],
      'CANCELLED': []
    };
    
    if (!validTransitions[existingRequest.status].includes(data.status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${existingRequest.status} to ${data.status}` },
        { status: 400 }
      );
    }
    
    // Update request status
    const updatedRequest = await prisma.radiologyRequest.update({
      where: { id: data.id },
      data: { status: data.status }
    });
    
    // If status is changed to COMPLETED, create a study record if it doesn't exist
    if (data.status === 'COMPLETED' && !existingRequest.radiologyStudy) {
      const accessionNumber = `RAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const studyInstanceUID = `1.2.840.10008.${Date.now()}.${Math.floor(Math.random() * 1000000)}`;
      
      await prisma.radiologyStudy.create({
        data: {
          requestId: data.id,
          studyInstanceUID,
          studyDate: new Date(),
          accessionNumber,
          performedBy: data.performedBy || 'SYSTEM',
          status: 'COMPLETED'
        }
      });
    }
    
    return NextResponse.json(updatedRequest);
    
  } catch (error) {
    console.error('Error updating radiology request status:', error);
    return NextResponse.json(
      { error: 'Failed to update radiology request status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for cancelling a radiology request
 * @param req - The request object
 * @returns A response indicating success or failure
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    // Check if request exists
    const existingRequest = await prisma.radiologyRequest.findUnique({
      where: { id }
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: `Request with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    // Check if request can be cancelled
    if (['COMPLETED', 'REPORTED', 'VERIFIED', 'DELIVERED'].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: `Cannot cancel a request with status ${existingRequest.status}` },
        { status: 400 }
      );
    }
    
    // Update request status to CANCELLED
    await prisma.radiologyRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    
    return NextResponse.json({
      message: 'Request cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling radiology request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel radiology request' },
      { status: 500 }
    );
  }
}
