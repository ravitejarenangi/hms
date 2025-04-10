'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const PatientCareOutcomeChart = () => {
  const [timeRange, setTimeRange] = useState('Yearly');
  const [metricType, setMetricType] = useState('Recovery');

  // Sample data for patient care outcomes
  const outcomeData = {
    Yearly: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      recovery: {
        title: 'Patient Recovery Rate',
        data: [78, 80, 79, 82, 83, 85, 84, 86, 88, 87, 89, 90],
        description: 'Percentage of patients who fully recovered after treatment',
        trend: 'positive',
        change: '+12%',
        color: '#4CAF50'
      },
      readmission: {
        title: 'Readmission Rate',
        data: [12, 11, 12, 10, 9, 8, 9, 7, 6, 7, 6, 5],
        description: 'Percentage of patients readmitted within 30 days',
        trend: 'negative',
        change: '-7%',
        color: '#F44336'
      },
      satisfaction: {
        title: 'Patient Satisfaction Score',
        data: [82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93],
        description: 'Average patient satisfaction score (out of 100)',
        trend: 'positive',
        change: '+11%',
        color: '#2196F3'
      },
      mortality: {
        title: 'Mortality Rate',
        data: [4.2, 4.1, 4.0, 3.9, 3.8, 3.7, 3.6, 3.5, 3.4, 3.3, 3.2, 3.1],
        description: 'Percentage of patients who died during treatment',
        trend: 'negative',
        change: '-1.1%',
        color: '#FF5722'
      },
      complications: {
        title: 'Treatment Complications',
        data: [15, 14, 14, 13, 12, 11, 10, 9, 9, 8, 7, 7],
        description: 'Percentage of patients who experienced complications',
        trend: 'negative',
        change: '-8%',
        color: '#9C27B0'
      }
    },
    Quarterly: {
      months: ['Q1', 'Q2', 'Q3', 'Q4'],
      recovery: {
        title: 'Patient Recovery Rate',
        data: [79, 83, 86, 89],
        description: 'Percentage of patients who fully recovered after treatment',
        trend: 'positive',
        change: '+10%',
        color: '#4CAF50'
      },
      readmission: {
        title: 'Readmission Rate',
        data: [11.7, 9, 7.3, 6],
        description: 'Percentage of patients readmitted within 30 days',
        trend: 'negative',
        change: '-5.7%',
        color: '#F44336'
      },
      satisfaction: {
        title: 'Patient Satisfaction Score',
        data: [83, 86, 89, 92],
        description: 'Average patient satisfaction score (out of 100)',
        trend: 'positive',
        change: '+9%',
        color: '#2196F3'
      },
      mortality: {
        title: 'Mortality Rate',
        data: [4.1, 3.8, 3.5, 3.2],
        description: 'Percentage of patients who died during treatment',
        trend: 'negative',
        change: '-0.9%',
        color: '#FF5722'
      },
      complications: {
        title: 'Treatment Complications',
        data: [14.3, 12, 9.3, 7.3],
        description: 'Percentage of patients who experienced complications',
        trend: 'negative',
        change: '-7%',
        color: '#9C27B0'
      }
    },
    Monthly: {
      months: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      recovery: {
        title: 'Patient Recovery Rate',
        data: [88, 89, 90, 91],
        description: 'Percentage of patients who fully recovered after treatment',
        trend: 'positive',
        change: '+3%',
        color: '#4CAF50'
      },
      readmission: {
        title: 'Readmission Rate',
        data: [6, 5.8, 5.5, 5.2],
        description: 'Percentage of patients readmitted within 30 days',
        trend: 'negative',
        change: '-0.8%',
        color: '#F44336'
      },
      satisfaction: {
        title: 'Patient Satisfaction Score',
        data: [91, 92, 92, 93],
        description: 'Average patient satisfaction score (out of 100)',
        trend: 'positive',
        change: '+2%',
        color: '#2196F3'
      },
      mortality: {
        title: 'Mortality Rate',
        data: [3.3, 3.2, 3.1, 3.0],
        description: 'Percentage of patients who died during treatment',
        trend: 'negative',
        change: '-0.3%',
        color: '#FF5722'
      },
      complications: {
        title: 'Treatment Complications',
        data: [8, 7.5, 7.2, 7],
        description: 'Percentage of patients who experienced complications',
        trend: 'negative',
        change: '-1%',
        color: '#9C27B0'
      }
    }
  };

  const { months } = outcomeData[timeRange];
  const selectedMetric = outcomeData[timeRange][metricType.toLowerCase()];

  // Prepare chart options
  const chartOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    colors: [selectedMetric.color],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    markers: {
      size: 4,
      colors: [selectedMetric.color],
      strokeColors: '#fff',
      strokeWidth: 2,
    },
    xaxis: {
      categories: months,
    },
    yaxis: {
      title: {
        text: selectedMetric.title,
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + (metricType === 'Satisfaction' ? ' points' : '%');
        },
      },
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      },
    },
  };

  const chartSeries = [
    {
      name: selectedMetric.title,
      data: selectedMetric.data,
    },
  ];

  // Calculate average value
  const averageValue = (selectedMetric.data.reduce((a, b) => a + b, 0) / selectedMetric.data.length).toFixed(1);

  // Determine if the trend is positive or negative for the selected metric
  const isPositiveTrend = selectedMetric.trend === 'positive';
  
  // For metrics like readmission, mortality, and complications, a negative trend is actually good
  const isGoodTrend = (metricType === 'Recovery' || metricType === 'Satisfaction') ? isPositiveTrend : !isPositiveTrend;

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Patient Care & Treatment Outcomes</h6>
          <div className="d-flex gap-2">
            <select
              className="form-select bg-base form-select-sm w-auto"
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
            >
              <option value="Recovery">Recovery Rate</option>
              <option value="Readmission">Readmission Rate</option>
              <option value="Satisfaction">Patient Satisfaction</option>
              <option value="Mortality">Mortality Rate</option>
              <option value="Complications">Complications Rate</option>
            </select>
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
        </div>
        
        <div className="mt-4">
          <div className="d-flex flex-wrap align-items-center gap-4 mb-4">
            <div>
              <p className="text-sm fw-medium mb-1">{selectedMetric.title}</p>
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">{averageValue}{metricType === 'Satisfaction' ? ' points' : '%'}</h5>
                <span className={`d-inline-flex align-items-center gap-1 ${isGoodTrend ? 'text-success-main' : 'text-danger-main'}`}>
                  <Icon icon={isPositiveTrend ? 'bxs:up-arrow' : 'bxs:down-arrow'} className="text-xs" />
                  {selectedMetric.change}
                </span>
              </div>
            </div>
            <div className="ms-auto">
              <span className={`badge ${isGoodTrend ? 'bg-success' : 'bg-danger'}`}>
                {isGoodTrend ? 'Improving' : 'Needs Attention'}
              </span>
            </div>
          </div>
          
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="line"
            height={350}
          />
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            {selectedMetric.description}. 
            {isGoodTrend 
              ? " The trend shows improvement in patient outcomes." 
              : " This metric requires attention to improve patient outcomes."}
          </p>
          
          {metricType === 'Recovery' && (
            <div className="mt-3 p-3 bg-light rounded">
              <h6 className="mb-2">WhatsApp Notification Status</h6>
              <div className="d-flex align-items-center gap-2">
                <Icon icon="logos:whatsapp-icon" className="text-xl" />
                <span className="text-sm">
                  Treatment follow-up reminders sent to 98% of discharged patients via WhatsApp
                </span>
              </div>
            </div>
          )}
          
          {metricType === 'Satisfaction' && (
            <div className="mt-3 p-3 bg-light rounded">
              <h6 className="mb-2">WhatsApp Notification Status</h6>
              <div className="d-flex align-items-center gap-2">
                <Icon icon="logos:whatsapp-icon" className="text-xl" />
                <span className="text-sm">
                  Satisfaction surveys sent to 100% of discharged patients via WhatsApp
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCareOutcomeChart;
