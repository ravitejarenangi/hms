'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const InventoryStockChart = () => {
  const [inventoryType, setInventoryType] = useState('Medications');

  // Sample data for inventory and stock levels
  const inventoryData = {
    Medications: {
      items: ['Antibiotics', 'Painkillers', 'Antivirals', 'Sedatives', 'Vaccines', 'Insulin', 'Steroids', 'Anticoagulants'],
      currentStock: [850, 1200, 450, 320, 780, 550, 380, 420],
      minimumRequired: [500, 800, 300, 200, 400, 300, 200, 250],
      reorderLevel: [600, 900, 350, 250, 500, 350, 250, 300],
      lowStockItems: ['Sedatives', 'Steroids'],
      criticalStockItems: [],
      expiringItems: ['Vaccines (50 units in 30 days)'],
      totalItems: 5950,
      totalValue: 1250000,
      recentlyOrdered: ['Antibiotics', 'Painkillers']
    },
    'Medical Supplies': {
      items: ['Syringes', 'Gloves', 'Masks', 'Bandages', 'Catheters', 'IV Sets', 'Surgical Gowns', 'Sutures'],
      currentStock: [5000, 12000, 8000, 3500, 1200, 2000, 1500, 900],
      minimumRequired: [3000, 8000, 5000, 2000, 800, 1200, 1000, 600],
      reorderLevel: [3500, 9000, 6000, 2500, 900, 1500, 1200, 700],
      lowStockItems: ['Sutures', 'Catheters'],
      criticalStockItems: [],
      expiringItems: [],
      totalItems: 34100,
      totalValue: 850000,
      recentlyOrdered: ['Gloves', 'Masks']
    },
    Equipment: {
      items: ['Ventilators', 'ECG Machines', 'Defibrillators', 'Oxygen Cylinders', 'Infusion Pumps', 'Patient Monitors', 'Surgical Tools', 'Wheelchairs'],
      currentStock: [25, 15, 20, 120, 45, 35, 80, 60],
      minimumRequired: [20, 10, 15, 80, 30, 25, 50, 40],
      reorderLevel: [22, 12, 17, 90, 35, 28, 60, 45],
      lowStockItems: ['ECG Machines', 'Patient Monitors'],
      criticalStockItems: [],
      expiringItems: [],
      totalItems: 400,
      totalValue: 3500000,
      recentlyOrdered: ['Ventilators', 'Oxygen Cylinders']
    },
    'Laboratory Supplies': {
      items: ['Test Tubes', 'Reagents', 'Microscope Slides', 'Culture Media', 'Pipettes', 'Lab Coats', 'Specimen Containers', 'Disinfectants'],
      currentStock: [3000, 850, 2500, 600, 1200, 200, 1500, 750],
      minimumRequired: [2000, 500, 1500, 400, 800, 150, 1000, 500],
      reorderLevel: [2200, 600, 1800, 450, 900, 170, 1200, 600],
      lowStockItems: ['Lab Coats', 'Culture Media'],
      criticalStockItems: [],
      expiringItems: ['Reagents (100 units in 45 days)'],
      totalItems: 10600,
      totalValue: 750000,
      recentlyOrdered: ['Test Tubes', 'Pipettes']
    }
  };

  const { items, currentStock, minimumRequired, reorderLevel, lowStockItems, criticalStockItems, expiringItems, totalItems, totalValue, recentlyOrdered } = inventoryData[inventoryType];

  // Prepare line chart data
  const lineChartOptions = {
    chart: {
      height: 350,
      type: 'line',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    colors: ['#4CAF50', '#FFC107', '#FF5252'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: [3, 3, 3],
      curve: 'straight',
      dashArray: [0, 0, 0]
    },
    legend: {
      position: 'top'
    },
    markers: {
      size: 5,
      hover: {
        size: 7
      }
    },
    xaxis: {
      categories: items,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Quantity'
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + " units";
        }
      }
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    }
  };

  const lineChartSeries = [
    {
      name: 'Current Stock',
      data: currentStock
    },
    {
      name: 'Reorder Level',
      data: reorderLevel
    },
    {
      name: 'Minimum Required',
      data: minimumRequired
    }
  ];

  // Calculate stock status percentages
  const totalItemTypes = items.length;
  const lowStockPercentage = (lowStockItems.length / totalItemTypes) * 100;
  const criticalStockPercentage = (criticalStockItems.length / totalItemTypes) * 100;
  const healthyStockPercentage = 100 - lowStockPercentage - criticalStockPercentage;

  // Prepare donut chart data for stock status
  const donutChartOptions = {
    chart: {
      type: 'donut',
      height: 250
    },
    labels: ['Healthy Stock', 'Low Stock', 'Critical Stock'],
    colors: ['#4CAF50', '#FFC107', '#FF5252'],
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '55%'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val.toFixed(1) + "%";
      }
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

  const donutChartSeries = [
    healthyStockPercentage,
    lowStockPercentage,
    criticalStockPercentage
  ];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Inventory & Stock Levels</h6>
          <select
            className="form-select bg-base form-select-sm w-auto"
            value={inventoryType}
            onChange={(e) => setInventoryType(e.target.value)}
          >
            <option value="Medications">Medications</option>
            <option value="Medical Supplies">Medical Supplies</option>
            <option value="Equipment">Equipment</option>
            <option value="Laboratory Supplies">Laboratory Supplies</option>
          </select>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-8">
            <ReactApexChart
              options={lineChartOptions}
              series={lineChartSeries}
              type="line"
              height={350}
            />
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-light rounded h-100">
              <h6 className="mb-3">Inventory Summary</h6>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Total {inventoryType}</p>
                <h5 className="mb-0">{totalItems.toLocaleString()} units</h5>
                <p className="text-sm text-muted mb-0">Value: {formatCurrency(totalValue)}</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm fw-medium mb-1">Stock Status</p>
                <ReactApexChart
                  options={donutChartOptions}
                  series={donutChartSeries}
                  type="donut"
                  height={180}
                />
              </div>
              
              {(lowStockItems.length > 0 || criticalStockItems.length > 0) && (
                <div className="mb-3">
                  <p className="text-sm fw-medium mb-1">Items Requiring Attention</p>
                  <ul className="list-unstyled mb-0">
                    {lowStockItems.map((item, index) => (
                      <li key={`low-${index}`} className="text-sm">
                        <Icon icon="mdi:alert" className="text-warning me-1" />
                        {item} (Low Stock)
                      </li>
                    ))}
                    {criticalStockItems.map((item, index) => (
                      <li key={`critical-${index}`} className="text-sm">
                        <Icon icon="mdi:alert-circle" className="text-danger me-1" />
                        {item} (Critical Stock)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {expiringItems.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm fw-medium mb-1">Expiring Soon</p>
                  <ul className="list-unstyled mb-0">
                    {expiringItems.map((item, index) => (
                      <li key={index} className="text-sm">
                        <Icon icon="mdi:clock-alert" className="text-warning me-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {recentlyOrdered.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm fw-medium mb-1">Recently Ordered</p>
                  <ul className="list-unstyled mb-0">
                    {recentlyOrdered.map((item, index) => (
                      <li key={index} className="text-sm">
                        <Icon icon="mdi:package-variant" className="text-info me-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="text-xl" />
                  <span className="text-sm">
                    WhatsApp notifications sent to suppliers for low stock items
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted mb-0">
            <Icon icon="mdi:information-outline" className="me-1" />
            This chart shows the current inventory levels compared to reorder levels and minimum required quantities.
            {lowStockItems.length > 0 
              ? ` There are ${lowStockItems.length} items with low stock that need attention.` 
              : ' All items are currently at healthy stock levels.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryStockChart;
