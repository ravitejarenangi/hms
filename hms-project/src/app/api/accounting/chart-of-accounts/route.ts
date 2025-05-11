import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new account
const createAccountSchema = z.object({
  accountCode: z.string(),
  accountName: z.string(),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentAccountId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  departmentId: z.string().optional(),
  openingBalance: z.number().default(0),
});

// Schema for updating an account
const updateAccountSchema = z.object({
  id: z.string(),
  accountCode: z.string().optional(),
  accountName: z.string().optional(),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  parentAccountId: z.string().optional().nullable(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  departmentId: z.string().optional().nullable(),
  openingBalance: z.number().optional(),
});

// GET handler - Get all accounts or a specific account
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const accountType = searchParams.get('accountType');
    const parentId = searchParams.get('parentId');
    const isActive = searchParams.get('isActive');
    const departmentId = searchParams.get('departmentId');
    const searchQuery = searchParams.get('search');
    const hierarchical = searchParams.get('hierarchical') === 'true';
    
    // Build filter conditions
    const where: any = {};
    
    if (id) {
      where.id = id;
    }
    
    if (accountType) {
      where.accountType = accountType;
    }
    
    if (parentId) {
      where.parentAccountId = parentId;
    } else if (parentId === 'null' && !hierarchical) {
      where.parentAccountId = null;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (searchQuery) {
      where.OR = [
        { accountCode: { contains: searchQuery, mode: 'insensitive' } },
        { accountName: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
    
    // If an ID is provided, return a specific account with its children
    if (id) {
      const account = await prisma.chartOfAccount.findUnique({
        where: { id },
        include: {
          parentAccount: {
            select: {
              id: true,
              accountCode: true,
              accountName: true,
            },
          },
          childAccounts: {
            where: { isActive: true },
            select: {
              id: true,
              accountCode: true,
              accountName: true,
              accountType: true,
              currentBalance: true,
            },
            orderBy: { accountCode: 'asc' },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      
      return NextResponse.json(account);
    }
    
    // If hierarchical view is requested, return a tree structure
    if (hierarchical) {
      // Get all accounts
      const allAccounts = await prisma.chartOfAccount.findMany({
        where: {
          ...where,
          parentAccountId: null, // Start with root accounts
        },
        include: {
          childAccounts: {
            include: {
              childAccounts: {
                include: {
                  childAccounts: {
                    include: {
                      childAccounts: true, // Support up to 4 levels of nesting
                    },
                  },
                },
              },
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { accountCode: 'asc' },
      });
      
      return NextResponse.json(allAccounts);
    }
    
    // Otherwise, return a flat list of accounts
    const accounts = await prisma.chartOfAccount.findMany({
      where,
      include: {
        parentAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { childAccounts: true },
        },
      },
      orderBy: { accountCode: 'asc' },
    });
    
    return NextResponse.json(accounts);
    
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST handler - Create a new account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createAccountSchema.parse(body);
    
    // Check if account code already exists
    const existingAccount = await prisma.chartOfAccount.findFirst({
      where: {
        accountCode: validatedData.accountCode,
      },
    });
    
    if (existingAccount) {
      return NextResponse.json(
        { error: `Account with code ${validatedData.accountCode} already exists` },
        { status: 400 }
      );
    }
    
    // Check if parent account exists if provided
    if (validatedData.parentAccountId) {
      const parentAccount = await prisma.chartOfAccount.findUnique({
        where: { id: validatedData.parentAccountId },
      });
      
      if (!parentAccount) {
        return NextResponse.json({ error: 'Parent account not found' }, { status: 404 });
      }
      
      // Check if parent account type is compatible with child account type
      if (!isAccountTypeCompatible(parentAccount.accountType, validatedData.accountType)) {
        return NextResponse.json(
          { error: `Account type ${validatedData.accountType} is not compatible with parent account type ${parentAccount.accountType}` },
          { status: 400 }
        );
      }
    }
    
    // Check if department exists if provided
    if (validatedData.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      });
      
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      }
    }
    
    // Create the account
    const account = await prisma.chartOfAccount.create({
      data: {
        accountCode: validatedData.accountCode,
        accountName: validatedData.accountName,
        accountType: validatedData.accountType,
        parentAccountId: validatedData.parentAccountId,
        description: validatedData.description,
        isActive: validatedData.isActive,
        departmentId: validatedData.departmentId,
        openingBalance: validatedData.openingBalance,
        currentBalance: validatedData.openingBalance,
        createdBy: session.user.id,
      },
      include: {
        parentAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(account, { status: 201 });
    
  } catch (error) {
    console.error('Error creating account:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

// PATCH handler - Update an account
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateAccountSchema.parse(body);
    
    // Check if account exists
    const existingAccount = await prisma.chartOfAccount.findUnique({
      where: { id: validatedData.id },
      include: {
        childAccounts: true,
      },
    });
    
    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Check if account code is unique if it's being updated
    if (validatedData.accountCode && validatedData.accountCode !== existingAccount.accountCode) {
      const duplicateCode = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: validatedData.accountCode,
          id: { not: validatedData.id },
        },
      });
      
      if (duplicateCode) {
        return NextResponse.json(
          { error: `Account with code ${validatedData.accountCode} already exists` },
          { status: 400 }
        );
      }
    }
    
    // Check if parent account exists if provided
    if (validatedData.parentAccountId) {
      // Prevent circular references
      if (validatedData.parentAccountId === validatedData.id) {
        return NextResponse.json(
          { error: 'An account cannot be its own parent' },
          { status: 400 }
        );
      }
      
      // Check if the new parent is not one of the account's children
      const isChildAccount = await isAccountAChild(validatedData.id, validatedData.parentAccountId);
      if (isChildAccount) {
        return NextResponse.json(
          { error: 'Cannot set a child account as the parent' },
          { status: 400 }
        );
      }
      
      const parentAccount = await prisma.chartOfAccount.findUnique({
        where: { id: validatedData.parentAccountId },
      });
      
      if (!parentAccount) {
        return NextResponse.json({ error: 'Parent account not found' }, { status: 404 });
      }
      
      // Check if parent account type is compatible with child account type
      const accountType = validatedData.accountType || existingAccount.accountType;
      if (!isAccountTypeCompatible(parentAccount.accountType, accountType)) {
        return NextResponse.json(
          { error: `Account type ${accountType} is not compatible with parent account type ${parentAccount.accountType}` },
          { status: 400 }
        );
      }
    }
    
    // Check if department exists if provided
    if (validatedData.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      });
      
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      }
    }
    
    // Check if account type is compatible with child accounts if it's being updated
    if (validatedData.accountType && validatedData.accountType !== existingAccount.accountType && existingAccount.childAccounts.length > 0) {
      for (const childAccount of existingAccount.childAccounts) {
        if (!isAccountTypeCompatible(validatedData.accountType, childAccount.accountType)) {
          return NextResponse.json(
            { error: `Account type ${validatedData.accountType} is not compatible with child account type ${childAccount.accountType}` },
            { status: 400 }
          );
        }
      }
    }
    
    // Update the account
    const updatedAccount = await prisma.chartOfAccount.update({
      where: { id: validatedData.id },
      data: {
        accountCode: validatedData.accountCode,
        accountName: validatedData.accountName,
        accountType: validatedData.accountType,
        parentAccountId: validatedData.parentAccountId,
        description: validatedData.description,
        isActive: validatedData.isActive,
        departmentId: validatedData.departmentId,
        openingBalance: validatedData.openingBalance,
        currentBalance: validatedData.openingBalance !== undefined
          ? validatedData.openingBalance + (existingAccount.currentBalance - existingAccount.openingBalance)
          : undefined,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        parentAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedAccount);
    
  } catch (error) {
    console.error('Error updating account:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

// DELETE handler - Deactivate an account (not actually deleting it)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }
    
    // Check if account exists
    const existingAccount = await prisma.chartOfAccount.findUnique({
      where: { id },
      include: {
        childAccounts: true,
        journalEntryItems: {
          take: 1,
        },
      },
    });
    
    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Check if account has child accounts
    if (existingAccount.childAccounts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot deactivate an account with child accounts. Deactivate child accounts first.' },
        { status: 400 }
      );
    }
    
    // Check if account has journal entries
    if (existingAccount.journalEntryItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot deactivate an account with journal entries. Create a new account and transfer the balance.' },
        { status: 400 }
      );
    }
    
    // Deactivate the account (not actually deleting it)
    const deactivatedAccount = await prisma.chartOfAccount.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ message: 'Account deactivated successfully', account: deactivatedAccount });
    
  } catch (error) {
    console.error('Error deactivating account:', error);
    return NextResponse.json({ error: 'Failed to deactivate account' }, { status: 500 });
  }
}

// Helper function to check if account types are compatible
function isAccountTypeCompatible(parentType: string, childType: string): boolean {
  // Account types must match for parent-child relationship
  return parentType === childType;
}

// Helper function to check if an account is a child of another account
async function isAccountAChild(parentId: string, childId: string): Promise<boolean> {
  const childAccount = await prisma.chartOfAccount.findUnique({
    where: { id: childId },
    select: { childAccounts: { select: { id: true } } },
  });
  
  if (!childAccount) {
    return false;
  }
  
  // Check if the parent is one of the direct children
  if (childAccount.childAccounts.some(child => child.id === parentId)) {
    return true;
  }
  
  // Recursively check all children
  for (const child of childAccount.childAccounts) {
    const isChild = await isAccountAChild(parentId, child.id);
    if (isChild) {
      return true;
    }
  }
  
  return false;
}
