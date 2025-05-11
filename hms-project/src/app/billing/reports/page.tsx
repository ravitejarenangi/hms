import React from 'react';
import FinancialReports from '@/components/billing/FinancialReports';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';

export const metadata = {
  title: 'Financial Reports | HMS',
  description: 'Financial reports in Hospital Management System',
};

export default async function FinancialReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/billing/reports');
  }
  
  if (!hasPermission(session, 'reports.view')) {
    redirect('/unauthorized');
  }
  
  return <FinancialReports />;
}
