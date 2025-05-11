import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';

interface Sample {
  id: string;
  testId: string;
  test: {
    id: string;
    testCatalogId: string;
    testCatalog: {
      name: string;
      code: string;
    };
    patientId: string;
  };
  sampleType: string;
  sampleId: string;
  collectedBy: string;
  collectedAt: string;
  receivedBy?: string;
  receivedAt?: string;
  status: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Test {
  id: string;
  testCatalogId: string;
  testCatalog: {
    name: string;
    code: string;
    sampleType?: string;
  };
  patientId: string;
  status: string;
}

interface User {
  id: string;
  name: string;
}

const SampleManagement: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [testFilter, setTestFilter] = useState<string>('');
  const [sampleIdFilter, setSampleIdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSample, setCurrentSample] = useState<Sample | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sampleToDelete, setSampleToDelete] = useState<string | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch samples on component mount and when filters change
  useEffect(() => {
    fetchSamples();
  }, [page, rowsPerPage, testFilter, sampleIdFilter, statusFilter]);

  // Fetch tests and users for the form
  useEffect(() => {
    fetchTests();
    fetchUsers();
  }, []);

  const fetchSamples = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/lab/samples?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (testFilter) {
        url += `&testId=${encodeURIComponent(testFilter)}`;
      }
      
      if (sampleIdFilter) {
        url += `&sampleId=${encodeURIComponent(sampleIdFilter)}`;
      }
      
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch samples');
      }
      
      const data = await response.json();
      setSamples(data.samples);
      setTotalCount(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      const response = await fetch('/api/lab/requests?status=REQUESTED,SCHEDULED&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch tests');
      }
      const data = await response.json();
      setTests(data.tests);
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users?role=STAFF,NURSE,DOCTOR&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTestFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTestFilter(event.target.value as string);
    setPage(0);
  };

  const handleSampleIdFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSampleIdFilter(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as string);
    setPage(0);
  };

  const handleOpenDialog = (sample: Sample | null = null) => {
    setCurrentSample(sample);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentSample(null);
  };

  const handleDeleteConfirmOpen = (id: string) => {
    setSampleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setSampleToDelete(null);
  };

  const handleDelete = async () => {
    if (!sampleToDelete) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/lab/samples?id=${sampleToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete sample');
      }
      
      setSuccess('Sample deleted successfully');
      fetchSamples();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      handleDeleteConfirmClose();
    }
  };

  const handleSaveSample = async (sampleData: any) => {
    setLoading(true);
    setError(null);
    try {
      const method = sampleData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/lab/samples', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${sampleData.id ? 'update' : 'create'} sample`);
      }
      
      setSuccess(`Sample ${sampleData.id ? 'updated' : 'created'} successfully`);
      fetchSamples();
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

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'COLLECTED':
        return 'default';
      case 'IN_TRANSIT':
        return 'info';
      case 'RECEIVED':
        return 'primary';
      case 'PROCESSING':
        return 'warning';
      case 'ANALYZED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'DISPOSED':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="test-filter-label">Test</InputLabel>
              <Select
                labelId="test-filter-label"
                value={testFilter}
                onChange={handleTestFilterChange}
                label="Test"
              >
                <MenuItem value="">All Tests</MenuItem>
                {tests.map((test) => (
                  <MenuItem key={test.id} value={test.id}>
                    {test.testCatalog.name} ({test.testCatalog.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Sample ID"
              variant="outlined"
              value={sampleIdFilter}
              onChange={handleSampleIdFilterChange}
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="COLLECTED">Collected</MenuItem>
                <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
                <MenuItem value="RECEIVED">Received</MenuItem>
                <MenuItem value="PROCESSING">Processing</MenuItem>
                <MenuItem value="ANALYZED">Analyzed</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="DISPOSED">Disposed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                New Sample
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

      {!loading && samples.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No samples found. Try adjusting your filters or collect a new sample.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
          >
            Collect New Sample
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sample ID</TableCell>
                <TableCell>Test</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Collected By</TableCell>
                <TableCell>Collected At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {samples.map((sample) => (
                <TableRow key={sample.id}>
                  <TableCell>{sample.sampleId}</TableCell>
                  <TableCell>{sample.test.testCatalog.name}</TableCell>
                  <TableCell>{sample.sampleType}</TableCell>
                  <TableCell>{sample.collectedBy}</TableCell>
                  <TableCell>{formatDate(sample.collectedAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={sample.status}
                      color={getStatusChipColor(sample.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(sample)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteConfirmOpen(sample.id)}
                        size="small"
                        disabled={sample.status !== 'COLLECTED' && sample.status !== 'REJECTED'}
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

      {/* Sample Form Dialog */}
      <SampleFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        sample={currentSample}
        onSave={handleSaveSample}
        tests={tests}
        users={users}
        loading={loadingTests || loadingUsers}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteConfirmClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this sample? This action cannot be undone.
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

// Sample Form Dialog Component
interface SampleFormDialogProps {
  open: boolean;
  onClose: () => void;
  sample: Sample | null;
  onSave: (sample: any) => void;
  tests: Test[];
  users: User[];
  loading: boolean;
}

const SampleFormDialog: React.FC<SampleFormDialogProps> = ({
  open,
  onClose,
  sample,
  onSave,
  tests,
  users,
  loading,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    testId: '',
    sampleType: '',
    sampleId: '',
    collectedBy: '',
    collectedAt: new Date(),
    receivedBy: '',
    receivedAt: null as Date | null,
    status: 'COLLECTED',
    rejectionReason: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({
    testId: false,
    sampleType: false,
    sampleId: false,
    collectedBy: false,
  });

  useEffect(() => {
    if (sample) {
      setFormData({
        id: sample.id,
        testId: sample.testId,
        sampleType: sample.sampleType,
        sampleId: sample.sampleId,
        collectedBy: sample.collectedBy,
        collectedAt: new Date(sample.collectedAt),
        receivedBy: sample.receivedBy || '',
        receivedAt: sample.receivedAt ? new Date(sample.receivedAt) : null,
        status: sample.status,
        rejectionReason: sample.rejectionReason || '',
        notes: sample.notes || '',
      });
    } else {
      setFormData({
        id: '',
        testId: '',
        sampleType: '',
        sampleId: '',
        collectedBy: '',
        collectedAt: new Date(),
        receivedBy: '',
        receivedAt: null,
        status: 'COLLECTED',
        rejectionReason: '',
        notes: '',
      });
    }
    setFormErrors({
      testId: false,
      sampleType: false,
      sampleId: false,
      collectedBy: false,
    });
  }, [sample]);

  useEffect(() => {
    // Auto-fill sample type based on selected test
    if (formData.testId && !sample) {
      const selectedTest = tests.find(test => test.id === formData.testId);
      if (selectedTest && selectedTest.testCatalog.sampleType) {
        setFormData(prev => ({
          ...prev,
          sampleType: selectedTest.testCatalog.sampleType || '',
        }));
      }
    }
  }, [formData.testId, tests, sample]);

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

  const handleCollectedDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      collectedAt: date || new Date(),
    });
  };

  const handleReceivedDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      receivedAt: date,
    });
  };

  const validateForm = () => {
    const errors = {
      testId: !formData.testId,
      sampleType: !formData.sampleType,
      sampleId: !formData.sampleId,
      collectedBy: !formData.collectedBy,
    };
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        collectedAt: formData.collectedAt.toISOString(),
        receivedAt: formData.receivedAt ? formData.receivedAt.toISOString() : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{sample ? 'Edit Sample' : 'Collect New Sample'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={formErrors.testId} disabled={!!sample}>
                  <InputLabel id="test-label">Test</InputLabel>
                  <Select
                    labelId="test-label"
                    name="testId"
                    value={formData.testId}
                    onChange={handleSelectChange}
                    label="Test"
                    required
                  >
                    {tests.map((test) => (
                      <MenuItem key={test.id} value={test.id}>
                        {test.testCatalog.name} ({test.testCatalog.code})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.testId && (
                    <FormHelperText>Test is required</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Sample Type"
                  name="sampleType"
                  value={formData.sampleType}
                  onChange={handleInputChange}
                  margin="normal"
                  error={formErrors.sampleType}
                  helperText={formErrors.sampleType ? "Sample type is required" : ""}
                  placeholder="e.g., Blood, Urine, etc."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Sample ID"
                  name="sampleId"
                  value={formData.sampleId}
                  onChange={handleInputChange}
                  margin="normal"
                  error={formErrors.sampleId}
                  helperText={formErrors.sampleId ? "Sample ID is required" : ""}
                  disabled={!!sample}
                  placeholder="Unique identifier or barcode"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={formErrors.collectedBy}>
                  <InputLabel id="collected-by-label">Collected By</InputLabel>
                  <Select
                    labelId="collected-by-label"
                    name="collectedBy"
                    value={formData.collectedBy}
                    onChange={handleSelectChange}
                    label="Collected By"
                    required
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.collectedBy && (
                    <FormHelperText>Collector is required</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Collected At"
                    value={formData.collectedAt}
                    onChange={handleCollectedDateChange}
                    slotProps={{ textField: { fullWidth: true, margin: "normal", required: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              {sample && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select
                        labelId="status-label"
                        name="status"
                        value={formData.status}
                        onChange={handleSelectChange}
                        label="Status"
                      >
                        <MenuItem value="COLLECTED">Collected</MenuItem>
                        <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
                        <MenuItem value="RECEIVED">Received</MenuItem>
                        <MenuItem value="PROCESSING">Processing</MenuItem>
                        <MenuItem value="ANALYZED">Analyzed</MenuItem>
                        <MenuItem value="REJECTED">Rejected</MenuItem>
                        <MenuItem value="DISPOSED">Disposed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {(formData.status === 'RECEIVED' || formData.status === 'PROCESSING' || formData.status === 'ANALYZED') && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel id="received-by-label">Received By</InputLabel>
                          <Select
                            labelId="received-by-label"
                            name="receivedBy"
                            value={formData.receivedBy}
                            onChange={handleSelectChange}
                            label="Received By"
                          >
                            {users.map((user) => (
                              <MenuItem key={user.id} value={user.id}>
                                {user.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DateTimePicker
                            label="Received At"
                            value={formData.receivedAt}
                            onChange={handleReceivedDateChange}
                            slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
                          />
                        </LocalizationProvider>
                      </Grid>
                    </>
                  )}
                  {formData.status === 'REJECTED' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Rejection Reason"
                        name="rejectionReason"
                        value={formData.rejectionReason}
                        onChange={handleInputChange}
                        margin="normal"
                        required={formData.status === 'REJECTED'}
                        error={formData.status === 'REJECTED' && !formData.rejectionReason}
                        helperText={formData.status === 'REJECTED' && !formData.rejectionReason ? "Rejection reason is required" : ""}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  )}
                </>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="Additional notes or observations"
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

export default SampleManagement;
