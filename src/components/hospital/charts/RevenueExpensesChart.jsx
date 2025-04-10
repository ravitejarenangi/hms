'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const RevenueExpensesChart = () => {
  const [timeRange, setTimeRange] = useState('Yearly');

  // Sample data for revenue and expenses
  const chartData = {
    Yearly: {
      revenue: [
        { category: 'Outpatient Services', amount: 850000 },
        { category: 'Inpatient Services', amount: 1200000 },
        { category: 'Laboratory', amount: 450000 },
        { category: 'Radiology', amount: 380000 },
        { category: 'Pharmacy', amount: 520000 },
        { category: 'Emergency', amount: 320000 },
        { category: 'Other', amount: 180000 }
      ],
      expenses: [
        { category: 'Staff Salaries', amount: 1500000 },
        { category: 'Medications', amount: 420000 },
        { category: 'Equipment', amount: 380000 },
        { category: 'Maintenance', amount: 250000 },
        { category: 'Utilities', amount: 180000 },
        { category: 'Administrative', amount: 320000 },
        { category: 'Other', amount: 150000 }
      ]
    },
    Monthly: {
      revenue: [
        { category: 'Outpatient Services', amount: 70000 },
        { category: 'Inpatient Services', amount: 100000 },
        { category: 'Laboratory', amount: 38000 },
        { category: 'Radiology', amount: 32000 },
        { category: 'Pharmacy', amount: 43000 },
        { category: 'Emergency', amount: 27000 },
        { category: 'Other', amount: 15000 }
      ],
      expenses: [
        { category: 'Staff Salaries', amount: 125000 },
        { category: 'Medications', amount: 35000 },
        { category: 'Equipment', amount: 32000 },
        { category: 'Maintenance', amount: 21000 },
        { category: 'Utilities', amount: 15000 },
        { category: 'Administrative', amount: 27000 },
        { category: 'Other', amount: 12500 }
      ]
    },
    Quarterly: {
      revenue: [
        { category: 'Outpatient Services', amount: 210000 },
        { category: 'Inpatient Services', amount: 300000 },
        { category: 'Laboratory', amount: 112500 },
        { category: 'Radiology', amount: 95000 },
        { category: 'Pharmacy', amount: 130000 },
        { category: 'Emergency', amount: 80000 },
        { category: 'Other', amount: 45000 }
      ],
      expenses: [
        { category: 'Staff Salaries', amount: 375000 },
        { category: 'Medications', amount: 105000 },
        { category: 'Equipment', amount: 95000 },
        { category: 'Maintenance', amount: 62500 },
        { category: 'Utilities', amount: 45000 },
        { category: 'Administrative', amount: 80000 },
        { category: 'Other', amount: 37500 }
      ]
    }
  };

  const { revenue, expenses } = chartData[timeRange];

  // Calculate totals
  const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const profitMargin = ((netIncome / totalRevenue) * 100).toFixed(1);
  const isProfit = netIncome > 0;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare chart data
  const revenueChartOptions = {
    chart: {
      type: 'donut',
    },
    labels: revenue.map(item => item.category),
    colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
    legend: {
      position: 'bottom',
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
              label: 'Total Revenue',
              formatter: function() {
                return formatCurrency(totalRevenue);
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false,
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

  const expensesChartOptions = {
    chart: {
      type: 'donut',
    },
    labels: expenses.map(item => item.category),
    colors: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4'],
    legend: {
      position: 'bottom',
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
              label: 'Total Expenses',
              formatter: function() {
                return formatCurrency(totalExpenses);
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false,
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

  const revenueChartSeries = revenue.map(item => item.amount);
  const expensesChartSeries = expenses.map(item => item.amount);

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Revenue & Expenses Comparison</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="Yearly">Yearly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
        
        <div className="d-flex flex-wrap align-items-center gap-4 mt-8">
          <div>
            <p className="text-sm fw-medium mb-1">Total Revenue</p>
            <h6 className="mb-0 text-success-main">{formatCurrency(totalRevenue)}</h6>
          </div>
          <div>
            <p className="text-sm fw-medium mb-1">Total Expenses</p>
            <h6 className="mb-0 text-danger-main">{formatCurrency(totalExpenses)}</h6>
          </div>
          <div>
            <p className="text-sm fw-medium mb-1">Net Income</p>
            <div className="d-flex align-items-center gap-1">
              <h6 className={`mb-0 ${isProfit ? 'text-success-main' : 'text-danger-main'}`}>
                {formatCurrency(netIncome)}
              </h6>
              <span className={`d-inline-flex align-items-center gap-1 ${isProfit ? 'text-success-main' : 'text-danger-main'}`}>
                <Icon icon={isProfit ? 'bxs:up-arrow' : 'bxs:down-arrow'} className="text-xs" />
                {profitMargin}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-6">
            <h6 className="text-center mb-3">Revenue Breakdown</h6>
            <ReactApexChart
              options={revenueChartOptions}
              series={revenueChartSeries}
              type="donut"
              height={350}
            />
          </div>
          <div className="col-md-6">
            <h6 className="text-center mb-3">Expenses Breakdown</h6>
            <ReactApexChart
              options={expensesChartOptions}
              series={expensesChartSeries}
              type="donut"
              height={350}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This chart compares revenue and expenses across different categories. 
            {isProfit 
              ? " The hospital is currently operating at a profit." 
              : " The hospital is currently operating at a loss."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueExpensesChart;
