import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSession } from 'next-auth/react';

export default function PharmacyBilling() {
  const { data: session } = useSession();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'CASH',
    reference: '',
    notes: ''
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilterStatus(event.target.value as string);
    setPage(0);
  };

  const handleOpenViewDialog = (bill: any) => {
    setSelectedBill(bill);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedBill(null);
  };

  const handleOpenPaymentDialog = (bill: any) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: bill.totalAmount - bill.paidAmount,
      method: 'CASH',
      reference: '',
      notes: ''
    });
    setPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialog(false);
  };

  const handlePaymentDataChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setPaymentData({
      ...paymentData,
      [name as string]: value
    });
  };

  const handleProcessPayment = async () => {
    try {
      if (!selectedBill) return;

      const response = await fetch(`/api/pharmacy/billing/${selectedBill.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }

      // Refresh bills data
      fetchBills();
      handleClosePaymentDialog();
      handleCloseViewDialog();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handlePrintBill = (billId: string) => {
    window.open(`/api/pharmacy/billing/${billId}/print`, '_blank');
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pharmacy/billing?status=${filterStatus}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }
      const data = await response.json();
      setBills(data.bills);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBills();
    }
  }, [session, filterStatus]);

  // Filter bills based on search term
  const filteredBills = bills.filter(bill => {
    const billNumber = bill.billNumber || '';
    const patientName = bill.patient?.user?.name || '';
    
    return (
      billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'PENDING':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Pharmacy Billing</Typography>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Search Bills"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 250 }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Payment Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={filterStatus}
              onChange={handleFilterChange}
              label="Payment Status"
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="PARTIAL">Partial</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="ALL">All</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bill #</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell align="right">Paid Amount</TableCell>
                <TableCell align="center">Payment Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBills
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {bill.billNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{bill.patient?.user?.name || 'N/A'}</TableCell>
                    <TableCell>{formatDate(bill.billDate)}</TableCell>
                    <TableCell align="right">{formatCurrency(bill.totalAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(bill.paidAmount)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={bill.paymentStatus} 
                        color={getPaymentStatusColor(bill.paymentStatus) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleOpenViewDialog(bill)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Print Bill">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handlePrintBill(bill.id)}
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {bill.paymentStatus !== 'PAID' && (
                        <Tooltip title="Process Payment">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleOpenPaymentDialog(bill)}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {filteredBills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No bills found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredBills.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* View Bill Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Bill Details - {selectedBill?.billNumber}
            </Typography>
            <Chip 
              label={selectedBill?.paymentStatus} 
              color={getPaymentStatusColor(selectedBill?.paymentStatus) as any} 
              size="small" 
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedBill && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Patient Information
                      </Typography>
                      <Typography variant="body1">
                        {selectedBill.patient?.user?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ID: {selectedBill.patient?.patientId || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Bill Information
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong> {formatDate(selectedBill.billDate)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Generated By:</strong> {selectedBill.generatedBy || 'System'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom>
                Items
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Tax</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedBill.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.medicine?.name || 'Unknown Item'}
                          {item.batch && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Batch: {item.batch.batchNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{item.discount}%</TableCell>
                        <TableCell align="right">{item.tax}%</TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box display="flex" justifyContent="flex-end">
                <Box width="250px">
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1">{formatCurrency(selectedBill.subtotal)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Discount:</Typography>
                    <Typography variant="body1">{formatCurrency(selectedBill.discount)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Tax:</Typography>
                    <Typography variant="body1">{formatCurrency(selectedBill.tax)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1" fontWeight="bold">Total:</Typography>
                    <Typography variant="body1" fontWeight="bold">{formatCurrency(selectedBill.totalAmount)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Paid Amount:</Typography>
                    <Typography variant="body1">{formatCurrency(selectedBill.paidAmount)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1" fontWeight="bold" color={selectedBill.totalAmount - selectedBill.paidAmount > 0 ? "error" : "inherit"}>
                      Balance:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color={selectedBill.totalAmount - selectedBill.paidAmount > 0 ? "error" : "inherit"}>
                      {formatCurrency(selectedBill.totalAmount - selectedBill.paidAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {selectedBill.payments && selectedBill.payments.length > 0 && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                    Payment History
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Reference</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedBill.payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>{payment.paymentMethod}</TableCell>
                            <TableCell>{payment.reference || 'N/A'}</TableCell>
                            <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button 
            onClick={() => handlePrintBill(selectedBill?.id)} 
            variant="outlined" 
            color="primary"
            startIcon={<PrintIcon />}
          >
            Print
          </Button>
          {selectedBill && selectedBill.paymentStatus !== 'PAID' && (
            <Button 
              onClick={() => handleOpenPaymentDialog(selectedBill)} 
              variant="contained" 
              color="success"
              startIcon={<CheckCircleIcon />}
            >
              Process Payment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mt: 1 }}>
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="amount"
                label="Payment Amount"
                type="number"
                value={paymentData.amount}
                onChange={handlePaymentDataChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-label"
                  name="method"
                  value={paymentData.method}
                  onChange={handlePaymentDataChange}
                  label="Payment Method"
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                  <MenuItem value="INSURANCE">Insurance</MenuItem>
                  <MenuItem value="MOBILE">Mobile Payment</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                margin="dense"
                name="reference"
                label="Reference Number"
                value={paymentData.reference}
                onChange={handlePaymentDataChange}
                helperText="Transaction ID, Card approval code, etc."
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                margin="dense"
                name="notes"
                label="Notes"
                multiline
                rows={2}
                value={paymentData.notes}
                onChange={handlePaymentDataChange}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button onClick={handleProcessPayment} variant="contained" color="primary">
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
