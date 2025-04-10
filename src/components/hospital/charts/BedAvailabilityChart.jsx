'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const BedAvailabilityChart = () => {
  const [wardFilter, setWardFilter] = useState('All');

  // Sample data for bed availability
  const bedData = {
    All: {
      totalBeds: 500,
      occupiedBeds: 390,
      maintenanceBeds: 15,
      reservedBeds: 45,
      availableBeds: 50,
      occupancyRate: 78,
      wards: [
        { name: 'General Ward', total: 200, occupied: 170, maintenance: 5, reserved: 15, available: 10 },
        { name: 'Private Rooms', total: 80, occupied: 60, maintenance: 2, reserved: 10, available: 8 },
        { name: 'ICU', total: 50, occupied: 42, maintenance: 3, reserved: 5, available: 0 },
        { name: 'CCU', total: 40, occupied: 32, maintenance: 1, reserved: 5, available: 2 },
        { name: 'Pediatric', total: 60, occupied: 42, maintenance: 2, reserved: 6, available: 10 },
        { name: 'Maternity', total: 40, occupied: 25, maintenance: 1, reserved: 4, available: 10 },
        { name: 'Emergency', total: 30, occupied: 19, maintenance: 1, reserved: 0, available: 10 }
      ]
    },
    'General Ward': {
      totalBeds: 200,
      occupiedBeds: 170,
      maintenanceBeds: 5,
      reservedBeds: 15,
      availableBeds: 10,
      occupancyRate: 85
    },
    'Private Rooms': {
      totalBeds: 80,
      occupiedBeds: 60,
      maintenanceBeds: 2,
      reservedBeds: 10,
      availableBeds: 8,
      occupancyRate: 75
    },
    'ICU': {
      totalBeds: 50,
      occupiedBeds: 42,
      maintenanceBeds: 3,
      reservedBeds: 5,
      availableBeds: 0,
      occupancyRate: 84
    },
    'CCU': {
      totalBeds: 40,
      occupiedBeds: 32,
      maintenanceBeds: 1,
      reservedBeds: 5,
      availableBeds: 2,
      occupancyRate: 80
    },
    'Pediatric': {
      totalBeds: 60,
      occupiedBeds: 42,
      maintenanceBeds: 2,
      reservedBeds: 6,
      availableBeds: 10,
      occupancyRate: 70
    },
    'Maternity': {
      totalBeds: 40,
      occupiedBeds: 25,
      maintenanceBeds: 1,
      reservedBeds: 4,
      availableBeds: 10,
      occupancyRate: 62.5
    },
    'Emergency': {
      totalBeds: 30,
      occupiedBeds: 19,
      maintenanceBeds: 1,
      reservedBeds: 0,
      availableBeds: 10,
      occupancyRate: 63.3
    }
  };

  const selectedData = bedData[wardFilter];
  
  // Determine color based on occupancy rate
  const getOccupancyColor = (rate) => {
    if (rate >= 90) return '#FF5252';
    if (rate >= 75) return '#FFC107';
    return '#4CAF50';
  };

  const occupancyColor = getOccupancyColor(selectedData.occupancyRate);

  // Gauge chart options
  const gaugeChartOptions = {
    chart: {
      type: 'radialBar',
      offsetY: -20,
      sparkline: {
        enabled: true
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "#e7e7e7",
          strokeWidth: '97%',
          margin: 5,
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            color: '#999',
            opacity: 1,
            blur: 2
          }
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            offsetY: -2,
            fontSize: '22px'
          }
        }
      }
    },
    grid: {
      padding: {
        top: -10
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        shadeIntensity: 0.4,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 53, 91]
      },
    },
    labels: ['Occupancy Rate'],
    colors: [occupancyColor]
  };

  const gaugeChartSeries = [selectedData.occupancyRate];

  // Bar chart for bed distribution
  const barChartOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 2,
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['Beds'],
    },
    yaxis: {
      title: {
        text: 'Number of Beds'
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " beds";
        }
      }
    },
    colors: ['#FF5252', '#FFC107', '#2196F3', '#4CAF50'],
    legend: {
      position: 'top'
    }
  };

  const barChartSeries = [
    {
      name: 'Occupied',
      data: [selectedData.occupiedBeds]
    },
    {
      name: 'Reserved',
      data: [selectedData.reservedBeds]
    },
    {
      name: 'Maintenance',
      data: [selectedData.maintenanceBeds]
    },
    {
      name: 'Available',
      data: [selectedData.availableBeds]
    }
  ];

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Bed Availability & Occupancy</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
          >
            <option value="All">All Wards</option>
            <option value="General Ward">General Ward</option>
            <option value="Private Rooms">Private Rooms</option>
            <option value="ICU">ICU</option>
            <option value="CCU">CCU</option>
            <option value="Pediatric">Pediatric</option>
            <option value="Maternity">Maternity</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-6">
            <div className="text-center">
              <h6 className="mb-3">Occupancy Rate</h6>
              <ReactApexChart
                options={gaugeChartOptions}
                series={gaugeChartSeries}
                type="radialBar"
                height={300}
              />
              <div className="mt-3">
                <p className="mb-0">
                  <span className="fw-bold">{selectedData.occupancyRate}%</span> of beds are currently occupied
                </p>
                {selectedData.occupancyRate >= 90 ? (
                  <p className="text-danger mb-0 mt-2">
                    <Icon icon="mdi:alert-circle" className="me-1" />
                    Critical occupancy level! Consider patient transfers.
                  </p>
                ) : selectedData.occupancyRate >= 75 ? (
                  <p className="text-warning mb-0 mt-2">
                    <Icon icon="mdi:alert" className="me-1" />
                    High occupancy level. Monitor closely.
                  </p>
                ) : (
                  <p className="text-success mb-0 mt-2">
                    <Icon icon="mdi:check-circle" className="me-1" />
                    Healthy occupancy level.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="text-center">
              <h6 className="mb-3">Bed Distribution</h6>
              <ReactApexChart
                options={barChartOptions}
                series={barChartSeries}
                type="bar"
                height={300}
              />
            </div>
          </div>
        </div>
        
        {wardFilter === 'All' && (
          <div className="mt-4">
            <h6 className="mb-3">Ward-wise Occupancy</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Ward</th>
                    <th>Total Beds</th>
                    <th>Occupied</th>
                    <th>Available</th>
                    <th>Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedData.wards.map((ward, index) => (
                    <tr key={index}>
                      <td>{ward.name}</td>
                      <td>{ward.total}</td>
                      <td>{ward.occupied}</td>
                      <td>{ward.available}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress flex-grow-1" style={{ height: '6px' }}>
                            <div 
                              className="progress-bar" 
                              role="progressbar" 
                              style={{ 
                                width: `${(ward.occupied / ward.total) * 100}%`,
                                backgroundColor: getOccupancyColor((ward.occupied / ward.total) * 100)
                              }}
                              aria-valuenow={(ward.occupied / ward.total) * 100} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <span className="ms-2">{((ward.occupied / ward.total) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This chart shows the current bed occupancy and availability across the hospital. 
            {selectedData.availableBeds === 0 
              ? " There are currently no available beds in this ward." 
              : ` There are ${selectedData.availableBeds} beds available for new patients.`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BedAvailabilityChart;
