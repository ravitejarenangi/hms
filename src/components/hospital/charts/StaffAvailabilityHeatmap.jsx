'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const StaffAvailabilityHeatmap = () => {
  const [staffType, setStaffType] = useState('Doctors');

  // Sample data for staff availability
  const staffData = {
    Doctors: {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine'],
      shifts: ['Morning (6AM-2PM)', 'Afternoon (2PM-10PM)', 'Night (10PM-6AM)'],
      availability: [
        [8, 6, 4, 5, 3, 4, 3, 7],  // Morning shift
        [7, 5, 3, 4, 2, 3, 2, 6],  // Afternoon shift
        [4, 2, 1, 2, 1, 2, 1, 3]   // Night shift
      ],
      totalStaff: 85,
      onDutyStaff: 42,
      offDutyStaff: 43,
      criticalShortage: ['Neurology - Night', 'Oncology - Night']
    },
    Nurses: {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine'],
      shifts: ['Morning (6AM-2PM)', 'Afternoon (2PM-10PM)', 'Night (10PM-6AM)'],
      availability: [
        [15, 12, 10, 14, 8, 10, 9, 16],  // Morning shift
        [14, 10, 8, 12, 7, 9, 8, 14],    // Afternoon shift
        [10, 6, 5, 8, 4, 5, 4, 9]        // Night shift
      ],
      totalStaff: 180,
      onDutyStaff: 95,
      offDutyStaff: 85,
      criticalShortage: ['Neurology - Night', 'Oncology - Night', 'Orthopedics - Night']
    },
    'Support Staff': {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine'],
      shifts: ['Morning (6AM-2PM)', 'Afternoon (2PM-10PM)', 'Night (10PM-6AM)'],
      availability: [
        [10, 8, 7, 9, 6, 7, 6, 12],  // Morning shift
        [9, 7, 6, 8, 5, 6, 5, 10],   // Afternoon shift
        [5, 3, 3, 4, 2, 3, 2, 6]     // Night shift
      ],
      totalStaff: 120,
      onDutyStaff: 65,
      offDutyStaff: 55,
      criticalShortage: ['Neurology - Night', 'Oncology - Night', 'Gynecology - Night']
    }
  };

  const { departments, shifts, availability, totalStaff, onDutyStaff, offDutyStaff, criticalShortage } = staffData[staffType];

  // Prepare heatmap data
  const heatmapOptions = {
    chart: {
      type: 'heatmap',
      height: 350,
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      }
    },
    colors: ['#008FFB'],
    title: {
      text: `${staffType} Availability by Department and Shift`,
      align: 'center',
      style: {
        fontSize: '14px'
      }
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
      categories: shifts
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0,
        useFillColorAsStroke: true,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 2,
              name: 'Critical',
              color: '#FF5252'
            },
            {
              from: 3,
              to: 5,
              name: 'Low',
              color: '#FFC107'
            },
            {
              from: 6,
              to: 10,
              name: 'Adequate',
              color: '#4CAF50'
            },
            {
              from: 11,
              to: 20,
              name: 'Optimal',
              color: '#2196F3'
            }
          ]
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ` ${staffType.toLowerCase()} available`;
        }
      }
    }
  };

  const heatmapSeries = shifts.map((shift, index) => {
    return {
      name: shift,
      data: departments.map((dept, deptIndex) => {
        return {
          x: dept,
          y: availability[index][deptIndex]
        };
      })
    };
  });

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Staff Availability & On-Duty Status</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={staffType}
            onChange={(e) => setStaffType(e.target.value)}
          >
            <option value="Doctors">Doctors</option>
            <option value="Nurses">Nurses</option>
            <option value="Support Staff">Support Staff</option>
          </select>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-8">
            <ReactApexChart
              options={heatmapOptions}
              series={heatmapSeries}
              type="heatmap"
              height={350}
            />
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-light rounded h-100">
              <h6 className="mb-3">Staff Status Summary</h6>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Total {staffType}</p>
                <h5 className="mb-0">{totalStaff}</h5>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Currently On Duty</p>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 text-success">{onDutyStaff}</h6>
                  <span className="text-sm">({Math.round((onDutyStaff / totalStaff) * 100)}%)</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Off Duty</p>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0">{offDutyStaff}</h6>
                  <span className="text-sm">({Math.round((offDutyStaff / totalStaff) * 100)}%)</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Critical Shortages</p>
                {criticalShortage.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {criticalShortage.map((shortage, index) => (
                      <li key={index} className="text-sm">
                        <Icon icon="mdi:alert-circle" className="text-danger me-1" />
                        {shortage}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm mb-0">No critical shortages</p>
                )}
              </div>
              
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="text-xl" />
                  <span className="text-sm">
                    Emergency staff notifications sent via WhatsApp for critical shortages
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This heatmap shows the current availability of {staffType.toLowerCase()} across different departments and shifts. 
            Red areas indicate critical shortages that require immediate attention.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffAvailabilityHeatmap;
