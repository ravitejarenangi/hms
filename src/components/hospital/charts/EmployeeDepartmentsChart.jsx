'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const EmployeeDepartmentsChart = () => {
  const [viewType, setViewType] = useState('All Departments');

  // Sample data for employee department distribution
  const departmentData = {
    'All Departments': [
      { name: 'Emergency', count: 85 },
      { name: 'Cardiology', count: 65 },
      { name: 'Orthopedics', count: 55 },
      { name: 'Pediatrics', count: 70 },
      { name: 'Neurology', count: 45 },
      { name: 'Gynecology', count: 50 },
      { name: 'Oncology', count: 40 },
      { name: 'General Medicine', count: 80 },
      { name: 'Radiology', count: 35 },
      { name: 'Laboratory', count: 45 },
      { name: 'Pharmacy', count: 30 },
      { name: 'Administration', count: 95 },
      { name: 'Housekeeping', count: 65 },
      { name: 'IT & Support', count: 40 }
    ],
    'Medical Departments': [
      { name: 'Emergency', count: 85 },
      { name: 'Cardiology', count: 65 },
      { name: 'Orthopedics', count: 55 },
      { name: 'Pediatrics', count: 70 },
      { name: 'Neurology', count: 45 },
      { name: 'Gynecology', count: 50 },
      { name: 'Oncology', count: 40 },
      { name: 'General Medicine', count: 80 },
      { name: 'Radiology', count: 35 }
    ],
    'Support Departments': [
      { name: 'Laboratory', count: 45 },
      { name: 'Pharmacy', count: 30 },
      { name: 'Administration', count: 95 },
      { name: 'Housekeeping', count: 65 },
      { name: 'IT & Support', count: 40 }
    ]
  };

  // Department growth data
  const departmentGrowth = {
    'Emergency': +5,
    'Cardiology': +3,
    'Orthopedics': +2,
    'Pediatrics': +4,
    'Neurology': +1,
    'Gynecology': -1,
    'Oncology': +3,
    'General Medicine': +6,
    'Radiology': 0,
    'Laboratory': +2,
    'Pharmacy': +1,
    'Administration': -2,
    'Housekeeping': +3,
    'IT & Support': +4
  };

  // Department efficiency scores (out of 100)
  const departmentEfficiency = {
    'Emergency': 92,
    'Cardiology': 88,
    'Orthopedics': 85,
    'Pediatrics': 90,
    'Neurology': 87,
    'Gynecology': 84,
    'Oncology': 86,
    'General Medicine': 89,
    'Radiology': 83,
    'Laboratory': 91,
    'Pharmacy': 87,
    'Administration': 82,
    'Housekeeping': 80,
    'IT & Support': 85
  };

  // Get the selected department data
  const selectedDepartments = departmentData[viewType];
  
  // Calculate total employees
  const totalEmployees = selectedDepartments.reduce((sum, dept) => sum + dept.count, 0);
  
  // Find departments with growth and decline
  const growingDepartments = Object.entries(departmentGrowth)
    .filter(([dept, growth]) => growth > 0 && selectedDepartments.some(d => d.name === dept))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  const decliningDepartments = Object.entries(departmentGrowth)
    .filter(([dept, growth]) => growth < 0 && selectedDepartments.some(d => d.name === dept))
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);
  
  // Find departments with highest and lowest efficiency
  const highestEfficiencyDepartments = Object.entries(departmentEfficiency)
    .filter(([dept]) => selectedDepartments.some(d => d.name === dept))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  const lowestEfficiencyDepartments = Object.entries(departmentEfficiency)
    .filter(([dept]) => selectedDepartments.some(d => d.name === dept))
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  // Prepare donut chart options
  const donutChartOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: selectedDepartments.map(dept => dept.name),
    colors: [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
      '#F44336', '#3F51B5', '#00BCD4', '#FFC107', 
      '#795548', '#607D8B', '#E91E63', '#CDDC39',
      '#009688', '#673AB7'
    ],
    legend: {
      position: 'bottom',
      fontSize: '12px'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '55%',
          labels: {
            show: true,
            name: {
              show: true,
            },
            value: {
              show: true,
              formatter: function(val) {
                return val + ' staff';
              }
            },
            total: {
              show: true,
              label: 'Total Staff',
              formatter: function() {
                return totalEmployees;
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    tooltip: {
      y: {
        formatter: function(val) {
          return val + " employees";
        }
      }
    }
  };

  const donutChartSeries = selectedDepartments.map(dept => dept.count);

  // Prepare horizontal bar chart for department growth
  const growthChartOptions = {
    chart: {
      type: 'bar',
      height: 250,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        distributed: true,
        dataLabels: {
          position: 'bottom'
        }
      },
    },
    colors: selectedDepartments.map(dept => {
      const growth = departmentGrowth[dept.name];
      return growth > 0 ? '#4CAF50' : growth < 0 ? '#F44336' : '#FFC107';
    }),
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: {
        colors: ['#fff']
      },
      formatter: function(val, opt) {
        const growth = val;
        return growth > 0 ? `+${growth}` : growth;
      },
      offsetX: 0
    },
    stroke: {
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: selectedDepartments.map(dept => dept.name),
      labels: {
        formatter: function(val) {
          return val;
        }
      }
    },
    yaxis: {
      labels: {
        show: false
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val > 0 ? `+${val} staff` : `${val} staff`;
        }
      }
    },
    title: {
      text: 'Department Growth (Last 3 Months)',
      align: 'center',
      style: {
        fontSize: '14px'
      }
    }
  };

  const growthChartSeries = [{
    name: 'Staff Change',
    data: selectedDepartments.map(dept => departmentGrowth[dept.name])
  }];

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Employee Department Distribution</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
          >
            <option value="All Departments">All Departments</option>
            <option value="Medical Departments">Medical Departments</option>
            <option value="Support Departments">Support Departments</option>
          </select>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-7">
            <h6 className="text-center mb-3">Staff Distribution by Department</h6>
            <ReactApexChart
              options={donutChartOptions}
              series={donutChartSeries}
              type="donut"
              height={350}
            />
          </div>
          <div className="col-md-5">
            <div className="p-3 bg-light rounded h-100">
              <h6 className="mb-3">Department Insights</h6>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Total Staff in {viewType}</p>
                <h5 className="mb-0">{totalEmployees}</h5>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Growing Departments</p>
                {growingDepartments.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {growingDepartments.map(([dept, growth], index) => (
                      <li key={index} className="text-sm d-flex justify-content-between mb-1">
                        <span>{dept}</span>
                        <span className="text-success">+{growth} staff</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm mb-0">No growing departments</p>
                )}
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Declining Departments</p>
                {decliningDepartments.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {decliningDepartments.map(([dept, growth], index) => (
                      <li key={index} className="text-sm d-flex justify-content-between mb-1">
                        <span>{dept}</span>
                        <span className="text-danger">{growth} staff</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm mb-0">No declining departments</p>
                )}
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Highest Efficiency Departments</p>
                <ul className="list-unstyled mb-0">
                  {highestEfficiencyDepartments.map(([dept, score], index) => (
                    <li key={index} className="text-sm d-flex justify-content-between mb-1">
                      <span>{dept}</span>
                      <div>
                        <div className="progress" style={{ height: '6px', width: '60px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ width: `${score}%` }}
                            aria-valuenow={score} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <span className="text-xs">{score}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Lowest Efficiency Departments</p>
                <ul className="list-unstyled mb-0">
                  {lowestEfficiencyDepartments.map(([dept, score], index) => (
                    <li key={index} className="text-sm d-flex justify-content-between mb-1">
                      <span>{dept}</span>
                      <div>
                        <div className="progress" style={{ height: '6px', width: '60px' }}>
                          <div 
                            className="progress-bar bg-warning" 
                            role="progressbar" 
                            style={{ width: `${score}%` }}
                            aria-valuenow={score} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <span className="text-xs">{score}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="text-xl" />
                  <span className="text-sm">
                    Department-wide announcements sent via WhatsApp groups
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row mt-4">
          <div className="col-12">
            <ReactApexChart
              options={growthChartOptions}
              series={growthChartSeries}
              type="bar"
              height={250}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This chart shows the distribution of employees across different departments in the hospital.
            {viewType === 'All Departments' 
              ? ' Administration and Emergency departments have the highest staff count.' 
              : viewType === 'Medical Departments'
                ? ' Emergency and General Medicine are the largest medical departments.'
                : ' Administration and Housekeeping are the largest support departments.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDepartmentsChart;
