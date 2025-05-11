import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Science as ScienceIcon,
  Biotech as BiotechIcon,
  LocalHospital as LocalHospitalIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

interface AnalyticsData {
  testStatistics: {
    totalTests: number;
    pendingTests: number;
    completedTests: number;
    cancelledTests: number;
    testsByCategory: {
      category: string;
      count: number;
    }[];
    testsTrend: {
      date: string;
      count: number;
    }[];
  };
  sampleStatistics: {
    totalSamples: number;
    pendingSamples: number;
    processedSamples: number;
    rejectedSamples: number;
    samplesByType: {
      type: string;
      count: number;
    }[];
  };
  billingStatistics: {
    totalRevenue: number;
    pendingPayments: number;
    completedPayments: number;
    revenueByMonth: {
      month: string;
      revenue: number;
    }[];
    revenueByTestCategory: {
      category: string;
      revenue: number;
    }[];
  };
}

const AnalyticsComponent: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('month');

  // Define colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff8042'
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/lab/analytics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeRange(event.target.value as string);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No analytics data available.
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h2">
              Laboratory Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Overview of laboratory operations, tests, samples, and revenue
            </Typography>
          </Grid>
          <Grid item>
            <FormControl variant="outlined" size="small">
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                onChange={handleTimeRangeChange}
                label="Time Range"
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ScienceIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {analyticsData.testStatistics.totalTests}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Total Tests
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                {analyticsData.testStatistics.completedTests} completed ({Math.round((analyticsData.testStatistics.completedTests / analyticsData.testStatistics.totalTests) * 100)}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BiotechIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {analyticsData.sampleStatistics.totalSamples}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Total Samples
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                {analyticsData.sampleStatistics.processedSamples} processed ({Math.round((analyticsData.sampleStatistics.processedSamples / analyticsData.sampleStatistics.totalSamples) * 100)}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocalHospitalIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {analyticsData.testStatistics.pendingTests}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Tests
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                {analyticsData.sampleStatistics.pendingSamples} pending samples
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(analyticsData.billingStatistics.totalRevenue)}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                {formatCurrency(analyticsData.billingStatistics.pendingPayments)} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Tests by Category */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Tests by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.testStatistics.testsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="category"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {analyticsData.testStatistics.testsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} tests`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Tests Trend */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Tests Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={analyticsData.testStatistics.testsTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke={theme.palette.primary.main} activeDot={{ r: 8 }} name="Tests" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Samples by Type */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Samples by Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analyticsData.sampleStatistics.samplesByType}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Samples" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Revenue by Month */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Revenue by Month
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analyticsData.billingStatistics.revenueByMonth}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill={theme.palette.success.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Revenue by Test Category */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Revenue by Test Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analyticsData.billingStatistics.revenueByTestCategory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue">
                  {analyticsData.billingStatistics.revenueByTestCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsComponent;
