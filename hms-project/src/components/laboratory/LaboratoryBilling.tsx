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
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  LocalAtm as LocalAtmIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

interface BillingRecord {
  id: string;
  testId: string;
  test: {
    id: string;
    testCatalogId: string;
    testCatalog: {
      name: string;
      code: string;
      price: number;
    };
    patientId: string;
  };
  patientId: string;
  invoiceNumber: string;
  amount: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  insuranceCovered: boolean;
  insuranceAmount: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
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
    price: number;
  };
  patientId: string;
  status: string;
}

interface Patient {
  id: string;
  patientId: string;
  user: {
    name: string;
  };
}

const LaboratoryBilling: React.FC = () => {
  const [billings, setBillings] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [patientFilter, setPatientFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBilling, setCurrentBilling] = useState<BillingRecord | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  // Fetch billings on component mount and when filters change
  useEffect(() => {
    fetchBillings();
  }, [page, rowsPerPage, patientFilter, statusFilter]);

  // Fetch tests and patients for the form
  useEffect(() => {
    fetchTests();
    fetchPatients();
  }, []);

  const fetchBillings = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/lab/billing?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (patientFilter) {
        url += `&patientId=${encodeURIComponent(patientFilter)}`;
      }
      
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing records');
      }
      
      const data = await response.json();
      setBillings(data.billings);
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
      const response = await fetch('/api/lab/requests?status=COMPLETED,REPORTED,VERIFIED&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch tests');
      }
      const data = await response.json();
      
      // Filter out tests that already have billing
      const testsWithoutBilling = await filterTestsWithoutBilling(data.tests);
      setTests(testsWithoutBilling);
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const filterTestsWithoutBilling = async (tests: Test[]) => {
    try {
      // Get all test IDs
      const testIds = tests.map(test => test.id);
      
      // Check which tests already have billing
      const response = await fetch(`/api/lab/billing?testIds=${testIds.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to check test billing status');
      }
      
      const data = await response.json();
      const billedTestIds = data.billings.map((billing: BillingRecord) => billing.testId);
      
      // Return only tests without billing
      return tests.filter(test => !billedTestIds.includes(test.id));
    } catch (err) {
      console.error('Error filtering tests:', err);
      return tests; // Return all tests if filtering fails
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

  const handleOpenDialog = (billing: BillingRecord | null = null) => {
    setCurrentBilling(billing);
    setOpenDialog(true);
    setSelectedTest(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentBilling(null);
    setSelectedTest(null);
  };

  const handleSaveBilling = async (billingData: any) => {
    setLoading(true);
    setError(null);
    try {
      const method = billingData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/lab/billing', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${billingData.id ? 'update' : 'create'} billing record`);
      }
      
      setSuccess(`Billing record ${billingData.id ? 'updated' : 'created'} successfully`);
      fetchBillings();
      fetchTests(); // Refresh tests list to exclude newly billed tests
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
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <LocalAtmIcon fontSize="small" />;
      case 'CREDIT_CARD':
        return <CreditCardIcon fontSize="small" />;
      case 'BANK_TRANSFER':
        return <AccountBalanceIcon fontSize="small" />;
      case 'INSURANCE':
        return <ReceiptIcon fontSize="small" />;
      default:
        return <MoneyIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Payment Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Payment Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                disabled={tests.length === 0}
              >
                New Billing
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

      {!loading && billings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No billing records found. Try adjusting your filters or create a new billing record.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
            disabled={tests.length === 0}
          >
            Create Billing Record
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Test</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Insurance</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {billings.map((billing) => (
                <TableRow key={billing.id}>
                  <TableCell>{billing.invoiceNumber}</TableCell>
                  <TableCell>{billing.test.testCatalog.name}</TableCell>
                  <TableCell>{billing.patientId}</TableCell>
                  <TableCell>{formatCurrency(billing.totalAmount)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {getPaymentMethodIcon(billing.paymentMethod)}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {billing.paymentMethod.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={billing.paymentStatus}
                      color={getStatusChipColor(billing.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {billing.insuranceCovered ? (
                      <Tooltip title={`${formatCurrency(billing.insuranceAmount)} covered by insurance`}>
                        <Chip
                          label="Covered"
                          color="info"
                          size="small"
                        />
                      </Tooltip>
                    ) : (
                      <Chip label="Not Covered" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(billing.createdAt)}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(billing)}
                        size="small"
                      >
                        <EditIcon />
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

      {/* Billing Form Dialog */}
      <BillingFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        billing={currentBilling}
        onSave={handleSaveBilling}
        tests={tests}
        patients={patients}
        loading={loadingTests || loadingPatients}
        selectedTest={selectedTest}
        setSelectedTest={setSelectedTest}
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

// Billing Form Dialog Component
interface BillingFormDialogProps {
  open: boolean;
  onClose: () => void;
  billing: BillingRecord | null;
  onSave: (billing: any) => void;
  tests: Test[];
  patients: Patient[];
  loading: boolean;
  selectedTest: Test | null;
  setSelectedTest: React.Dispatch<React.SetStateAction<Test | null>>;
}

const BillingFormDialog: React.FC<BillingFormDialogProps> = ({
  open,
  onClose,
  billing,
  onSave,
  tests,
  patients,
  loading,
  selectedTest,
  setSelectedTest,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    testId: '',
    patientId: '',
    amount: 0,
    discount: 0,
    tax: 0,
    totalAmount: 0,
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    insuranceCovered: false,
    insuranceAmount: 0,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (billing) {
      setFormData({
        id: billing.id,
        testId: billing.testId,
        patientId: billing.patientId,
        amount: billing.amount,
        discount: billing.discount,
        tax: billing.tax,
        totalAmount: billing.totalAmount,
        paymentMethod: billing.paymentMethod,
        paymentStatus: billing.paymentStatus,
        insuranceCovered: billing.insuranceCovered,
        insuranceAmount: billing.insuranceAmount,
        insuranceProvider: billing.insuranceProvider || '',
        insurancePolicyNumber: billing.insurancePolicyNumber || '',
        notes: billing.notes || '',
      });
      
      // Find the test in the tests array
      const test = tests.find(t => t.id === billing.testId);
      setSelectedTest(test || null);
    } else {
      setFormData({
        id: '',
        testId: selectedTest ? selectedTest.id : '',
        patientId: selectedTest ? selectedTest.patientId : '',
        amount: selectedTest ? selectedTest.testCatalog.price : 0,
        discount: 0,
        tax: 0,
        totalAmount: selectedTest ? selectedTest.testCatalog.price : 0,
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        insuranceCovered: false,
        insuranceAmount: 0,
        insuranceProvider: '',
        insurancePolicyNumber: '',
        notes: '',
      });
    }
  }, [billing, selectedTest, tests]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
      
      // If insurance coverage is turned off, reset insurance fields
      if (name === 'insuranceCovered' && !checked) {
        setFormData({
          ...formData,
          [name]: checked,
          insuranceAmount: 0,
          insuranceProvider: '',
          insurancePolicyNumber: '',
        });
      }
    } else if (name === 'amount' || name === 'discount' || name === 'tax' || name === 'insuranceAmount') {
      // Handle numeric fields
      const newValue = parseFloat(value) || 0;
      
      const updatedFormData = {
        ...formData,
        [name]: newValue,
      };
      
      // Recalculate total amount
      if (name === 'amount' || name === 'discount' || name === 'tax') {
        const amount = name === 'amount' ? newValue : formData.amount;
        const discount = name === 'discount' ? newValue : formData.discount;
        const tax = name === 'tax' ? newValue : formData.tax;
        
        updatedFormData.totalAmount = amount - discount + tax;
      }
      
      setFormData(updatedFormData);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    if (name === 'testId') {
      // Find the selected test
      const test = tests.find(t => t.id === value);
      
      if (test) {
        setSelectedTest(test);
        
        // Update form data with test details
        setFormData({
          ...formData,
          testId: test.id,
          patientId: test.patientId,
          amount: test.testCatalog.price,
          totalAmount: test.testCatalog.price - formData.discount + formData.tax,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{billing ? 'Edit Billing Record' : 'Create New Billing Record'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" disabled={!!billing}>
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
                        {test.testCatalog.name} ({formatCurrency(test.testCatalog.price)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" disabled={!!billing || !!selectedTest}>
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
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="subtitle2">Billing Details</Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Base Amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Discount"
                  name="discount"
                  type="number"
                  value={formData.discount}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Tax"
                  name="tax"
                  type="number"
                  value={formData.tax}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Amount"
                  type="number"
                  value={formData.totalAmount}
                  margin="normal"
                  InputProps={{
                    startAdornment: '$',
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="payment-method-label">Payment Method</InputLabel>
                  <Select
                    labelId="payment-method-label"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleSelectChange}
                    label="Payment Method"
                  >
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                    <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                    <MenuItem value="INSURANCE">Insurance</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="payment-status-label">Payment Status</InputLabel>
                  <Select
                    labelId="payment-status-label"
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleSelectChange}
                    label="Payment Status"
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.insuranceCovered}
                      onChange={handleInputChange}
                      name="insuranceCovered"
                      color="primary"
                    />
                  }
                  label="Insurance Covered"
                  sx={{ mt: 2 }}
                />
              </Grid>
              
              {formData.insuranceCovered && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                      <Typography variant="subtitle2">Insurance Details</Typography>
                    </Divider>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Insurance Amount"
                      name="insuranceAmount"
                      type="number"
                      value={formData.insuranceAmount}
                      onChange={handleInputChange}
                      margin="normal"
                      InputProps={{
                        startAdornment: '$',
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Insurance Provider"
                      name="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Policy Number"
                      name="insurancePolicyNumber"
                      value={formData.insurancePolicyNumber}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                  </Grid>
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
            disabled={loading || !formData.testId || !formData.patientId}
          >
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LaboratoryBilling;
