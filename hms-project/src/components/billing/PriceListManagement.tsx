import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`price-list-tabpanel-${index}`}
      aria-labelledby={`price-list-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface ServicePrice {
  id: string;
  serviceName: string;
  serviceCode: string;
  departmentId: string;
  departmentName: string;
  hsnSacCode: string;
  basePrice: number;
  gstRateType: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

interface PackagePrice {
  id: string;
  packageName: string;
  packageCode: string;
  departmentId: string;
  departmentName: string;
  hsnSacCode: string;
  basePrice: number;
  gstRateType: string;
  description: string;
  duration: number | null;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  itemCount: number;
}

const PriceListManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [packagePrices, setPackagePrices] = useState<PackagePrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [servicePage, setServicePage] = useState<number>(0);
  const [packagePage, setPackagePage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openServiceDialog, setOpenServiceDialog] = useState<boolean>(false);
  const [openPackageDialog, setOpenPackageDialog] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ServicePrice | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackagePrice | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Mock data for development
  const mockServicePrices: ServicePrice[] = [
    {
      id: '1',
      serviceName: 'General Consultation',
      serviceCode: 'CONS-GEN',
      departmentId: 'D001',
      departmentName: 'General Medicine',
      hsnSacCode: '998311',
      basePrice: 1000,
      gstRateType: 'EIGHTEEN',
      isActive: true,
      effectiveFrom: '2023-01-01',
      effectiveTo: null,
    },
    {
      id: '2',
      serviceName: 'Specialist Consultation',
      serviceCode: 'CONS-SPL',
      departmentId: 'D001',
      departmentName: 'General Medicine',
      hsnSacCode: '998311',
      basePrice: 1500,
      gstRateType: 'EIGHTEEN',
      isActive: true,
      effectiveFrom: '2023-01-01',
      effectiveTo: null,
    },
    {
      id: '3',
      serviceName: 'Blood Test - Complete Blood Count',
      serviceCode: 'LAB-CBC',
      departmentId: 'D002',
      departmentName: 'Laboratory',
      hsnSacCode: '998311',
      basePrice: 800,
      gstRateType: 'EIGHTEEN',
      isActive: true,
      effectiveFrom: '2023-01-01',
      effectiveTo: null,
    },
    {
      id: '4',
      serviceName: 'X-Ray - Chest',
      serviceCode: 'RAD-XRAY-CHEST',
      departmentId: 'D003',
      departmentName: 'Radiology',
      hsnSacCode: '998311',
      basePrice: 1200,
      gstRateType: 'EIGHTEEN',
      isActive: true,
      effectiveFrom: '2023-01-01',
      effectiveTo: null,
    },
    {
      id: '5',
      serviceName: 'Physiotherapy Session',
      serviceCode: 'PHY-SESS',
      departmentId: 'D004',
      departmentName: 'Physiotherapy',
      hsnSacCode: '998311',
      basePrice: 700,
      gstRateType: 'EIGHTEEN',
      isActive: true,
      effectiveFrom: '2023-01-01',
      effectiveTo: null,
    },
  ];

  const mockPackagePrices: PackagePrice[] = [
    {
      id: '1',
      packageName: 'Basic Health Checkup',
      packageCode: 'PKG-HEALTH-BASIC',
      departmentId: 'D001',
      departmentName: 'General Medicine',
      hsnSacCode: '998311',
      basePrice: 3000,
      gstRateType: 'EIGHTEEN',
      description: 'Basic health checkup including consultation, blood tests, and urine tests',
      duration: 1,
      isActive: true,
      effectiveFrom: '2023-01-01',
      effectiveTo: null,
      itemCount: 5,
    },
    {
      id: '2',
      packageName: 'Comprehensive Health Checkup',
      packageCode: 'PKG-HEALTH-COMP',
      departmentId: 'D001',
      departmentName: 'General Medicine',
      hsnSacCode: '998311',
      basePrice: 5000,
      gstRateType: 'EIGHTEEN',
      description: 'Comprehensive health checkup including consultation, blood tests, urine tests, ECG, and X-Ray',
      duration: 1,
      isActive: true,
      effectiveFrom: '2023-01-01',
      effectiveTo: null,
      itemCount: 8,
    },
    {
      id: '3',
      packageName: 'Maternity Package',
      packageCode: 'PKG-MAT-BASIC',
      departmentId: 'D005',
      departmentName: 'Obstetrics & Gynecology',
      hsnSacCode: '998311',
      basePrice: 25000,
      gstRateType: 'EIGHTEEN',
      description: 'Basic maternity package including prenatal care, delivery, and postnatal care',
      duration: 270,
      isActive: true,
      effectiveFrom: '2023-01-01',
      effectiveTo: null,
      itemCount: 12,
    },
  ];

  useEffect(() => {
    // In a real application, fetch prices from API
    // For now, use mock data
    setTimeout(() => {
      setServicePrices(mockServicePrices);
      setPackagePrices(mockPackagePrices);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleServicePageChange = (event: unknown, newPage: number) => {
    setServicePage(newPage);
  };

  const handlePackagePageChange = (event: unknown, newPage: number) => {
    setPackagePage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setServicePage(0);
    setPackagePage(0);
  };

  const handleOpenServiceDialog = (service?: ServicePrice) => {
    if (service) {
      setSelectedService(service);
    } else {
      setSelectedService(null);
    }
    setOpenServiceDialog(true);
  };

  const handleCloseServiceDialog = () => {
    setOpenServiceDialog(false);
    setSelectedService(null);
  };

  const handleOpenPackageDialog = (pkg?: PackagePrice) => {
    if (pkg) {
      setSelectedPackage(pkg);
    } else {
      setSelectedPackage(null);
    }
    setOpenPackageDialog(true);
  };

  const handleClosePackageDialog = () => {
    setOpenPackageDialog(false);
    setSelectedPackage(null);
  };

  const handleFilterDepartmentChange = (event: SelectChangeEvent) => {
    setFilterDepartment(event.target.value);
  };

  const handleFilterActiveChange = (event: SelectChangeEvent) => {
    setFilterActive(event.target.value);
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const filteredServicePrices = servicePrices.filter((service) => {
    // Apply department filter
    if (filterDepartment && service.departmentId !== filterDepartment) {
      return false;
    }

    // Apply active filter
    if (filterActive === 'active' && !service.isActive) {
      return false;
    }
    if (filterActive === 'inactive' && service.isActive) {
      return false;
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        service.serviceName.toLowerCase().includes(query) ||
        service.serviceCode.toLowerCase().includes(query) ||
        service.departmentName.toLowerCase().includes(query) ||
        service.hsnSacCode.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const filteredPackagePrices = packagePrices.filter((pkg) => {
    // Apply department filter
    if (filterDepartment && pkg.departmentId !== filterDepartment) {
      return false;
    }

    // Apply active filter
    if (filterActive === 'active' && !pkg.isActive) {
      return false;
    }
    if (filterActive === 'inactive' && pkg.isActive) {
      return false;
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        pkg.packageName.toLowerCase().includes(query) ||
        pkg.packageCode.toLowerCase().includes(query) ||
        pkg.departmentName.toLowerCase().includes(query) ||
        pkg.hsnSacCode.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getGSTRateLabel = (rateType: string) => {
    switch (rateType) {
      case 'EXEMPT':
        return 'Exempt';
      case 'ZERO':
        return '0%';
      case 'FIVE':
        return '5%';
      case 'TWELVE':
        return '12%';
      case 'EIGHTEEN':
        return '18%';
      case 'TWENTYEIGHT':
        return '28%';
      default:
        return rateType;
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="div">
              <ListAltIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Price List Management
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            {tabValue === 0 ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenServiceDialog()}
              >
                Add Service
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenPackageDialog()}
              >
                Add Package
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="price list tabs"
          variant="fullWidth"
        >
          <Tab
            icon={<MedicalServicesIcon />}
            label="Services"
            id="price-list-tab-0"
            aria-controls="price-list-tabpanel-0"
          />
          <Tab
            icon={<LocalHospitalIcon />}
            label="Packages"
            id="price-list-tab-1"
            aria-controls="price-list-tabpanel-1"
          />
        </Tabs>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleToggleFilters}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Grid>

          {showFilters && (
            <>
              <Grid item xs={12} sm={6} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filterDepartment}
                    label="Department"
                    onChange={handleFilterDepartmentChange}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    <MenuItem value="D001">General Medicine</MenuItem>
                    <MenuItem value="D002">Laboratory</MenuItem>
                    <MenuItem value="D003">Radiology</MenuItem>
                    <MenuItem value="D004">Physiotherapy</MenuItem>
                    <MenuItem value="D005">Obstetrics & Gynecology</MenuItem>
                    <MenuItem value="D006">Dental</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterActive}
                    label="Status"
                    onChange={handleFilterActiveChange}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setFilterDepartment('');
                    setFilterActive('');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Paper elevation={3}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="service price table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service Name</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>HSN/SAC</TableCell>
                      <TableCell align="right">Base Price (₹)</TableCell>
                      <TableCell>GST Rate</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Effective From</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredServicePrices
                      .slice(servicePage * rowsPerPage, servicePage * rowsPerPage + rowsPerPage)
                      .map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>{service.serviceName}</TableCell>
                          <TableCell>{service.serviceCode}</TableCell>
                          <TableCell>{service.departmentName}</TableCell>
                          <TableCell>{service.hsnSacCode}</TableCell>
                          <TableCell align="right">
                            {service.basePrice.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>{getGSTRateLabel(service.gstRateType)}</TableCell>
                          <TableCell>
                            <Chip
                              label={service.isActive ? 'Active' : 'Inactive'}
                              color={service.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{service.effectiveFrom}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenServiceDialog(service)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredServicePrices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No services found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredServicePrices.length}
                rowsPerPage={rowsPerPage}
                page={servicePage}
                onPageChange={handleServicePageChange}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper elevation={3}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="package price table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Package Name</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>HSN/SAC</TableCell>
                      <TableCell align="right">Base Price (₹)</TableCell>
                      <TableCell>GST Rate</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPackagePrices
                      .slice(packagePage * rowsPerPage, packagePage * rowsPerPage + rowsPerPage)
                      .map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell>{pkg.packageName}</TableCell>
                          <TableCell>{pkg.packageCode}</TableCell>
                          <TableCell>{pkg.departmentName}</TableCell>
                          <TableCell>{pkg.hsnSacCode}</TableCell>
                          <TableCell align="right">
                            {pkg.basePrice.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>{getGSTRateLabel(pkg.gstRateType)}</TableCell>
                          <TableCell>{pkg.itemCount}</TableCell>
                          <TableCell>
                            <Chip
                              label={pkg.isActive ? 'Active' : 'Inactive'}
                              color={pkg.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenPackageDialog(pkg)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredPackagePrices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No packages found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPackagePrices.length}
                rowsPerPage={rowsPerPage}
                page={packagePage}
                onPageChange={handlePackagePageChange}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </TabPanel>

      {/* Service Dialog - This would be implemented as a separate component */}
      <Dialog open={openServiceDialog} onClose={handleCloseServiceDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedService ? 'Edit Service Price' : 'Add New Service Price'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            This feature will be implemented as a separate component.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseServiceDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCloseServiceDialog}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Package Dialog - This would be implemented as a separate component */}
      <Dialog open={openPackageDialog} onClose={handleClosePackageDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPackage ? 'Edit Package Price' : 'Add New Package Price'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            This feature will be implemented as a separate component.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePackageDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleClosePackageDialog}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PriceListManagement;
