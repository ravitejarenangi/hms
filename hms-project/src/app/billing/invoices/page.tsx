import React from 'react';
import InvoiceList from '@/components/billing/InvoiceList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Invoices | HMS',
  description: 'Hospital Management System Invoices',
};

async function getInvoices(page = 1, limit = 10) {
  try {
    const [invoices, total] = await Promise.all([
      prisma.taxInvoice.findMany({
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              uhid: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMethod: true,
            },
          },
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.taxInvoice.count(),
    ]);
    
    return {
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0,
      },
    };
  }
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/billing/invoices');
  }
  
  if (!hasPermission(session, 'billing.view')) {
    redirect('/unauthorized');
  }
  
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 10;
  
  const invoices = await getInvoices(page, limit);
  
  return <InvoiceList initialData={invoices} />;
}
