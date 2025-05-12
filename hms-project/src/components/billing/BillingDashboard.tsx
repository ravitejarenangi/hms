"use client"

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { format, subDays } from 'date-fns';

interface DashboardSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  invoiceCount: {
    pending: number;
    paid: number;
    partiallyPaid: number;
    overdue: number;
    cancelled: number;
  };
  revenueByDepartment: {
    departmentName: string;
    amount: number;
    percentage: number;
  }[];
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    patientName: string;
    date: string;
    amount: number;
    status: string;
  }[];
  recentPayments: {
    id: string;
    receiptNumber: string;
    patientName: string;
    date: string;
    amount: number;
    method: string;
  }[];
  dailyRevenue: {
    date: string;
    amount: number;
  }[];
  collectionRate: number;
}

const BillingDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  // Mock data for development
  const mockDashboardData: DashboardSummary = {
    totalInvoices: 156,
    totalAmount: 1250000,
    paidAmount: 850000,
    pendingAmount: 350000,
    overdueAmount: 50000,
    invoiceCount: {
      pending: 45,
      paid: 95,
      partiallyPaid: 10,
      overdue: 6,
      cancelled: 0,
    },
    revenueByDepartment: [
      { departmentName: 'General Medicine', amount: 350000, percentage: 28 },
      { departmentName: 'Laboratory', amount: 250000, percentage: 20 },
      { departmentName: 'Radiology', amount: 200000, percentage: 16 },
      { departmentName: 'Pharmacy', amount: 180000, percentage: 14.4 },
      { departmentName: 'Surgery', amount: 150000, percentage: 12 },
      { departmentName: 'Others', amount: 120000, percentage: 9.6 },
    ],
    recentInvoices: [
      {
        id: '1',
        invoiceNumber: 'INV-2023-156',
        patientName: 'John Doe',
        date: '2023-05-10',
        amount: 5900,
        status: 'PAID',
      },
      {
        id: '2',
        invoiceNumber: 'INV-2023-155',
        patientName: 'Jane Smith',
        date: '2023-05-09',
        amount: 9440,
        status: 'PENDING',
      },
      {
        id: '3',
        invoiceNumber: 'INV-2023-154',
        patientName: 'Robert Johnson',
        date: '2023-05-08',
        amount: 14160,
        status: 'PARTIALLY_PAID',
      },
      {
        id: '4',
        invoiceNumber: 'INV-2023-153',
        patientName: 'Mary Williams',
        date: '2023-05-07',
        amount: 3500,
        status: 'PAID',
      },
      {
        id: '5',
        invoiceNumber: 'INV-2023-152',
        patientName: 'David Brown',
        date: '2023-05-06',
        amount: 7200,
        status: 'OVERDUE',
      },
    ],
    recentPayments: [
      {
        id: '1',
        receiptNumber: 'RCPT-2023-095',
        patientName: 'John Doe',
        date: '2023-05-10',
        amount: 5900,
        method: 'CASH',
      },
      {
        id: '2',
        receiptNumber: 'RCPT-2023-094',
        patientName: 'Mary Williams',
        date: '2023-05-07',
        amount: 3500,
        method: 'CREDIT_CARD',
      },
      {
        id: '3',
        receiptNumber: 'RCPT-2023-093',
        patientName: 'Robert Johnson',
        date: '2023-05-08',
        amount: 5000,
        method: 'UPI',
      },
      {
        id: '4',
        receiptNumber: 'RCPT-2023-092',
        patientName: 'Sarah Davis',
        date: '2023-05-05',
        amount: 12000,
        method: 'NETBANKING',
      },
      {
        id: '5',
        receiptNumber: 'RCPT-2023-091',
        patientName: 'Michael Wilson',
        date: '2023-05-04',
        amount: 8500,
        method: 'CHEQUE',
      },
    ],
    dailyRevenue: [
      { date: '2023-05-01', amount: 25000 },
      { date: '2023-05-02', amount: 32000 },
      { date: '2023-05-03', amount: 28000 },
      { date: '2023-05-04', amount: 35000 },
      { date: '2023-05-05', amount: 42000 },
      { date: '2023-05-06', amount: 18000 },
      { date: '2023-05-07', amount: 15000 },
      { date: '2023-05-08', amount: 30000 },
      { date: '2023-05-09', amount: 38000 },
      { date: '2023-05-10', amount: 45000 },
    ],
    collectionRate: 68,
  };

  useEffect(() => {
    // In a real application, fetch dashboard data from API
    // For now, use mock data
    setTimeout(() => {
      setDashboardData(mockDashboardData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDateRangeChange = () => {
    // In a real application, this would fetch new data based on the date range
    setLoading(true);
    setTimeout(() => {
      setDashboardData(mockDashboardData);
      setLoading(false);
    }, 1000);
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'PARTIALLY_PAID':
        return 'info';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Cash';
      case 'CREDIT_CARD':
        return 'Credit Card';
      case 'DEBIT_CARD':
        return 'Debit Card';
      case 'UPI':
        return 'UPI';
      case 'NETBANKING':
        return 'Net Banking';
      case 'CHEQUE':
        return 'Cheque';
      case 'INSURANCE':
        return 'Insurance';
      case 'WALLET':
        return 'Wallet';
      default:
        return 'Other';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Failed to load dashboard data
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
              Billing Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Overview of billing and payments
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

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Invoices
                </Typography>
                <ReceiptIcon color="primary" />
              </Box>
              <Typography variant="h4">{dashboardData.totalInvoices}</Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Value: ₹{' '}
                  {dashboardData.totalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Paid Amount
                </Typography>
                <PaymentIcon sx={{ color: 'success.main' }} />
              </Box>
              <Typography variant="h4">
                ₹{' '}
                {dashboardData.paidAmount.toLocaleString('en-IN', {
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
                  {dashboardData.collectionRate}% Collection Rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Pending Amount
                </Typography>
                <AccountBalanceIcon sx={{ color: 'warning.main' }} />
              </Box>
              <Typography variant="h4">
                ₹{' '}
                {dashboardData.pendingAmount.toLocaleString('en-IN', {
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
                <Typography variant="body2" color="textSecondary">
                  {dashboardData.invoiceCount.pending} Pending Invoices
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Overdue Amount
                </Typography>
                <AssignmentReturnIcon sx={{ color: 'error.main' }} />
              </Box>
              <Typography variant="h4">
                ₹{' '}
                {dashboardData.overdueAmount.toLocaleString('en-IN', {
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
                <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5, fontSize: '1rem' }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}
                >
                  {dashboardData.invoiceCount.overdue} Overdue Invoices
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue by Department */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Revenue by Department</Typography>
                <PieChartIcon color="primary" />
              </Box>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Department revenue chart would be displayed here
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell align="right">Amount (₹)</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.revenueByDepartment.map((dept) => (
                      <TableRow key={dept.departmentName}>
                        <TableCell>{dept.departmentName}</TableCell>
                        <TableCell align="right">
                          {dept.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="right">{dept.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Revenue Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Daily Revenue</Typography>
                <BarChartIcon color="primary" />
              </Box>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Daily revenue chart would be displayed here
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Revenue (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.dailyRevenue.slice(-5).map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{day.date}</TableCell>
                        <TableCell align="right">
                          {day.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Invoices */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Invoices</Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount (₹)</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.patientName}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell align="right">
                          {invoice.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status.replace('_', ' ')}
                            color={getStatusChipColor(invoice.status) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Payments</Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Receipt #</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount (₹)</TableCell>
                      <TableCell>Method</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.receiptNumber}</TableCell>
                        <TableCell>{payment.patientName}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell align="right">
                          {payment.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>{getPaymentMethodLabel(payment.method)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import OPDBilling from './OPDBilling';
import IPDBilling from './IPDBilling';
import OperationTheaterBilling from './OperationTheaterBilling';
import EmergencyBilling from './EmergencyBilling';
import PathologyBilling from './PathologyBilling';
import RadiologyBilling from './RadiologyBilling';
import PharmacyBilling from './PharmacyBilling';
import PhysiotherapyBilling from './PhysiotherapyBilling';
import DentalBilling from './DentalBilling';

const departmentTabs = [
  { label: 'OPD', component: <OPDBilling /> },
  { label: 'IPD', component: <IPDBilling /> },
  { label: 'Operation Theater', component: <OperationTheaterBilling /> },
  { label: 'Emergency', component: <EmergencyBilling /> },
  { label: 'Pathology', component: <PathologyBilling /> },
  { label: 'Radiology', component: <RadiologyBilling /> },
  { label: 'Pharmacy', component: <PharmacyBilling /> },
  { label: 'Physiotherapy', component: <PhysiotherapyBilling /> },
  { label: 'Dental', component: <DentalBilling /> },
];

function DepartmentBillingTabs() {
  const [tab, setTab] = React.useState(0);
  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Department Billing Tabs"
      >
        {departmentTabs.map((d, idx) => (
          <Tab key={d.label} label={d.label} />
        ))}
      </Tabs>
      <Box sx={{ mt: 2 }}>{departmentTabs[tab].component}</Box>
    </Box>
  );
}

const BillingDashboardWithDepartments = () => (
  <>
    <BillingDashboard />
    <DepartmentBillingTabs />
  </>
);

export default BillingDashboardWithDepartments;

