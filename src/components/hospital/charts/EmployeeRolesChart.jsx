'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const EmployeeRolesChart = () => {
  const [viewType, setViewType] = useState('Roles');

  // Sample data for employee roles and sub-roles
  const employeeData = {
    roles: [
      { name: 'Doctors', count: 187 },
      { name: 'Nurses', count: 320 },
      { name: 'Administrative Staff', count: 95 },
      { name: 'Laboratory Staff', count: 45 },
      { name: 'Pharmacy Staff', count: 30 },
      { name: 'Housekeeping', count: 65 },
      { name: 'Security', count: 25 },
      { name: 'IT Staff', count: 18 },
      { name: 'Management', count: 15 }
    ],
    doctorSpecialties: [
      { name: 'Cardiologists', count: 22 },
      { name: 'Orthopedic Surgeons', count: 18 },
      { name: 'Neurologists', count: 15 },
      { name: 'Pediatricians', count: 25 },
      { name: 'Gynecologists', count: 20 },
      { name: 'Oncologists', count: 14 },
      { name: 'General Physicians', count: 30 },
      { name: 'Anesthesiologists', count: 16 },
      { name: 'Radiologists', count: 12 },
      { name: 'Other Specialists', count: 15 }
    ],
    nurseTypes: [
      { name: 'Registered Nurses', count: 180 },
      { name: 'Nurse Practitioners', count: 45 },
      { name: 'ICU Nurses', count: 35 },
      { name: 'ER Nurses', count: 40 },
      { name: 'Pediatric Nurses', count: 20 }
    ],
    totalEmployees: 800,
    maleEmployees: 320,
    femaleEmployees: 480,
    fullTimeEmployees: 680,
    partTimeEmployees: 120,
    averageExperience: 8.5,
    newHires: 45,
    vacantPositions: 32
  };

  // Determine which data to show based on view type
  let chartData = [];
  let chartTitle = '';

  switch (viewType) {
    case 'Roles':
      chartData = employeeData.roles;
      chartTitle = 'Employee Role Distribution';
      break;
    case 'Doctor Specialties':
      chartData = employeeData.doctorSpecialties;
      chartTitle = 'Doctor Specialties Distribution';
      break;
    case 'Nurse Types':
      chartData = employeeData.nurseTypes;
      chartTitle = 'Nurse Types Distribution';
      break;
    default:
      chartData = employeeData.roles;
      chartTitle = 'Employee Role Distribution';
  }

  // Prepare pie chart options
  const pieChartOptions = {
    chart: {
      type: 'pie',
      height: 350
    },
    labels: chartData.map(item => item.name),
    colors: [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
      '#F44336', '#3F51B5', '#00BCD4', '#FFC107', 
      '#795548', '#607D8B', '#E91E63', '#CDDC39'
    ],
    legend: {
      position: 'bottom'
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
    dataLabels: {
      enabled: true,
      formatter: function(val, opts) {
        return opts.w.config.series[opts.seriesIndex] + ' (' + val.toFixed(1) + '%)';
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + " employees";
        }
      }
    }
  };

  const pieChartSeries = chartData.map(item => item.count);

  // Calculate gender ratio percentage
  const malePercentage = (employeeData.maleEmployees / employeeData.totalEmployees) * 100;
  const femalePercentage = (employeeData.femaleEmployees / employeeData.totalEmployees) * 100;

  // Prepare gender ratio bar chart
  const genderChartOptions = {
    chart: {
      type: 'bar',
      height: 120,
      stacked: true,
      stackType: '100%',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val.toFixed(1) + '%';
      },
      style: {
        colors: ['#fff']
      }
    },
    stroke: {
      width: 0,
    },
    xaxis: {
      categories: ['Gender Ratio'],
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
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
          return val.toFixed(1) + '%';
        }
      }
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    colors: ['#2196F3', '#E91E63']
  };

  const genderChartSeries = [
    {
      name: 'Male',
      data: [malePercentage]
    },
    {
      name: 'Female',
      data: [femalePercentage]
    }
  ];

  // Prepare employment type bar chart
  const employmentChartOptions = {
    chart: {
      type: 'bar',
      height: 120,
      stacked: true,
      stackType: '100%',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val.toFixed(1) + '%';
      },
      style: {
        colors: ['#fff']
      }
    },
    stroke: {
      width: 0,
    },
    xaxis: {
      categories: ['Employment Type'],
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
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
          return val.toFixed(1) + '%';
        }
      }
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    colors: ['#4CAF50', '#FFC107']
  };

  const fullTimePercentage = (employeeData.fullTimeEmployees / employeeData.totalEmployees) * 100;
  const partTimePercentage = (employeeData.partTimeEmployees / employeeData.totalEmployees) * 100;

  const employmentChartSeries = [
    {
      name: 'Full Time',
      data: [fullTimePercentage]
    },
    {
      name: 'Part Time',
      data: [partTimePercentage]
    }
  ];

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Employee Roles Distribution</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
          >
            <option value="Roles">All Roles</option>
            <option value="Doctor Specialties">Doctor Specialties</option>
            <option value="Nurse Types">Nurse Types</option>
          </select>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-8">
            <h6 className="text-center mb-3">{chartTitle}</h6>
            <ReactApexChart
              options={pieChartOptions}
              series={pieChartSeries}
              type="pie"
              height={350}
            />
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-light rounded h-100">
              <h6 className="mb-3">Staff Summary</h6>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Total Employees</p>
                <h5 className="mb-0">{employeeData.totalEmployees}</h5>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Gender Distribution</p>
                <ReactApexChart
                  options={genderChartOptions}
                  series={genderChartSeries}
                  type="bar"
                  height={80}
                />
                <div className="d-flex justify-content-between text-sm mt-1">
                  <span>Male: {employeeData.maleEmployees}</span>
                  <span>Female: {employeeData.femaleEmployees}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Employment Type</p>
                <ReactApexChart
                  options={employmentChartOptions}
                  series={employmentChartSeries}
                  type="bar"
                  height={80}
                />
                <div className="d-flex justify-content-between text-sm mt-1">
                  <span>Full-time: {employeeData.fullTimeEmployees}</span>
                  <span>Part-time: {employeeData.partTimeEmployees}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Staff Metrics</p>
                <ul className="list-unstyled mb-0">
                  <li className="text-sm d-flex justify-content-between mb-1">
                    <span>Average Experience:</span>
                    <span className="fw-medium">{employeeData.averageExperience} years</span>
                  </li>
                  <li className="text-sm d-flex justify-content-between mb-1">
                    <span>New Hires (30 days):</span>
                    <span className="fw-medium">{employeeData.newHires}</span>
                  </li>
                  <li className="text-sm d-flex justify-content-between">
                    <span>Vacant Positions:</span>
                    <span className="fw-medium">{employeeData.vacantPositions}</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="text-xl" />
                  <span className="text-sm">
                    Staff notifications and schedules sent via WhatsApp
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This chart shows the distribution of employees across different roles in the hospital.
            {viewType === 'Roles' 
              ? ' Nurses and doctors make up the largest portion of the hospital staff.' 
              : viewType === 'Doctor Specialties'
                ? ' General Physicians and Pediatricians are the most numerous doctor specialties.'
                : ' Registered Nurses form the majority of the nursing staff.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRolesChart;
