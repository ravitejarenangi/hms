import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format, subDays, subMonths } from 'date-fns';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface RevenueData {
  period: string;
  amount: number;
  growth: number;
}

interface DepartmentRevenue {
  departmentName: string;
  amount: number;
  percentage: number;
}

interface ServiceRevenue {
  serviceName: string;
  serviceCode: string;
  count: number;
  amount: number;
  percentage: number;
}

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface InvoiceStatusData {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

interface AnalyticsData {
  revenueByPeriod: RevenueData[];
  revenueByDepartment: DepartmentRevenue[];
  revenueByService: ServiceRevenue[];
  revenueByPaymentMethod: PaymentMethodData[];
  invoiceByStatus: InvoiceStatusData[];
  collectionEfficiency: number;
  averageCollectionPeriod: number;
  outstandingReceivables: number;
}

const BillingAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: subMonths(new Date(), 3),
    endDate: new Date(),
  });
  const [periodType, setPeriodType] = useState<string>('monthly');

  // Mock data for development
  const mockAnalyticsData: AnalyticsData = {
    revenueByPeriod: [
      { period: 'Jan 2023', amount: 1250000, growth: 5.2 },
      { period: 'Feb 2023', amount: 1320000, growth: 5.6 },
      { period: 'Mar 2023', amount: 1380000, growth: 4.5 },
      { period: 'Apr 2023', amount: 1450000, growth: 5.1 },
      { period: 'May 2023', amount: 1520000, growth: 4.8 },
    ],
    revenueByDepartment: [
      { departmentName: 'General Medicine', amount: 450000, percentage: 29.6 },
      { departmentName: 'Laboratory', amount: 320000, percentage: 21.1 },
      { departmentName: 'Radiology', amount: 280000, percentage: 18.4 },
      { departmentName: 'Pharmacy', amount: 220000, percentage: 14.5 },
      { departmentName: 'Surgery', amount: 150000, percentage: 9.9 },
      { departmentName: 'Physiotherapy', amount: 100000, percentage: 6.5 },
    ],
    revenueByService: [
      { serviceName: 'General Consultation', serviceCode: 'CONS-GEN', count: 520, amount: 520000, percentage: 34.2 },
      { serviceName: 'Complete Blood Count', serviceCode: 'LAB-CBC', count: 320, amount: 256000, percentage: 16.8 },
      { serviceName: 'X-Ray Chest', serviceCode: 'RAD-XRAY-CHEST', count: 180, amount: 216000, percentage: 14.2 },
      { serviceName: 'CT Scan', serviceCode: 'RAD-CT', count: 45, amount: 180000, percentage: 11.8 },
      { serviceName: 'Specialist Consultation', serviceCode: 'CONS-SPL', count: 95, amount: 142500, percentage: 9.4 },
      { serviceName: 'Physiotherapy Session', serviceCode: 'PHY-SESS', count: 140, amount: 98000, percentage: 6.4 },
      { serviceName: 'ECG', serviceCode: 'CAR-ECG', count: 110, amount: 88000, percentage: 5.8 },
      { serviceName: 'Others', serviceCode: 'OTHERS', count: 25, amount: 19500, percentage: 1.4 },
    ],
    revenueByPaymentMethod: [
      { method: 'Cash', count: 320, amount: 480000, percentage: 31.6 },
      { method: 'Credit Card', count: 210, amount: 420000, percentage: 27.6 },
      { method: 'UPI', count: 280, amount: 350000, percentage: 23.0 },
      { method: 'Insurance', count: 45, amount: 180000, percentage: 11.8 },
      { method: 'Cheque', count: 35, amount: 70000, percentage: 4.6 },
      { method: 'Net Banking', count: 20, amount: 20000, percentage: 1.4 },
    ],
    invoiceByStatus: [
      { status: 'Paid', count: 520, amount: 1040000, percentage: 68.4 },
      { status: 'Pending', count: 180, amount: 360000, percentage: 23.7 },
      { status: 'Partially Paid', count: 45, amount: 90000, percentage: 5.9 },
      { status: 'Overdue', count: 15, amount: 30000, percentage: 2.0 },
    ],
    collectionEfficiency: 82.5,
    averageCollectionPeriod: 12.3,
    outstandingReceivables: 480000,
  };

  useEffect(() => {
    // In a real application, fetch analytics data from API
    // For now, use mock data
    setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDateRangeChange = () => {
    // In a real application, this would fetch new data based on the date range
    setLoading(true);
    setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);
  };

  const handlePeriodTypeChange = (event: SelectChangeEvent) => {
    setPeriodType(event.target.value);
    // In a real application, this would fetch new data based on the period type
    setLoading(true);
    setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);
  };

  const handleExportData = () => {
    // In a real application, this would export the data to CSV or Excel
    alert('Export functionality will be implemented here');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Failed to load analytics data
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="div">
              Billing Analytics
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Detailed analysis of billing data
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Grid container spacing={2} justifyContent="flex-end">
              <Grid item>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From"
                    value={dateRange.startDate}
                    onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To"
                    value={dateRange.endDate}
                    onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={handleDateRangeChange}
                  sx={{ height: '40px' }}
                >
                  Apply
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                ₹{' '}
                {analyticsData.revenueByPeriod
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5, fontSize: '1rem' }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}
                >
                  {analyticsData.revenueByPeriod[analyticsData.revenueByPeriod.length - 1].growth}% growth
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Collection Efficiency
              </Typography>
              <Typography variant="h4">{analyticsData.collectionEfficiency}%</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Based on paid vs. total invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Average Collection Period
              </Typography>
              <Typography variant="h4">{analyticsData.averageCollectionPeriod} days</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Time to collect payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Outstanding Receivables
              </Typography>
              <Typography variant="h4">
                ₹{' '}
                {analyticsData.outstandingReceivables.toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Pending collections
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="analytics tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<TimelineIcon />}
              label="Revenue Trends"
              id="analytics-tab-0"
              aria-controls="analytics-tabpanel-0"
            />
            <Tab
              icon={<PieChartIcon />}
              label="Department Analysis"
              id="analytics-tab-1"
              aria-controls="analytics-tabpanel-1"
            />
            <Tab
              icon={<BarChartIcon />}
              label="Service Analysis"
              id="analytics-tab-2"
              aria-controls="analytics-tabpanel-2"
            />
            <Tab
              icon={<TrendingUpIcon />}
              label="Payment Analysis"
              id="analytics-tab-3"
              aria-controls="analytics-tabpanel-3"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6">Revenue Trends</Typography>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={periodType}
                    label="Period"
                    onChange={handlePeriodTypeChange}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportData}
                >
                  Export
                </Button>
              </Grid>
            </Grid>

            <Box sx={{ height: '400px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', pt: 10 }}>
                Revenue trend chart would be displayed here
              </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Revenue (₹)</TableCell>
                    <TableCell align="right">Growth (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.revenueByPeriod.map((item) => (
                    <TableRow key={item.period}>
                      <TableCell>{item.period}</TableCell>
                      <TableCell align="right">
                        {item.amount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: item.growth >= 0 ? 'success.main' : 'error.main',
                        }}
                      >
                        {item.growth >= 0 ? '+' : ''}
                        {item.growth}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6">Department Revenue Analysis</Typography>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportData}
                >
                  Export
                </Button>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: '400px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
                  <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', pt: 10 }}>
                    Department revenue pie chart would be displayed here
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Department</TableCell>
                        <TableCell align="right">Revenue (₹)</TableCell>
                        <TableCell align="right">Percentage (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.revenueByDepartment.map((item) => (
                        <TableRow key={item.departmentName}>
                          <TableCell>{item.departmentName}</TableCell>
                          <TableCell align="right">
                            {item.amount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell align="right">{item.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6">Service Revenue Analysis</Typography>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportData}
                >
                  Export
                </Button>
              </Grid>
            </Grid>

            <Box sx={{ height: '400px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', pt: 10 }}>
                Service revenue chart would be displayed here
              </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Revenue (₹)</TableCell>
                    <TableCell align="right">Percentage (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.revenueByService.map((item) => (
                    <TableRow key={item.serviceCode}>
                      <TableCell>{item.serviceName}</TableCell>
                      <TableCell>{item.serviceCode}</TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right">
                        {item.amount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell align="right">{item.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6">Payment Analysis</Typography>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportData}
                >
                  Export
                </Button>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Revenue by Payment Method
                </Typography>
                <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
                  <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', pt: 10 }}>
                    Payment method chart would be displayed here
                  </Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Payment Method</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Amount (₹)</TableCell>
                        <TableCell align="right">Percentage (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.revenueByPaymentMethod.map((item) => (
                        <TableRow key={item.method}>
                          <TableCell>{item.method}</TableCell>
                          <TableCell align="right">{item.count}</TableCell>
                          <TableCell align="right">
                            {item.amount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell align="right">{item.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Invoice Status Distribution
                </Typography>
                <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
                  <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', pt: 10 }}>
                    Invoice status chart would be displayed here
                  </Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Amount (₹)</TableCell>
                        <TableCell align="right">Percentage (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.invoiceByStatus.map((item) => (
                        <TableRow key={item.status}>
                          <TableCell>{item.status}</TableCell>
                          <TableCell align="right">{item.count}</TableCell>
                          <TableCell align="right">
                            {item.amount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell align="right">{item.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default BillingAnalytics;
