import React, { useState, useEffect, useRef } from 'react';
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
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Divider,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';

interface TestResult {
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
    status: string;
  };
  parameter: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
  isAbnormal: boolean;
  isCritical: boolean;
  performedBy: string;
  performedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
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
  };
  patientId: string;
  status: string;
  samples: any[];
}

interface User {
  id: string;
  name: string;
}

const ResultManagement: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Setup SSE connection for real-time updates
  useEffect(() => {
    if (realTimeEnabled) {
      connectToSSE();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [realTimeEnabled, selectedTestId]);

  // Fetch tests and users for the form
  useEffect(() => {
    fetchTests();
    fetchUsers();
  }, []);

  const connectToSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    let url = '/api/lab/results-sse';
    if (selectedTestId) {
      url += `?testId=${selectedTestId}`;
    }

    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'initial') {
          setResults(data.results);
        } else if (data.type === 'new_result') {
          setResults(prevResults => {
            // Check if result already exists
            const exists = prevResults.some(r => r.id === data.result.id);
            if (exists) {
              return prevResults.map(r => r.id === data.result.id ? data.result : r);
            } else {
              return [data.result, ...prevResults];
            }
          });
          setSuccess('New test result received');
        } else if (data.type === 'updated_result') {
          setResults(prevResults => 
            prevResults.map(r => r.id === data.result.id ? data.result : r)
          );
          setSuccess('Test result updated');
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
      setTimeout(connectToSSE, 5000); // Try to reconnect after 5 seconds
    };

    eventSourceRef.current = eventSource;
  };

  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      const response = await fetch('/api/lab/requests?status=SAMPLE_COLLECTED,IN_PROGRESS,COMPLETED&limit=100');
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
      const response = await fetch('/api/users?role=STAFF,DOCTOR&limit=100');
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

  const handleTestChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTestId(event.target.value as string);
  };

  const handleRealTimeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRealTimeEnabled(event.target.checked);
  };

  const handleOpenDialog = (result: TestResult | null = null) => {
    setCurrentResult(result);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentResult(null);
  };

  const handleSaveResult = async (resultData: any) => {
    setLoading(true);
    setError(null);
    try {
      const method = resultData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/lab/results-sse', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${resultData.id ? 'update' : 'create'} test result`);
      }
      
      setSuccess(`Test result ${resultData.id ? 'updated' : 'created'} successfully`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="test-filter-label">Filter by Test</InputLabel>
              <Select
                labelId="test-filter-label"
                value={selectedTestId}
                onChange={handleTestChange}
                label="Filter by Test"
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
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeEnabled}
                  onChange={handleRealTimeToggle}
                  color="primary"
                />
              }
              label="Real-time Updates"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Result
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

      {!loading && results.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No test results found. Select a test or add a new result.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
          >
            Add Test Result
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {results.map((result) => (
            <Grid item xs={12} sm={6} md={4} key={result.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  borderLeft: result.isCritical 
                    ? '4px solid #f44336' 
                    : result.isAbnormal 
                      ? '4px solid #ff9800' 
                      : '4px solid #4caf50'
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" component="div">
                      {result.parameter}
                    </Typography>
                    {result.isCritical ? (
                      <Tooltip title="Critical Value">
                        <ErrorIcon color="error" />
                      </Tooltip>
                    ) : result.isAbnormal ? (
                      <Tooltip title="Abnormal Value">
                        <WarningIcon color="warning" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Normal Value">
                        <CheckCircleIcon color="success" />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Test: {result.test.testCatalog.name}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" component="div">
                      {result.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {result.unit || ''}
                    </Typography>
                  </Box>
                  {result.referenceRange && (
                    <Typography variant="body2" color="text.secondary">
                      Reference: {result.referenceRange}
                    </Typography>
                  )}
                  {result.interpretation && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {result.interpretation}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" display="block">
                    Performed: {formatDate(result.performedAt)}
                  </Typography>
                  <Typography variant="caption" display="block">
                    By: {result.performedBy}
                  </Typography>
                  {result.verifiedAt && (
                    <Typography variant="caption" display="block">
                      Verified: {formatDate(result.verifiedAt)} by {result.verifiedBy}
                    </Typography>
                  )}
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Tooltip title="Edit Result">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(result)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Test Result Form Dialog */}
      <ResultFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        result={currentResult}
        onSave={handleSaveResult}
        tests={tests}
        users={users}
        loading={loadingTests || loadingUsers}
      />

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

// Test Result Form Dialog Component
interface ResultFormDialogProps {
  open: boolean;
  onClose: () => void;
  result: TestResult | null;
  onSave: (result: any) => void;
  tests: Test[];
  users: User[];
  loading: boolean;
}

const ResultFormDialog: React.FC<ResultFormDialogProps> = ({
  open,
  onClose,
  result,
  onSave,
  tests,
  users,
  loading,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    testId: '',
    parameter: '',
    value: '',
    unit: '',
    referenceRange: '',
    interpretation: '',
    isAbnormal: false,
    isCritical: false,
    performedBy: '',
    notes: '',
    verifiedBy: '',
    verifiedAt: null as Date | null,
  });
  const [formErrors, setFormErrors] = useState({
    testId: false,
    parameter: false,
    value: false,
    performedBy: false,
  });

  useEffect(() => {
    if (result) {
      setFormData({
        id: result.id,
        testId: result.testId,
        parameter: result.parameter,
        value: result.value,
        unit: result.unit || '',
        referenceRange: result.referenceRange || '',
        interpretation: result.interpretation || '',
        isAbnormal: result.isAbnormal,
        isCritical: result.isCritical,
        performedBy: result.performedBy,
        notes: result.notes || '',
        verifiedBy: result.verifiedBy || '',
        verifiedAt: result.verifiedAt ? new Date(result.verifiedAt) : null,
      });
    } else {
      setFormData({
        id: '',
        testId: '',
        parameter: '',
        value: '',
        unit: '',
        referenceRange: '',
        interpretation: '',
        isAbnormal: false,
        isCritical: false,
        performedBy: '',
        notes: '',
        verifiedBy: '',
        verifiedAt: null,
      });
    }
    setFormErrors({
      testId: false,
      parameter: false,
      value: false,
      performedBy: false,
    });
  }, [result]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
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

  const validateForm = () => {
    const errors = {
      testId: !formData.testId,
      parameter: !formData.parameter,
      value: !formData.value,
      performedBy: !formData.performedBy,
    };
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        verifiedAt: formData.verifiedAt ? formData.verifiedAt.toISOString() : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{result ? 'Edit Test Result' : 'Add New Test Result'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={formErrors.testId} disabled={!!result}>
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
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Parameter"
                  name="parameter"
                  value={formData.parameter}
                  onChange={handleInputChange}
                  margin="normal"
                  error={formErrors.parameter}
                  helperText={formErrors.parameter ? "Parameter is required" : ""}
                  disabled={!!result}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  margin="normal"
                  error={formErrors.value}
                  helperText={formErrors.value ? "Value is required" : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  margin="normal"
                  placeholder="e.g., mg/dL, mmol/L, etc."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reference Range"
                  name="referenceRange"
                  value={formData.referenceRange}
                  onChange={handleInputChange}
                  margin="normal"
                  placeholder="e.g., 70-110 mg/dL"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={formErrors.performedBy}>
                  <InputLabel id="performed-by-label">Performed By</InputLabel>
                  <Select
                    labelId="performed-by-label"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleSelectChange}
                    label="Performed By"
                    required
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isAbnormal}
                      onChange={handleInputChange}
                      name="isAbnormal"
                      color="warning"
                    />
                  }
                  label="Abnormal Value"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isCritical}
                      onChange={handleInputChange}
                      name="isCritical"
                      color="error"
                    />
                  }
                  label="Critical Value"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Interpretation"
                  name="interpretation"
                  value={formData.interpretation}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="Clinical interpretation of the result"
                />
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
                  rows={2}
                  placeholder="Additional notes or comments"
                />
              </Grid>
              {result && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="verified-by-label">Verified By</InputLabel>
                      <Select
                        labelId="verified-by-label"
                        name="verifiedBy"
                        value={formData.verifiedBy}
                        onChange={handleSelectChange}
                        label="Verified By"
                      >
                        <MenuItem value="">Not Verified</MenuItem>
                        {users.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
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

export default ResultManagement;
