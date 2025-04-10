'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const AdmissionsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('admissionDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterDoctor, setFilterDoctor] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');

  // Sample admissions data
  const admissionsData = [
    { id: 'ADM001', patientId: 'P015', patientName: 'Charles Garcia', admissionDate: '2023-03-15', doctor: 'Dr. Sarah Johnson', department: 'Cardiology', reason: 'Chest Pain', status: 'Active', roomNo: '205' },
    { id: 'ADM002', patientId: 'P008', patientName: 'Jennifer Anderson', admissionDate: '2023-03-14', doctor: 'Dr. Michael Chen', department: 'Neurology', reason: 'Severe Headache', status: 'Active', roomNo: '312' },
    { id: 'ADM003', patientId: 'P003', patientName: 'Michael Brown', admissionDate: '2023-03-12', doctor: 'Dr. Emily Wilson', department: 'Orthopedics', reason: 'Fractured Femur', status: 'Active', roomNo: '118' },
    { id: 'ADM004', patientId: 'P020', patientName: 'Barbara Lewis', admissionDate: '2023-03-10', doctor: 'Dr. James Miller', department: 'Gastroenterology', reason: 'Abdominal Pain', status: 'Active', roomNo: '225' },
    { id: 'ADM005', patientId: 'P012', patientName: 'Mary Harris', admissionDate: '2023-03-08', doctor: 'Dr. Robert Davis', department: 'Pulmonology', reason: 'Respiratory Distress', status: 'Active', roomNo: '304' },
    { id: 'ADM006', patientId: 'P007', patientName: 'Robert Taylor', admissionDate: '2023-03-05', doctor: 'Dr. Sarah Johnson', department: 'Cardiology', reason: 'Arrhythmia', status: 'Active', roomNo: '207' },
    { id: 'ADM007', patientId: 'P016', patientName: 'Linda Martinez', admissionDate: '2023-03-02', doctor: 'Dr. William Brown', department: 'Oncology', reason: 'Chemotherapy', status: 'Active', roomNo: '410' },
    { id: 'ADM008', patientId: 'P005', patientName: 'David Wilson', admissionDate: '2023-02-28', doctor: 'Dr. Jennifer Lee', department: 'Nephrology', reason: 'Kidney Failure', status: 'Active', roomNo: '315' },
    { id: 'ADM009', patientId: 'P019', patientName: 'Daniel Rodriguez', admissionDate: '2023-02-25', doctor: 'Dr. Michael Chen', department: 'Neurology', reason: 'Stroke', status: 'Active', roomNo: '310' },
    { id: 'ADM010', patientId: 'P002', patientName: 'Emily Johnson', admissionDate: '2023-02-22', doctor: 'Dr. Emily Wilson', department: 'Orthopedics', reason: 'Hip Replacement', status: 'Active', roomNo: '120' },
    { id: 'ADM011', patientId: 'P014', patientName: 'Patricia Thompson', admissionDate: '2023-02-18', doctor: 'Dr. David Wang', department: 'Endocrinology', reason: 'Diabetic Ketoacidosis', status: 'Active', roomNo: '218' },
    { id: 'ADM012', patientId: 'P009', patientName: 'James Thomas', admissionDate: '2023-02-15', doctor: 'Dr. Lisa Martinez', department: 'Geriatrics', reason: 'Pneumonia', status: 'Active', roomNo: '230' },
    { id: 'ADM013', patientId: 'P018', patientName: 'Elizabeth Clark', admissionDate: '2023-02-12', doctor: 'Dr. Robert Davis', department: 'Pulmonology', reason: 'COPD Exacerbation', status: 'Active', roomNo: '306' },
    { id: 'ADM014', patientId: 'P001', patientName: 'John Smith', admissionDate: '2023-02-08', doctor: 'Dr. Sarah Johnson', department: 'Cardiology', reason: 'Heart Failure', status: 'Active', roomNo: '209' },
    { id: 'ADM015', patientId: 'P013', patientName: 'Richard Martin', admissionDate: '2023-02-05', doctor: 'Dr. William Brown', department: 'Oncology', reason: 'Lymphoma Treatment', status: 'Active', roomNo: '412' },
    { id: 'ADM016', patientId: 'P006', patientName: 'Sarah Martinez', admissionDate: '2023-02-01', doctor: 'Dr. James Miller', department: 'Gastroenterology', reason: 'Gastrointestinal Bleeding', status: 'Active', roomNo: '227' },
    { id: 'ADM017', patientId: 'P011', patientName: 'William White', admissionDate: '2023-01-28', doctor: 'Dr. Jennifer Lee', department: 'Nephrology', reason: 'Acute Kidney Injury', status: 'Active', roomNo: '317' },
    { id: 'ADM018', patientId: 'P017', patientName: 'Thomas Robinson', admissionDate: '2023-01-25', doctor: 'Dr. Lisa Martinez', department: 'Geriatrics', reason: 'Dehydration', status: 'Active', roomNo: '232' },
    { id: 'ADM019', patientId: 'P004', patientName: 'Jessica Davis', admissionDate: '2023-01-22', doctor: 'Dr. David Wang', department: 'Endocrinology', reason: 'Thyroid Storm', status: 'Active', roomNo: '220' },
    { id: 'ADM020', patientId: 'P010', patientName: 'Lisa Jackson', admissionDate: '2023-01-18', doctor: 'Dr. Michael Chen', department: 'Neurology', reason: 'Seizure Disorder', status: 'Active', roomNo: '314' }
  ];

  // Get unique departments and doctors for filter
  const uniqueDepartments = ['All', ...new Set(admissionsData.map(admission => admission.department))];
  const uniqueDoctors = ['All', ...new Set(admissionsData.map(admission => admission.doctor))];

  // Filter function
  const getFilteredData = () => {
    return admissionsData.filter(admission => {
      // Search term filter
      const searchMatch = 
        admission.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.roomNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Department filter
      const departmentMatch = filterDepartment === 'All' || admission.department === filterDepartment;
      
      // Doctor filter
      const doctorMatch = filterDoctor === 'All' || admission.doctor === filterDoctor;
      
      // Date range filter
      let dateMatch = true;
      const admissionDate = new Date(admission.admissionDate);
      const today = new Date();
      
      if (filterDateRange !== 'All') {
        switch (filterDateRange) {
          case 'Today':
            dateMatch = admissionDate.toDateString() === today.toDateString();
            break;
          case 'This Week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            dateMatch = admissionDate >= weekAgo;
            break;
          case 'This Month':
            dateMatch = admissionDate.getMonth() === today.getMonth() && 
                        admissionDate.getFullYear() === today.getFullYear();
            break;
          case 'Last 3 Months':
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(today.getMonth() - 3);
            dateMatch = admissionDate >= threeMonthsAgo;
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

  // Calculate statistics
  const totalAdmissions = filteredData.length;
  
  // Department distribution
  const departmentDistribution = {};
  filteredData.forEach(admission => {
    departmentDistribution[admission.department] = (departmentDistribution[admission.department] || 0) + 1;
  });
  
  const topDepartments = Object.entries(departmentDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([department, count]) => ({ 
      department, 
      count, 
      percentage: ((count / totalAdmissions) * 100).toFixed(1) 
    }));
  
  // Doctor distribution
  const doctorDistribution = {};
  filteredData.forEach(admission => {
    doctorDistribution[admission.doctor] = (doctorDistribution[admission.doctor] || 0) + 1;
  });
  
  const topDoctors = Object.entries(doctorDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([doctor, count]) => ({ 
      doctor, 
      count, 
      percentage: ((count / totalAdmissions) * 100).toFixed(1) 
    }));
  
  // Reason distribution
  const reasonDistribution = {};
  filteredData.forEach(admission => {
    reasonDistribution[admission.reason] = (reasonDistribution[admission.reason] || 0) + 1;
  });
  
  const topReasons = Object.entries(reasonDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => ({ 
      reason, 
      count, 
      percentage: ((count / totalAdmissions) * 100).toFixed(1) 
    }));

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
          <h6 className="text-lg mb-0">Total Admissions</h6>
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
                  placeholder="Search admissions..."
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
          <div className="col-md-8">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} className="cursor-pointer">
                      ID {sortField === 'id' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('patientName')} className="cursor-pointer">
                      Patient {sortField === 'patientName' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('admissionDate')} className="cursor-pointer">
                      Date {sortField === 'admissionDate' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('doctor')} className="cursor-pointer">
                      Doctor {sortField === 'doctor' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('department')} className="cursor-pointer">
                      Department {sortField === 'department' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('reason')} className="cursor-pointer">
                      Reason {sortField === 'reason' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('roomNo')} className="cursor-pointer">
                      Room {sortField === 'roomNo' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((admission) => (
                    <tr key={admission.id}>
                      <td>{admission.id}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-xs me-2 bg-primary-light rounded-circle">
                            <span className="avatar-text">{admission.patientName.charAt(0)}</span>
                          </div>
                          <div>
                            <div>{admission.patientName}</div>
                            <div className="text-xs text-muted">{admission.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td>{admission.admissionDate}</td>
                      <td>{admission.doctor}</td>
                      <td>
                        <span className="badge bg-light text-dark">{admission.department}</span>
                      </td>
                      <td>{admission.reason}</td>
                      <td>{admission.roomNo}</td>
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

          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="mb-3">Admission Statistics</h6>
                
                <div className="mb-4">
                  <p className="text-sm fw-medium mb-1">Top Departments</p>
                  <div className="d-flex flex-column gap-2">
                    {topDepartments.map((item, index) => (
                      <div key={index}>
                        <div className="d-flex justify-content-between text-sm mb-1">
                          <span>{item.department}</span>
                          <span>{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{ width: `${item.percentage}%` }}
                            aria-valuenow={item.percentage} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm fw-medium mb-1">Top Doctors</p>
                  <div className="d-flex flex-column gap-2">
                    {topDoctors.map((item, index) => (
                      <div key={index}>
                        <div className="d-flex justify-content-between text-sm mb-1">
                          <span>{item.doctor.replace('Dr. ', '')}</span>
                          <span>{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ width: `${item.percentage}%` }}
                            aria-valuenow={item.percentage} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm fw-medium mb-1">Top Reasons for Admission</p>
                  <div className="d-flex flex-column gap-2">
                    {topReasons.map((item, index) => (
                      <div key={index}>
                        <div className="d-flex justify-content-between text-sm mb-1">
                          <span>{item.reason}</span>
                          <span>{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-info" 
                            role="progressbar" 
                            style={{ width: `${item.percentage}%` }}
                            aria-valuenow={item.percentage} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="d-flex align-items-center gap-2">
                    <Icon icon="logos:whatsapp-icon" className="text-xl" />
                    <span className="text-sm">
                      Send admission alerts via WhatsApp
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionsTable;
