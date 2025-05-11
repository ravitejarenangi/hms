import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET handler for fetching radiology services
 * @param req - The request object
 * @returns A response with the list of radiology services
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const modalityType = url.searchParams.get('modalityType') || '';
    const bodyPart = url.searchParams.get('bodyPart') || '';
    const isActive = url.searchParams.get('isActive');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (modalityType) {
      where.modalityType = modalityType;
    }
    
    if (bodyPart) {
      where.bodyPart = { contains: bodyPart, mode: 'insensitive' };
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    // Fetch services with pagination
    const [services, totalCount] = await Promise.all([
      prisma.radiologyServiceCatalog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.radiologyServiceCatalog.count({ where })
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      services,
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
    console.error('Error fetching radiology services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch radiology services' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new radiology service
 * @param req - The request object
 * @returns A response with the created radiology service
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['code', 'name', 'modalityType', 'bodyPart', 'price', 'duration'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check if service with the same code already exists
    const existingService = await prisma.radiologyServiceCatalog.findUnique({
      where: { code: data.code }
    });
    
    if (existingService) {
      return NextResponse.json(
        { error: `Service with code ${data.code} already exists` },
        { status: 409 }
      );
    }
    
    // Create new service
    const newService = await prisma.radiologyServiceCatalog.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        modalityType: data.modalityType,
        bodyPart: data.bodyPart,
        price: data.price,
        preparationNotes: data.preparationNotes,
        duration: data.duration,
        isActive: data.isActive ?? true,
        requiresContrast: data.requiresContrast ?? false,
        dicomSupported: data.dicomSupported ?? true
      }
    });
    
    return NextResponse.json(newService, { status: 201 });
    
  } catch (error) {
    console.error('Error creating radiology service:', error);
    return NextResponse.json(
      { error: 'Failed to create radiology service' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating an existing radiology service
 * @param req - The request object
 * @returns A response with the updated radiology service
 */
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Check if service exists
    const existingService = await prisma.radiologyServiceCatalog.findUnique({
      where: { id: data.id }
    });
    
    if (!existingService) {
      return NextResponse.json(
        { error: `Service with ID ${data.id} not found` },
        { status: 404 }
      );
    }
    
    // If code is being changed, check if the new code already exists
    if (data.code && data.code !== existingService.code) {
      const serviceWithCode = await prisma.radiologyServiceCatalog.findUnique({
        where: { code: data.code }
      });
      
      if (serviceWithCode) {
        return NextResponse.json(
          { error: `Service with code ${data.code} already exists` },
          { status: 409 }
        );
      }
    }
    
    // Update service
    const updatedService = await prisma.radiologyServiceCatalog.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        modalityType: data.modalityType,
        bodyPart: data.bodyPart,
        price: data.price,
        preparationNotes: data.preparationNotes,
        duration: data.duration,
        isActive: data.isActive,
        requiresContrast: data.requiresContrast,
        dicomSupported: data.dicomSupported
      }
    });
    
    return NextResponse.json(updatedService);
    
  } catch (error) {
    console.error('Error updating radiology service:', error);
    return NextResponse.json(
      { error: 'Failed to update radiology service' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a radiology service
 * @param req - The request object
 * @returns A response indicating success or failure
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Check if service exists
    const existingService = await prisma.radiologyServiceCatalog.findUnique({
      where: { id }
    });
    
    if (!existingService) {
      return NextResponse.json(
        { error: `Service with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    // Check if service is in use by any requests
    const requestsUsingService = await prisma.radiologyRequest.count({
      where: { serviceCatalogId: id }
    });
    
    if (requestsUsingService > 0) {
      // Instead of deleting, mark as inactive
      await prisma.radiologyServiceCatalog.update({
        where: { id },
        data: { isActive: false }
      });
      
      return NextResponse.json({
        message: 'Service is in use and has been marked as inactive instead of deleted'
      });
    }
    
    // Delete service if not in use
    await prisma.radiologyServiceCatalog.delete({
      where: { id }
    });
    
    return NextResponse.json({
      message: 'Service deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting radiology service:', error);
    return NextResponse.json(
      { error: 'Failed to delete radiology service' },
      { status: 500 }
    );
  }
}
