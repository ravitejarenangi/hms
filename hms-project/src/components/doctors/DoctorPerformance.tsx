import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  AccessTime as AccessTimeIcon,
  People as PeopleIcon,
  Share as ShareIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, isValid, addMonths, startOfMonth, endOfMonth } from 'date-fns';

interface PerformanceMetric {
  id: string;
  doctorId: string;
  period: string;
  startDate: string;
  endDate: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageDuration: number;
  appointmentCompletionRate: number;
  patientSatisfaction: number | null;
  revenueGenerated: number;
  referralsReceived: number;
  referralsMade: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const DoctorPerformance = ({ doctorId }: { doctorId?: string }) => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [period, setPeriod] = useState<string>('monthly');
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPerformanceMetrics();
    }
  }, [status, doctorId, period, dateRange]);

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      const id = doctorId || session?.user.doctorId;
      
      if (!id) {
        setSnackbarMessage('No doctor ID provided');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }
      
      let url = `/api/doctors/performance?doctorId=${id}&period=${period}`;
      
      if (dateRange.startDate && dateRange.endDate) {
        url += `&startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data.metrics);
        setIsCalculated(data.data.isCalculated || false);
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch performance metrics');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      setSnackbarMessage('An error occurred while fetching performance metrics');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event: any) => {
    const newPeriod = event.target.value;
    setPeriod(newPeriod);
    
    // Adjust date range based on period
    const today = new Date();
    let start = today;
    let end = today;
    
    switch (newPeriod) {
      case 'daily':
        start = today;
        end = today;
        break;
      case 'weekly':
        start = new Date(today.setDate(today.getDate() - today.getDay()));
        end = new Date(today.setDate(today.getDate() + 6));
        break;
      case 'monthly':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'quarterly':
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), quarterMonth, 1);
        end = new Date(today.getFullYear(), quarterMonth + 3, 0);
        break;
      case 'yearly':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        break;
    }
    
    setDateRange({
      startDate: start,
      endDate: end
    });
  };

  const handleGenerateMetrics = async () => {
    try {
      setLoading(true);
      const id = doctorId || session?.user.doctorId;
      
      if (!id) {
        setSnackbarMessage('No doctor ID provided');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/doctors/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: id,
          period,
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Performance metrics generated successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        fetchPerformanceMetrics();
      } else {
        setSnackbarMessage(data.error || 'Failed to generate performance metrics');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error generating performance metrics:', error);
      setSnackbarMessage('An error occurred while generating performance metrics');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Paper elevation={3}>
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" component="h1">
                Performance Metrics
              </Typography>
              {session?.user.role === 'admin' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleGenerateMetrics}
                >
                  Generate Metrics
                </Button>
              )}
            </Box>

            <Box mb={3}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="period-label">Period</InputLabel>
                    <Select
                      labelId="period-label"
                      value={period}
                      onChange={handlePeriodChange}
                      label="Period"
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={8}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <DatePicker
                          label="Start Date"
                          value={dateRange.startDate}
                          onChange={(date) => date && setDateRange({ ...dateRange, startDate: date })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <DatePicker
                          label="End Date"
                          value={dateRange.endDate}
                          onChange={(date) => date && setDateRange({ ...dateRange, endDate: date })}
                        />
                      </Grid>
                    </Grid>
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Box>

            {isCalculated && (
              <Box mb={2}>
                <Alert severity="info" icon={<InfoIcon />}>
                  These metrics are calculated on-the-fly and have not been saved to the database.
                </Alert>
              </Box>
            )}

            {metrics.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="textSecondary">
                  No performance metrics found for the selected period.
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={3} mb={4}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" component="div">
                            Appointments
                          </Typography>
                          <PeopleIcon />
                        </Box>
                        <Typography variant="h4" component="div" mt={2}>
                          {metrics[0].totalAppointments}
                        </Typography>
                        <Typography variant="body2" mt={1}>
                          {metrics[0].completedAppointments} completed
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" component="div">
                            Completion Rate
                          </Typography>
                          <TrendingUpIcon />
                        </Box>
                        <Typography variant="h4" component="div" mt={2}>
                          {metrics[0].appointmentCompletionRate.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" mt={1}>
                          {metrics[0].noShowAppointments} no-shows
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" component="div">
                            Avg. Duration
                          </Typography>
                          <AccessTimeIcon />
                        </Box>
                        <Typography variant="h4" component="div" mt={2}>
                          {metrics[0].averageDuration} min
                        </Typography>
                        <Typography variant="body2" mt={1}>
                          per appointment
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" component="div">
                            Revenue
                          </Typography>
                          <AttachMoneyIcon />
                        </Box>
                        <Typography variant="h4" component="div" mt={2}>
                          ${metrics[0].revenueGenerated.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" mt={1}>
                          for this period
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Detailed Metrics
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">{metrics[0].period}</TableCell>
                        <TableCell>
                          {format(parseISO(metrics[0].startDate), 'MMM dd, yyyy')} - {format(parseISO(metrics[0].endDate), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Total Appointments</TableCell>
                        <TableCell align="right">{metrics[0].totalAppointments}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Tooltip title="Completed">
                              <Typography variant="body2" color="success.main" mr={2}>
                                {metrics[0].completedAppointments} completed
                              </Typography>
                            </Tooltip>
                            <Tooltip title="Cancelled">
                              <Typography variant="body2" color="error.main" mr={2}>
                                {metrics[0].cancelledAppointments} cancelled
                              </Typography>
                            </Tooltip>
                            <Tooltip title="No-shows">
                              <Typography variant="body2" color="warning.main">
                                {metrics[0].noShowAppointments} no-shows
                              </Typography>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Completion Rate</TableCell>
                        <TableCell align="right">{metrics[0].appointmentCompletionRate.toFixed(1)}%</TableCell>
                        <TableCell>
                          {metrics[0].totalAppointments > 0 ? 
                            `${metrics[0].completedAppointments} out of ${metrics[0].totalAppointments} appointments completed` : 
                            'No appointments in this period'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Duration</TableCell>
                        <TableCell align="right">{metrics[0].averageDuration} minutes</TableCell>
                        <TableCell>Average time spent per appointment</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Revenue Generated</TableCell>
                        <TableCell align="right">${metrics[0].revenueGenerated.toFixed(2)}</TableCell>
                        <TableCell>Total billing for this period</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Referrals</TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            <ShareIcon fontSize="small" sx={{ mr: 1 }} />
                            {metrics[0].referralsMade + metrics[0].referralsReceived}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Tooltip title="Referrals Made">
                              <Typography variant="body2" mr={2}>
                                {metrics[0].referralsMade} made
                              </Typography>
                            </Tooltip>
                            <Tooltip title="Referrals Received">
                              <Typography variant="body2">
                                {metrics[0].referralsReceived} received
                              </Typography>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      {metrics[0].patientSatisfaction && (
                        <TableRow>
                          <TableCell>Patient Satisfaction</TableCell>
                          <TableCell align="right">{metrics[0].patientSatisfaction.toFixed(1)}/5.0</TableCell>
                          <TableCell>Based on patient feedback</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {metrics[0].notes && (
                  <Box mt={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Notes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">{metrics[0].notes}</Typography>
                    </Paper>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DoctorPerformance;
