import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { PatientAutocomplete } from '@/components/patients/PatientAutocomplete';

// Types
interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
  };
  invoiceDate: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  payments: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  }[];
}

interface InvoiceListProps {
  initialData?: {
    data: Invoice[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

const InvoiceList: React.FC<InvoiceListProps> = ({ initialData }) => {
  const theme = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>(initialData?.data || []);
  const [pagination, setPagination] = useState({
    total: initialData?.pagination?.total || 0,
    page: initialData?.pagination?.page || 1,
    limit: initialData?.pagination?.limit || 10,
    pages: initialData?.pagination?.pages || 0,
  });
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    patientId: '',
    fromDate: subDays(new Date(), 30),
    toDate: new Date(),
  });
  
  // Fetch invoices with filters
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      
      if (filters.patientId) {
        queryParams.append('patientId', filters.patientId);
      }
      
      if (filters.fromDate) {
        queryParams.append('fromDate', filters.fromDate.toISOString().split('T')[0]);
      }
      
      if (filters.toDate) {
        queryParams.append('toDate', filters.toDate.toISOString().split('T')[0]);
      }
      
      const response = await fetch(`/api/billing/invoices?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      setInvoices(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (event: unknown, newPage: number) => {
    setPagination({ ...pagination, page: newPage + 1 });
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination({
      ...pagination,
      limit: parseInt(event.target.value, 10),
      page: 1,
    });
  };
  
  // Handle filter change
  const handleFilterChange = (name: string, value: any) => {
    setFilters({ ...filters, [name]: value });
    setPagination({ ...pagination, page: 1 });
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchInvoices();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      patientId: '',
      fromDate: subDays(new Date(), 30),
      toDate: new Date(),
    });
    setPagination({ ...pagination, page: 1 });
  };
  
  // Handle patient selection
  const handlePatientSelect = (patient: any) => {
    handleFilterChange('patientId', patient?.id || '');
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Get status chip color
  const getStatusChipColor = (status: string) => {
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
      default:
        return 'default';
    }
  };
  
  // Format status label
  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  // Effect to fetch invoices when filters or pagination changes
  useEffect(() => {
    if (!initialData) {
      fetchInvoices();
    }
  }, [pagination.page, pagination.limit]);
  
  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Invoices</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/billing/invoices/create')}
          >
            Create Invoice
          </Button>
        </Box>
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="OVERDUE">Overdue</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={filters.fromDate}
                onChange={(date) => handleFilterChange('fromDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="To Date"
                value={filters.toDate}
                onChange={(date) => handleFilterChange('toDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <PatientAutocomplete
              onChange={handlePatientSelect}
              label="Filter by Patient"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={applyFilters}
                fullWidth
              >
                Apply Filters
              </Button>
              <Button
                variant="text"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Stack>
          </Grid>
        </Grid>
        
        {/* Invoices Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !invoices.length ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !invoices.length ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.patient.firstName} {invoice.patient.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {invoice.patient.uhid}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatusLabel(invoice.status)}
                        color={getStatusChipColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.paidAmount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.balanceAmount)}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {invoice.status !== 'CANCELLED' && invoice.balanceAmount > 0 && (
                          <Tooltip title="Add Payment">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => router.push(`/billing/invoices/${invoice.id}/payment`)}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Print">
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => window.print()}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
};

export default InvoiceList;
