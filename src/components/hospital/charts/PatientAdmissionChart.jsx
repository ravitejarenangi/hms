'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const PatientAdmissionChart = () => {
  const [timeRange, setTimeRange] = useState('Monthly');

  // Sample data for patient admissions and discharges
  const chartData = {
    Monthly: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      admissions: [65, 72, 78, 69, 80, 85, 76, 90, 87, 92, 88, 96],
      discharges: [60, 68, 74, 65, 75, 80, 72, 85, 82, 87, 83, 90]
    },
    Weekly: {
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      admissions: [22, 25, 28, 21],
      discharges: [20, 23, 26, 19]
    },
    Daily: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      admissions: [8, 10, 12, 9, 7, 5, 6],
      discharges: [7, 9, 11, 8, 6, 4, 5]
    }
  };

  const { categories, admissions, discharges } = chartData[timeRange];

  // Calculate totals and percentages
  const totalAdmissions = admissions.reduce((sum, val) => sum + val, 0);
  const totalDischarges = discharges.reduce((sum, val) => sum + val, 0);
  const percentChange = ((totalAdmissions - totalDischarges) / totalDischarges * 100).toFixed(1);
  const isPositive = percentChange > 0;

  const chartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: categories,
    },
    yaxis: {
      title: {
        text: 'Number of Patients',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " patients";
        },
      },
    },
    colors: ['#4CAF50', '#FF5722'],
    legend: {
      position: 'top',
    }
  };

  const chartSeries = [
    {
      name: 'Admissions',
      data: admissions,
    },
    {
      name: 'Discharges',
      data: discharges,
    },
  ];

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Patient Admissions & Discharges</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
            <option value="Daily">Daily</option>
          </select>
        </div>
        
        <div className="d-flex flex-wrap align-items-center gap-4 mt-8">
          <div>
            <p className="text-sm fw-medium mb-1">Total Admissions</p>
            <h6 className="mb-0">{totalAdmissions}</h6>
          </div>
          <div>
            <p className="text-sm fw-medium mb-1">Total Discharges</p>
            <h6 className="mb-0">{totalDischarges}</h6>
          </div>
          <div>
            <p className="text-sm fw-medium mb-1">Net Change</p>
            <div className="d-flex align-items-center gap-1">
              <h6 className="mb-0">{percentChange}%</h6>
              <span className={`d-inline-flex align-items-center gap-1 ${isPositive ? 'text-success-main' : 'text-danger-main'}`}>
                <Icon icon={isPositive ? 'bxs:up-arrow' : 'bxs:down-arrow'} className="text-xs" />
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="bar"
            height={350}
          />
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This chart shows the comparison between patient admissions and discharges over time.
            {isPositive 
              ? " The positive trend indicates more admissions than discharges." 
              : " The negative trend indicates more discharges than admissions."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientAdmissionChart;
