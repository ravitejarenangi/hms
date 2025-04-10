'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const DepartmentPatientFlowChart = () => {
  const [timeRange, setTimeRange] = useState('Weekly');

  // Sample data for department-wise patient flow and waiting time
  const flowData = {
    Weekly: {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine'],
      patientFlow: [145, 92, 78, 110, 65, 88, 72, 130],
      waitingTimes: {
        registration: [5, 8, 7, 6, 9, 7, 8, 10],
        consultation: [15, 35, 30, 25, 40, 28, 45, 20],
        treatment: [25, 60, 45, 30, 55, 40, 70, 35],
        discharge: [10, 15, 12, 8, 14, 10, 18, 12]
      },
      averageWaitTime: 42,
      longestWaitDept: 'Oncology',
      longestWaitTime: 141, // minutes
      shortestWaitDept: 'Emergency',
      shortestWaitTime: 55 // minutes
    },
    Monthly: {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine'],
      patientFlow: [580, 368, 312, 440, 260, 352, 288, 520],
      waitingTimes: {
        registration: [6, 9, 8, 7, 10, 8, 9, 11],
        consultation: [16, 36, 31, 26, 41, 29, 46, 21],
        treatment: [26, 61, 46, 31, 56, 41, 71, 36],
        discharge: [11, 16, 13, 9, 15, 11, 19, 13]
      },
      averageWaitTime: 43,
      longestWaitDept: 'Oncology',
      longestWaitTime: 145, // minutes
      shortestWaitDept: 'Emergency',
      shortestWaitTime: 59 // minutes
    },
    Quarterly: {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine'],
      patientFlow: [1740, 1104, 936, 1320, 780, 1056, 864, 1560],
      waitingTimes: {
        registration: [5, 8, 7, 6, 9, 7, 8, 10],
        consultation: [15, 35, 30, 25, 40, 28, 45, 20],
        treatment: [25, 60, 45, 30, 55, 40, 70, 35],
        discharge: [10, 15, 12, 8, 14, 10, 18, 12]
      },
      averageWaitTime: 42,
      longestWaitDept: 'Oncology',
      longestWaitTime: 141, // minutes
      shortestWaitDept: 'Emergency',
      shortestWaitTime: 55 // minutes
    }
  };

  const { departments, patientFlow, waitingTimes, averageWaitTime, longestWaitDept, longestWaitTime, shortestWaitDept, shortestWaitTime } = flowData[timeRange];

  // Prepare data for stacked bar chart
  const stackedBarOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0
        }
      }
    }],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 2,
        columnWidth: '55%',
      },
    },
    xaxis: {
      categories: departments,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Waiting Time (minutes)'
      },
    },
    legend: {
      position: 'top'
    },
    fill: {
      opacity: 1
    },
    colors: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + " minutes"
        }
      }
    }
  };

  const stackedBarSeries = [
    {
      name: 'Registration',
      data: waitingTimes.registration
    },
    {
      name: 'Consultation',
      data: waitingTimes.consultation
    },
    {
      name: 'Treatment',
      data: waitingTimes.treatment
    },
    {
      name: 'Discharge',
      data: waitingTimes.discharge
    }
  ];

  // Prepare data for patient flow bar chart
  const patientFlowOptions = {
    chart: {
      type: 'bar',
      height: 200,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 2,
        distributed: true
      },
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: departments,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Number of Patients'
      }
    },
    colors: ['#3F51B5', '#303F9F', '#1A237E', '#283593', '#5C6BC0', '#3949AB', '#7986CB', '#3F51B5'],
    legend: {
      show: false
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + " patients"
        }
      }
    }
  };

  const patientFlowSeries = [
    {
      name: 'Patient Flow',
      data: patientFlow
    }
  ];

  // Calculate total waiting time for each department
  const totalWaitingTimes = departments.map((_, index) => {
    return waitingTimes.registration[index] + 
           waitingTimes.consultation[index] + 
           waitingTimes.treatment[index] + 
           waitingTimes.discharge[index];
  });

  // Find departments with high waiting times (above average)
  const highWaitingDepts = departments.filter((dept, index) => {
    return totalWaitingTimes[index] > averageWaitTime;
  });

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Department-wise Patient Flow & Waiting Time</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
          </select>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-8">
            <h6 className="text-center mb-3">Waiting Time by Department (minutes)</h6>
            <ReactApexChart
              options={stackedBarOptions}
              series={stackedBarSeries}
              type="bar"
              height={350}
            />
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-light rounded h-100">
              <h6 className="mb-3">Waiting Time Analysis</h6>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Average Total Wait Time</p>
                <h5 className="mb-0">{averageWaitTime} minutes</h5>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Longest Wait Time</p>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 text-danger">{longestWaitTime} minutes</h6>
                  <span className="text-sm">({longestWaitDept})</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Shortest Wait Time</p>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 text-success">{shortestWaitTime} minutes</h6>
                  <span className="text-sm">({shortestWaitDept})</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Departments with High Wait Times</p>
                <ul className="list-unstyled mb-0">
                  {highWaitingDepts.map((dept, index) => (
                    <li key={index} className="text-sm">
                      <Icon icon="mdi:alert-circle" className="text-warning me-1" />
                      {dept}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="text-xl" />
                  <span className="text-sm">
                    WhatsApp notifications sent to patients with appointment updates and estimated wait times
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h6 className="text-center mb-3">Patient Flow by Department</h6>
          <ReactApexChart
            options={patientFlowOptions}
            series={patientFlowSeries}
            type="bar"
            height={200}
          />
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This chart shows the patient flow and waiting times across different departments. 
            The Emergency department has the shortest waiting time but high patient flow, 
            while the Oncology department has the longest waiting time with moderate patient flow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPatientFlowChart;
