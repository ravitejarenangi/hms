'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const DepartmentIncomeWidget = () => {
  const [timeRange, setTimeRange] = useState('Monthly');

  // Sample data for department income
  const incomeData = {
    Monthly: {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine', 'Radiology', 'Laboratory', 'Pharmacy'],
      income: [280000, 350000, 320000, 220000, 180000, 210000, 290000, 240000, 170000, 150000, 190000],
      growth: [5.2, 7.8, 4.5, 3.2, -1.5, 2.8, 8.5, 3.7, 1.2, 4.8, 6.2],
      totalIncome: 2600000,
      previousTotalIncome: 2450000,
      topPerformer: 'Cardiology',
      topPerformerAmount: 350000,
      lowestPerformer: 'Laboratory',
      lowestPerformerAmount: 150000
    },
    Quarterly: {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine', 'Radiology', 'Laboratory', 'Pharmacy'],
      income: [840000, 1050000, 960000, 660000, 540000, 630000, 870000, 720000, 510000, 450000, 570000],
      growth: [6.5, 8.2, 5.1, 3.8, -0.8, 3.2, 9.1, 4.2, 1.5, 5.3, 6.8],
      totalIncome: 7800000,
      previousTotalIncome: 7300000,
      topPerformer: 'Cardiology',
      topPerformerAmount: 1050000,
      lowestPerformer: 'Laboratory',
      lowestPerformerAmount: 450000
    },
    Yearly: {
      departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology', 'Oncology', 'General Medicine', 'Radiology', 'Laboratory', 'Pharmacy'],
      income: [3360000, 4200000, 3840000, 2640000, 2160000, 2520000, 3480000, 2880000, 2040000, 1800000, 2280000],
      growth: [7.2, 9.5, 6.3, 4.5, 0.5, 3.8, 10.2, 5.1, 2.2, 6.1, 7.5],
      totalIncome: 31200000,
      previousTotalIncome: 29000000,
      topPerformer: 'Cardiology',
      topPerformerAmount: 4200000,
      lowestPerformer: 'Laboratory',
      lowestPerformerAmount: 1800000
    }
  };

  const { 
    departments, 
    income, 
    growth, 
    totalIncome, 
    previousTotalIncome, 
    topPerformer, 
    topPerformerAmount, 
    lowestPerformer, 
    lowestPerformerAmount 
  } = incomeData[timeRange];

  // Calculate overall growth percentage
  const overallGrowth = ((totalIncome - previousTotalIncome) / previousTotalIncome) * 100;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare column chart options
  const columnChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
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
        text: 'Income (USD)'
      },
      labels: {
        formatter: function(val) {
          return formatCurrency(val);
        }
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return formatCurrency(val);
        }
      }
    },
    colors: departments.map((_, index) => {
      const currentGrowth = growth[index];
      return currentGrowth >= 5 ? '#4CAF50' : 
             currentGrowth > 0 ? '#8BC34A' : 
             currentGrowth === 0 ? '#FFC107' : '#F44336';
    })
  };

  const columnChartSeries = [
    {
      name: 'Income',
      data: income
    }
  ];

  // Prepare line chart for growth
  const lineChartOptions = {
    chart: {
      type: 'line',
      height: 150,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
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
      title: {
        text: 'Growth %'
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val.toFixed(1) + '%';
        }
      }
    },
    colors: ['#3F51B5'],
    markers: {
      size: 4,
      colors: ['#3F51B5'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    annotations: {
      yaxis: [
        {
          y: 0,
          borderColor: '#999',
          borderWidth: 1,
          opacity: 0.5,
          strokeDashArray: 5
        }
      ]
    }
  };

  const lineChartSeries = [
    {
      name: 'Growth',
      data: growth
    }
  ];

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Monthly Income Overview by Department</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        
        <div className="row mt-4">
          <div className="col-lg-3">
            <div className="p-3 bg-light rounded h-100">
              <h6 className="mb-3">Income Summary</h6>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Total Income</p>
                <h5 className="mb-0">{formatCurrency(totalIncome)}</h5>
                <div className="d-flex align-items-center gap-1 mt-1">
                  <span className={`d-inline-flex align-items-center gap-1 ${overallGrowth >= 0 ? 'text-success-main' : 'text-danger-main'}`}>
                    <Icon icon={overallGrowth >= 0 ? 'bxs:up-arrow' : 'bxs:down-arrow'} className="text-xs" />
                    {Math.abs(overallGrowth).toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted">vs previous {timeRange.toLowerCase()}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Top Performing Department</p>
                <h6 className="mb-0">{topPerformer}</h6>
                <p className="text-sm text-success mb-0">{formatCurrency(topPerformerAmount)}</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Lowest Performing Department</p>
                <h6 className="mb-0">{lowestPerformer}</h6>
                <p className="text-sm text-warning mb-0">{formatCurrency(lowestPerformerAmount)}</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Payment Sources</p>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-sm">Insurance</span>
                    <span className="text-sm fw-medium">65%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-primary" style={{ width: '65%' }} role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-sm">Self-Pay</span>
                    <span className="text-sm fw-medium">25%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: '25%' }} role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-sm">Subsidy Schemes</span>
                    <span className="text-sm fw-medium">10%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" style={{ width: '10%' }} role="progressbar" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="text-xl" />
                  <span className="text-sm">
                    Financial reports sent to department heads via WhatsApp
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-9">
            <div className="mb-4">
              <h6 className="text-center mb-3">Department-wise Income</h6>
              <ReactApexChart
                options={columnChartOptions}
                series={columnChartSeries}
                type="bar"
                height={350}
              />
            </div>
            
            <div>
              <h6 className="text-center mb-3">Department Growth Rate (%)</h6>
              <ReactApexChart
                options={lineChartOptions}
                series={lineChartSeries}
                type="line"
                height={150}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This overview shows the income distribution across different departments in the hospital.
            Cardiology is currently the highest revenue-generating department with {formatCurrency(topPerformerAmount)},
            while Laboratory is the lowest with {formatCurrency(lowestPerformerAmount)}.
            Overall income has {overallGrowth >= 0 ? 'increased' : 'decreased'} by {Math.abs(overallGrowth).toFixed(1)}% compared to the previous {timeRange.toLowerCase()}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DepartmentIncomeWidget;
