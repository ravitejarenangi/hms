import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-hot-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Note: In a real implementation, we would use a charting library like Chart.js, Recharts, or Nivo
// For simplicity, we'll mock the charts with styled divs

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const BillingReports: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('REVENUE');
  const [timeRange, setTimeRange] = useState('MONTH');
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(subMonths(new Date(), 1)));
  const [reportData, setReportData] = useState<any>(null);

  // Report types
  const reportTypes = [
    { value: 'REVENUE', label: 'Revenue by Service Type' },
    { value: 'LOCATION', label: 'Revenue by Location' },
    { value: 'COLLECTION', label: 'Collection Rate Analysis' },
    { value: 'PROFITABILITY', label: 'Profitability by Route' },
    { value: 'INSURANCE', label: 'Insurance Claim Success Rate' },
  ];

  // Time range options
  const timeRanges = [
    { value: 'MONTH', label: 'Last Month' },
    { value: 'QUARTER', label: 'Last Quarter' },
    { value: 'HALFYEAR', label: 'Last 6 Months' },
    { value: 'YEAR', label: 'Last Year' },
    { value: 'CUSTOM', label: 'Custom Range' },
  ];

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock report data - in a real implementation, this would come from the API
  const generateMockReportData = () => {
    if (reportType === 'REVENUE') {
      return {
        title: 'Revenue by Service Type',
        labels: ['Basic Life Support', 'Advanced Life Support', 'Patient Transport', 'Neonatal', 'Mobile ICU'],
        data: [120000, 350000, 80000, 90000, 180000],
        totalAmount: 820000,
        growthRate: 12.5,
      };
    } else if (reportType === 'LOCATION') {
      return {
        title: 'Revenue by Location',
        labels: ['Urban', 'Suburban', 'Rural', 'Highway'],
        data: [450000, 220000, 95000, 55000],
        totalAmount: 820000,
        growthRate: 8.3,
      };
    } else if (reportType === 'COLLECTION') {
      return {
        title: 'Collection Rate Analysis',
        labels: ['Collected', 'Insurance Pending', 'Patient Pending', 'Written Off'],
        data: [75, 15, 8, 2], // percentages
        averageCollectionTime: 18, // days
        improvementRate: 5.2,
      };
    } else if (reportType === 'PROFITABILITY') {
      return {
        title: 'Profitability by Route',
        labels: ['Hospital to Home', 'Emergency Pickup', 'Inter-Hospital', 'Special Events', 'Rural Service'],
        data: [35, 42, 28, 20, 15], // percentages
        averageProfit: 32,
        topRoute: 'Emergency Pickup',
      };
    } else if (reportType === 'INSURANCE') {
      return {
        title: 'Insurance Claim Success Rate',
        labels: ['Approved', 'Partially Approved', 'Denied', 'Pending'],
        data: [68, 12, 8, 12], // percentages
        averageProcessingTime: 21, // days
        topProvider: 'Star Health',
      };
    }
    
    return null;
  };

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call the API with the selected parameters
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = generateMockReportData();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Update date range based on selected time range
  useEffect(() => {
    const now = new Date();
    let start = null;
    let end = now;
    
    switch (timeRange) {
      case 'MONTH':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'QUARTER':
        start = subMonths(now, 3);
        break;
      case 'HALFYEAR':
        start = subMonths(now, 6);
        break;
      case 'YEAR':
        start = subMonths(now, 12);
        break;
      case 'CUSTOM':
        // Keep the existing custom dates
        return;
      default:
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
    }
    
    setStartDate(start);
    setEndDate(end);
  }, [timeRange]);

  // Fetch report data when parameters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [reportType, startDate, endDate]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'dd/MM/yyyy');
  };

  // Render chart (simplified mock visualization)
  const renderChart = () => {
    if (!reportData) return null;
    
    const maxValue = Math.max(...reportData.data);
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>{reportData.title}</Typography>
        
        {reportData.labels.map((label: string, index: number) => {
          const value = reportData.data[index];
          const percentage = reportType === 'REVENUE' || reportType === 'LOCATION' 
            ? (value / reportData.totalAmount) * 100 
            : value;
          
          return (
            <Box key={label} sx={{ mb: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={4}>
                  <Typography variant="body2">{label}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      height: 25,
                      width: `${Math.round((value / maxValue) * 100)}%`,
                      bgcolor: theme.palette.primary.main,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      pr: 1,
                      color: 'white',
                    }}
                  >
                    {percentage.toFixed(1)}%
                  </Box>
                </Grid>
                <Grid item xs={2}>
                  {reportType === 'REVENUE' || reportType === 'LOCATION' ? (
                    <Typography variant="body2" align="right">{formatCurrency(value)}</Typography>
                  ) : (
                    <Typography variant="body2" align="right">{value}%</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          );
        })}
        
        <Divider sx={{ my: 2 }} />
        
        {/* Summary statistics */}
        <Grid container spacing={2}>
          {reportType === 'REVENUE' || reportType === 'LOCATION' ? (
            <>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h6">{formatCurrency(reportData.totalAmount)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Growth Rate</Typography>
                    <Typography variant="h6" color={reportData.growthRate > 0 ? 'success.main' : 'error.main'}>
                      {reportData.growthRate > 0 ? '+' : ''}{reportData.growthRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : reportType === 'COLLECTION' ? (
            <>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Average Collection Time</Typography>
                    <Typography variant="h6">{reportData.averageCollectionTime} days</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Improvement Rate</Typography>
                    <Typography variant="h6" color="success.main">
                      +{reportData.improvementRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : reportType === 'PROFITABILITY' ? (
            <>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Average Profit Margin</Typography>
                    <Typography variant="h6">{reportData.averageProfit}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Top Profitable Route</Typography>
                    <Typography variant="h6">{reportData.topRoute}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : reportType === 'INSURANCE' ? (
            <>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Avg. Processing Time</Typography>
                    <Typography variant="h6">{reportData.averageProcessingTime} days</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Top Insurance Provider</Typography>
                    <Typography variant="h6">{reportData.topProvider}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : null}
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Ambulance Billing Analytics</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="reporting tabs">
          <Tab label="Revenue Analysis" />
          <Tab label="Operational Metrics" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  {timeRanges.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {timeRange === 'CUSTOM' && (
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={setStartDate}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={setEndDate}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>
              </Grid>
            )}
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Showing data from {formatDate(startDate)} to {formatDate(endDate)}
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Typography>Loading report data...</Typography>
            </Box>
          ) : (
            renderChart()
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Operational Metrics</Typography>
          <Typography>
            Operational metrics dashboard would be implemented here with KPIs such as:
          </Typography>
          <ul>
            <li>Average response time</li>
            <li>Number of dispatches per day</li>
            <li>Ambulance utilization rate</li>
            <li>Fuel efficiency</li>
            <li>Maintenance cost per kilometer</li>
            <li>Driver performance metrics</li>
          </ul>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This dashboard would be customized based on hospital management requirements.
          </Typography>
        </Paper>
      </TabPanel>
    </Box>
  );
};
