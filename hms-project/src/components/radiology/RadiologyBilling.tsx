import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  LocalPrintshop as PrintIcon,
  Email as EmailIcon,
  Clear as ClearIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

interface RadiologyBill {
  id: string;
  patientId: string;
  patientName: string;
  radiologyRequestId: string;
  serviceName: string;
  serviceCode: string;
  modalityType: string;
  serviceDate: string;
  amount: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentDate: string | null;
  transactionId: string | null;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
}

const RadiologyBilling: React.FC = () => {
  const [bills, setBills] = useState<RadiologyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search and filter state
  const [patientId, setPatientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  
  // Payment dialog state
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [currentBill, setCurrentBill] = useState<RadiologyBill | null>(null);
  
  // Receipt dialog state
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  useEffect(() => {
    fetchBills();
  }, [page, rowsPerPage, patientId, invoiceNumber, paymentStatus, fromDate, toDate]);

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/radiology/billing?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (patientId) {
        url += `&patientId=${encodeURIComponent(patientId)}`;
      }
      
      if (invoiceNumber) {
        url += `&invoiceNumber=${encodeURIComponent(invoiceNumber)}`;
      }
      
      if (paymentStatus) {
        url += `&paymentStatus=${encodeURIComponent(paymentStatus)}`;
      }
      
      if (fromDate) {
        url += `&fromDate=${encodeURIComponent(fromDate.toISOString())}`;
      }
      
      if (toDate) {
        url += `&toDate=${encodeURIComponent(toDate.toISOString())}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch radiology bills');
      }
      
      const data = await response.json();
      setBills(data.bills);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setPatientId('');
    setInvoiceNumber('');
    setPaymentStatus('');
    setFromDate(null);
    setToDate(null);
    setPage(0);
  };

  const handleOpenPaymentDialog = (bill: RadiologyBill) => {
    setCurrentBill(bill);
    setPaidAmount(bill.totalAmount);
    setPaymentMethod('');
    setTransactionId('');
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setCurrentBill(null);
  };

  const handleOpenReceiptDialog = (bill: RadiologyBill) => {
    setCurrentBill(bill);
    setOpenReceiptDialog(true);
  };

  const handleCloseReceiptDialog = () => {
    setOpenReceiptDialog(false);
    setCurrentBill(null);
  };

  const handleProcessPayment = async () => {
    if (!currentBill) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/radiology/billing/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          billId: currentBill.id,
          paymentMethod,
          transactionId,
          amount: paidAmount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }
      
      setSuccess('Payment processed successfully');
      fetchBills();
      handleClosePaymentDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!currentBill) return;
    
    // In a real implementation, this would generate and print a receipt
    window.print();
  };

  const handleEmailReceipt = async () => {
    if (!currentBill) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/radiology/billing/email-receipt?id=${currentBill.id}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to email receipt');
      }
      
      setSuccess('Receipt emailed successfully');
      handleCloseReceiptDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusChip = (status: string) => {
    let color:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
    
    switch (status) {
      case 'PAID':
        color = 'success';
        break;
      case 'PENDING':
        color = 'warning';
        break;
      case 'OVERDUE':
        color = 'error';
        break;
      case 'CANCELLED':
        color = 'default';
        break;
      case 'REFUNDED':
        color = 'info';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <Box>
      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: patientId && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setPatientId('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="payment-status-filter-label">Payment Status</InputLabel>
              <Select
                labelId="payment-status-filter-label"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                label="Payment Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="OVERDUE">Overdue</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
              color="secondary"
              variant="outlined"
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(date) => setFromDate(date)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(date) => setToDate(date)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
          </LocalizationProvider>
        </Grid>
      </Paper>

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Bills Table */}
      {loading && bills.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : bills.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No radiology bills found. Try adjusting your filters.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>{bill.invoiceNumber}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {bill.patientName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ID: {bill.patientId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {bill.serviceName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {bill.modalityType} - {bill.serviceCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(bill.serviceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    ${bill.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getPaymentStatusChip(bill.paymentStatus)}</TableCell>
                  <TableCell>
                    {bill.paymentStatus === 'PENDING' || bill.paymentStatus === 'OVERDUE' ? (
                      <Tooltip title="Process Payment">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenPaymentDialog(bill)}
                        >
                          <MoneyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="View Receipt">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenReceiptDialog(bill)}
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
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

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Process Payment
        </DialogTitle>
        <DialogContent>
          {currentBill && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Invoice #: {currentBill.invoiceNumber}</Typography>
                <Typography variant="subtitle2">Patient: {currentBill.patientName}</Typography>
                <Typography variant="subtitle2">Service: {currentBill.serviceName}</Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>Total Amount: ${currentBill.totalAmount.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount to Pay"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="payment-method-label">Payment Method</InputLabel>
                  <Select
                    labelId="payment-method-label"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label="Payment Method"
                  >
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                    <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
                    <MenuItem value="INSURANCE">Insurance</MenuItem>
                    <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                    <MenuItem value="MOBILE_PAYMENT">Mobile Payment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  helperText="Required for card payments and bank transfers"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button
            onClick={handleProcessPayment}
            variant="contained"
            color="primary"
            disabled={loading || !paymentMethod || (paidAmount <= 0)}
          >
            {loading ? <CircularProgress size={24} /> : 'Process Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={openReceiptDialog} onClose={handleCloseReceiptDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Receipt
        </DialogTitle>
        <DialogContent>
          {currentBill && (
            <Box id="receipt-content" sx={{ p: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5">Hospital Management System</Typography>
                <Typography variant="body2">123 Healthcare Street, Medical City</Typography>
                <Typography variant="body2">Phone: (123) 456-7890</Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>RECEIPT</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Receipt No: {currentBill.invoiceNumber}</Typography>
                  <Typography variant="subtitle2">Date: {new Date(currentBill.serviceDate).toLocaleDateString()}</Typography>
                  {currentBill.paymentDate && (
                    <Typography variant="subtitle2">Payment Date: {new Date(currentBill.paymentDate).toLocaleDateString()}</Typography>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Patient ID: {currentBill.patientId}</Typography>
                  <Typography variant="subtitle2">Patient Name: {currentBill.patientName}</Typography>
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Service Code</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{currentBill.serviceName} ({currentBill.modalityType})</TableCell>
                          <TableCell>{currentBill.serviceCode}</TableCell>
                          <TableCell align="right">${currentBill.amount.toFixed(2)}</TableCell>
                        </TableRow>
                        {currentBill.discount > 0 && (
                          <TableRow>
                            <TableCell colSpan={2}>Discount</TableCell>
                            <TableCell align="right">-${currentBill.discount.toFixed(2)}</TableCell>
                          </TableRow>
                        )}
                        {currentBill.tax > 0 && (
                          <TableRow>
                            <TableCell colSpan={2}>Tax</TableCell>
                            <TableCell align="right">${currentBill.tax.toFixed(2)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>${currentBill.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Payment Status: {currentBill.paymentStatus}</Typography>
                  {currentBill.paymentMethod && (
                    <Typography variant="subtitle2">Payment Method: {currentBill.paymentMethod.replace('_', ' ')}</Typography>
                  )}
                  {currentBill.transactionId && (
                    <Typography variant="subtitle2">Transaction ID: {currentBill.transactionId}</Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2">Thank you for choosing our services!</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReceiptDialog}>Close</Button>
          <Button
            startIcon={<EmailIcon />}
            onClick={handleEmailReceipt}
            disabled={loading}
          >
            Email Receipt
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrintReceipt}
            variant="contained"
            color="primary"
          >
            Print Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RadiologyBilling;
