import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PatientAutocomplete } from '@/components/patients/PatientAutocomplete';
import { DoctorAutocomplete } from '@/components/doctors/DoctorAutocomplete';
import { DepartmentAutocomplete } from '@/components/departments/DepartmentAutocomplete';

// Define report types
const reportTypes = [
  { value: 'REVENUE_SUMMARY', label: 'Revenue Summary' },
  { value: 'GST_SUMMARY', label: 'GST Summary' },
  { value: 'DEPARTMENT_REVENUE', label: 'Department Revenue' },
  { value: 'DOCTOR_REVENUE', label: 'Doctor Revenue' },
  { value: 'PATIENT_BILLING', label: 'Patient Billing' },
  { value: 'OUTSTANDING_INVOICES', label: 'Outstanding Invoices' },
  { value: 'PAYMENT_COLLECTION', label: 'Payment Collection' },
];

// Define export formats
const exportFormats = [
  { value: 'JSON', label: 'JSON' },
  { value: 'CSV', label: 'CSV' },
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' },
];

// COLORS for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FinancialReports: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [reportType, setReportType] = useState('REVENUE_SUMMARY');
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });
  const [filters, setFilters] = useState({
    departmentId: '',
    doctorId: '',
    patientId: '',
    format: 'JSON',
  });
  const [reportData, setReportData] = useState<any>(null);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle report type change
  const handleReportTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReportType(event.target.value as string);
    setReportData(null);
  };
  
  // Handle filter change
  const handleFilterChange = (name: string, value: any) => {
    setFilters({ ...filters, [name]: value });
  };
  
  // Handle date range change
  const handleDateRangeChange = (type: 'startDate' | 'endDate', date: Date | null) => {
    if (date) {
      setDateRange({ ...dateRange, [type]: date });
    }
  };
  
  // Handle quick date range selection
  const handleQuickDateRange = (range: string) => {
    const today = new Date();
    
    switch (range) {
      case 'today':
        setDateRange({
          startDate: today,
          endDate: today,
        });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({
          startDate: yesterday,
          endDate: yesterday,
        });
        break;
      case 'thisWeek':
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        setDateRange({
          startDate: thisWeekStart,
          endDate: today,
        });
        break;
      case 'thisMonth':
        setDateRange({
          startDate: startOfMonth(today),
          endDate: endOfMonth(today),
        });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setDateRange({
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
        });
        break;
      case 'last30Days':
        setDateRange({
          startDate: subDays(today, 30),
          endDate: today,
        });
        break;
      case 'last90Days':
        setDateRange({
          startDate: subDays(today, 90),
          endDate: today,
        });
        break;
      default:
        break;
    }
  };
  
  // Generate report
  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          fromDate: dateRange.startDate.toISOString(),
          toDate: dateRange.endDate.toISOString(),
          departmentId: filters.departmentId || undefined,
          doctorId: filters.doctorId || undefined,
          patientId: filters.patientId || undefined,
          format: filters.format,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const data = await response.json();
      setReportData(data);
      setTabValue(1); // Switch to Results tab
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  // Export report
  const exportReport = async (format: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          fromDate: dateRange.startDate.toISOString(),
          toDate: dateRange.endDate.toISOString(),
          departmentId: filters.departmentId || undefined,
          doctorId: filters.doctorId || undefined,
          patientId: filters.patientId || undefined,
          format,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      
      // Handle different export formats
      if (format === 'JSON') {
        const data = await response.json();
        // Create a download link for the JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For other formats, get the blob and create a download link
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Report exported as ${format} successfully`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Render report content based on report type
  const renderReportContent = () => {
    if (!reportData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Typography variant="body1" color="textSecondary">
            No report data available. Please generate a report first.
          </Typography>
        </Box>
      );
    }
    
    switch (reportType) {
      case 'REVENUE_SUMMARY':
        return renderRevenueSummaryReport();
      case 'GST_SUMMARY':
        return renderGSTSummaryReport();
      case 'DEPARTMENT_REVENUE':
        return renderDepartmentRevenueReport();
      case 'DOCTOR_REVENUE':
        return renderDoctorRevenueReport();
      case 'OUTSTANDING_INVOICES':
        return renderOutstandingInvoicesReport();
      case 'PAYMENT_COLLECTION':
        return renderPaymentCollectionReport();
      default:
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <Typography variant="body1" color="textSecondary">
              Report type not implemented yet.
            </Typography>
          </Box>
        );
    }
  };
  
  // Render Revenue Summary Report
  const renderRevenueSummaryReport = () => {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total Invoiced
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(reportData.summary.totalInvoiced)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total Collected
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(reportData.summary.totalCollected)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total Outstanding
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(reportData.summary.totalOutstanding)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Collection Rate
                </Typography>
                <Typography variant="h5">
                  {reportData.summary.collectionRate.toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Revenue by Month
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(reportData.invoicesByMonth).map(([month, data]: [string, any]) => ({
                    month,
                    amount: data.amount,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}K`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="amount" name="Revenue" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Payments by Method
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(reportData.paymentsByMethod).map(([method, amount]: [string, number]) => ({
                        name: method,
                        value: amount,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(reportData.paymentsByMethod).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render GST Summary Report
  const renderGSTSummaryReport = () => {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total Taxable Amount
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(reportData.summary.totalTaxableAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total CGST
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(reportData.summary.totalCgstAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total SGST
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(reportData.summary.totalSgstAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total GST
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(reportData.summary.totalGstAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                GST Summary by Rate
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>GST Rate</TableCell>
                      <TableCell align="right">Taxable Amount</TableCell>
                      <TableCell align="right">CGST Amount</TableCell>
                      <TableCell align="right">SGST Amount</TableCell>
                      <TableCell align="right">IGST Amount</TableCell>
                      <TableCell align="right">Total Tax</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(reportData.gstSummaryByRate).map(([rate, data]: [string, any]) => (
                      <TableRow key={rate}>
                        <TableCell>{rate}</TableCell>
                        <TableCell align="right">{formatCurrency(data.taxableAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.cgstAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.sgstAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.igstAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.totalTax)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render Department Revenue Report
  const renderDepartmentRevenueReport = () => {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Revenue by Department
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.revenueByDepartment}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalAmount"
                      nameKey="departmentName"
                      label={({ departmentName, percent }) => `${departmentName}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.revenueByDepartment.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Department Revenue Summary
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell align="right">Items</TableCell>
                      <TableCell align="right">Taxable Amount</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.revenueByDepartment.map((dept: any) => (
                      <TableRow key={dept.departmentId}>
                        <TableCell>{dept.departmentName}</TableCell>
                        <TableCell align="right">{dept.itemCount}</TableCell>
                        <TableCell align="right">{formatCurrency(dept.taxableAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(dept.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render Doctor Revenue Report
  const renderDoctorRevenueReport = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography variant="body1" color="textSecondary">
          Doctor Revenue Report not fully implemented yet.
        </Typography>
      </Box>
    );
  };
  
  // Render Outstanding Invoices Report
  const renderOutstandingInvoicesReport = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography variant="body1" color="textSecondary">
          Outstanding Invoices Report not fully implemented yet.
        </Typography>
      </Box>
    );
  };
  
  // Render Payment Collection Report
  const renderPaymentCollectionReport = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography variant="body1" color="textSecondary">
          Payment Collection Report not fully implemented yet.
        </Typography>
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Financial Reports
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Generate Report" />
          <Tab label="Results" disabled={!reportData} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="report-type-label">Report Type</InputLabel>
                <Select
                  labelId="report-type-label"
                  label="Report Type"
                  value={reportType}
                  onChange={(e) => handleReportTypeChange(e as any)}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Typography variant="subtitle1" gutterBottom>
                Date Range
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="From Date"
                      value={dateRange.startDate}
                      onChange={(date) => handleDateRangeChange('startDate', date)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="To Date"
                      value={dateRange.endDate}
                      onChange={(date) => handleDateRangeChange('endDate', date)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
              
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button size="small" variant="outlined" onClick={() => handleQuickDateRange('today')}>
                  Today
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleQuickDateRange('thisWeek')}>
                  This Week
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleQuickDateRange('thisMonth')}>
                  This Month
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleQuickDateRange('lastMonth')}>
                  Last Month
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleQuickDateRange('last30Days')}>
                  Last 30 Days
                </Button>
              </Stack>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="export-format-label">Export Format</InputLabel>
                <Select
                  labelId="export-format-label"
                  label="Export Format"
                  value={filters.format}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                >
                  {exportFormats.map((format) => (
                    <MenuItem key={format.value} value={format.value}>
                      {format.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Additional Filters
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <DepartmentAutocomplete
                  onChange={(dept) => handleFilterChange('departmentId', dept?.id || '')}
                  label="Filter by Department"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <DoctorAutocomplete
                  onChange={(doctor) => handleFilterChange('doctorId', doctor?.id || '')}
                  label="Filter by Doctor"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <PatientAutocomplete
                  onChange={(patient) => handleFilterChange('patientId', patient?.id || '')}
                  label="Filter by Patient"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<FilterListIcon />}
                  onClick={generateReport}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  {reportTypes.find((type) => type.value === reportType)?.label || 'Report Results'}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={generateReport}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportReport(filters.format)}
                  >
                    Export
                  </Button>
                </Stack>
              </Box>
              
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Report Period: {format(dateRange.startDate, 'dd MMM yyyy')} to {format(dateRange.endDate, 'dd MMM yyyy')}
              </Typography>
              
              {renderReportContent()}
            </>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default FinancialReports;
