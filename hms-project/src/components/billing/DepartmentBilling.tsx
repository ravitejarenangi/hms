import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BiotechIcon from '@mui/icons-material/Biotech';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import MedicationIcon from '@mui/icons-material/Medication';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HotelIcon from '@mui/icons-material/Hotel';

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
      id={`department-billing-tabpanel-${index}`}
      aria-labelledby={`department-billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface BillingItem {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientId: string;
  date: string;
  amount: number;
  status: string;
  departmentId: string;
}

const DepartmentBilling: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Mock data for development
  const mockBillingItems: BillingItem[] = [
    // General Medicine
    {
      id: '1',
      invoiceNumber: 'INV-2023-001',
      patientName: 'John Doe',
      patientId: 'P001',
      date: '2023-05-10',
      amount: 1500,
      status: 'PAID',
      departmentId: 'general',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2023-002',
      patientName: 'Jane Smith',
      patientId: 'P002',
      date: '2023-05-09',
      amount: 2000,
      status: 'PENDING',
      departmentId: 'general',
    },
    // Laboratory
    {
      id: '3',
      invoiceNumber: 'INV-2023-003',
      patientName: 'Robert Johnson',
      patientId: 'P003',
      date: '2023-05-08',
      amount: 1200,
      status: 'PAID',
      departmentId: 'laboratory',
    },
    {
      id: '4',
      invoiceNumber: 'INV-2023-004',
      patientName: 'Mary Williams',
      patientId: 'P004',
      date: '2023-05-07',
      amount: 800,
      status: 'PENDING',
      departmentId: 'laboratory',
    },
    // Radiology
    {
      id: '5',
      invoiceNumber: 'INV-2023-005',
      patientName: 'David Brown',
      patientId: 'P005',
      date: '2023-05-06',
      amount: 3500,
      status: 'PAID',
      departmentId: 'radiology',
    },
    {
      id: '6',
      invoiceNumber: 'INV-2023-006',
      patientName: 'Sarah Davis',
      patientId: 'P006',
      date: '2023-05-05',
      amount: 4200,
      status: 'PENDING',
      departmentId: 'radiology',
    },
    // Pharmacy
    {
      id: '7',
      invoiceNumber: 'INV-2023-007',
      patientName: 'Michael Wilson',
      patientId: 'P007',
      date: '2023-05-04',
      amount: 750,
      status: 'PAID',
      departmentId: 'pharmacy',
    },
    {
      id: '8',
      invoiceNumber: 'INV-2023-008',
      patientName: 'Jennifer Lee',
      patientId: 'P008',
      date: '2023-05-03',
      amount: 1100,
      status: 'PENDING',
      departmentId: 'pharmacy',
    },
    // Physiotherapy
    {
      id: '9',
      invoiceNumber: 'INV-2023-009',
      patientName: 'Thomas Moore',
      patientId: 'P009',
      date: '2023-05-02',
      amount: 900,
      status: 'PAID',
      departmentId: 'physiotherapy',
    },
    {
      id: '10',
      invoiceNumber: 'INV-2023-010',
      patientName: 'Emily Clark',
      patientId: 'P010',
      date: '2023-05-01',
      amount: 700,
      status: 'PENDING',
      departmentId: 'physiotherapy',
    },
    // Inpatient
    {
      id: '11',
      invoiceNumber: 'INV-2023-011',
      patientName: 'Richard Taylor',
      patientId: 'P011',
      date: '2023-04-30',
      amount: 15000,
      status: 'PAID',
      departmentId: 'inpatient',
    },
    {
      id: '12',
      invoiceNumber: 'INV-2023-012',
      patientName: 'Patricia White',
      patientId: 'P012',
      date: '2023-04-29',
      amount: 18000,
      status: 'PENDING',
      departmentId: 'inpatient',
    },
  ];

  useEffect(() => {
    // In a real application, fetch billing items from API
    // For now, use mock data
    setTimeout(() => {
      setBillingItems(mockBillingItems);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterStatusChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value);
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const getDepartmentId = (tabIndex: number) => {
    switch (tabIndex) {
      case 0:
        return 'general';
      case 1:
        return 'laboratory';
      case 2:
        return 'radiology';
      case 3:
        return 'pharmacy';
      case 4:
        return 'physiotherapy';
      case 5:
        return 'inpatient';
      default:
        return '';
    }
  };

  const filteredBillingItems = billingItems.filter((item) => {
    // Apply department filter based on selected tab
    if (item.departmentId !== getDepartmentId(tabValue)) {
      return false;
    }

    // Apply status filter
    if (filterStatus && item.status !== filterStatus) {
      return false;
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.invoiceNumber.toLowerCase().includes(query) ||
        item.patientName.toLowerCase().includes(query) ||
        item.patientId.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'PARTIALLY_PAID':
        return 'info';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="div">
              Department Billing
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage billing operations by department
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
            >
              New Invoice
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="department billing tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<LocalHospitalIcon />}
            label="General Medicine"
            id="department-billing-tab-0"
            aria-controls="department-billing-tabpanel-0"
          />
          <Tab
            icon={<BiotechIcon />}
            label="Laboratory"
            id="department-billing-tab-1"
            aria-controls="department-billing-tabpanel-1"
          />
          <Tab
            icon={<MedicalServicesIcon />}
            label="Radiology"
            id="department-billing-tab-2"
            aria-controls="department-billing-tabpanel-2"
          />
          <Tab
            icon={<MedicationIcon />}
            label="Pharmacy"
            id="department-billing-tab-3"
            aria-controls="department-billing-tabpanel-3"
          />
          <Tab
            icon={<FitnessCenterIcon />}
            label="Physiotherapy"
            id="department-billing-tab-4"
            aria-controls="department-billing-tabpanel-4"
          />
          <Tab
            icon={<HotelIcon />}
            label="Inpatient"
            id="department-billing-tab-5"
            aria-controls="department-billing-tabpanel-5"
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
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={handleFilterStatusChange}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                    <MenuItem value="OVERDUE">Overdue</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setFilterStatus('');
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

      {[0, 1, 2, 3, 4, 5].map((tabIndex) => (
        <TabPanel key={tabIndex} value={tabValue} index={tabIndex}>
          <Paper elevation={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="department billing table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Patient ID</TableCell>
                        <TableCell>Patient Name</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount (₹)</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBillingItems
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.invoiceNumber}</TableCell>
                            <TableCell>{item.patientId}</TableCell>
                            <TableCell>{item.patientName}</TableCell>
                            <TableCell>{item.date}</TableCell>
                            <TableCell align="right">
                              {item.amount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                color={getStatusChipColor(item.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View">
                                <IconButton size="small" color="primary">
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton size="small" color="primary">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      {filteredBillingItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No billing items found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredBillingItems.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </Paper>
        </TabPanel>
      ))}
    </Box>
  );
};

export default DepartmentBilling;
