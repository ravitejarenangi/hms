import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new service price
const createServicePriceSchema = z.object({
  serviceName: z.string(),
  serviceCode: z.string(),
  departmentId: z.string(),
  hsnSacCode: z.string(),
  basePrice: z.number().positive(),
  gstRateType: z.enum(['EXEMPT', 'ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTYEIGHT']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().transform(str => new Date(str)),
  effectiveTo: z.string().transform(str => new Date(str)).optional(),
});

// Schema for updating a service price
const updateServicePriceSchema = z.object({
  id: z.string(),
  serviceName: z.string().optional(),
  serviceCode: z.string().optional(),
  departmentId: z.string().optional(),
  hsnSacCode: z.string().optional(),
  basePrice: z.number().positive().optional(),
  gstRateType: z.enum(['EXEMPT', 'ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTYEIGHT']).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: z.string().transform(str => new Date(str)).optional(),
  effectiveTo: z.string().transform(str => new Date(str)).optional(),
});

// Schema for creating a new package price
const createPackagePriceSchema = z.object({
  packageName: z.string(),
  packageCode: z.string(),
  departmentId: z.string(),
  hsnSacCode: z.string(),
  basePrice: z.number().positive(),
  gstRateType: z.enum(['EXEMPT', 'ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTYEIGHT']),
  description: z.string(),
  duration: z.number().optional(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().transform(str => new Date(str)),
  effectiveTo: z.string().transform(str => new Date(str)).optional(),
  packageItems: z.array(
    z.object({
      serviceId: z.string(),
      quantity: z.number().positive(),
      discountPercentage: z.number().default(0),
    })
  ),
});

// Schema for updating a package price
const updatePackagePriceSchema = z.object({
  id: z.string(),
  packageName: z.string().optional(),
  packageCode: z.string().optional(),
  departmentId: z.string().optional(),
  hsnSacCode: z.string().optional(),
  basePrice: z.number().positive().optional(),
  gstRateType: z.enum(['EXEMPT', 'ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTYEIGHT']).optional(),
  description: z.string().optional(),
  duration: z.number().optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: z.string().transform(str => new Date(str)).optional(),
  effectiveTo: z.string().transform(str => new Date(str)).optional(),
  packageItems: z.array(
    z.object({
      id: z.string().optional(),
      serviceId: z.string(),
      quantity: z.number().positive(),
      discountPercentage: z.number().default(0),
    })
  ).optional(),
});

// GET handler - Get all price lists or a specific price list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type'); // 'service' or 'package'
    const departmentId = searchParams.get('departmentId');
    const isActive = searchParams.get('isActive');
    const searchQuery = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // If type is not specified, default to 'service'
    const priceListType = type === 'package' ? 'package' : 'service';
    
    // If an ID is provided, return a specific price list
    if (id) {
      if (priceListType === 'service') {
        const servicePrice = await prisma.servicePriceList.findUnique({
          where: { id },
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            hsnSacCode: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
          },
        });
        
        if (!servicePrice) {
          return NextResponse.json({ error: 'Service price not found' }, { status: 404 });
        }
        
        return NextResponse.json(servicePrice);
      } else {
        const packagePrice = await prisma.packagePriceList.findUnique({
          where: { id },
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            hsnSacCode: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
            packageItems: {
              include: {
                service: {
                  select: {
                    id: true,
                    serviceName: true,
                    serviceCode: true,
                    basePrice: true,
                  },
                },
              },
            },
          },
        });
        
        if (!packagePrice) {
          return NextResponse.json({ error: 'Package price not found' }, { status: 404 });
        }
        
        return NextResponse.json(packagePrice);
      }
    }
    
    // Build filter conditions
    const where: any = {};
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (searchQuery) {
      if (priceListType === 'service') {
        where.OR = [
          { serviceName: { contains: searchQuery, mode: 'insensitive' } },
          { serviceCode: { contains: searchQuery, mode: 'insensitive' } },
        ];
      } else {
        where.OR = [
          { packageName: { contains: searchQuery, mode: 'insensitive' } },
          { packageCode: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
    }
    
    // Return a paginated list of price lists
    if (priceListType === 'service') {
      const [servicePrices, totalCount] = await Promise.all([
        prisma.servicePriceList.findMany({
          where,
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            hsnSacCode: {
              select: {
                id: true,
                code: true,
              },
            },
          },
          orderBy: {
            serviceName: 'asc',
          },
          skip,
          take: limit,
        }),
        prisma.servicePriceList.count({ where }),
      ]);
      
      return NextResponse.json({
        data: servicePrices,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } else {
      const [packagePrices, totalCount] = await Promise.all([
        prisma.packagePriceList.findMany({
          where,
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            hsnSacCode: {
              select: {
                id: true,
                code: true,
              },
            },
            packageItems: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            packageName: 'asc',
          },
          skip,
          take: limit,
        }),
        prisma.packagePriceList.count({ where }),
      ]);
      
      // Add item count to each package
      const packagesWithItemCount = packagePrices.map(pkg => ({
        ...pkg,
        itemCount: pkg.packageItems.length,
      }));
      
      return NextResponse.json({
        data: packagesWithItemCount,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      });
    }
    
  } catch (error) {
    console.error('Error fetching price lists:', error);
    return NextResponse.json({ error: 'Failed to fetch price lists' }, { status: 500 });
  }
}

// POST handler - Create a new service or package price
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const type = body.type || 'service'; // Default to 'service' if not specified
    
    if (type === 'service') {
      // Validate request body for service price
      const validatedData = createServicePriceSchema.parse(body);
      
      // Check if service code already exists
      const existingService = await prisma.servicePriceList.findFirst({
        where: {
          serviceCode: validatedData.serviceCode,
        },
      });
      
      if (existingService) {
        return NextResponse.json(
          { error: `Service with code ${validatedData.serviceCode} already exists` },
          { status: 400 }
        );
      }
      
      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      });
      
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      }
      
      // Check if HSN/SAC code exists
      const hsnSacCode = await prisma.hSNSACCode.findFirst({
        where: { code: validatedData.hsnSacCode },
      });
      
      if (!hsnSacCode) {
        return NextResponse.json({ error: 'HSN/SAC code not found' }, { status: 404 });
      }
      
      // Create the service price
      const servicePrice = await prisma.servicePriceList.create({
        data: {
          serviceName: validatedData.serviceName,
          serviceCode: validatedData.serviceCode,
          departmentId: validatedData.departmentId,
          hsnSacCodeId: hsnSacCode.id,
          basePrice: validatedData.basePrice,
          gstRateType: validatedData.gstRateType,
          description: validatedData.description,
          isActive: validatedData.isActive,
          effectiveFrom: validatedData.effectiveFrom,
          effectiveTo: validatedData.effectiveTo,
          createdBy: session.user.id,
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          hsnSacCode: {
            select: {
              id: true,
              code: true,
              description: true,
            },
          },
        },
      });
      
      return NextResponse.json(servicePrice, { status: 201 });
    } else {
      // Validate request body for package price
      const validatedData = createPackagePriceSchema.parse(body);
      
      // Check if package code already exists
      const existingPackage = await prisma.packagePriceList.findFirst({
        where: {
          packageCode: validatedData.packageCode,
        },
      });
      
      if (existingPackage) {
        return NextResponse.json(
          { error: `Package with code ${validatedData.packageCode} already exists` },
          { status: 400 }
        );
      }
      
      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      });
      
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      }
      
      // Check if HSN/SAC code exists
      const hsnSacCode = await prisma.hSNSACCode.findFirst({
        where: { code: validatedData.hsnSacCode },
      });
      
      if (!hsnSacCode) {
        return NextResponse.json({ error: 'HSN/SAC code not found' }, { status: 404 });
      }
      
      // Check if all services exist
      const serviceIds = validatedData.packageItems.map(item => item.serviceId);
      const services = await prisma.servicePriceList.findMany({
        where: {
          id: {
            in: serviceIds,
          },
        },
      });
      
      if (services.length !== serviceIds.length) {
        return NextResponse.json({ error: 'One or more services not found' }, { status: 404 });
      }
      
      // Create the package price
      const packagePrice = await prisma.packagePriceList.create({
        data: {
          packageName: validatedData.packageName,
          packageCode: validatedData.packageCode,
          departmentId: validatedData.departmentId,
          hsnSacCodeId: hsnSacCode.id,
          basePrice: validatedData.basePrice,
          gstRateType: validatedData.gstRateType,
          description: validatedData.description,
          duration: validatedData.duration,
          isActive: validatedData.isActive,
          effectiveFrom: validatedData.effectiveFrom,
          effectiveTo: validatedData.effectiveTo,
          createdBy: session.user.id,
          packageItems: {
            create: validatedData.packageItems.map(item => ({
              serviceId: item.serviceId,
              quantity: item.quantity,
              discountPercentage: item.discountPercentage,
            })),
          },
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          hsnSacCode: {
            select: {
              id: true,
              code: true,
              description: true,
            },
          },
          packageItems: {
            include: {
              service: {
                select: {
                  id: true,
                  serviceName: true,
                  serviceCode: true,
                  basePrice: true,
                },
              },
            },
          },
        },
      });
      
      return NextResponse.json(packagePrice, { status: 201 });
    }
    
  } catch (error) {
    console.error('Error creating price list:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create price list' }, { status: 500 });
  }
}

// PATCH handler - Update a service or package price
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const type = body.type || 'service'; // Default to 'service' if not specified
    
    if (type === 'service') {
      // Validate request body for service price
      const validatedData = updateServicePriceSchema.parse(body);
      
      // Check if service exists
      const existingService = await prisma.servicePriceList.findUnique({
        where: { id: validatedData.id },
      });
      
      if (!existingService) {
        return NextResponse.json({ error: 'Service price not found' }, { status: 404 });
      }
      
      // Check if service code is unique if it's being updated
      if (validatedData.serviceCode && validatedData.serviceCode !== existingService.serviceCode) {
        const duplicateCode = await prisma.servicePriceList.findFirst({
          where: {
            serviceCode: validatedData.serviceCode,
            id: { not: validatedData.id },
          },
        });
        
        if (duplicateCode) {
          return NextResponse.json(
            { error: `Service with code ${validatedData.serviceCode} already exists` },
            { status: 400 }
          );
        }
      }
      
      // Check if department exists if it's being updated
      if (validatedData.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: validatedData.departmentId },
        });
        
        if (!department) {
          return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }
      }
      
      // Check if HSN/SAC code exists if it's being updated
      let hsnSacCodeId = existingService.hsnSacCodeId;
      if (validatedData.hsnSacCode) {
        const hsnSacCode = await prisma.hSNSACCode.findFirst({
          where: { code: validatedData.hsnSacCode },
        });
        
        if (!hsnSacCode) {
          return NextResponse.json({ error: 'HSN/SAC code not found' }, { status: 404 });
        }
        
        hsnSacCodeId = hsnSacCode.id;
      }
      
      // Update the service price
      const updatedServicePrice = await prisma.servicePriceList.update({
        where: { id: validatedData.id },
        data: {
          serviceName: validatedData.serviceName,
          serviceCode: validatedData.serviceCode,
          departmentId: validatedData.departmentId,
          hsnSacCodeId: hsnSacCodeId,
          basePrice: validatedData.basePrice,
          gstRateType: validatedData.gstRateType,
          description: validatedData.description,
          isActive: validatedData.isActive,
          effectiveFrom: validatedData.effectiveFrom,
          effectiveTo: validatedData.effectiveTo,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          hsnSacCode: {
            select: {
              id: true,
              code: true,
              description: true,
            },
          },
        },
      });
      
      return NextResponse.json(updatedServicePrice);
    } else {
      // Validate request body for package price
      const validatedData = updatePackagePriceSchema.parse(body);
      
      // Check if package exists
      const existingPackage = await prisma.packagePriceList.findUnique({
        where: { id: validatedData.id },
        include: {
          packageItems: true,
        },
      });
      
      if (!existingPackage) {
        return NextResponse.json({ error: 'Package price not found' }, { status: 404 });
      }
      
      // Check if package code is unique if it's being updated
      if (validatedData.packageCode && validatedData.packageCode !== existingPackage.packageCode) {
        const duplicateCode = await prisma.packagePriceList.findFirst({
          where: {
            packageCode: validatedData.packageCode,
            id: { not: validatedData.id },
          },
        });
        
        if (duplicateCode) {
          return NextResponse.json(
            { error: `Package with code ${validatedData.packageCode} already exists` },
            { status: 400 }
          );
        }
      }
      
      // Check if department exists if it's being updated
      if (validatedData.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: validatedData.departmentId },
        });
        
        if (!department) {
          return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }
      }
      
      // Check if HSN/SAC code exists if it's being updated
      let hsnSacCodeId = existingPackage.hsnSacCodeId;
      if (validatedData.hsnSacCode) {
        const hsnSacCode = await prisma.hSNSACCode.findFirst({
          where: { code: validatedData.hsnSacCode },
        });
        
        if (!hsnSacCode) {
          return NextResponse.json({ error: 'HSN/SAC code not found' }, { status: 404 });
        }
        
        hsnSacCodeId = hsnSacCode.id;
      }
      
      // Start a transaction to ensure data consistency
      const result = await prisma.$transaction(async (prisma) => {
        // Update the package price
        const updatedPackagePrice = await prisma.packagePriceList.update({
          where: { id: validatedData.id },
          data: {
            packageName: validatedData.packageName,
            packageCode: validatedData.packageCode,
            departmentId: validatedData.departmentId,
            hsnSacCodeId: hsnSacCodeId,
            basePrice: validatedData.basePrice,
            gstRateType: validatedData.gstRateType,
            description: validatedData.description,
            duration: validatedData.duration,
            isActive: validatedData.isActive,
            effectiveFrom: validatedData.effectiveFrom,
            effectiveTo: validatedData.effectiveTo,
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
        });
        
        // Update package items if provided
        if (validatedData.packageItems && validatedData.packageItems.length > 0) {
          // Delete existing package items
          await prisma.packageItem.deleteMany({
            where: { packageId: validatedData.id },
          });
          
          // Create new package items
          await prisma.packageItem.createMany({
            data: validatedData.packageItems.map(item => ({
              packageId: validatedData.id,
              serviceId: item.serviceId,
              quantity: item.quantity,
              discountPercentage: item.discountPercentage,
            })),
          });
        }
        
        // Return the updated package with its items
        return prisma.packagePriceList.findUnique({
          where: { id: validatedData.id },
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            hsnSacCode: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
            packageItems: {
              include: {
                service: {
                  select: {
                    id: true,
                    serviceName: true,
                    serviceCode: true,
                    basePrice: true,
                  },
                },
              },
            },
          },
        });
      });
      
      return NextResponse.json(result);
    }
    
  } catch (error) {
    console.error('Error updating price list:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update price list' }, { status: 500 });
  }
}

// DELETE handler - Deactivate a service or package price (not actually deleting it)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'service'; // Default to 'service' if not specified
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    if (type === 'service') {
      // Check if service exists
      const existingService = await prisma.servicePriceList.findUnique({
        where: { id },
      });
      
      if (!existingService) {
        return NextResponse.json({ error: 'Service price not found' }, { status: 404 });
      }
      
      // Deactivate the service price (not actually deleting it)
      const deactivatedService = await prisma.servicePriceList.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });
      
      return NextResponse.json({ message: 'Service price deactivated successfully', service: deactivatedService });
    } else {
      // Check if package exists
      const existingPackage = await prisma.packagePriceList.findUnique({
        where: { id },
      });
      
      if (!existingPackage) {
        return NextResponse.json({ error: 'Package price not found' }, { status: 404 });
      }
      
      // Deactivate the package price (not actually deleting it)
      const deactivatedPackage = await prisma.packagePriceList.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });
      
      return NextResponse.json({ message: 'Package price deactivated successfully', package: deactivatedPackage });
    }
    
  } catch (error) {
    console.error('Error deactivating price list:', error);
    return NextResponse.json({ error: 'Failed to deactivate price list' }, { status: 500 });
  }
}
