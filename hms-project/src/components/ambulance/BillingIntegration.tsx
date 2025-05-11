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
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Calculate as CalculateIcon,
  ReceiptLong as ReceiptIcon,
  InsertChart as ChartIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { CalcRateSection } from './billing/CalcRateSection';
import { InsuranceSection } from './billing/InsuranceSection';
import { BillingReports } from './billing/BillingReports';

// Tabs interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`billing-tabpanel-${index}`}
      aria-labelledby={`billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BillingIntegration: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDispatch, setActiveDispatch] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch billing records
  const fetchBillingRecords = async () => {
    setLoading(true);
    try {
      let url = `/api/ambulances/billing?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (filterStatus !== 'ALL') {
        url += `&paymentStatus=${filterStatus}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing records');
      }
      
      const result = await response.json();
      setBillingRecords(result.data);
      setTotalRecords(result.meta.total);
    } catch (error) {
      console.error('Error fetching billing records:', error);
      toast.error('Failed to load billing records');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load and when filters/pagination change
  useEffect(() => {
    fetchBillingRecords();
  }, [page, rowsPerPage, filterStatus]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  // Get payment status chip
  const getPaymentStatusChip = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: any } } = {
      PENDING: { label: 'Pending', color: 'warning' },
      PAID: { label: 'Paid', color: 'success' },
      PARTIAL: { label: 'Partial', color: 'info' },
      CANCELLED: { label: 'Cancelled', color: 'error' },
      INSURANCE_PENDING: { label: 'Insurance Pending', color: 'secondary' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'default' };

    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="ambulance billing tabs">
          <Tab label="Billing Records" icon={<ReceiptIcon />} iconPosition="start" />
          <Tab label="Calculation Rates" icon={<CalculateIcon />} iconPosition="start" />
          <Tab label="Insurance Integration" icon={<MoneyIcon />} iconPosition="start" />
          <Tab label="Reports & Analytics" icon={<ChartIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Billing Records Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Ambulance Billing Records</Typography>
        </Box>

        {/* Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Payment Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                  <MenuItem value="PARTIAL">Partial</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="INSURANCE_PENDING">Insurance Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Billing Records List */}
        <Paper sx={{ p: 2 }}>
          {loading && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Typography>Loading...</Typography>
            </Box>
          )}
          
          {!loading && billingRecords.length === 0 && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Typography>No billing records found.</Typography>
            </Box>
          )}
          
          {!loading && billingRecords.map((record) => (
            <Card key={record.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={9}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        Bill #{record.invoiceNumber || record.id.substring(0, 8)}
                      </Typography>
                      {getPaymentStatusChip(record.paymentStatus)}
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Ambulance: {record.AmbulanceDispatch?.Ambulance?.registrationNumber || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        From: {record.AmbulanceDispatch?.pickupLocation || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        To: {record.AmbulanceDispatch?.dropLocation || 'N/A'}
                      </Typography>
                      {record.insuranceCovered && (
                        <Typography variant="body2" color="text.secondary">
                          Insurance: {record.insuranceProvider || 'Unknown'} 
                          {record.insurancePolicyNumber ? ` (${record.insurancePolicyNumber})` : ''}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                      {formatCurrency(record.totalAmount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Date: {formatDate(record.createdAt)}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<ReceiptIcon />}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Paper>
      </TabPanel>

      {/* Calculation Rates Tab */}
      <TabPanel value={tabValue} index={1}>
        <CalcRateSection />
      </TabPanel>

      {/* Insurance Integration Tab */}
      <TabPanel value={tabValue} index={2}>
        <InsuranceSection />
      </TabPanel>

      {/* Reports & Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <BillingReports />
      </TabPanel>
    </Box>
  );
};

export default BillingIntegration;
