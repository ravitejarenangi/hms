import React from 'react';
import InvoiceDetail from '@/components/billing/InvoiceDetail';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Invoice Details | HMS',
  description: 'View invoice details in Hospital Management System',
};

async function getInvoice(id: string) {
  try {
    const invoice = await prisma.taxInvoice.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            contactNumber: true,
            email: true,
            address: true,
          },
        },
        invoiceItems: true,
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });
    
    return invoice;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/auth/signin?callbackUrl=/billing/invoices/${params.id}`);
  }
  
  if (!hasPermission(session, 'billing.view')) {
    redirect('/unauthorized');
  }
  
  const invoice = await getInvoice(params.id);
  
  if (!invoice) {
    notFound();
  }
  
  return <InvoiceDetail invoice={invoice} />;
}
