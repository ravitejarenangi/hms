'use client';

import React from 'react';
import PatientDemographicsTable from '@/components/hospital/admin/PatientDemographicsTable';
import AdmissionsTable from '@/components/hospital/admin/AdmissionsTable';
import DischargesTable from '@/components/hospital/admin/DischargesTable';
import RevenueBreakdownTable from '@/components/hospital/admin/RevenueBreakdownTable';
import ExpensesBreakdownTable from '@/components/hospital/admin/ExpensesBreakdownTable';
import StaffAvailabilityHeatmap from '@/components/hospital/charts/StaffAvailabilityHeatmap';
import DepartmentPatientFlowChart from '@/components/hospital/charts/DepartmentPatientFlowChart';
import DepartmentIncomeWidget from '@/components/hospital/widgets/DepartmentIncomeWidget';
import AdminMetrics from '@/components/hospital/admin/AdminMetrics';

const AdminDashboard = () => {
  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Hospital Administration Dashboard</h1>
        
        {/* Admin Metrics */}
        <AdminMetrics />
        
        <div className="row gy-4 mt-1">
          {/* Total patients with demographics */}
          <div className="col-12">
            <PatientDemographicsTable />
          </div>
          
          {/* Total admissions with details */}
          <div className="col-12">
            <AdmissionsTable />
          </div>
          
          {/* Total discharges with details */}
          <div className="col-12">
            <DischargesTable />
          </div>
          
          {/* Total revenue with breakdown */}
          <div className="col-12">
            <RevenueBreakdownTable />
          </div>
          
          {/* Total expenses with breakdown */}
          <div className="col-12">
            <ExpensesBreakdownTable />
          </div>
          
          {/* Doctor and nurse availability and on-duty status */}
          <div className="col-xxl-6 col-xl-12">
            <StaffAvailabilityHeatmap />
          </div>
          
          {/* Department-wise patient flow and waiting time */}
          <div className="col-xxl-6 col-xl-12">
            <DepartmentPatientFlowChart />
          </div>
          
          {/* Monthly income overview by department */}
          <div className="col-12">
            <DepartmentIncomeWidget />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
