import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET handler - Get ledger entries for an account
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const financialYearId = searchParams.get('financialYearId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }
    
    // Check if account exists
    const account = await prisma.chartOfAccount.findUnique({
      where: { id: accountId },
    });
    
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Build filter conditions for journal entries
    const where: any = {
      status: 'POSTED',
      journalItems: {
        some: {
          accountId,
        },
      },
    };
    
    if (financialYearId) {
      where.financialYearId = financialYearId;
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
    
    // Get financial year details if provided
    let financialYear = null;
    if (financialYearId) {
      financialYear = await prisma.financialYear.findUnique({
        where: { id: financialYearId },
      });
      
      if (!financialYear) {
        return NextResponse.json({ error: 'Financial year not found' }, { status: 404 });
      }
    }
    
    // Calculate opening balance
    let openingBalance = account.openingBalance;
    
    // If financial year is provided, adjust opening balance based on transactions before the start date
    if (financialYear) {
      const previousTransactions = await prisma.journalEntryItem.findMany({
        where: {
          accountId,
          journalEntry: {
            status: 'POSTED',
            entryDate: {
              lt: financialYear.startDate,
            },
          },
        },
        select: {
          debitAmount: true,
          creditAmount: true,
          journalEntry: {
            select: {
              entryDate: true,
            },
          },
        },
      });
      
      // Calculate balance change based on account type
      for (const item of previousTransactions) {
        if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
          // Debits increase, credits decrease
          openingBalance += item.debitAmount - item.creditAmount;
        } else {
          // Credits increase, debits decrease for LIABILITY, EQUITY, REVENUE
          openingBalance += item.creditAmount - item.debitAmount;
        }
      }
    }
    
    // Get journal entries for the account within the specified period
    const [journalEntries, totalCount] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          journalItems: {
            where: {
              accountId,
            },
          },
        },
        orderBy: {
          entryDate: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ]);
    
    // Format ledger entries
    const ledgerEntries = [];
    let runningBalance = openingBalance;
    
    // Add opening balance entry if it's the first page
    if (page === 1) {
      ledgerEntries.push({
        date: financialYear ? financialYear.startDate : null,
        entryNumber: 'Opening Balance',
        description: 'Opening Balance',
        debit: 0,
        credit: 0,
        balance: openingBalance,
        isOpeningBalance: true,
      });
    } else {
      // Calculate running balance up to the current page
      const previousEntries = await prisma.journalEntry.findMany({
        where,
        include: {
          journalItems: {
            where: {
              accountId,
            },
          },
        },
        orderBy: {
          entryDate: 'asc',
        },
        take: skip,
      });
      
      for (const entry of previousEntries) {
        for (const item of entry.journalItems) {
          if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
            // Debits increase, credits decrease
            runningBalance += item.debitAmount - item.creditAmount;
          } else {
            // Credits increase, debits decrease for LIABILITY, EQUITY, REVENUE
            runningBalance += item.creditAmount - item.debitAmount;
          }
        }
      }
    }
    
    // Add journal entries
    for (const entry of journalEntries) {
      for (const item of entry.journalItems) {
        // Update running balance based on account type
        if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
          // Debits increase, credits decrease
          runningBalance += item.debitAmount - item.creditAmount;
        } else {
          // Credits increase, debits decrease for LIABILITY, EQUITY, REVENUE
          runningBalance += item.creditAmount - item.debitAmount;
        }
        
        ledgerEntries.push({
          id: entry.id,
          date: entry.entryDate,
          entryNumber: entry.entryNumber,
          reference: entry.reference,
          referenceType: entry.referenceType,
          description: item.description || entry.description,
          debit: item.debitAmount,
          credit: item.creditAmount,
          balance: runningBalance,
          isOpeningBalance: false,
        });
      }
    }
    
    // Calculate totals
    const totalDebits = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);
    
    return NextResponse.json({
      account: {
        id: account.id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        currentBalance: account.currentBalance,
      },
      financialYear: financialYear ? {
        id: financialYear.id,
        yearName: financialYear.yearName,
        startDate: financialYear.startDate,
        endDate: financialYear.endDate,
        status: financialYear.status,
      } : null,
      openingBalance,
      closingBalance: runningBalance,
      totalDebits,
      totalCredits,
      entries: ledgerEntries,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    return NextResponse.json({ error: 'Failed to fetch ledger entries' }, { status: 500 });
  }
}

// POST handler - Generate trial balance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { financialYearId, asOfDate } = body;
    
    if (!financialYearId) {
      return NextResponse.json({ error: 'Financial year ID is required' }, { status: 400 });
    }
    
    // Check if financial year exists
    const financialYear = await prisma.financialYear.findUnique({
      where: { id: financialYearId },
    });
    
    if (!financialYear) {
      return NextResponse.json({ error: 'Financial year not found' }, { status: 404 });
    }
    
    // Determine the cutoff date
    const cutoffDate = asOfDate ? new Date(asOfDate) : new Date();
    
    // Ensure cutoff date is within financial year
    if (cutoffDate < financialYear.startDate || cutoffDate > financialYear.endDate) {
      return NextResponse.json(
        { error: 'Cutoff date must be within the financial year' },
        { status: 400 }
      );
    }
    
    // Get all active accounts
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { accountType: 'asc' },
        { accountCode: 'asc' },
      ],
    });
    
    // Get all journal entry items for the financial year up to the cutoff date
    const journalItems = await prisma.journalEntryItem.findMany({
      where: {
        journalEntry: {
          financialYearId,
          status: 'POSTED',
          entryDate: {
            lte: cutoffDate,
          },
        },
      },
      include: {
        account: true,
      },
    });
    
    // Calculate balances for each account
    const trialBalanceEntries = accounts.map(account => {
      // Get items for this account
      const accountItems = journalItems.filter(item => item.accountId === account.id);
      
      // Calculate total debits and credits
      const totalDebits = accountItems.reduce((sum, item) => sum + item.debitAmount, 0);
      const totalCredits = accountItems.reduce((sum, item) => sum + item.creditAmount, 0);
      
      // Calculate balance based on account type
      let balance = account.openingBalance;
      
      if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
        // Debits increase, credits decrease
        balance += totalDebits - totalCredits;
      } else {
        // Credits increase, debits decrease for LIABILITY, EQUITY, REVENUE
        balance += totalCredits - totalDebits;
      }
      
      // Determine debit and credit columns for trial balance
      let debitBalance = 0;
      let creditBalance = 0;
      
      if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
        if (balance > 0) {
          debitBalance = balance;
        } else {
          creditBalance = Math.abs(balance);
        }
      } else {
        if (balance > 0) {
          creditBalance = balance;
        } else {
          debitBalance = Math.abs(balance);
        }
      }
      
      return {
        id: account.id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        openingBalance: account.openingBalance,
        totalDebits,
        totalCredits,
        balance,
        debitBalance,
        creditBalance,
      };
    });
    
    // Filter out accounts with zero balance if requested
    const filteredEntries = body.excludeZeroBalances
      ? trialBalanceEntries.filter(entry => entry.balance !== 0)
      : trialBalanceEntries;
    
    // Calculate totals
    const totalDebitBalance = filteredEntries.reduce((sum, entry) => sum + entry.debitBalance, 0);
    const totalCreditBalance = filteredEntries.reduce((sum, entry) => sum + entry.creditBalance, 0);
    
    // Group by account type if requested
    let groupedEntries = filteredEntries;
    if (body.groupByAccountType) {
      const groupedByType: Record<string, any> = {};
      
      // Group entries by account type
      filteredEntries.forEach(entry => {
        if (!groupedByType[entry.accountType]) {
          groupedByType[entry.accountType] = {
            accountType: entry.accountType,
            entries: [],
            totalDebitBalance: 0,
            totalCreditBalance: 0,
          };
        }
        
        groupedByType[entry.accountType].entries.push(entry);
        groupedByType[entry.accountType].totalDebitBalance += entry.debitBalance;
        groupedByType[entry.accountType].totalCreditBalance += entry.creditBalance;
      });
      
      // Convert to array
      groupedEntries = Object.values(groupedByType);
    }
    
    return NextResponse.json({
      financialYear: {
        id: financialYear.id,
        yearName: financialYear.yearName,
        startDate: financialYear.startDate,
        endDate: financialYear.endDate,
      },
      asOfDate: cutoffDate,
      entries: body.groupByAccountType ? groupedEntries : filteredEntries,
      totalDebitBalance,
      totalCreditBalance,
      isBalanced: Math.abs(totalDebitBalance - totalCreditBalance) < 0.01, // Allow for small rounding differences
    });
    
  } catch (error) {
    console.error('Error generating trial balance:', error);
    return NextResponse.json({ error: 'Failed to generate trial balance' }, { status: 500 });
  }
}
