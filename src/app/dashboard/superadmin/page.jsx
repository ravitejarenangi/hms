'use client';

import React from 'react';
import HospitalMetrics from '@/components/hospital/HospitalMetrics';
import PatientAdmissionChart from '@/components/hospital/charts/PatientAdmissionChart';
import RevenueExpensesChart from '@/components/hospital/charts/RevenueExpensesChart';
import BedAvailabilityChart from '@/components/hospital/charts/BedAvailabilityChart';
import PatientCareOutcomeChart from '@/components/hospital/charts/PatientCareOutcomeChart';
import DepartmentPatientFlowChart from '@/components/hospital/charts/DepartmentPatientFlowChart';
import StaffAvailabilityHeatmap from '@/components/hospital/charts/StaffAvailabilityHeatmap';
import InventoryStockChart from '@/components/hospital/charts/InventoryStockChart';
import BillingPaymentChart from '@/components/hospital/charts/BillingPaymentChart';
import EmployeeRolesChart from '@/components/hospital/charts/EmployeeRolesChart';
import EmployeeDepartmentsChart from '@/components/hospital/charts/EmployeeDepartmentsChart';
import DepartmentIncomeWidget from '@/components/hospital/widgets/DepartmentIncomeWidget';

const SuperadminDashboard = () => {
  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Hospital Management Dashboard</h1>
        
        {/* Hospital Metrics */}
        <HospitalMetrics />
        
        <div className="row gy-4 mt-1">
          {/* Patient Admissions and Discharge Rate - Bar Chart */}
          <div className="col-xxl-6 col-xl-12">
            <PatientAdmissionChart />
          </div>
          
          {/* Revenue and Expenses Comparison - Donut Chart */}
          <div className="col-xxl-6 col-xl-12">
            <RevenueExpensesChart />
          </div>
          
          {/* Bed Availability and Occupied Beds - Gauge Chart */}
          <div className="col-xxl-6 col-xl-12">
            <BedAvailabilityChart />
          </div>
          
          {/* Patient Care and Treatment Outcome - Line Chart */}
          <div className="col-xxl-6 col-xl-12">
            <PatientCareOutcomeChart />
          </div>
          
          {/* Department-wise Patient Flow and Waiting Time - Stacked Bar Chart */}
          <div className="col-xxl-6 col-xl-12">
            <DepartmentPatientFlowChart />
          </div>
          
          {/* Doctor and Nurse Availability - Heat Map */}
          <div className="col-xxl-6 col-xl-12">
            <StaffAvailabilityHeatmap />
          </div>
          
          {/* Inventory and Stock Levels - Line Chart */}
          <div className="col-xxl-6 col-xl-12">
            <InventoryStockChart />
          </div>
          
          {/* Billing and Payment Status - Bar Chart */}
          <div className="col-xxl-6 col-xl-12">
            <BillingPaymentChart />
          </div>
          
          {/* Employee Roles Distribution - Pie Chart */}
          <div className="col-xxl-6 col-xl-12">
            <EmployeeRolesChart />
          </div>
          
          {/* Employee Departments Distribution - Donut Chart */}
          <div className="col-xxl-6 col-xl-12">
            <EmployeeDepartmentsChart />
          </div>
          
          {/* Monthly Income Overview by Department - Metrics Widget */}
          <div className="col-12">
            <DepartmentIncomeWidget />
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperadminDashboard;
