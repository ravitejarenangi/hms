'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const PatientDemographicsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterState, setFilterState] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterAgeGroup, setFilterAgeGroup] = useState('All');

  // Sample patient data
  const patientData = [
    { id: 'P001', name: 'John Smith', age: 45, gender: 'Male', city: 'New York', state: 'NY', contact: '+1 (212) 555-1234', registrationDate: '2023-01-15' },
    { id: 'P002', name: 'Emily Johnson', age: 32, gender: 'Female', city: 'Los Angeles', state: 'CA', contact: '+1 (310) 555-5678', registrationDate: '2023-02-20' },
    { id: 'P003', name: 'Michael Brown', age: 58, gender: 'Male', city: 'Chicago', state: 'IL', contact: '+1 (312) 555-9012', registrationDate: '2023-01-05' },
    { id: 'P004', name: 'Jessica Davis', age: 27, gender: 'Female', city: 'Houston', state: 'TX', contact: '+1 (713) 555-3456', registrationDate: '2023-03-10' },
    { id: 'P005', name: 'David Wilson', age: 63, gender: 'Male', city: 'Phoenix', state: 'AZ', contact: '+1 (602) 555-7890', registrationDate: '2023-02-18' },
    { id: 'P006', name: 'Sarah Martinez', age: 41, gender: 'Female', city: 'Philadelphia', state: 'PA', contact: '+1 (215) 555-2345', registrationDate: '2023-01-30' },
    { id: 'P007', name: 'Robert Taylor', age: 52, gender: 'Male', city: 'San Antonio', state: 'TX', contact: '+1 (210) 555-6789', registrationDate: '2023-03-05' },
    { id: 'P008', name: 'Jennifer Anderson', age: 36, gender: 'Female', city: 'San Diego', state: 'CA', contact: '+1 (619) 555-0123', registrationDate: '2023-02-12' },
    { id: 'P009', name: 'James Thomas', age: 70, gender: 'Male', city: 'Dallas', state: 'TX', contact: '+1 (214) 555-4567', registrationDate: '2023-01-22' },
    { id: 'P010', name: 'Lisa Jackson', age: 29, gender: 'Female', city: 'San Jose', state: 'CA', contact: '+1 (408) 555-8901', registrationDate: '2023-03-18' },
    { id: 'P011', name: 'William White', age: 48, gender: 'Male', city: 'Austin', state: 'TX', contact: '+1 (512) 555-2345', registrationDate: '2023-01-08' },
    { id: 'P012', name: 'Mary Harris', age: 55, gender: 'Female', city: 'Jacksonville', state: 'FL', contact: '+1 (904) 555-6789', registrationDate: '2023-02-25' },
    { id: 'P013', name: 'Richard Martin', age: 67, gender: 'Male', city: 'San Francisco', state: 'CA', contact: '+1 (415) 555-0123', registrationDate: '2023-03-02' },
    { id: 'P014', name: 'Patricia Thompson', age: 39, gender: 'Female', city: 'Columbus', state: 'OH', contact: '+1 (614) 555-4567', registrationDate: '2023-01-19' },
    { id: 'P015', name: 'Charles Garcia', age: 51, gender: 'Male', city: 'Indianapolis', state: 'IN', contact: '+1 (317) 555-8901', registrationDate: '2023-02-07' },
    { id: 'P016', name: 'Linda Martinez', age: 34, gender: 'Female', city: 'Fort Worth', state: 'TX', contact: '+1 (817) 555-2345', registrationDate: '2023-03-15' },
    { id: 'P017', name: 'Thomas Robinson', age: 72, gender: 'Male', city: 'Charlotte', state: 'NC', contact: '+1 (704) 555-6789', registrationDate: '2023-01-27' },
    { id: 'P018', name: 'Elizabeth Clark', age: 43, gender: 'Female', city: 'Seattle', state: 'WA', contact: '+1 (206) 555-0123', registrationDate: '2023-02-14' },
    { id: 'P019', name: 'Daniel Rodriguez', age: 60, gender: 'Male', city: 'Denver', state: 'CO', contact: '+1 (303) 555-4567', registrationDate: '2023-03-08' },
    { id: 'P020', name: 'Barbara Lewis', age: 31, gender: 'Female', city: 'Boston', state: 'MA', contact: '+1 (617) 555-8901', registrationDate: '2023-01-11' }
  ];

  // Get unique states for filter
  const uniqueStates = ['All', ...new Set(patientData.map(patient => patient.state))];

  // Define age groups for filter
  const ageGroups = ['All', '0-18', '19-35', '36-50', '51-65', '65+'];

  // Filter function
  const getFilteredData = () => {
    return patientData.filter(patient => {
      // Search term filter
      const searchMatch = 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contact.toLowerCase().includes(searchTerm.toLowerCase());
      
      // State filter
      const stateMatch = filterState === 'All' || patient.state === filterState;
      
      // Gender filter
      const genderMatch = filterGender === 'All' || patient.gender === filterGender;
      
      // Age group filter
      let ageMatch = true;
      if (filterAgeGroup !== 'All') {
        const age = patient.age;
        switch (filterAgeGroup) {
          case '0-18':
            ageMatch = age <= 18;
            break;
          case '19-35':
            ageMatch = age >= 19 && age <= 35;
            break;
          case '36-50':
            ageMatch = age >= 36 && age <= 50;
            break;
          case '51-65':
            ageMatch = age >= 51 && age <= 65;
            break;
          case '65+':
            ageMatch = age > 65;
            break;
          default:
            ageMatch = true;
        }
      }
      
      return searchMatch && stateMatch && genderMatch && ageMatch;
    });
  };

  // Sort function
  const getSortedData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle numeric fields
      if (sortField === 'age') {
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

  // Calculate demographics
  const totalPatients = filteredData.length;
  const maleCount = filteredData.filter(p => p.gender === 'Male').length;
  const femaleCount = filteredData.filter(p => p.gender === 'Female').length;
  const malePercentage = totalPatients > 0 ? ((maleCount / totalPatients) * 100).toFixed(1) : 0;
  const femalePercentage = totalPatients > 0 ? ((femaleCount / totalPatients) * 100).toFixed(1) : 0;
  
  // Age distribution
  const ageGroups = {
    '0-18': filteredData.filter(p => p.age <= 18).length,
    '19-35': filteredData.filter(p => p.age >= 19 && p.age <= 35).length,
    '36-50': filteredData.filter(p => p.age >= 36 && p.age <= 50).length,
    '51-65': filteredData.filter(p => p.age >= 51 && p.age <= 65).length,
    '65+': filteredData.filter(p => p.age > 65).length
  };

  // State distribution (top 3)
  const stateDistribution = {};
  filteredData.forEach(p => {
    stateDistribution[p.state] = (stateDistribution[p.state] || 0) + 1;
  });
  
  const topStates = Object.entries(stateDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([state, count]) => ({ 
      state, 
      count, 
      percentage: ((count / totalPatients) * 100).toFixed(1) 
    }));

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
          <h6 className="text-lg mb-0">Patient Demographics</h6>
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
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="form-select"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
              >
                {uniqueStates.map((state, index) => (
                  <option key={index} value={state}>{state === 'All' ? 'All States' : state}</option>
                ))}
              </select>
              
              <select
                className="form-select"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              
              <select
                className="form-select"
                value={filterAgeGroup}
                onChange={(e) => setFilterAgeGroup(e.target.value)}
              >
                <option value="All">All Ages</option>
                <option value="0-18">0-18 years</option>
                <option value="19-35">19-35 years</option>
                <option value="36-50">36-50 years</option>
                <option value="51-65">51-65 years</option>
                <option value="65+">65+ years</option>
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
                    <th onClick={() => handleSort('name')} className="cursor-pointer">
                      Name {sortField === 'name' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('age')} className="cursor-pointer">
                      Age {sortField === 'age' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('gender')} className="cursor-pointer">
                      Gender {sortField === 'gender' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('city')} className="cursor-pointer">
                      City {sortField === 'city' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('state')} className="cursor-pointer">
                      State {sortField === 'state' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('contact')} className="cursor-pointer">
                      Contact {sortField === 'contact' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th onClick={() => handleSort('registrationDate')} className="cursor-pointer">
                      Reg. Date {sortField === 'registrationDate' && (
                        <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.id}</td>
                      <td>{patient.name}</td>
                      <td>{patient.age}</td>
                      <td>{patient.gender}</td>
                      <td>{patient.city}</td>
                      <td>{patient.state}</td>
                      <td>{patient.contact}</td>
                      <td>{patient.registrationDate}</td>
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
                <h6 className="mb-3">Demographics Overview</h6>
                
                <div className="mb-4">
                  <p className="text-sm fw-medium mb-1">Gender Distribution</p>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="progress flex-grow-1" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar bg-primary" 
                        role="progressbar" 
                        style={{ width: `${malePercentage}%` }}
                        aria-valuenow={malePercentage} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                      <div 
                        className="progress-bar bg-danger" 
                        role="progressbar" 
                        style={{ width: `${femalePercentage}%` }}
                        aria-valuenow={femalePercentage} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between text-sm">
                    <div>
                      <span className="d-inline-block me-1 bg-primary" style={{ width: '10px', height: '10px' }}></span>
                      Male: {maleCount} ({malePercentage}%)
                    </div>
                    <div>
                      <span className="d-inline-block me-1 bg-danger" style={{ width: '10px', height: '10px' }}></span>
                      Female: {femaleCount} ({femalePercentage}%)
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm fw-medium mb-1">Age Distribution</p>
                  <div className="d-flex flex-column gap-2">
                    {Object.entries(ageGroups).map(([group, count]) => {
                      const percentage = totalPatients > 0 ? ((count / totalPatients) * 100).toFixed(1) : 0;
                      return (
                        <div key={group}>
                          <div className="d-flex justify-content-between text-sm mb-1">
                            <span>{group} years</span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="progress" style={{ height: '6px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              role="progressbar" 
                              style={{ width: `${percentage}%` }}
                              aria-valuenow={percentage} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm fw-medium mb-1">Top States</p>
                  <div className="d-flex flex-column gap-2">
                    {topStates.map((item, index) => (
                      <div key={index}>
                        <div className="d-flex justify-content-between text-sm mb-1">
                          <span>{item.state}</span>
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
                      Send demographics report via WhatsApp
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

export default PatientDemographicsTable;
