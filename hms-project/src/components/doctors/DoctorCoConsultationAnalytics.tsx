import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format } from 'date-fns';

interface CoConsultationAnalytics {
  summary: {
    totalCoConsultations: number;
    asPrimaryDoctor: number;
    asSecondaryDoctor: number;
    totalRevenue: number;
    byStatus: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
  };
  topCollaborators: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
  }>;
  recentCoConsultations: Array<any>;
}

interface DoctorCoConsultationAnalyticsProps {
  doctorId: string;
}

const DoctorCoConsultationAnalytics: React.FC<DoctorCoConsultationAnalyticsProps> = ({
  doctorId
}) => {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<CoConsultationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('month');

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    pending: '#FFBB28',
    confirmed: '#0088FE',
    completed: '#00C49F',
    cancelled: '#FF8042'
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/doctors/analytics/co-consultations?doctorId=${doctorId}&period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalytics(data.data);
    } catch (err) {
      setError('Error loading analytics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchAnalytics();
    }
  }, [doctorId, period]);

  const handlePeriodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPeriod(event.target.value as string);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && !analytics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No analytics data available.
      </Alert>
    );
  }

  // Prepare data for role distribution pie chart
  const roleData = [
    { name: 'As Primary', value: analytics.summary.asPrimaryDoctor },
    { name: 'As Secondary', value: analytics.summary.asSecondaryDoctor }
  ];

  // Prepare data for status distribution pie chart
  const statusData = [
    { name: 'Pending', value: analytics.summary.byStatus.pending },
    { name: 'Confirmed', value: analytics.summary.byStatus.confirmed },
    { name: 'Completed', value: analytics.summary.byStatus.completed },
    { name: 'Cancelled', value: analytics.summary.byStatus.cancelled }
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Co-Consultation Analytics
        </Typography>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={period}
            onChange={handlePeriodChange}
            label="Time Period"
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Summary Cards */}
      <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mb: 4 }}>
        <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Total Co-Consultations
              </Typography>
              <Typography variant="h4">
                {analytics.summary.totalCoConsultations}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                As Primary Doctor
              </Typography>
              <Typography variant="h4">
                {analytics.summary.asPrimaryDoctor}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                As Secondary Doctor
              </Typography>
              <Typography variant="h4">
                {analytics.summary.asSecondaryDoctor}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Total Revenue
              </Typography>
              <Typography variant="h4">
                {formatCurrency(analytics.summary.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      {/* Charts */}
      <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mb: 4 }}>
        {/* Role Distribution */}
        <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="subtitle1" gutterBottom>
              Role Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} consultations`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
        
        {/* Status Distribution */}
        <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="subtitle1" gutterBottom>
              Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={STATUS_COLORS.pending} />
                  <Cell fill={STATUS_COLORS.confirmed} />
                  <Cell fill={STATUS_COLORS.completed} />
                  <Cell fill={STATUS_COLORS.cancelled} />
                </Pie>
                <Tooltip formatter={(value) => [`${value} consultations`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
        
        {/* Timeline Chart */}
        <Box component="div" sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="subtitle1" gutterBottom>
              Co-Consultations Over Time
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={analytics.timeline}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const [year, month] = date.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const [year, month] = date.split('-');
                    return `${month}/${year}`;
                  }}
                  formatter={(value) => [`${value} consultations`, 'Count']}
                />
                <Legend />
                <Bar dataKey="count" name="Co-Consultations" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>
      
      {/* Top Collaborators */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Top Collaborators
        </Typography>
        {analytics.topCollaborators.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell align="right">Co-Consultations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.topCollaborators.map((collaborator) => (
                  <TableRow key={collaborator.id}>
                    <TableCell>{collaborator.name}</TableCell>
                    <TableCell align="right">{collaborator.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No collaborator data available.
          </Typography>
        )}
      </Paper>
      
      {/* Recent Co-Consultations */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Recent Co-Consultations
        </Typography>
        {analytics.recentCoConsultations.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Collaborating Doctor</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.recentCoConsultations.map((consultation) => {
                  const isAsPrimary = consultation.primaryDoctorId === doctorId;
                  const collaboratingDoctor = isAsPrimary 
                    ? consultation.secondaryDoctor.user.name 
                    : consultation.primaryDoctor.user.name;
                  
                  return (
                    <TableRow key={consultation.id}>
                      <TableCell>
                        {format(new Date(consultation.scheduledTime), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {consultation.patient?.user?.name || 'Unknown Patient'}
                      </TableCell>
                      <TableCell>{collaboratingDoctor}</TableCell>
                      <TableCell>
                        {isAsPrimary ? 'Primary' : 'Secondary'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={consultation.status.toLowerCase()} 
                          size="small"
                          sx={{ 
                            backgroundColor: STATUS_COLORS[consultation.status.toLowerCase() as keyof typeof STATUS_COLORS],
                            color: 'white'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No recent co-consultations.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default DoctorCoConsultationAnalytics;
