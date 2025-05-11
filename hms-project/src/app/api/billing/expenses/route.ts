import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch all expenses or a specific one
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const departmentId = searchParams.get("departmentId");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (departmentId) whereClause.departmentId = departmentId;
    if (category) whereClause.category = category;
    if (startDate && endDate) {
      whereClause.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.expenseDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.expenseDate = {
        lte: new Date(endDate),
      };
    }

    if (id) {
      // Fetch specific expense
      const expense = await prisma.expense.findUnique({
        where: { id },
        include: {
          department: true,
          vendor: true,
          attachments: true,
          journalEntry: true,
        },
      });

      if (!expense) {
        return NextResponse.json(
          { error: "Expense not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(expense);
    } else {
      // Fetch all expenses with pagination
      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where: whereClause,
          include: {
            department: true,
            vendor: true,
          },
          skip,
          take: limit,
          orderBy: { expenseDate: "desc" },
        }),
        prisma.expense.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        data: expenses,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST: Create a new expense
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      expenseNumber,
      description,
      category,
      expenseDate,
      amount,
      taxAmount,
      totalAmount,
      departmentId,
      vendorId,
      paymentMethod,
      paymentStatus,
      paymentDate,
      receiptNumber,
      notes,
      attachments,
    } = data;

    // Validate required fields
    if (!description || !category || !expenseDate || !amount || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate expense number if not provided
    const finalExpenseNumber = expenseNumber || `EXP-${Date.now()}`;

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        expenseNumber: finalExpenseNumber,
        description,
        category,
        expenseDate: new Date(expenseDate),
        amount,
        taxAmount: taxAmount || 0,
        totalAmount,
        departmentId,
        vendorId,
        paymentMethod: paymentMethod || "CASH",
        paymentStatus: paymentStatus || "PENDING",
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        receiptNumber,
        notes,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create attachments if provided
    if (attachments && attachments.length > 0) {
      await prisma.expenseAttachment.createMany({
        data: attachments.map((attachment: any) => ({
          expenseId: expense.id,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          fileUrl: attachment.fileUrl,
          uploadedBy: session.user.id,
          uploadedAt: new Date(),
        })),
      });
    }

    // Create journal entry for the expense
    const chartOfAccounts = await prisma.chartOfAccount.findMany({
      where: {
        OR: [
          { accountName: { contains: "Expense" } },
          { accountName: { contains: "Cash" } },
          { accountName: { contains: "Bank" } },
        ],
      },
    });

    const expenseAccount = chartOfAccounts.find(
      (account) => account.accountName.includes("Expense")
    );
    const cashAccount = chartOfAccounts.find(
      (account) => account.accountName.includes("Cash")
    );

    if (expenseAccount && cashAccount) {
      const currentFinancialYear = await prisma.financialYear.findFirst({
        where: { isCurrent: true },
      });

      if (currentFinancialYear) {
        const journalEntry = await prisma.journalEntry.create({
          data: {
            entryNumber: `JE-EXP-${Date.now()}`,
            entryDate: new Date(),
            financialYearId: currentFinancialYear.id,
            reference: expense.id,
            referenceType: "EXPENSE",
            description: `Expense: ${description}`,
            totalDebit: totalAmount,
            totalCredit: totalAmount,
            status: "POSTED",
            createdBy: session.user.id,
            journalItems: {
              create: [
                {
                  accountId: expenseAccount.id,
                  description: `Expense: ${description}`,
                  debitAmount: totalAmount,
                  creditAmount: 0,
                  departmentId,
                },
                {
                  accountId: cashAccount.id,
                  description: `Payment for expense: ${description}`,
                  debitAmount: 0,
                  creditAmount: totalAmount,
                  departmentId,
                },
              ],
            },
          },
        });

        // Update expense with journal entry reference
        await prisma.expense.update({
          where: { id: expense.id },
          data: {
            journalEntryId: journalEntry.id,
          },
        });
      }
    }

    // Return the created expense with attachments
    const createdExpense = await prisma.expense.findUnique({
      where: { id: expense.id },
      include: {
        department: true,
        vendor: true,
        attachments: true,
        journalEntry: true,
      },
    });

    return NextResponse.json(createdExpense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

// PUT: Update an expense
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { id, attachments, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      );
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    // Handle attachments if provided
    if (attachments) {
      // Delete existing attachments
      await prisma.expenseAttachment.deleteMany({
        where: { expenseId: id },
      });

      // Create new attachments
      if (attachments.length > 0) {
        await prisma.expenseAttachment.createMany({
          data: attachments.map((attachment: any) => ({
            expenseId: id,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            fileUrl: attachment.fileUrl,
            uploadedBy: session.user.id,
            uploadedAt: new Date(),
          })),
        });
      }
    }

    // Return the updated expense with attachments
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        department: true,
        vendor: true,
        attachments: true,
        journalEntry: true,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an expense
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      );
    }

    // Get the expense to check if it has a journal entry
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { journalEntryId: true },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    // Delete journal entry if exists
    if (expense.journalEntryId) {
      await prisma.journalEntryItem.deleteMany({
        where: { journalEntryId: expense.journalEntryId },
      });

      await prisma.journalEntry.delete({
        where: { id: expense.journalEntryId },
      });
    }

    // Delete attachments
    await prisma.expenseAttachment.deleteMany({
      where: { expenseId: id },
    });

    // Delete expense
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
