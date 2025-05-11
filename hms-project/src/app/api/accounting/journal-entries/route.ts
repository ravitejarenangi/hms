import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new journal entry
const createJournalEntrySchema = z.object({
  entryDate: z.string().transform(str => new Date(str)),
  financialYearId: z.string(),
  reference: z.string().optional(),
  referenceType: z.string().optional(),
  description: z.string(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.string().optional(),
  nextRecurringDate: z.string().transform(str => new Date(str)).optional(),
  journalItems: z.array(
    z.object({
      accountId: z.string(),
      description: z.string().optional(),
      debitAmount: z.number().default(0),
      creditAmount: z.number().default(0),
    })
  ).refine(items => {
    // Ensure at least one debit and one credit entry
    const hasDebit = items.some(item => item.debitAmount > 0);
    const hasCredit = items.some(item => item.creditAmount > 0);
    return hasDebit && hasCredit;
  }, {
    message: 'Journal entry must have at least one debit and one credit entry',
  }).refine(items => {
    // Ensure total debits equal total credits
    const totalDebits = items.reduce((sum, item) => sum + item.debitAmount, 0);
    const totalCredits = items.reduce((sum, item) => sum + item.creditAmount, 0);
    return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small rounding differences
  }, {
    message: 'Total debits must equal total credits',
  }),
});

// Schema for updating a journal entry
const updateJournalEntrySchema = z.object({
  id: z.string(),
  entryDate: z.string().transform(str => new Date(str)).optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.string().optional(),
  nextRecurringDate: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['DRAFT', 'POSTED', 'REVERSED']).optional(),
  journalItems: z.array(
    z.object({
      id: z.string().optional(), // Existing item ID
      accountId: z.string(),
      description: z.string().optional(),
      debitAmount: z.number().default(0),
      creditAmount: z.number().default(0),
    })
  ).optional().refine(items => {
    if (!items) return true;
    // Ensure at least one debit and one credit entry
    const hasDebit = items.some(item => item.debitAmount > 0);
    const hasCredit = items.some(item => item.creditAmount > 0);
    return hasDebit && hasCredit;
  }, {
    message: 'Journal entry must have at least one debit and one credit entry',
  }).refine(items => {
    if (!items) return true;
    // Ensure total debits equal total credits
    const totalDebits = items.reduce((sum, item) => sum + item.debitAmount, 0);
    const totalCredits = items.reduce((sum, item) => sum + item.creditAmount, 0);
    return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small rounding differences
  }, {
    message: 'Total debits must equal total credits',
  }),
});

// Generate journal entry number
async function generateJournalEntryNumber() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  // Get the count of journal entries for the current month
  const entryCount = await prisma.journalEntry.count({
    where: {
      entryDate: {
        gte: new Date(`${year}-${month}-01`),
        lt: new Date(month === '12' ? `${year + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`),
      },
    },
  });
  
  // Format: JE-YYYYMM-XXXX (e.g., JE-202305-0001)
  return `JE-${year}${month}-${String(entryCount + 1).padStart(4, '0')}`;
}

// GET handler - Get all journal entries or a specific journal entry
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const financialYearId = searchParams.get('financialYearId');
    const status = searchParams.get('status');
    const reference = searchParams.get('reference');
    const referenceType = searchParams.get('referenceType');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const accountId = searchParams.get('accountId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    if (id) {
      where.id = id;
    }
    
    if (financialYearId) {
      where.financialYearId = financialYearId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (reference) {
      where.reference = reference;
    }
    
    if (referenceType) {
      where.referenceType = referenceType;
    }
    
    if (fromDate && toDate) {
      where.entryDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    } else if (fromDate) {
      where.entryDate = {
        gte: new Date(fromDate),
      };
    } else if (toDate) {
      where.entryDate = {
        lte: new Date(toDate),
      };
    }
    
    if (accountId) {
      where.journalItems = {
        some: {
          accountId,
        },
      };
    }
    
    // If an ID is provided, return a specific journal entry with its items
    if (id) {
      const journalEntry = await prisma.journalEntry.findUnique({
        where: { id },
        include: {
          financialYear: true,
          journalItems: {
            include: {
              account: {
                select: {
                  id: true,
                  accountCode: true,
                  accountName: true,
                  accountType: true,
                },
              },
            },
          },
        },
      });
      
      if (!journalEntry) {
        return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
      }
      
      return NextResponse.json(journalEntry);
    }
    
    // Otherwise, return a paginated list of journal entries
    const [journalEntries, totalCount] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          financialYear: {
            select: {
              id: true,
              yearName: true,
            },
          },
          journalItems: {
            select: {
              id: true,
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
        orderBy: {
          entryDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ]);
    
    return NextResponse.json({
      data: journalEntries,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

// POST handler - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createJournalEntrySchema.parse(body);
    
    // Check if financial year exists and is active
    const financialYear = await prisma.financialYear.findUnique({
      where: { id: validatedData.financialYearId },
    });
    
    if (!financialYear) {
      return NextResponse.json({ error: 'Financial year not found' }, { status: 404 });
    }
    
    if (financialYear.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot create journal entries in a closed financial year' },
        { status: 400 }
      );
    }
    
    // Check if entry date is within financial year
    const entryDate = validatedData.entryDate;
    if (entryDate < financialYear.startDate || entryDate > financialYear.endDate) {
      return NextResponse.json(
        { error: 'Entry date must be within the financial year' },
        { status: 400 }
      );
    }
    
    // Check if all accounts exist and are active
    const accountIds = validatedData.journalItems.map(item => item.accountId);
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        id: {
          in: accountIds,
        },
      },
    });
    
    if (accounts.length !== accountIds.length) {
      return NextResponse.json({ error: 'One or more accounts not found' }, { status: 404 });
    }
    
    const inactiveAccounts = accounts.filter(account => !account.isActive);
    if (inactiveAccounts.length > 0) {
      return NextResponse.json(
        { error: `The following accounts are inactive: ${inactiveAccounts.map(a => a.accountName).join(', ')}` },
        { status: 400 }
      );
    }
    
    // Calculate total debit and credit amounts
    const totalDebit = validatedData.journalItems.reduce((sum, item) => sum + item.debitAmount, 0);
    const totalCredit = validatedData.journalItems.reduce((sum, item) => sum + item.creditAmount, 0);
    
    // Generate journal entry number
    const entryNumber = await generateJournalEntryNumber();
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Create the journal entry with its items
      const journalEntry = await prisma.journalEntry.create({
        data: {
          entryNumber,
          entryDate: validatedData.entryDate,
          financialYearId: validatedData.financialYearId,
          reference: validatedData.reference,
          referenceType: validatedData.referenceType,
          description: validatedData.description,
          totalDebit,
          totalCredit,
          status: 'DRAFT',
          isRecurring: validatedData.isRecurring,
          recurringInterval: validatedData.recurringInterval,
          nextRecurringDate: validatedData.nextRecurringDate,
          createdBy: session.user.id,
          journalItems: {
            create: validatedData.journalItems.map(item => ({
              accountId: item.accountId,
              description: item.description,
              debitAmount: item.debitAmount,
              creditAmount: item.creditAmount,
            })),
          },
        },
        include: {
          journalItems: {
            include: {
              account: {
                select: {
                  id: true,
                  accountCode: true,
                  accountName: true,
                  accountType: true,
                },
              },
            },
          },
        },
      });
      
      return journalEntry;
    });
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error creating journal entry:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}

// PATCH handler - Update a journal entry
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateJournalEntrySchema.parse(body);
    
    // Check if journal entry exists
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id: validatedData.id },
      include: {
        financialYear: true,
        journalItems: true,
      },
    });
    
    if (!existingEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }
    
    // Check if journal entry is in a state that can be updated
    if (existingEntry.status === 'REVERSED') {
      return NextResponse.json(
        { error: 'Cannot update a reversed journal entry' },
        { status: 400 }
      );
    }
    
    // If status is being updated to POSTED, update account balances
    if (validatedData.status === 'POSTED' && existingEntry.status === 'DRAFT') {
      // Start a transaction to ensure data consistency
      const result = await prisma.$transaction(async (prisma) => {
        // Update account balances
        for (const item of existingEntry.journalItems) {
          const account = await prisma.chartOfAccount.findUnique({
            where: { id: item.accountId },
          });
          
          if (!account) {
            throw new Error(`Account with ID ${item.accountId} not found`);
          }
          
          // Calculate new balance based on account type
          let balanceChange = 0;
          
          if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
            // Debits increase, credits decrease
            balanceChange = item.debitAmount - item.creditAmount;
          } else {
            // Credits increase, debits decrease for LIABILITY, EQUITY, REVENUE
            balanceChange = item.creditAmount - item.debitAmount;
          }
          
          // Update account balance
          await prisma.chartOfAccount.update({
            where: { id: item.accountId },
            data: {
              currentBalance: {
                increment: balanceChange,
              },
            },
          });
        }
        
        // Update journal entry status
        const updatedEntry = await prisma.journalEntry.update({
          where: { id: validatedData.id },
          data: {
            status: 'POSTED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
          include: {
            journalItems: {
              include: {
                account: {
                  select: {
                    id: true,
                    accountCode: true,
                    accountName: true,
                    accountType: true,
                  },
                },
              },
            },
          },
        });
        
        return updatedEntry;
      });
      
      return NextResponse.json(result);
    }
    
    // If journal items are being updated, validate them
    if (validatedData.journalItems && existingEntry.status === 'DRAFT') {
      // Check if all accounts exist and are active
      const accountIds = validatedData.journalItems.map(item => item.accountId);
      const accounts = await prisma.chartOfAccount.findMany({
        where: {
          id: {
            in: accountIds,
          },
        },
      });
      
      if (accounts.length !== accountIds.length) {
        return NextResponse.json({ error: 'One or more accounts not found' }, { status: 404 });
      }
      
      const inactiveAccounts = accounts.filter(account => !account.isActive);
      if (inactiveAccounts.length > 0) {
        return NextResponse.json(
          { error: `The following accounts are inactive: ${inactiveAccounts.map(a => a.accountName).join(', ')}` },
          { status: 400 }
        );
      }
      
      // Calculate total debit and credit amounts
      const totalDebit = validatedData.journalItems.reduce((sum, item) => sum + item.debitAmount, 0);
      const totalCredit = validatedData.journalItems.reduce((sum, item) => sum + item.creditAmount, 0);
      
      // Start a transaction to ensure data consistency
      const result = await prisma.$transaction(async (prisma) => {
        // Delete existing journal items
        await prisma.journalEntryItem.deleteMany({
          where: { journalEntryId: validatedData.id },
        });
        
        // Create new journal items
        await prisma.journalEntryItem.createMany({
          data: validatedData.journalItems.map(item => ({
            journalEntryId: validatedData.id,
            accountId: item.accountId,
            description: item.description,
            debitAmount: item.debitAmount,
            creditAmount: item.creditAmount,
          })),
        });
        
        // Update journal entry
        const updatedEntry = await prisma.journalEntry.update({
          where: { id: validatedData.id },
          data: {
            entryDate: validatedData.entryDate,
            description: validatedData.description,
            totalDebit,
            totalCredit,
            isRecurring: validatedData.isRecurring,
            recurringInterval: validatedData.recurringInterval,
            nextRecurringDate: validatedData.nextRecurringDate,
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
          include: {
            journalItems: {
              include: {
                account: {
                  select: {
                    id: true,
                    accountCode: true,
                    accountName: true,
                    accountType: true,
                  },
                },
              },
            },
          },
        });
        
        return updatedEntry;
      });
      
      return NextResponse.json(result);
    }
    
    // If only basic details are being updated
    const updatedEntry = await prisma.journalEntry.update({
      where: { id: validatedData.id },
      data: {
        entryDate: validatedData.entryDate,
        description: validatedData.description,
        isRecurring: validatedData.isRecurring,
        recurringInterval: validatedData.recurringInterval,
        nextRecurringDate: validatedData.nextRecurringDate,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        journalItems: {
          include: {
            account: {
              select: {
                id: true,
                accountCode: true,
                accountName: true,
                accountType: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json(updatedEntry);
    
  } catch (error) {
    console.error('Error updating journal entry:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 });
  }
}

// DELETE handler - Reverse a journal entry (not actually deleting it)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason');
    
    if (!id) {
      return NextResponse.json({ error: 'Journal entry ID is required' }, { status: 400 });
    }
    
    if (!reason) {
      return NextResponse.json({ error: 'Reason for reversal is required' }, { status: 400 });
    }
    
    // Check if journal entry exists
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        financialYear: true,
        journalItems: {
          include: {
            account: true,
          },
        },
      },
    });
    
    if (!existingEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }
    
    // Check if journal entry is in a state that can be reversed
    if (existingEntry.status !== 'POSTED') {
      return NextResponse.json(
        { error: `Cannot reverse a journal entry with status ${existingEntry.status}` },
        { status: 400 }
      );
    }
    
    // Check if financial year is active
    if (existingEntry.financialYear.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot reverse a journal entry in a closed financial year' },
        { status: 400 }
      );
    }
    
    // Generate reversal entry number
    const reversalEntryNumber = await generateJournalEntryNumber();
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Create reversal journal entry
      const reversalEntry = await prisma.journalEntry.create({
        data: {
          entryNumber: reversalEntryNumber,
          entryDate: new Date(),
          financialYearId: existingEntry.financialYearId,
          reference: existingEntry.entryNumber,
          referenceType: 'REVERSAL',
          description: `Reversal of ${existingEntry.entryNumber}: ${reason}`,
          totalDebit: existingEntry.totalCredit,
          totalCredit: existingEntry.totalDebit,
          status: 'POSTED',
          createdBy: session.user.id,
          approvedBy: session.user.id,
          approvedAt: new Date(),
          journalItems: {
            create: existingEntry.journalItems.map(item => ({
              accountId: item.accountId,
              description: `Reversal of ${existingEntry.entryNumber}: ${item.description || ''}`,
              debitAmount: item.creditAmount,
              creditAmount: item.debitAmount,
            })),
          },
        },
      });
      
      // Update original journal entry
      const updatedEntry = await prisma.journalEntry.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversedBy: session.user.id,
          reversedAt: new Date(),
          reversalEntryId: reversalEntry.id,
        },
      });
      
      // Update account balances
      for (const item of existingEntry.journalItems) {
        // Calculate balance change based on account type
        let balanceChange = 0;
        
        if (['ASSET', 'EXPENSE'].includes(item.account.accountType)) {
          // Reverse the original entry (credits increase, debits decrease)
          balanceChange = item.creditAmount - item.debitAmount;
        } else {
          // Reverse the original entry (debits increase, credits decrease)
          balanceChange = item.debitAmount - item.creditAmount;
        }
        
        // Update account balance
        await prisma.chartOfAccount.update({
          where: { id: item.accountId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        });
      }
      
      return { originalEntry: updatedEntry, reversalEntry };
    });
    
    return NextResponse.json({
      message: 'Journal entry reversed successfully',
      data: result,
    });
    
  } catch (error) {
    console.error('Error reversing journal entry:', error);
    return NextResponse.json({ error: 'Failed to reverse journal entry' }, { status: 500 });
  }
}
