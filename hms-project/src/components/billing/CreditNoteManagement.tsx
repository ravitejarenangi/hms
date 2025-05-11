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
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  issueDate: string;
  reason: string;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  status: string;
  refundMethod: string | null;
  refundTransactionId: string | null;
}

interface CreditNoteItem {
  id: string;
  invoiceItemType: string;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unitPrice: number;
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

const CreditNoteManagement: React.FC = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openViewDialog, setOpenViewDialog] = useState<boolean>(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
  const [creditNoteItems, setCreditNoteItems] = useState<CreditNoteItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Mock data for development
  const mockCreditNotes: CreditNote[] = [
    {
      id: '1',
      creditNoteNumber: 'CN-2023-001',
      invoiceId: '1',
      invoiceNumber: 'INV-2023-001',
      patientId: 'P001',
      patientName: 'John Doe',
      issueDate: '2023-05-05',
      reason: 'Service not provided',
      subtotal: 1000,
      cgstAmount: 90,
      sgstAmount: 90,
      igstAmount: 0,
      totalAmount: 1180,
      status: 'ISSUED',
      refundMethod: null,
      refundTransactionId: null,
    },
    {
      id: '2',
      creditNoteNumber: 'CN-2023-002',
      invoiceId: '2',
      invoiceNumber: 'INV-2023-002',
      patientId: 'P002',
      patientName: 'Jane Smith',
      issueDate: '2023-05-10',
      reason: 'Overcharged for service',
      subtotal: 500,
      cgstAmount: 45,
      sgstAmount: 45,
      igstAmount: 0,
      totalAmount: 590,
      status: 'REFUNDED',
      refundMethod: 'CASH',
      refundTransactionId: '',
    },
    {
      id: '3',
      creditNoteNumber: 'CN-2023-003',
      invoiceId: '3',
      invoiceNumber: 'INV-2023-003',
      patientId: 'P003',
      patientName: 'Robert Johnson',
      issueDate: '2023-05-15',
      reason: 'Returned medication',
      subtotal: 800,
      cgstAmount: 72,
      sgstAmount: 72,
      igstAmount: 0,
      totalAmount: 944,
      status: 'ADJUSTED',
      refundMethod: null,
      refundTransactionId: null,
    },
  ];

  const mockCreditNoteItems: CreditNoteItem[] = [
    {
      id: '1',
      invoiceItemType: 'Service',
      description: 'Consultation - General Medicine',
      hsnSacCode: '998311',
      quantity: 1,
      unitPrice: 1000,
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
  ];

  useEffect(() => {
    // In a real application, fetch credit notes from API
    // For now, use mock data
    setTimeout(() => {
      setCreditNotes(mockCreditNotes);
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

  const handleViewCreditNote = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote);
    // In a real application, fetch credit note items from API
    // For now, use mock data
    setCreditNoteItems(mockCreditNoteItems);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedCreditNote(null);
    setCreditNoteItems([]);
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

  const handlePrintCreditNote = (creditNote: CreditNote) => {
    // Implement print functionality
    console.log('Print credit note:', creditNote);
  };

  const handleProcessRefund = (creditNote: CreditNote) => {
    // Implement refund processing functionality
    console.log('Process refund for credit note:', creditNote);
  };

  const filteredCreditNotes = creditNotes.filter((creditNote) => {
    // Apply status filter
    if (filterStatus && creditNote.status !== filterStatus) {
      return false;
    }

    // Apply date range filter
    if (filterStartDate && new Date(creditNote.issueDate) < filterStartDate) {
      return false;
    }
    if (filterEndDate) {
      const endDateWithTime = new Date(filterEndDate);
      endDateWithTime.setHours(23, 59, 59, 999);
      if (new Date(creditNote.issueDate) > endDateWithTime) {
        return false;
      }
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        creditNote.creditNoteNumber.toLowerCase().includes(query) ||
        creditNote.invoiceNumber.toLowerCase().includes(query) ||
        creditNote.patientName.toLowerCase().includes(query) ||
        creditNote.patientId.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return 'warning';
      case 'REFUNDED':
        return 'success';
      case 'ADJUSTED':
        return 'info';
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
              <AssignmentReturnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Credit Note Management
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Create Credit Note
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
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={handleFilterStatusChange}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="ISSUED">Issued</MenuItem>
                    <MenuItem value="REFUNDED">Refunded</MenuItem>
                    <MenuItem value="ADJUSTED">Adjusted</MenuItem>
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
              <Table sx={{ minWidth: 650 }} aria-label="credit note table">
                <TableHead>
                  <TableRow>
                    <TableCell>Credit Note #</TableCell>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount (₹)</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCreditNotes
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((creditNote) => (
                      <TableRow key={creditNote.id}>
                        <TableCell>{creditNote.creditNoteNumber}</TableCell>
                        <TableCell>{creditNote.invoiceNumber}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{creditNote.patientName}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {creditNote.patientId}
                          </Typography>
                        </TableCell>
                        <TableCell>{creditNote.issueDate}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {creditNote.reason}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={creditNote.status}
                            color={getStatusChipColor(creditNote.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {creditNote.totalAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewCreditNote(creditNote)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePrintCreditNote(creditNote)}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {creditNote.status === 'ISSUED' && (
                            <Tooltip title="Process Refund">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleProcessRefund(creditNote)}
                              >
                                <MoneyOffIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredCreditNotes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No credit notes found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredCreditNotes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* View Credit Note Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedCreditNote && (
          <>
            <DialogTitle>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>Credit Note #{selectedCreditNote.creditNoteNumber}</Grid>
                <Grid item>
                  <Chip
                    label={selectedCreditNote.status}
                    color={getStatusChipColor(selectedCreditNote.status) as any}
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
                      <Typography variant="body1">{selectedCreditNote.patientName}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Patient ID: {selectedCreditNote.patientId}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Credit Note Details
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Invoice Number:
                          </Typography>
                          <Typography variant="body2">
                            {selectedCreditNote.invoiceNumber}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Issue Date:
                          </Typography>
                          <Typography variant="body2">{selectedCreditNote.issueDate}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Reason:
                          </Typography>
                          <Typography variant="body2">{selectedCreditNote.reason}</Typography>
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
                      <TableCell align="right">Taxable (₹)</TableCell>
                      <TableCell align="right">GST (%)</TableCell>
                      <TableCell align="right">GST (₹)</TableCell>
                      <TableCell align="right">Total (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {creditNoteItems.map((item) => (
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
                            {selectedCreditNote.subtotal.toLocaleString('en-IN', {
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
                            {selectedCreditNote.cgstAmount.toLocaleString('en-IN', {
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
                            {selectedCreditNote.sgstAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                        {selectedCreditNote.igstAmount > 0 && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2">IGST:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" align="right">
                                ₹{' '}
                                {selectedCreditNote.igstAmount.toLocaleString('en-IN', {
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
                          <Typography variant="subtitle2">Total Amount:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" align="right">
                            ₹{' '}
                            {selectedCreditNote.totalAmount.toLocaleString('en-IN', {
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

              {selectedCreditNote.status === 'REFUNDED' && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Refund Information
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Refund Method:
                        </Typography>
                        <Typography variant="body2">
                          {selectedCreditNote.refundMethod}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Transaction ID:
                        </Typography>
                        <Typography variant="body2">
                          {selectedCreditNote.refundTransactionId || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewDialog}>Close</Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintCreditNote(selectedCreditNote)}
              >
                Print
              </Button>
              {selectedCreditNote.status === 'ISSUED' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<MoneyOffIcon />}
                  onClick={() => handleProcessRefund(selectedCreditNote)}
                >
                  Process Refund
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Credit Note Dialog - This would be implemented as a separate component */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Create New Credit Note</DialogTitle>
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

export default CreditNoteManagement;
