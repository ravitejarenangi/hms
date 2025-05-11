import React from 'react';
import BillingDashboard from '@/components/billing/BillingDashboard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';

export const metadata = {
  title: 'Billing Dashboard | HMS',
  description: 'Hospital Management System Billing Dashboard',
};

export default async function BillingDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/billing');
  }
  
  if (!hasPermission(session, 'billing.view')) {
    redirect('/unauthorized');
  }
  
  return <BillingDashboard />;
}
