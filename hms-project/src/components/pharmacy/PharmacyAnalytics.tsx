import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { useSession } from 'next-auth/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function PharmacyAnalytics() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('MONTH');
  const [tabValue, setTabValue] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<any>({
    summary: {
      totalSales: 0,
      totalPrescriptions: 0,
      totalMedicinesDispensed: 0,
      averageOrderValue: 0,
      lowStockItems: 0
    },
    salesData: [],
    topMedicines: [],
    inventoryStatus: [],
    purchaseOrders: []
  });

  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeRange(event.target.value as string);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pharmacy/analytics?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAnalyticsData();
    }
  }, [session, timeRange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Sales trend chart data
  const salesTrendData = {
    labels: analyticsData.salesData.map((item: any) => item.date),
    datasets: [
      {
        label: 'Sales',
        data: analyticsData.salesData.map((item: any) => item.amount),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3
      }
    ]
  };

  // Sales trend chart options
  const salesTrendOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sales Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value as number)
        }
      }
    }
  };

  // Top medicines chart data
  const topMedicinesData = {
    labels: analyticsData.topMedicines.map((item: any) => item.name),
    datasets: [
      {
        label: 'Units Sold',
        data: analyticsData.topMedicines.map((item: any) => item.quantity),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(40, 159, 64, 0.6)',
          'rgba(210, 199, 199, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(40, 159, 64, 1)',
          'rgba(210, 199, 199, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Top medicines chart options
  const topMedicinesOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top Selling Medicines'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Inventory status chart data
  const inventoryStatusData = {
    labels: ['Low Stock', 'Normal Stock', 'Overstocked'],
    datasets: [
      {
        label: 'Inventory Status',
        data: [
          analyticsData.inventoryStatus.filter((item: any) => item.status === 'LOW').length,
          analyticsData.inventoryStatus.filter((item: any) => item.status === 'NORMAL').length,
          analyticsData.inventoryStatus.filter((item: any) => item.status === 'OVERSTOCK').length
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Purchase orders status chart data
  const purchaseOrdersData = {
    labels: ['Pending', 'Approved', 'Ordered', 'Received', 'Cancelled'],
    datasets: [
      {
        label: 'Purchase Orders',
        data: [
          analyticsData.purchaseOrders.filter((item: any) => item.status === 'PENDING').length,
          analyticsData.purchaseOrders.filter((item: any) => item.status === 'APPROVED').length,
          analyticsData.purchaseOrders.filter((item: any) => item.status === 'ORDERED').length,
          analyticsData.purchaseOrders.filter((item: any) => item.status === 'RECEIVED').length,
          analyticsData.purchaseOrders.filter((item: any) => item.status === 'CANCELLED').length
        ],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
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
          <Typography variant="h6">Pharmacy Analytics</Typography>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range"
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="WEEK">Last Week</MenuItem>
              <MenuItem value="MONTH">Last Month</MenuItem>
              <MenuItem value="QUARTER">Last Quarter</MenuItem>
              <MenuItem value="YEAR">Last Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total Sales
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(analyticsData.summary.totalSales)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Prescriptions Filled
                </Typography>
                <Typography variant="h6">
                  {analyticsData.summary.totalPrescriptions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Medicines Dispensed
                </Typography>
                <Typography variant="h6">
                  {analyticsData.summary.totalMedicinesDispensed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Average Order Value
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(analyticsData.summary.averageOrderValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Low Stock Items
                </Typography>
                <Typography variant="h6" color={analyticsData.summary.lowStockItems > 5 ? "error" : "inherit"}>
                  {analyticsData.summary.lowStockItems}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="Sales" />
          <Tab label="Inventory" />
          <Tab label="Purchase Orders" />
        </Tabs>

        {/* Sales Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sales Trend
                </Typography>
                <Box height={300}>
                  <Line data={salesTrendData} options={salesTrendOptions} />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Top Selling Medicines
                </Typography>
                <Box height={300}>
                  <Bar data={topMedicinesData} options={topMedicinesOptions} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Inventory Tab */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Inventory Status
                </Typography>
                <Box height={300} display="flex" justifyContent="center">
                  <Pie data={inventoryStatusData} />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Low Stock Items
                </Typography>
                {analyticsData.inventoryStatus
                  .filter((item: any) => item.status === 'LOW')
                  .slice(0, 10)
                  .map((item: any, index: number) => (
                    <Box key={index} mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">
                          {item.medicine.name}
                        </Typography>
                        <Typography variant="body2" color="error">
                          {item.currentStock} units
                        </Typography>
                      </Box>
                      <Divider />
                    </Box>
                  ))}
                {analyticsData.inventoryStatus.filter((item: any) => item.status === 'LOW').length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                    No low stock items
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Purchase Orders Tab */}
        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Purchase Orders Status
                </Typography>
                <Box height={300} display="flex" justifyContent="center">
                  <Pie data={purchaseOrdersData} />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Recent Purchase Orders
                </Typography>
                {analyticsData.purchaseOrders
                  .slice(0, 10)
                  .map((order: any, index: number) => (
                    <Box key={index} mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">
                          {order.orderNumber} - {order.supplier.name}
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        Status: {order.status} | Date: {new Date(order.orderDate).toLocaleDateString()}
                      </Typography>
                      <Divider sx={{ mt: 0.5 }} />
                    </Box>
                  ))}
                {analyticsData.purchaseOrders.length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                    No purchase orders found
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
}
