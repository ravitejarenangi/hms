import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new financial year
const createFinancialYearSchema = z.object({
  yearName: z.string(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  isCurrent: z.boolean().default(false),
});

// Schema for updating a financial year
const updateFinancialYearSchema = z.object({
  id: z.string(),
  yearName: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
  isCurrent: z.boolean().optional(),
});

// GET handler - Get all financial years or a specific financial year
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const current = searchParams.get('current');
    
    // Build filter conditions
    const where: any = {};
    
    if (id) {
      where.id = id;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (current === 'true') {
      where.isCurrent = true;
    }
    
    // If an ID is provided, return a specific financial year
    if (id) {
      const financialYear = await prisma.financialYear.findUnique({
        where: { id },
      });
      
      if (!financialYear) {
        return NextResponse.json({ error: 'Financial year not found' }, { status: 404 });
      }
      
      return NextResponse.json(financialYear);
    }
    
    // Otherwise, return all financial years
    const financialYears = await prisma.financialYear.findMany({
      where,
      orderBy: {
        startDate: 'desc',
      },
    });
    
    return NextResponse.json(financialYears);
    
  } catch (error) {
    console.error('Error fetching financial years:', error);
    return NextResponse.json({ error: 'Failed to fetch financial years' }, { status: 500 });
  }
}

// POST handler - Create a new financial year
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createFinancialYearSchema.parse(body);
    
    // Check if year name already exists
    const existingYear = await prisma.financialYear.findFirst({
      where: {
        yearName: validatedData.yearName,
      },
    });
    
    if (existingYear) {
      return NextResponse.json(
        { error: `Financial year with name ${validatedData.yearName} already exists` },
        { status: 400 }
      );
    }
    
    // Check if start date is before end date
    if (validatedData.startDate >= validatedData.endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }
    
    // Check for overlapping financial years
    const overlappingYear = await prisma.financialYear.findFirst({
      where: {
        OR: [
          {
            // New start date falls within an existing financial year
            startDate: { lte: validatedData.startDate },
            endDate: { gte: validatedData.startDate },
          },
          {
            // New end date falls within an existing financial year
            startDate: { lte: validatedData.endDate },
            endDate: { gte: validatedData.endDate },
          },
          {
            // New financial year completely encompasses an existing financial year
            startDate: { gte: validatedData.startDate },
            endDate: { lte: validatedData.endDate },
          },
        ],
      },
    });
    
    if (overlappingYear) {
      return NextResponse.json(
        { error: `New financial year overlaps with existing financial year ${overlappingYear.yearName}` },
        { status: 400 }
      );
    }
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // If this is set as the current financial year, unset any existing current financial year
      if (validatedData.isCurrent) {
        await prisma.financialYear.updateMany({
          where: {
            isCurrent: true,
          },
          data: {
            isCurrent: false,
          },
        });
      }
      
      // Create the financial year
      const financialYear = await prisma.financialYear.create({
        data: {
          yearName: validatedData.yearName,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          status: 'ACTIVE',
          isCurrent: validatedData.isCurrent,
          createdBy: session.user.id,
        },
      });
      
      return financialYear;
    });
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error creating financial year:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create financial year' }, { status: 500 });
  }
}

// PATCH handler - Update a financial year
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateFinancialYearSchema.parse(body);
    
    // Check if financial year exists
    const existingYear = await prisma.financialYear.findUnique({
      where: { id: validatedData.id },
    });
    
    if (!existingYear) {
      return NextResponse.json({ error: 'Financial year not found' }, { status: 404 });
    }
    
    // Check if year name is unique if it's being updated
    if (validatedData.yearName && validatedData.yearName !== existingYear.yearName) {
      const duplicateName = await prisma.financialYear.findFirst({
        where: {
          yearName: validatedData.yearName,
          id: { not: validatedData.id },
        },
      });
      
      if (duplicateName) {
        return NextResponse.json(
          { error: `Financial year with name ${validatedData.yearName} already exists` },
          { status: 400 }
        );
      }
    }
    
    // Check if start date is before end date if either is being updated
    const startDate = validatedData.startDate || existingYear.startDate;
    const endDate = validatedData.endDate || existingYear.endDate;
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }
    
    // Check for overlapping financial years if dates are being updated
    if (validatedData.startDate || validatedData.endDate) {
      const overlappingYear = await prisma.financialYear.findFirst({
        where: {
          id: { not: validatedData.id },
          OR: [
            {
              // Updated start date falls within another financial year
              startDate: { lte: startDate },
              endDate: { gte: startDate },
            },
            {
              // Updated end date falls within another financial year
              startDate: { lte: endDate },
              endDate: { gte: endDate },
            },
            {
              // Updated financial year completely encompasses another financial year
              startDate: { gte: startDate },
              endDate: { lte: endDate },
            },
          ],
        },
      });
      
      if (overlappingYear) {
        return NextResponse.json(
          { error: `Updated financial year overlaps with existing financial year ${overlappingYear.yearName}` },
          { status: 400 }
        );
      }
    }
    
    // Check if financial year can be closed
    if (validatedData.status === 'CLOSED' && existingYear.status === 'ACTIVE') {
      // Check if there are any draft journal entries in this financial year
      const draftEntries = await prisma.journalEntry.findFirst({
        where: {
          financialYearId: validatedData.id,
          status: 'DRAFT',
        },
      });
      
      if (draftEntries) {
        return NextResponse.json(
          { error: 'Cannot close financial year with draft journal entries' },
          { status: 400 }
        );
      }
    }
    
    // Check if a closed financial year is being reopened
    if (validatedData.status === 'ACTIVE' && existingYear.status === 'CLOSED') {
      // Check if there's a newer financial year that's already closed
      const newerClosedYear = await prisma.financialYear.findFirst({
        where: {
          startDate: { gt: existingYear.startDate },
          status: 'CLOSED',
        },
      });
      
      if (newerClosedYear) {
        return NextResponse.json(
          { error: 'Cannot reopen a financial year when a newer financial year is already closed' },
          { status: 400 }
        );
      }
    }
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // If this is set as the current financial year, unset any existing current financial year
      if (validatedData.isCurrent === true) {
        await prisma.financialYear.updateMany({
          where: {
            isCurrent: true,
            id: { not: validatedData.id },
          },
          data: {
            isCurrent: false,
          },
        });
      }
      
      // Update the financial year
      const updatedYear = await prisma.financialYear.update({
        where: { id: validatedData.id },
        data: {
          yearName: validatedData.yearName,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          status: validatedData.status,
          isCurrent: validatedData.isCurrent,
          closedBy: validatedData.status === 'CLOSED' ? session.user.id : existingYear.closedBy,
          closedAt: validatedData.status === 'CLOSED' ? new Date() : existingYear.closedAt,
        },
      });
      
      return updatedYear;
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error updating financial year:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update financial year' }, { status: 500 });
  }
}

// DELETE handler - Delete a financial year (only if it has no journal entries)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Financial year ID is required' }, { status: 400 });
    }
    
    // Check if financial year exists
    const existingYear = await prisma.financialYear.findUnique({
      where: { id },
      include: {
        journalEntries: {
          take: 1,
        },
      },
    });
    
    if (!existingYear) {
      return NextResponse.json({ error: 'Financial year not found' }, { status: 404 });
    }
    
    // Check if financial year has journal entries
    if (existingYear.journalEntries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a financial year with journal entries' },
        { status: 400 }
      );
    }
    
    // Delete the financial year
    await prisma.financialYear.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Financial year deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting financial year:', error);
    return NextResponse.json({ error: 'Failed to delete financial year' }, { status: 500 });
  }
}
