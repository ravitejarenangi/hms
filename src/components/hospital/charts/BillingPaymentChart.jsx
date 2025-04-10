'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const BillingPaymentChart = () => {
  const [timeRange, setTimeRange] = useState('Monthly');

  // Sample data for billing and payment status
  const billingData = {
    Monthly: {
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      billed: [320000, 280000, 350000, 300000],
      received: [290000, 250000, 310000, 260000],
      pending: [30000, 30000, 40000, 40000],
      overdue: [15000, 18000, 22000, 25000],
      totalBilled: 1250000,
      totalReceived: 1110000,
      totalPending: 140000,
      totalOverdue: 80000,
      collectionRate: 88.8,
      insuranceClaims: 850000,
      selfPay: 400000,
      subsidySchemes: 120000,
      topDepartments: [
        { name: 'Cardiology', amount: 280000 },
        { name: 'Orthopedics', amount: 220000 },
        { name: 'Neurology', amount: 180000 }
      ]
    },
    Quarterly: {
      categories: ['Month 1', 'Month 2', 'Month 3'],
      billed: [950000, 1050000, 1200000],
      received: [850000, 920000, 1050000],
      pending: [100000, 130000, 150000],
      overdue: [50000, 70000, 90000],
      totalBilled: 3200000,
      totalReceived: 2820000,
      totalPending: 380000,
      totalOverdue: 210000,
      collectionRate: 88.1,
      insuranceClaims: 2200000,
      selfPay: 1000000,
      subsidySchemes: 320000,
      topDepartments: [
        { name: 'Cardiology', amount: 720000 },
        { name: 'Orthopedics', amount: 580000 },
        { name: 'Neurology', amount: 480000 }
      ]
    },
    Yearly: {
      categories: ['Q1', 'Q2', 'Q3', 'Q4'],
      billed: [3200000, 3500000, 3800000, 4100000],
      received: [2900000, 3100000, 3350000, 3600000],
      pending: [300000, 400000, 450000, 500000],
      overdue: [150000, 200000, 250000, 300000],
      totalBilled: 14600000,
      totalReceived: 12950000,
      totalPending: 1650000,
      totalOverdue: 900000,
      collectionRate: 88.7,
      insuranceClaims: 9800000,
      selfPay: 4800000,
      subsidySchemes: 1400000,
      topDepartments: [
        { name: 'Cardiology', amount: 3200000 },
        { name: 'Orthopedics', amount: 2600000 },
        { name: 'Neurology', amount: 2100000 }
      ]
    }
  };

  const { 
    categories, 
    billed, 
    received, 
    pending, 
    overdue, 
    totalBilled, 
    totalReceived, 
    totalPending, 
    totalOverdue, 
    collectionRate,
    insuranceClaims,
    selfPay,
    subsidySchemes,
    topDepartments
  } = billingData[timeRange];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare bar chart data
  const barChartOptions = {
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
      categories: categories
    },
    yaxis: {
      title: {
        text: 'Amount (USD)'
      },
      labels: {
        formatter: function(val) {
          return formatCurrency(val);
        }
      }
    },
    legend: {
      position: 'top'
    },
    fill: {
      opacity: 1
    },
    colors: ['#4CAF50', '#FFC107', '#FF5252'],
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return formatCurrency(val);
        }
      }
    }
  };

  const barChartSeries = [
    {
      name: 'Received',
      data: received
    },
    {
      name: 'Pending',
      data: pending.map((val, index) => val - overdue[index])
    },
    {
      name: 'Overdue',
      data: overdue
    }
  ];

  // Prepare donut chart data for payment sources
  const donutChartOptions = {
    chart: {
      type: 'donut',
      height: 250
    },
    labels: ['Insurance Claims', 'Self Pay', 'Subsidy Schemes'],
    colors: ['#3F51B5', '#2196F3', '#00BCD4'],
    legend: {
      position: 'bottom'
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
                return formatCurrency(val);
              }
            },
            total: {
              show: true,
              label: 'Total',
              formatter: function() {
                return formatCurrency(totalBilled);
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
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const donutChartSeries = [insuranceClaims, selfPay, subsidySchemes];

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Billing & Payment Status</h6>
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
          <div className="col-md-8">
            <h6 className="text-center mb-3">Billing & Payment Trends</h6>
            <ReactApexChart
              options={barChartOptions}
              series={barChartSeries}
              type="bar"
              height={350}
            />
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-light rounded h-100">
              <h6 className="mb-3">Payment Summary</h6>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Total Billed</p>
                <h5 className="mb-0">{formatCurrency(totalBilled)}</h5>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Total Received</p>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 text-success">{formatCurrency(totalReceived)}</h6>
                  <span className="text-sm">({collectionRate.toFixed(1)}%)</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Pending Payments</p>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 text-warning">{formatCurrency(totalPending)}</h6>
                  <span className="text-sm">({((totalPending / totalBilled) * 100).toFixed(1)}%)</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Overdue Payments</p>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 text-danger">{formatCurrency(totalOverdue)}</h6>
                  <span className="text-sm">({((totalOverdue / totalBilled) * 100).toFixed(1)}%)</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Top Revenue Departments</p>
                <ul className="list-unstyled mb-0">
                  {topDepartments.map((dept, index) => (
                    <li key={index} className="text-sm d-flex justify-content-between">
                      <span>{dept.name}</span>
                      <span className="fw-medium">{formatCurrency(dept.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="text-xl" />
                  <span className="text-sm">
                    Payment reminders sent to {Math.round((totalPending / 5000))} patients via WhatsApp
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-6">
            <h6 className="text-center mb-3">Payment Sources</h6>
            <ReactApexChart
              options={donutChartOptions}
              series={donutChartSeries}
              type="donut"
              height={250}
            />
          </div>
          <div className="col-md-6">
            <div className="p-3 bg-light rounded h-100">
              <h6 className="mb-3">Government Subsidy Schemes</h6>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Scheme Name</th>
                      <th>Patients</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>National Health Program</td>
                      <td>45</td>
                      <td>{formatCurrency(subsidySchemes * 0.45)}</td>
                    </tr>
                    <tr>
                      <td>Senior Citizen Scheme</td>
                      <td>28</td>
                      <td>{formatCurrency(subsidySchemes * 0.25)}</td>
                    </tr>
                    <tr>
                      <td>Below Poverty Line</td>
                      <td>22</td>
                      <td>{formatCurrency(subsidySchemes * 0.20)}</td>
                    </tr>
                    <tr>
                      <td>Other Schemes</td>
                      <td>10</td>
                      <td>{formatCurrency(subsidySchemes * 0.10)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This chart shows the billing and payment status across different time periods. 
            The current collection rate is {collectionRate.toFixed(1)}%, with {formatCurrency(totalOverdue)} in overdue payments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingPaymentChart;
