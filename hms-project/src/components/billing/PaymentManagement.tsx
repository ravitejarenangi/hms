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
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PaymentIcon from '@mui/icons-material/Payment';

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  transactionId: string;
  notes: string;
  receivedBy: string;
}

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openViewDialog, setOpenViewDialog] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Mock data for development
  const mockPayments: Payment[] = [
    {
      id: '1',
      invoiceId: '1',
      invoiceNumber: 'INV-2023-001',
      patientId: 'P001',
      patientName: 'John Doe',
      paymentDate: '2023-05-01',
      paymentMethod: 'CASH',
      amount: 5900,
      transactionId: '',
      notes: 'Full payment received',
      receivedBy: 'Staff 1',
    },
    {
      id: '2',
      invoiceId: '3',
      invoiceNumber: 'INV-2023-003',
      patientId: 'P003',
      patientName: 'Robert Johnson',
      paymentDate: '2023-05-10',
      paymentMethod: 'CREDIT_CARD',
      amount: 5000,
      transactionId: 'TXN123456',
      notes: 'Partial payment',
      receivedBy: 'Staff 2',
    },
    {
      id: '3',
      invoiceId: '4',
      invoiceNumber: 'INV-2023-004',
      patientId: 'P004',
      patientName: 'Mary Williams',
      paymentDate: '2023-05-15',
      paymentMethod: 'UPI',
      amount: 3500,
      transactionId: 'UPI123456789',
      notes: 'Payment for consultation',
      receivedBy: 'Staff 1',
    },
  ];

  useEffect(() => {
    // In a real application, fetch payments from API
    // For now, use mock data
    setTimeout(() => {
      setPayments(mockPayments);
      setLoading(false);
    }, 1000);
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedPayment(null);
  };

  const handleFilterPaymentMethodChange = (event: SelectChangeEvent) => {
    setFilterPaymentMethod(event.target.value);
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handlePrintReceipt = (payment: Payment) => {
    // Implement print functionality
    console.log('Print receipt:', payment);
  };

  const filteredPayments = payments.filter((payment) => {
    // Apply payment method filter
    if (filterPaymentMethod && payment.paymentMethod !== filterPaymentMethod) {
      return false;
    }

    // Apply date range filter
    if (filterStartDate && new Date(payment.paymentDate) < filterStartDate) {
      return false;
    }
    if (filterEndDate) {
      const endDateWithTime = new Date(filterEndDate);
      endDateWithTime.setHours(23, 59, 59, 999);
      if (new Date(payment.paymentDate) > endDateWithTime) {
        return false;
      }
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.invoiceNumber.toLowerCase().includes(query) ||
        payment.patientName.toLowerCase().includes(query) ||
        payment.patientId.toLowerCase().includes(query) ||
        payment.transactionId.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Cash';
      case 'CREDIT_CARD':
        return 'Credit Card';
      case 'DEBIT_CARD':
        return 'Debit Card';
      case 'UPI':
        return 'UPI';
      case 'NETBANKING':
        return 'Net Banking';
      case 'CHEQUE':
        return 'Cheque';
      case 'INSURANCE':
        return 'Insurance';
      case 'WALLET':
        return 'Wallet';
      default:
        return 'Other';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'success';
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return 'primary';
      case 'UPI':
      case 'NETBANKING':
      case 'WALLET':
        return 'info';
      case 'CHEQUE':
        return 'warning';
      case 'INSURANCE':
        return 'secondary';
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
              <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Payment Management
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Record Payment
            </Button>
          </Grid>
        </Grid>
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
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={filterPaymentMethod}
                    label="Payment Method"
                    onChange={handleFilterPaymentMethodChange}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                    <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="NETBANKING">Net Banking</MenuItem>
                    <MenuItem value="CHEQUE">Cheque</MenuItem>
                    <MenuItem value="INSURANCE">Insurance</MenuItem>
                    <MenuItem value="WALLET">Wallet</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={filterStartDate}
                    onChange={(date) => setFilterStartDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={filterEndDate}
                    onChange={(date) => setFilterEndDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setFilterPaymentMethod('');
                    setFilterStartDate(null);
                    setFilterEndDate(null);
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

      <Paper elevation={3}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="payment table">
                <TableHead>
                  <TableRow>
                    <TableCell>Receipt #</TableCell>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell align="right">Amount (₹)</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>RCPT-{payment.id}</TableCell>
                        <TableCell>{payment.invoiceNumber}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{payment.patientName}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {payment.patientId}
                          </Typography>
                        </TableCell>
                        <TableCell>{payment.paymentDate}</TableCell>
                        <TableCell>
                          <Chip
                            label={getPaymentMethodLabel(payment.paymentMethod)}
                            color={getPaymentMethodColor(payment.paymentMethod) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{payment.transactionId || '-'}</TableCell>
                        <TableCell align="right">
                          {payment.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewPayment(payment)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Receipt">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePrintReceipt(payment)}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPayments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* View Payment Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedPayment && (
          <>
            <DialogTitle>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>Payment Receipt #{selectedPayment.id}</Grid>
                <Grid item>
                  <Chip
                    label={getPaymentMethodLabel(selectedPayment.paymentMethod)}
                    color={getPaymentMethodColor(selectedPayment.paymentMethod) as any}
                    size="small"
                  />
                </Grid>
              </Grid>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Patient Information
                      </Typography>
                      <Typography variant="body1">{selectedPayment.patientName}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Patient ID: {selectedPayment.patientId}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Payment Details
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Invoice Number:
                          </Typography>
                          <Typography variant="body2">
                            {selectedPayment.invoiceNumber}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Payment Date:
                          </Typography>
                          <Typography variant="body2">{selectedPayment.paymentDate}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Payment Method:
                          </Typography>
                          <Typography variant="body2">
                            {getPaymentMethodLabel(selectedPayment.paymentMethod)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Transaction ID:
                          </Typography>
                          <Typography variant="body2">
                            {selectedPayment.transactionId || '-'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Payment Amount
                  </Typography>
                  <Typography variant="h4" color="primary" align="center" sx={{ my: 2 }}>
                    ₹{' '}
                    {selectedPayment.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </CardContent>
              </Card>

              {selectedPayment.notes && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Notes
                    </Typography>
                    <Typography variant="body2">{selectedPayment.notes}</Typography>
                  </CardContent>
                </Card>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewDialog}>Close</Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintReceipt(selectedPayment)}
              >
                Print Receipt
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Record Payment Dialog - This would be implemented as a separate component */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Record New Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            This feature will be implemented as a separate component.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCloseDialog}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentManagement;
