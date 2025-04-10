'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const RevenueBreakdownTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('amount');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterDoctor, setFilterDoctor] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewBy, setViewBy] = useState('department');

  // Sample revenue data
  const revenueData = [
    { id: 'REV001', department: 'Cardiology', doctor: 'Dr. Sarah Johnson', date: '2023-03-15', patientName: 'Charles Garcia', patientId: 'P015', serviceType: 'Consultation', amount: 12500, paymentMethod: 'Insurance' },
    { id: 'REV002', department: 'Oncology', doctor: 'Dr. William Brown', date: '2023-03-14', patientName: 'Richard Martin', patientId: 'P013', serviceType: 'Treatment', amount: 28500, paymentMethod: 'Insurance' },
    { id: 'REV003', department: 'Neurology', doctor: 'Dr. Michael Chen', date: '2023-03-12', patientName: 'Jennifer Anderson', patientId: 'P008', serviceType: 'Consultation', amount: 8500, paymentMethod: 'Self-Pay' },
    { id: 'REV004', department: 'Orthopedics', doctor: 'Dr. Emily Wilson', date: '2023-03-10', patientName: 'Michael Brown', patientId: 'P003', serviceType: 'Surgery', amount: 35000, paymentMethod: 'Insurance' },
    { id: 'REV005', department: 'Gastroenterology', doctor: 'Dr. James Miller', date: '2023-03-08', patientName: 'Barbara Lewis', patientId: 'P020', serviceType: 'Procedure', amount: 18500, paymentMethod: 'Insurance' },
    { id: 'REV006', department: 'Pulmonology', doctor: 'Dr. Robert Davis', date: '2023-03-05', patientName: 'Mary Harris', patientId: 'P012', serviceType: 'Consultation', amount: 7500, paymentMethod: 'Self-Pay' },
    { id: 'REV007', department: 'Cardiology', doctor: 'Dr. Sarah Johnson', date: '2023-03-02', patientName: 'Robert Taylor', patientId: 'P007', serviceType: 'Procedure', amount: 22000, paymentMethod: 'Insurance' },
    { id: 'REV008', department: 'Oncology', doctor: 'Dr. William Brown', date: '2023-02-28', patientName: 'Linda Martinez', patientId: 'P016', serviceType: 'Treatment', amount: 31500, paymentMethod: 'Insurance' },
    { id: 'REV009', department: 'Nephrology', doctor: 'Dr. Jennifer Lee', date: '2023-02-25', patientName: 'David Wilson', patientId: 'P005', serviceType: 'Procedure', amount: 16500, paymentMethod: 'Subsidy Scheme' },
    { id: 'REV010', department: 'Neurology', doctor: 'Dr. Michael Chen', date: '2023-02-22', patientName: 'Daniel Rodriguez', patientId: 'P019', serviceType: 'Consultation', amount: 9500, paymentMethod: 'Self-Pay' },
    { id: 'REV011', department: 'Orthopedics', doctor: 'Dr. Emily Wilson', date: '2023-02-18', patientName: 'Emily Johnson', patientId: 'P002', serviceType: 'Surgery', amount: 42000, paymentMethod: 'Insurance' },
    { id: 'REV012', department: 'Endocrinology', doctor: 'Dr. David Wang', date: '2023-02-15', patientName: 'Patricia Thompson', patientId: 'P014', serviceType: 'Consultation', amount: 8000, paymentMethod: 'Self-Pay' },
    { id: 'REV013', department: 'Geriatrics', doctor: 'Dr. Lisa Martinez', date: '2023-02-12', patientName: 'James Thomas', patientId: 'P009', serviceType: 'Consultation', amount: 7000, paymentMethod: 'Subsidy Scheme' },
    { id: 'REV014', department: 'Pulmonology', doctor: 'Dr. Robert Davis', date: '2023-02-08', patientName: 'Elizabeth Clark', patientId: 'P018', serviceType: 'Procedure', amount: 14500, paymentMethod: 'Insurance' },
    { id: 'REV015', department: 'Cardiology', doctor: 'Dr. Sarah Johnson', date: '2023-02-05', patientName: 'John Smith', patientId: 'P001', serviceType: 'Procedure', amount: 19500, paymentMethod: 'Insurance' },
    { id: 'REV016', department: 'Oncology', doctor: 'Dr. William Brown', date: '2023-02-01', patientName: 'Richard Martin', patientId: 'P013', serviceType: 'Treatment', amount: 27000, paymentMethod: 'Insurance' },
    { id: 'REV017', department: 'Gastroenterology', doctor: 'Dr. James Miller', date: '2023-01-28', patientName: 'Sarah Martinez', patientId: 'P006', serviceType: 'Procedure', amount: 17500, paymentMethod: 'Self-Pay' },
    { id: 'REV018', department: 'Nephrology', doctor: 'Dr. Jennifer Lee', date: '2023-01-25', patientName: 'William White', patientId: 'P011', serviceType: 'Consultation', amount: 8500, paymentMethod: 'Subsidy Scheme' },
    { id: 'REV019', department: 'Geriatrics', doctor: 'Dr. Lisa Martinez', date: '2023-01-22', patientName: 'Thomas Robinson', patientId: 'P017', serviceType: 'Consultation', amount: 6500, paymentMethod: 'Subsidy Scheme' },
    { id: 'REV020', department: 'Endocrinology', doctor: 'Dr. David Wang', date: '2023-01-18', patientName: 'Jessica Davis', patientId: 'P004', serviceType: 'Procedure', amount: 13500, paymentMethod: 'Insurance' }
  ];

  // Get unique departments and doctors for filter
  const uniqueDepartments = ['All', ...new Set(revenueData.map(revenue => revenue.department))];
  const uniqueDoctors = ['All', ...new Set(revenueData.map(revenue => revenue.doctor))];

  // Filter function
  const getFilteredData = () => {
    return revenueData.filter(revenue => {
      // Search term filter
      const searchMatch = 
        revenue.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        revenue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        revenue.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        revenue.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        revenue.amount.toString().includes(searchTerm.toLowerCase());
      
      // Department filter
      const departmentMatch = filterDepartment === 'All' || revenue.department === filterDepartment;
      
      // Doctor filter
      const doctorMatch = filterDoctor === 'All' || revenue.doctor === filterDoctor;
      
      // Date range filter
      let dateMatch = true;
      const revenueDate = new Date(revenue.date);
      const today = new Date();
      
      if (filterDateRange !== 'All') {
        switch (filterDateRange) {
          case 'Today':
            dateMatch = revenueDate.toDateString() === today.toDateString();
            break;
          case 'This Week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            dateMatch = revenueDate >= weekAgo;
            break;
          case 'This Month':
            dateMatch = revenueDate.getMonth() === today.getMonth() && 
                        revenueDate.getFullYear() === today.getFullYear();
            break;
          case 'Last 3 Months':
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(today.getMonth() - 3);
            dateMatch = revenueDate >= threeMonthsAgo;
            break;
          default:
            dateMatch = true;
        }
      }
      
      return searchMatch && departmentMatch && doctorMatch && dateMatch;
    });
  };

  // Sort function
  const getSortedData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle numeric fields
      if (sortField === 'amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Pagination function
  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return data.slice(startIndex, startIndex + rowsPerPage);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Process data with filters, sorting, and pagination
  const filteredData = getFilteredData();
  const sortedData = getSortedData(filteredData);
  const paginatedData = getPaginatedData(sortedData);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare data for breakdown by department, doctor, or date
  const prepareBreakdownData = () => {
    const breakdown = {};
    
    filteredData.forEach(revenue => {
      let key;
      
      if (viewBy === 'department') {
        key = revenue.department;
      } else if (viewBy === 'doctor') {
        key = revenue.doctor;
      } else if (viewBy === 'date') {
        // Group by month for date view
        const date = new Date(revenue.date);
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (viewBy === 'paymentMethod') {
        key = revenue.paymentMethod;
      } else if (viewBy === 'serviceType') {
        key = revenue.serviceType;
      }
      
      if (!breakdown[key]) {
        breakdown[key] = 0;
      }
      
      breakdown[key] += revenue.amount;
    });
    
    // Convert to array and sort by amount
    return Object.entries(breakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const breakdownData = prepareBreakdownData();
  
  // Calculate total revenue
  const totalRevenue = filteredData.reduce((sum, revenue) => sum + revenue.amount, 0);

  // Prepare chart data
  const chartOptions = {
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
      categories: breakdownData.map(item => item.name),
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px'
        }
      }
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
    colors: ['#4CAF50']
  };

  const chartSeries = [
    {
      name: 'Revenue',
      data: breakdownData.map(item => item.amount)
    }
  ];

  // Prepare pie chart for payment method distribution
  const paymentMethodDistribution = {};
  filteredData.forEach(revenue => {
    if (!paymentMethodDistribution[revenue.paymentMethod]) {
      paymentMethodDistribution[revenue.paymentMethod] = 0;
    }
    paymentMethodDistribution[revenue.paymentMethod] += revenue.amount;
  });

  const pieChartOptions = {
    chart: {
      type: 'pie',
      height: 250
    },
    labels: Object.keys(paymentMethodDistribution),
    colors: ['#3F51B5', '#2196F3', '#00BCD4'],
    legend: {
      position: 'bottom'
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
    }],
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val.toFixed(1) + "%";
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return formatCurrency(val);
        }
      }
    }
  };

  const pieChartSeries = Object.values(paymentMethodDistribution);

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
          <h6 className="text-lg mb-0">Total Revenue</h6>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-primary">
              <Icon icon="mdi:file-export" className="me-1" />
              Export
            </button>
            <button className="btn btn-sm btn-outline-primary">
              <Icon icon="mdi:printer" className="me-1" />
              Print
            </button>
            <button className="btn btn-sm btn-outline-primary">
              <Icon icon="mdi:whatsapp" className="me-1" />
              Share
            </button>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-8">
            <div className="d-flex flex-wrap gap-2">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <Icon icon="mdi:magnify" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search revenue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="form-select"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                {uniqueDepartments.map((department, index) => (
                  <option key={index} value={department}>{department === 'All' ? 'All Departments' : department}</option>
                ))}
              </select>
              
              <select
                className="form-select"
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
              >
                {uniqueDoctors.map((doctor, index) => (
                  <option key={index} value={doctor}>{doctor === 'All' ? 'All Doctors' : doctor}</option>
                ))}
              </select>
              
              <select
                className="form-select"
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Last 3 Months">Last 3 Months</option>
              </select>
            </div>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <div className="d-flex justify-content-md-end align-items-center gap-2">
              <span className="text-sm text-muted">Show</span>
              <select
                className="form-select form-select-sm w-auto"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-muted">entries</span>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-light mb-4">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <h5 className="mb-1">Total Revenue</h5>
                    <h3 className="mb-0 text-success">{formatCurrency(totalRevenue)}</h3>
                  </div>
                  <div className="col-md-8">
                    <div className="d-flex flex-wrap justify-content-md-end gap-2 mt-3 mt-md-0">
                      <div className="btn-group">
                        <button 
                          className={`btn btn-sm ${viewBy === 'department' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewBy('department')}
                        >
                          By Department
                        </button>
                        <button 
                          className={`btn btn-sm ${viewBy === 'doctor' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewBy('doctor')}
                        >
                          By Doctor
                        </button>
                        <button 
                          className={`btn btn-sm ${viewBy === 'date' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewBy('date')}
                        >
                          By Date
                        </button>
                        <button 
                          className={`btn btn-sm ${viewBy === 'serviceType' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewBy('serviceType')}
                        >
                          By Service
                        </button>
                        <button 
                          className={`btn btn-sm ${viewBy === 'paymentMethod' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewBy('paymentMethod')}
                        >
                          By Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-8">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="mb-3">Revenue Breakdown by {viewBy.charAt(0).toUpperCase() + viewBy.slice(1)}</h6>
                <ReactApexChart
                  options={chartOptions}
                  series={chartSeries}
                  type="bar"
                  height={350}
                />
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="mb-3">Payment Method Distribution</h6>
                <ReactApexChart
                  options={pieChartOptions}
                  series={pieChartSeries}
                  type="pie"
                  height={250}
                />
                <div className="mt-4">
                  <div className="d-flex align-items-center gap-2">
                    <Icon icon="logos:whatsapp-icon" className="text-xl" />
                    <span className="text-sm">
                      Send revenue reports via WhatsApp
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} className="cursor-pointer">
                      ID {sortField === 'id' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('date')} className="cursor-pointer">
                      Date {sortField === 'date' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('patientName')} className="cursor-pointer">
                      Patient {sortField === 'patientName' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('department')} className="cursor-pointer">
                      Department {sortField === 'department' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('doctor')} className="cursor-pointer">
                      Doctor {sortField === 'doctor' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('serviceType')} className="cursor-pointer">
                      Service {sortField === 'serviceType' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('paymentMethod')} className="cursor-pointer">
                      Payment {sortField === 'paymentMethod' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('amount')} className="cursor-pointer">
                      Amount {sortField === 'amount' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((revenue) => (
                    <tr key={revenue.id}>
                      <td>{revenue.id}</td>
                      <td>{revenue.date}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-xs me-2 bg-primary-light rounded-circle">
                            <span className="avatar-text">{revenue.patientName.charAt(0)}</span>
                          </div>
                          <div>
                            <div>{revenue.patientName}</div>
                            <div className="text-xs text-muted">{revenue.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">{revenue.department}</span>
                      </td>
                      <td>{revenue.doctor}</td>
                      <td>{revenue.serviceType}</td>
                      <td>
                        <span className={`badge ${
                          revenue.paymentMethod === 'Insurance' ? 'bg-primary' : 
                          revenue.paymentMethod === 'Self-Pay' ? 'bg-success' : 
                          'bg-info'
                        }`}>
                          {revenue.paymentMethod}
                        </span>
                      </td>
                      <td className="fw-medium">{formatCurrency(revenue.amount)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-icon btn-outline-primary">
                            <Icon icon="mdi:eye" />
                          </button>
                          <button className="btn btn-sm btn-icon btn-outline-success">
                            <Icon icon="mdi:whatsapp" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-sm text-muted">
                Showing {Math.min(filteredData.length, 1 + (currentPage - 1) * rowsPerPage)} to {Math.min(filteredData.length, currentPage * rowsPerPage)} of {filteredData.length} entries
              </div>
              <div className="btn-group">
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  disabled={currentPage * rowsPerPage >= filteredData.length}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakdownTable;
