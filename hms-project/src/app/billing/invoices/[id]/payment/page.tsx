import React from 'react';
import PaymentForm from '@/components/billing/PaymentForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Process Payment | HMS',
  description: 'Process payment for an invoice in Hospital Management System',
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

export default async function ProcessPaymentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/auth/signin?callbackUrl=/billing/invoices/${params.id}/payment`);
  }
  
  if (!hasPermission(session, 'billing.create')) {
    redirect('/unauthorized');
  }
  
  const invoice = await getInvoice(params.id);
  
  if (!invoice) {
    notFound();
  }
  
  // Check if invoice is cancelled or already paid
  if (invoice.status === 'CANCELLED' || invoice.balanceAmount <= 0) {
    redirect(`/billing/invoices/${params.id}`);
  }
  
  return <PaymentForm invoiceData={invoice} />;
}
