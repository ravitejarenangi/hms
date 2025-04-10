'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const ExpensesBreakdownTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('amount');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewBy, setViewBy] = useState('department');

  // Sample expenses data
  const expensesData = [
    { id: 'EXP001', department: 'Cardiology', date: '2023-03-15', category: 'Staff Salaries', description: 'Medical Staff Salaries', amount: 85000, approvedBy: 'Dr. Sarah Johnson', paymentStatus: 'Paid' },
    { id: 'EXP002', department: 'Pharmacy', date: '2023-03-14', category: 'Medications', description: 'Monthly Medication Stock', amount: 62000, approvedBy: 'Dr. William Brown', paymentStatus: 'Paid' },
    { id: 'EXP003', department: 'Radiology', date: '2023-03-12', category: 'Equipment', description: 'MRI Machine Maintenance', amount: 35000, approvedBy: 'Dr. Michael Chen', paymentStatus: 'Paid' },
    { id: 'EXP004', department: 'Orthopedics', date: '2023-03-10', category: 'Medical Supplies', description: 'Surgical Supplies', amount: 28000, approvedBy: 'Dr. Emily Wilson', paymentStatus: 'Paid' },
    { id: 'EXP005', department: 'Administration', date: '2023-03-08', category: 'Utilities', description: 'Electricity and Water Bills', amount: 42000, approvedBy: 'James Miller', paymentStatus: 'Paid' },
    { id: 'EXP006', department: 'Housekeeping', date: '2023-03-05', category: 'Maintenance', description: 'Building Maintenance', amount: 18000, approvedBy: 'Robert Davis', paymentStatus: 'Paid' },
    { id: 'EXP007', department: 'Laboratory', date: '2023-03-02', category: 'Medical Supplies', description: 'Lab Reagents and Supplies', amount: 32000, approvedBy: 'Dr. Jennifer Lee', paymentStatus: 'Paid' },
    { id: 'EXP008', department: 'Oncology', date: '2023-02-28', category: 'Equipment', description: 'Radiation Therapy Equipment Lease', amount: 75000, approvedBy: 'Dr. William Brown', paymentStatus: 'Paid' },
    { id: 'EXP009', department: 'Emergency', date: '2023-02-25', category: 'Medical Supplies', description: 'Emergency Supplies Restock', amount: 25000, approvedBy: 'Dr. Lisa Martinez', paymentStatus: 'Paid' },
    { id: 'EXP010', department: 'Neurology', date: '2023-02-22', category: 'Staff Salaries', description: 'Department Staff Salaries', amount: 68000, approvedBy: 'Dr. Michael Chen', paymentStatus: 'Paid' },
    { id: 'EXP011', department: 'IT Department', date: '2023-02-18', category: 'Software', description: 'Hospital Management System License', amount: 45000, approvedBy: 'David Wang', paymentStatus: 'Paid' },
    { id: 'EXP012', department: 'Cafeteria', date: '2023-02-15', category: 'Food Supplies', description: 'Monthly Food Supplies', amount: 22000, approvedBy: 'Patricia Thompson', paymentStatus: 'Paid' },
    { id: 'EXP013', department: 'Administration', date: '2023-02-12', category: 'Insurance', description: 'Hospital Insurance Premium', amount: 85000, approvedBy: 'James Thomas', paymentStatus: 'Paid' },
    { id: 'EXP014', department: 'Pulmonology', date: '2023-02-08', category: 'Equipment', description: 'Ventilator Maintenance', amount: 18000, approvedBy: 'Dr. Robert Davis', paymentStatus: 'Paid' },
    { id: 'EXP015', department: 'Cardiology', date: '2023-02-05', category: 'Medical Supplies', description: 'Cardiac Catheterization Supplies', amount: 32000, approvedBy: 'Dr. Sarah Johnson', paymentStatus: 'Paid' },
    { id: 'EXP016', department: 'Pharmacy', date: '2023-02-01', category: 'Medications', description: 'Specialty Medications', amount: 58000, approvedBy: 'Dr. William Brown', paymentStatus: 'Paid' },
    { id: 'EXP017', department: 'Human Resources', date: '2023-01-28', category: 'Staff Training', description: 'Staff Development Program', amount: 28000, approvedBy: 'Sarah Martinez', paymentStatus: 'Paid' },
    { id: 'EXP018', department: 'Administration', date: '2023-01-25', category: 'Marketing', description: 'Hospital Marketing Campaign', amount: 35000, approvedBy: 'William White', paymentStatus: 'Paid' },
    { id: 'EXP019', department: 'Security', date: '2023-01-22', category: 'Staff Salaries', description: 'Security Staff Salaries', amount: 32000, approvedBy: 'Thomas Robinson', paymentStatus: 'Paid' },
    { id: 'EXP020', department: 'Administration', date: '2023-01-18', category: 'Administrative', description: 'Office Supplies and Equipment', amount: 15000, approvedBy: 'Jessica Davis', paymentStatus: 'Paid' }
  ];

  // Get unique departments and categories for filter
  const uniqueDepartments = ['All', ...new Set(expensesData.map(expense => expense.department))];
  const uniqueCategories = ['All', ...new Set(expensesData.map(expense => expense.category))];

  // Filter function
  const getFilteredData = () => {
    return expensesData.filter(expense => {
      // Search term filter
      const searchMatch = 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.approvedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount.toString().includes(searchTerm.toLowerCase());
      
      // Department filter
      const departmentMatch = filterDepartment === 'All' || expense.department === filterDepartment;
      
      // Category filter
      const categoryMatch = filterCategory === 'All' || expense.category === filterCategory;
      
      // Date range filter
      let dateMatch = true;
      const expenseDate = new Date(expense.date);
      const today = new Date();
      
      if (filterDateRange !== 'All') {
        switch (filterDateRange) {
          case 'Today':
            dateMatch = expenseDate.toDateString() === today.toDateString();
            break;
          case 'This Week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            dateMatch = expenseDate >= weekAgo;
            break;
          case 'This Month':
            dateMatch = expenseDate.getMonth() === today.getMonth() && 
                        expenseDate.getFullYear() === today.getFullYear();
            break;
          case 'Last 3 Months':
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(today.getMonth() - 3);
            dateMatch = expenseDate >= threeMonthsAgo;
            break;
          default:
            dateMatch = true;
        }
      }
      
      return searchMatch && departmentMatch && categoryMatch && dateMatch;
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

  // Prepare data for breakdown by department, category, or date
  const prepareBreakdownData = () => {
    const breakdown = {};
    
    filteredData.forEach(expense => {
      let key;
      
      if (viewBy === 'department') {
        key = expense.department;
      } else if (viewBy === 'category') {
        key = expense.category;
      } else if (viewBy === 'date') {
        // Group by month for date view
        const date = new Date(expense.date);
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      if (!breakdown[key]) {
        breakdown[key] = 0;
      }
      
      breakdown[key] += expense.amount;
    });
    
    // Convert to array and sort by amount
    return Object.entries(breakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const breakdownData = prepareBreakdownData();
  
  // Calculate total expenses
  const totalExpenses = filteredData.reduce((sum, expense) => sum + expense.amount, 0);

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
    colors: ['#F44336']
  };

  const chartSeries = [
    {
      name: 'Expenses',
      data: breakdownData.map(item => item.amount)
    }
  ];

  // Prepare pie chart for expense category distribution
  const categoryDistribution = {};
  filteredData.forEach(expense => {
    if (!categoryDistribution[expense.category]) {
      categoryDistribution[expense.category] = 0;
    }
    categoryDistribution[expense.category] += expense.amount;
  });

  const pieChartOptions = {
    chart: {
      type: 'pie',
      height: 250
    },
    labels: Object.keys(categoryDistribution),
    colors: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4'],
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

  const pieChartSeries = Object.values(categoryDistribution);

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
          <h6 className="text-lg mb-0">Total Expenses</h6>
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
                  placeholder="Search expenses..."
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
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {uniqueCategories.map((category, index) => (
                  <option key={index} value={category}>{category === 'All' ? 'All Categories' : category}</option>
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
                    <h5 className="mb-1">Total Expenses</h5>
                    <h3 className="mb-0 text-danger">{formatCurrency(totalExpenses)}</h3>
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
                          className={`btn btn-sm ${viewBy === 'category' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewBy('category')}
                        >
                          By Category
                        </button>
                        <button 
                          className={`btn btn-sm ${viewBy === 'date' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewBy('date')}
                        >
                          By Date
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
                <h6 className="mb-3">Expenses Breakdown by {viewBy.charAt(0).toUpperCase() + viewBy.slice(1)}</h6>
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
                <h6 className="mb-3">Expense Category Distribution</h6>
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
                      Send expense reports via WhatsApp
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
                    <th onClick={() => handleSort('department')} className="cursor-pointer">
                      Department {sortField === 'department' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('category')} className="cursor-pointer">
                      Category {sortField === 'category' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('description')} className="cursor-pointer">
                      Description {sortField === 'description' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('approvedBy')} className="cursor-pointer">
                      Approved By {sortField === 'approvedBy' && (
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
                  {paginatedData.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.id}</td>
                      <td>{expense.date}</td>
                      <td>
                        <span className="badge bg-light text-dark">{expense.department}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          expense.category === 'Staff Salaries' ? 'bg-primary' : 
                          expense.category === 'Medications' ? 'bg-success' : 
                          expense.category === 'Equipment' ? 'bg-warning' :
                          expense.category === 'Medical Supplies' ? 'bg-info' :
                          expense.category === 'Utilities' ? 'bg-secondary' :
                          expense.category === 'Maintenance' ? 'bg-danger' :
                          'bg-dark'
                        }`}>
                          {expense.category}
                        </span>
                      </td>
                      <td>{expense.description}</td>
                      <td>{expense.approvedBy}</td>
                      <td className="fw-medium">{formatCurrency(expense.amount)}</td>
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

export default ExpensesBreakdownTable;
