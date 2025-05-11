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
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

interface InvoiceItem {
  id: string;
  itemType: string;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRateType: string;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openViewDialog, setOpenViewDialog] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Mock data for development
  const mockInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2023-001',
      patientId: 'P001',
      patientName: 'John Doe',
      invoiceDate: '2023-05-01',
      dueDate: '2023-05-15',
      status: 'PAID',
      subtotal: 5000,
      taxableAmount: 5000,
      cgstAmount: 450,
      sgstAmount: 450,
      igstAmount: 0,
      totalAmount: 5900,
      paidAmount: 5900,
      balanceAmount: 0,
    },
    {
      id: '2',
      invoiceNumber: 'INV-2023-002',
      patientId: 'P002',
      patientName: 'Jane Smith',
      invoiceDate: '2023-05-05',
      dueDate: '2023-05-20',
      status: 'PENDING',
      subtotal: 8000,
      taxableAmount: 8000,
      cgstAmount: 720,
      sgstAmount: 720,
      igstAmount: 0,
      totalAmount: 9440,
      paidAmount: 0,
      balanceAmount: 9440,
    },
    {
      id: '3',
      invoiceNumber: 'INV-2023-003',
      patientId: 'P003',
      patientName: 'Robert Johnson',
      invoiceDate: '2023-05-10',
      dueDate: '2023-05-25',
      status: 'PARTIALLY_PAID',
      subtotal: 12000,
      taxableAmount: 12000,
      cgstAmount: 1080,
      sgstAmount: 1080,
      igstAmount: 0,
      totalAmount: 14160,
      paidAmount: 5000,
      balanceAmount: 9160,
    },
  ];

  const mockInvoiceItems: InvoiceItem[] = [
    {
      id: '1',
      itemType: 'Service',
      description: 'Consultation - General Medicine',
      hsnSacCode: '998311',
      quantity: 1,
      unitPrice: 1000,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 1000,
      gstRateType: 'EIGHTEEN',
      cgstRate: 9,
      cgstAmount: 90,
      sgstRate: 9,
      sgstAmount: 90,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 1180,
    },
    {
      id: '2',
      itemType: 'Service',
      description: 'Blood Test - Complete Blood Count',
      hsnSacCode: '998311',
      quantity: 1,
      unitPrice: 800,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 800,
      gstRateType: 'EIGHTEEN',
      cgstRate: 9,
      cgstAmount: 72,
      sgstRate: 9,
      sgstAmount: 72,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 944,
    },
    {
      id: '3',
      itemType: 'Service',
      description: 'X-Ray - Chest',
      hsnSacCode: '998311',
      quantity: 1,
      unitPrice: 1200,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 1200,
      gstRateType: 'EIGHTEEN',
      cgstRate: 9,
      cgstAmount: 108,
      sgstRate: 9,
      sgstAmount: 108,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 1416,
    },
  ];

  useEffect(() => {
    // In a real application, fetch invoices from API
    // For now, use mock data
    setTimeout(() => {
      setInvoices(mockInvoices);
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

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    // In a real application, fetch invoice items from API
    // For now, use mock data
    setInvoiceItems(mockInvoiceItems);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedInvoice(null);
    setInvoiceItems([]);
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

  const handlePrintInvoice = (invoice: Invoice) => {
    // Implement print functionality
    console.log('Print invoice:', invoice);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    // Implement payment recording functionality
    console.log('Record payment for invoice:', invoice);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    // Apply status filter
    if (filterStatus && invoice.status !== filterStatus) {
      return false;
    }

    // Apply date range filter
    if (filterStartDate && new Date(invoice.invoiceDate) < filterStartDate) {
      return false;
    }
    if (filterEndDate) {
      const endDateWithTime = new Date(filterEndDate);
      endDateWithTime.setHours(23, 59, 59, 999);
      if (new Date(invoice.invoiceDate) > endDateWithTime) {
        return false;
      }
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.patientName.toLowerCase().includes(query) ||
        invoice.patientId.toLowerCase().includes(query)
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
      case 'CANCELLED':
        return 'error';
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
              <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Invoice Management
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Create Invoice
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
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={handleFilterStatusChange}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                    <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={filterStartDate}
                    onChange={(date) => setFilterStartDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={filterEndDate}
                    onChange={(date) => setFilterEndDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setFilterStatus('');
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
              <Table sx={{ minWidth: 650 }} aria-label="invoice table">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Total (₹)</TableCell>
                    <TableCell align="right">Balance (₹)</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{invoice.patientName}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {invoice.patientId}
                          </Typography>
                        </TableCell>
                        <TableCell>{invoice.invoiceDate}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status.replace('_', ' ')}
                            color={getStatusChipColor(invoice.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {invoice.totalAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {invoice.balanceAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePrintInvoice(invoice)}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {invoice.status !== 'PAID' && (
                            <Tooltip title="Record Payment">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleRecordPayment(invoice)}
                              >
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {invoice.status === 'DRAFT' && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton size="small" color="primary">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredInvoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* View Invoice Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedInvoice && (
          <>
            <DialogTitle>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>Invoice #{selectedInvoice.invoiceNumber}</Grid>
                <Grid item>
                  <Chip
                    label={selectedInvoice.status.replace('_', ' ')}
                    color={getStatusChipColor(selectedInvoice.status) as any}
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
                      <Typography variant="body1">{selectedInvoice.patientName}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Patient ID: {selectedInvoice.patientId}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Invoice Details
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Invoice Date:
                          </Typography>
                          <Typography variant="body2">
                            {selectedInvoice.invoiceDate}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Due Date:
                          </Typography>
                          <Typography variant="body2">{selectedInvoice.dueDate}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>HSN/SAC</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Rate (₹)</TableCell>
                      <TableCell align="right">Discount (₹)</TableCell>
                      <TableCell align="right">Taxable (₹)</TableCell>
                      <TableCell align="right">GST (%)</TableCell>
                      <TableCell align="right">GST (₹)</TableCell>
                      <TableCell align="right">Total (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.hsnSacCode}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {item.unitPrice.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {item.discountAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {item.taxableAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {item.cgstRate + item.sgstRate + item.igstRate}%
                        </TableCell>
                        <TableCell align="right">
                          {(item.cgstAmount + item.sgstAmount + item.igstAmount).toLocaleString(
                            'en-IN',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {item.totalAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}></Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">Subtotal:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="right">
                            ₹{' '}
                            {selectedInvoice.subtotal.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">CGST:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="right">
                            ₹{' '}
                            {selectedInvoice.cgstAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">SGST:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="right">
                            ₹{' '}
                            {selectedInvoice.sgstAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        {selectedInvoice.igstAmount > 0 && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2">IGST:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" align="right">
                                ₹{' '}
                                {selectedInvoice.igstAmount.toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Grid>
                          </>
                        )}
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Total:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" align="right">
                            ₹{' '}
                            {selectedInvoice.totalAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="success.main">
                            Paid Amount:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="success.main" align="right">
                            ₹{' '}
                            {selectedInvoice.paidAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="error.main">
                            Balance Due:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="error.main" align="right">
                            ₹{' '}
                            {selectedInvoice.balanceAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewDialog}>Close</Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintInvoice(selectedInvoice)}
              >
                Print
              </Button>
              {selectedInvoice.status !== 'PAID' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PaymentIcon />}
                  onClick={() => handleRecordPayment(selectedInvoice)}
                >
                  Record Payment
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Invoice Dialog - This would be implemented as a separate component */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Create New Invoice</DialogTitle>
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

export default InvoiceManagement;
