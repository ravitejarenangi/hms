"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as MoneyIcon,
  AccountBalance as BankIcon,
  Smartphone as MobileIcon,
  LocalHospital as InsuranceIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }[];
  payments: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
  }[];
  discounts: {
    id: string;
    amount: number;
    percentage: number | null;
    discountType: string;
    reason: string | null;
  }[];
}

interface BillingHistoryData {
  patientId: string;
  patientName: string;
  invoices: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function PatientBillingPage({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [billingData, setBillingData] = useState<BillingHistoryData | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  
  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchBillingHistory();
    }
  }, [status, router, patientId, page, limit, statusFilter, fromDate, toDate]);

  const fetchBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      
      if (fromDate) {
        params.append("from", fromDate.toISOString());
      }
      
      if (toDate) {
        params.append("to", toDate.toISOString());
      }
      
      const response = await fetch(`/api/patients/${patientId}/billing?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setHasPermission(false);
          throw new Error("You don't have permission to view this patient's billing history");
        } else if (response.status === 404) {
          throw new Error("Patient not found");
        } else {
          throw new Error("Failed to fetch billing history");
        }
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBillingData(data.data);
        setHasPermission(true);
      } else {
        throw new Error(data.error || "Failed to fetch billing history");
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching billing history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: SelectChangeEvent<string>) => {
    setLimit(parseInt(event.target.value));
    setPage(1);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handleFromDateChange = (date: Date | null) => {
    setFromDate(date);
    setPage(1);
  };

  const handleToDateChange = (date: Date | null) => {
    setToDate(date);
    setPage(1);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialogOpen(true);
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
  };

  const handleBack = () => {
    router.push(`/patients/${patientId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'warning';
      case 'PENDING':
        return 'info';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'default';
      case 'REFUNDED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCardIcon fontSize="small" />;
      case 'CASH':
        return <MoneyIcon fontSize="small" />;
      case 'BANK_TRANSFER':
      case 'CHEQUE':
        return <BankIcon fontSize="small" />;
      case 'MOBILE_PAYMENT':
      case 'ONLINE':
        return <MobileIcon fontSize="small" />;
      case 'INSURANCE':
        return <InsuranceIcon fontSize="small" />;
      default:
        return <PaymentIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!hasPermission) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: 3, py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Billing History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Patient
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {billingData && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Patient: {billingData.patientName}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFiltersOpen(!filtersOpen)}
                sx={{ mb: 2 }}
              >
                {filtersOpen ? "Hide Filters" : "Show Filters"}
              </Button>
              
              {filtersOpen && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={handleStatusFilterChange}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="PAID">Paid</MenuItem>
                        <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="OVERDUE">Overdue</MenuItem>
                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                        <MenuItem value="REFUNDED">Refunded</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="From Date"
                        value={fromDate}
                        onChange={handleFromDateChange}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="To Date"
                        value={toDate}
                        onChange={handleToDateChange}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Items per page</InputLabel>
                      <Select
                        value={limit.toString()}
                        label="Items per page"
                        onChange={handleLimitChange}
                      >
                        <MenuItem value="5">5</MenuItem>
                        <MenuItem value="10">10</MenuItem>
                        <MenuItem value="25">25</MenuItem>
                        <MenuItem value="50">50</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Box>
            
            {billingData.invoices.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No billing records found
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Paid</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billingData.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>{formatDate(invoice.issuedDate)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                          <TableCell align="right">{formatCurrency(invoice.paidAmount)}</TableCell>
                          <TableCell align="right">{formatCurrency(invoice.balance)}</TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.status}
                              size="small"
                              color={getStatusColor(invoice.status) as any}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Pagination
                    count={billingData.pagination.pages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              </>
            )}
          </Paper>
        </>
      )}

      {/* Invoice Details Dialog */}
      <Dialog
        open={invoiceDialogOpen}
        onClose={handleCloseInvoiceDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedInvoice && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">
                  Invoice #{selectedInvoice.invoiceNumber}
                </Typography>
                <Chip
                  label={selectedInvoice.status}
                  size="small"
                  color={getStatusColor(selectedInvoice.status) as any}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issue Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedInvoice.issuedDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedInvoice.dueDate)}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">Total</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">
                          {formatCurrency(selectedInvoice.totalAmount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedInvoice.discounts.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Discounts
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.discounts.map((discount) => (
                          <TableRow key={discount.id}>
                            <TableCell>{discount.discountType}</TableCell>
                            <TableCell>{discount.reason || "N/A"}</TableCell>
                            <TableCell align="right">
                              {discount.percentage
                                ? `${discount.percentage}% (${formatCurrency(discount.amount)})`
                                : formatCurrency(discount.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {selectedInvoice.payments.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Payments
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getPaymentMethodIcon(payment.paymentMethod)}
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  {payment.paymentMethod.replace('_', ' ')}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={payment.status}
                                size="small"
                                color={payment.status === 'COMPLETED' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">
                  Balance Due: {formatCurrency(selectedInvoice.balance)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<PrintIcon />}
                onClick={() => console.log('Print invoice')}
              >
                Print
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => console.log('Download invoice')}
              >
                Download
              </Button>
              <Button onClick={handleCloseInvoiceDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
