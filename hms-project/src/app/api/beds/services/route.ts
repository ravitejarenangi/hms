import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Fetch all room service requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const requestType = searchParams.get('requestType');
    const roomId = searchParams.get('roomId');
    const patientId = searchParams.get('patientId');
    const priority = searchParams.get('priority');

    // Build the query filters
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (requestType) {
      filters.requestType = requestType;
    }
    
    if (roomId) {
      filters.roomId = roomId;
    }
    
    if (patientId) {
      filters.patientId = patientId;
    }
    
    if (priority) {
      filters.priority = priority;
    }

    // Fetch service requests with filters
    const serviceRequests = await prisma.roomServiceRequest.findMany({
      where: filters,
      include: {
        room: true
      },
      orderBy: [
        {
          priority: 'desc'
        },
        {
          requestedAt: 'desc'
        }
      ]
    });

    // Fetch patient details for each service request if patientId exists
    const requestsWithDetails = await Promise.all(
      serviceRequests.map(async (request) => {
        let patient = null;
        if (request.patientId) {
          patient = await prisma.patient.findUnique({
            where: { id: request.patientId },
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              },
              mrn: true
            }
          });
        }

        // Fetch staff details for requestedBy, assignedTo, and completedBy
        const requestedByUser = await prisma.user.findUnique({
          where: { id: request.requestedBy },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });

        let assignedToUser = null;
        if (request.assignedTo) {
          assignedToUser = await prisma.user.findUnique({
            where: { id: request.assignedTo },
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          });
        }

        let completedByUser = null;
        if (request.completedBy) {
          completedByUser = await prisma.user.findUnique({
            where: { id: request.completedBy },
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          });
        }

        return {
          ...request,
          patient: patient ? {
            id: patient.id,
            name: patient.user.name,
            email: patient.user.email,
            mrn: patient.mrn
          } : null,
          requestedByUser: requestedByUser || null,
          assignedToUser: assignedToUser || null,
          completedByUser: completedByUser || null,
          room: {
            ...request.room,
            roomNumber: request.room.roomNumber,
            floor: request.room.floor,
            wing: request.room.wing,
            roomType: request.room.roomType
          }
        };
      })
    );

    return NextResponse.json(requestsWithDetails);
  } catch (error) {
    console.error('Error fetching room service requests:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new room service request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { 
      roomId, 
      patientId, 
      requestType, 
      requestDetails, 
      priority,
      notes 
    } = data;

    // Validate required fields
    if (!roomId || !requestType || !requestDetails) {
      return NextResponse.json(
        { error: 'Room ID, Request Type, and Request Details are required' },
        { status: 400 }
      );
    }

    // Check if the room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if the patient exists if patientId is provided
    if (patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }
    }

    // Create the service request
    const serviceRequest = await prisma.roomServiceRequest.create({
      data: {
        roomId,
        patientId,
        requestType,
        requestDetails,
        priority: priority || 'NORMAL',
        requestedBy: session.user.id,
        notes,
        status: 'PENDING'
      },
      include: {
        room: true
      }
    });

    // Fetch patient details if patientId exists
    let patient = null;
    if (patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true
            }
          },
          mrn: true
        }
      });
    }

    // Fetch requestedBy user details
    const requestedByUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // Return the service request with details
    return NextResponse.json({
      ...serviceRequest,
      patient: patient ? {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        mrn: patient.mrn
      } : null,
      requestedByUser: requestedByUser || null,
      assignedToUser: null,
      completedByUser: null,
      room: {
        ...serviceRequest.room,
        roomNumber: serviceRequest.room.roomNumber,
        floor: serviceRequest.room.floor,
        wing: serviceRequest.room.wing,
        roomType: serviceRequest.room.roomType
      }
    });
  } catch (error) {
    console.error('Error creating room service request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT: Update a room service request (assign, complete, cancel)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { 
      id, 
      status, 
      assignedTo, 
      feedback, 
      feedbackRating,
      notes 
    } = data;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Service Request ID is required' },
        { status: 400 }
      );
    }

    // Check if the service request exists
    const serviceRequest = await prisma.roomServiceRequest.findUnique({
      where: { id },
      include: {
        room: true
      }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service Request not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      notes: notes || serviceRequest.notes
    };

    // Update status if provided
    if (status) {
      // Validate status transition
      const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED' },
          { status: 400 }
        );
      }
      
      updateData.status = status;
      
      // If status is COMPLETED, set completedAt and completedBy
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedBy = session.user.id;
      }
    }

    // Update assignedTo if provided
    if (assignedTo) {
      // Check if the assigned user exists
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedTo }
      });

      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 404 }
        );
      }
      
      updateData.assignedTo = assignedTo;
      updateData.assignedAt = new Date();
      
      // If status is not already updated, set it to ASSIGNED
      if (!status) {
        updateData.status = 'ASSIGNED';
      }
    }

    // Update feedback if provided
    if (feedback) {
      updateData.feedback = feedback;
    }

    // Update feedback rating if provided
    if (feedbackRating !== undefined) {
      // Validate rating
      if (feedbackRating < 1 || feedbackRating > 5) {
        return NextResponse.json(
          { error: 'Feedback rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      
      updateData.feedbackRating = feedbackRating;
    }

    // Update the service request
    const updatedRequest = await prisma.roomServiceRequest.update({
      where: { id },
      data: updateData,
      include: {
        room: true
      }
    });

    // Fetch patient details if patientId exists
    let patient = null;
    if (updatedRequest.patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: updatedRequest.patientId },
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true
            }
          },
          mrn: true
        }
      });
    }

    // Fetch staff details
    const requestedByUser = await prisma.user.findUnique({
      where: { id: updatedRequest.requestedBy },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    let assignedToUser = null;
    if (updatedRequest.assignedTo) {
      assignedToUser = await prisma.user.findUnique({
        where: { id: updatedRequest.assignedTo },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
    }

    let completedByUser = null;
    if (updatedRequest.completedBy) {
      completedByUser = await prisma.user.findUnique({
        where: { id: updatedRequest.completedBy },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
    }

    // Return the updated service request with details
    return NextResponse.json({
      ...updatedRequest,
      patient: patient ? {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        mrn: patient.mrn
      } : null,
      requestedByUser: requestedByUser || null,
      assignedToUser: assignedToUser || null,
      completedByUser: completedByUser || null,
      room: {
        ...updatedRequest.room,
        roomNumber: updatedRequest.room.roomNumber,
        floor: updatedRequest.room.floor,
        wing: updatedRequest.room.wing,
        roomType: updatedRequest.room.roomType
      }
    });
  } catch (error) {
    console.error('Error updating room service request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
