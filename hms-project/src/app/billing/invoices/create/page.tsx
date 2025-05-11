import React from 'react';
import InvoiceForm from '@/components/billing/InvoiceForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';

export const metadata = {
  title: 'Create Invoice | HMS',
  description: 'Create a new invoice in Hospital Management System',
};

export default async function CreateInvoicePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/billing/invoices/create');
  }
  
  if (!hasPermission(session, 'billing.create')) {
    redirect('/unauthorized');
  }
  
  return <InvoiceForm />;
}
