import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Autocomplete,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Science as ScienceIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';

interface TestRequest {
  id: string;
  testCatalogId: string;
  testCatalog: {
    id: string;
    name: string;
    code: string;
    category: string;
    sampleRequired: boolean;
    sampleType?: string;
  };
  patientId: string;
  requestedBy: string;
  requestedAt: string;
  scheduledAt?: string;
  status: string;
  priority: string;
  notes?: string;
  samples: any[];
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  id: string;
  patientId: string;
  user: {
    name: string;
  };
}

interface Doctor {
  id: string;
  user: {
    name: string;
  };
}

interface TestCatalog {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  sampleRequired: boolean;
  sampleType?: string;
}

const TestRequestManagement: React.FC = () => {
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [patientFilter, setPatientFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<TestRequest | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [testCatalog, setTestCatalog] = useState<TestCatalog[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingTestCatalog, setLoadingTestCatalog] = useState(false);

  // Fetch test requests on component mount and when filters change
  useEffect(() => {
    fetchTestRequests();
  }, [page, rowsPerPage, patientFilter, statusFilter, priorityFilter, startDateFilter, endDateFilter]);

  // Fetch patients, doctors, and test catalog for the form
  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchTestCatalog();
  }, []);

  const fetchTestRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/lab/requests?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (patientFilter) {
        url += `&patientId=${encodeURIComponent(patientFilter)}`;
      }
      
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      
      if (priorityFilter) {
        url += `&priority=${encodeURIComponent(priorityFilter)}`;
      }
      
      if (startDateFilter) {
        url += `&startDate=${encodeURIComponent(startDateFilter.toISOString())}`;
      }
      
      if (endDateFilter) {
        url += `&endDate=${encodeURIComponent(endDateFilter.toISOString())}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch test requests');
      }
      
      const data = await response.json();
      setTestRequests(data.tests);
      setTotalCount(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await fetch('/api/patients?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      setPatients(data.patients);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await fetch('/api/doctors?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      const data = await response.json();
      setDoctors(data.doctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchTestCatalog = async () => {
    setLoadingTestCatalog(true);
    try {
      const response = await fetch('/api/lab/catalog?isActive=true&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch test catalog');
      }
      const data = await response.json();
      setTestCatalog(data.tests);
    } catch (err) {
      console.error('Error fetching test catalog:', err);
    } finally {
      setLoadingTestCatalog(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePatientFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPatientFilter(event.target.value as string);
    setPage(0);
  };

  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as string);
    setPage(0);
  };

  const handlePriorityFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPriorityFilter(event.target.value as string);
    setPage(0);
  };

  const handleStartDateFilterChange = (date: Date | null) => {
    setStartDateFilter(date);
    setPage(0);
  };

  const handleEndDateFilterChange = (date: Date | null) => {
    setEndDateFilter(date);
    setPage(0);
  };

  const handleOpenDialog = (request: TestRequest | null = null) => {
    setCurrentRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRequest(null);
  };

  const handleDeleteConfirmOpen = (id: string) => {
    setRequestToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setRequestToDelete(null);
  };

  const handleDelete = async () => {
    if (!requestToDelete) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/lab/requests?id=${requestToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete test request');
      }
      
      setSuccess('Test request deleted successfully');
      fetchTestRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      handleDeleteConfirmClose();
    }
  };

  const handleSaveRequest = async (requestData: any) => {
    setLoading(true);
    setError(null);
    try {
      const method = requestData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/lab/requests', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${requestData.id ? 'update' : 'create'} test request`);
      }
      
      setSuccess(`Test request ${requestData.id ? 'updated' : 'created'} successfully`);
      fetchTestRequests();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  const getPriorityChipColor = (priority: string) => {
    switch (priority) {
      case 'STAT':
        return 'error';
      case 'URGENT':
        return 'warning';
      case 'ROUTINE':
      default:
        return 'default';
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'default';
      case 'SCHEDULED':
        return 'info';
      case 'SAMPLE_COLLECTED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'REPORTED':
        return 'success';
      case 'VERIFIED':
        return 'success';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Render test request table
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="patient-filter-label">Patient</InputLabel>
              <Select
                labelId="patient-filter-label"
                value={patientFilter}
                onChange={handlePatientFilterChange}
                label="Patient"
              >
                <MenuItem value="">All Patients</MenuItem>
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.user.name} ({patient.patientId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="REQUESTED">Requested</MenuItem>
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="SAMPLE_COLLECTED">Sample Collected</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="REPORTED">Reported</MenuItem>
                <MenuItem value="VERIFIED">Verified</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                value={priorityFilter}
                onChange={handlePriorityFilterChange}
                label="Priority"
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="ROUTINE">Routine</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
                <MenuItem value="STAT">STAT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="From Date"
                value={startDateFilter}
                onChange={handleStartDateFilterChange}
                slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="To Date"
                value={endDateFilter}
                onChange={handleEndDateFilterChange}
                slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                New
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && testRequests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No test requests found. Try adjusting your filters or create a new request.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
          >
            Create Test Request
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test</TableCell>
                <TableCell>Patient ID</TableCell>
                <TableCell>Requested At</TableCell>
                <TableCell>Scheduled At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Samples</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {testRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.testCatalog.name}</TableCell>
                  <TableCell>{request.patientId}</TableCell>
                  <TableCell>{formatDate(request.requestedAt)}</TableCell>
                  <TableCell>
                    {request.scheduledAt ? formatDate(request.scheduledAt) : 'Not scheduled'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      color={getStatusChipColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      color={getPriorityChipColor(request.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {request.samples.length > 0 ? (
                      <Chip
                        icon={<ScienceIcon />}
                        label={`${request.samples.length} sample(s)`}
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <Chip label="No samples" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(request)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteConfirmOpen(request.id)}
                        size="small"
                        disabled={request.status !== 'REQUESTED'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      {/* Test Request Form Dialog */}
      <TestRequestFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        request={currentRequest}
        onSave={handleSaveRequest}
        patients={patients}
        doctors={doctors}
        testCatalog={testCatalog}
        loading={loadingPatients || loadingDoctors || loadingTestCatalog}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteConfirmClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this test request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!success || !!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={success ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Test Request Form Dialog Component
interface TestRequestFormDialogProps {
  open: boolean;
  onClose: () => void;
  request: TestRequest | null;
  onSave: (request: any) => void;
  patients: Patient[];
  doctors: Doctor[];
  testCatalog: TestCatalog[];
  loading: boolean;
}

const TestRequestFormDialog: React.FC<TestRequestFormDialogProps> = ({
  open,
  onClose,
  request,
  onSave,
  patients,
  doctors,
  testCatalog,
  loading,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    testCatalogId: '',
    patientId: '',
    requestedBy: '',
    scheduledAt: null as Date | null,
    priority: 'ROUTINE',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({
    testCatalogId: false,
    patientId: false,
    requestedBy: false,
  });

  useEffect(() => {
    if (request) {
      setFormData({
        id: request.id,
        testCatalogId: request.testCatalogId,
        patientId: request.patientId,
        requestedBy: request.requestedBy,
        scheduledAt: request.scheduledAt ? new Date(request.scheduledAt) : null,
        priority: request.priority,
        notes: request.notes || '',
      });
    } else {
      setFormData({
        id: '',
        testCatalogId: '',
        patientId: '',
        requestedBy: '',
        scheduledAt: null,
        priority: 'ROUTINE',
        notes: '',
      });
    }
    setFormErrors({
      testCatalogId: false,
      patientId: false,
      requestedBy: false,
    });
  }, [request]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: false,
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    setFormData({
      ...formData,
      [name]: e.target.value,
    });
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: false,
      });
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      scheduledAt: date,
    });
  };

  const validateForm = () => {
    const errors = {
      testCatalogId: !formData.testCatalogId,
      patientId: !formData.patientId,
      requestedBy: !formData.requestedBy,
    };
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        scheduledAt: formData.scheduledAt ? formData.scheduledAt.toISOString() : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{request ? 'Edit Test Request' : 'Create New Test Request'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={formErrors.testCatalogId}>
                  <InputLabel id="test-catalog-label">Test</InputLabel>
                  <Select
                    labelId="test-catalog-label"
                    name="testCatalogId"
                    value={formData.testCatalogId}
                    onChange={handleSelectChange}
                    label="Test"
                    required
                  >
                    {testCatalog.map((test) => (
                      <MenuItem key={test.id} value={test.id}>
                        {test.name} ({test.code})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.testCatalogId && (
                    <FormHelperText>Test is required</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={formErrors.patientId}>
                  <InputLabel id="patient-label">Patient</InputLabel>
                  <Select
                    labelId="patient-label"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleSelectChange}
                    label="Patient"
                    required
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.user.name} ({patient.patientId})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.patientId && (
                    <FormHelperText>Patient is required</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={formErrors.requestedBy}>
                  <InputLabel id="doctor-label">Requested By</InputLabel>
                  <Select
                    labelId="doctor-label"
                    name="requestedBy"
                    value={formData.requestedBy}
                    onChange={handleSelectChange}
                    label="Requested By"
                    required
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.user.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.requestedBy && (
                    <FormHelperText>Doctor is required</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    name="priority"
                    value={formData.priority}
                    onChange={handleSelectChange}
                    label="Priority"
                  >
                    <MenuItem value="ROUTINE">Routine</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                    <MenuItem value="STAT">STAT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Scheduled At"
                    value={formData.scheduledAt}
                    onChange={handleDateChange}
                    slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Additional notes or instructions"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TestRequestManagement;
