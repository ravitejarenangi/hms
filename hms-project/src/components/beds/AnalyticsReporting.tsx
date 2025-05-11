import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Chip, FormControl, Grid, InputLabel, MenuItem,
  Paper, Select, Tab, Tabs, TextField, Typography, SelectChangeEvent, CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import DateRangeIcon from '@mui/icons-material/DateRange';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`analytics-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface OccupancyData {
  period: string;
  bedType: string;
  ward: string;
  totalBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
}

interface LengthOfStayData {
  department: string;
  diagnosis: string;
  averageLOS: number;
  minLOS: number;
  maxLOS: number;
  patientCount: number;
}

interface RevenueData {
  roomType: string;
  bedType: string;
  totalRevenue: number;
  occupancyDays: number;
  averageRatePerDay: number;
}

interface TurnoverData {
  ward: string;
  averageTurnoverTime: number; // in hours
  admissions: number;
  discharges: number;
  cleaningTime: number; // in minutes
  preparationTime: number; // in minutes
}

interface WardEfficiencyData {
  ward: string;
  staffToPatientRatio: number;
  bedUtilization: number;
  averageLOS: number;
  readmissionRate: number;
}

const AnalyticsReporting: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [losData, setLosData] = useState<LengthOfStayData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [turnoverData, setTurnoverData] = useState<TurnoverData[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<WardEfficiencyData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [filters, setFilters] = useState({
    bedType: '',
    roomType: '',
    ward: '',
    department: ''
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch occupancy data
      const occupancyResponse = await fetch(`/api/beds/analytics/occupancy?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (occupancyResponse.ok) {
        const data = await occupancyResponse.json();
        setOccupancyData(data);
      }
      
      // Fetch length of stay data
      const losResponse = await fetch(`/api/beds/analytics/los?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (losResponse.ok) {
        const data = await losResponse.json();
        setLosData(data);
      }
      
      // Fetch revenue data
      const revenueResponse = await fetch(`/api/beds/analytics/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (revenueResponse.ok) {
        const data = await revenueResponse.json();
        setRevenueData(data);
      }
      
      // Fetch turnover data
      const turnoverResponse = await fetch(`/api/beds/analytics/turnover?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (turnoverResponse.ok) {
        const data = await turnoverResponse.json();
        setTurnoverData(data);
      }
      
      // Fetch efficiency data
      const efficiencyResponse = await fetch(`/api/beds/analytics/efficiency?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (efficiencyResponse.ok) {
        const data = await efficiencyResponse.json();
        setEfficiencyData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  const handleFilterChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const exportToPDF = (reportType: string) => {
    // This would be implemented to generate and download a PDF report
    console.log(`Exporting ${reportType} report to PDF`);
    alert(`${reportType} report would be exported to PDF here`);
  };

  const exportToExcel = (reportType: string) => {
    // This would be implemented to generate and download an Excel report
    console.log(`Exporting ${reportType} report to Excel`);
    alert(`${reportType} report would be exported to Excel here`);
  };

  const filteredOccupancyData = occupancyData.filter(item => {
    if (filters.bedType && item.bedType !== filters.bedType) return false;
    if (filters.ward && item.ward !== filters.ward) return false;
    return true;
  });

  const filteredLosData = losData.filter(item => {
    if (filters.department && item.department !== filters.department) return false;
    return true;
  });

  const filteredRevenueData = revenueData.filter(item => {
    if (filters.bedType && item.bedType !== filters.bedType) return false;
    if (filters.roomType && item.roomType !== filters.roomType) return false;
    return true;
  });

  const filteredTurnoverData = turnoverData.filter(item => {
    if (filters.ward && item.ward !== filters.ward) return false;
    return true;
  });

  const filteredEfficiencyData = efficiencyData.filter(item => {
    if (filters.ward && item.ward !== filters.ward) return false;
    return true;
  });

  // Calculate summary statistics
  const calculateOccupancySummary = () => {
    if (filteredOccupancyData.length === 0) return { average: 0, min: 0, max: 0 };
    
    const rates = filteredOccupancyData.map(item => item.occupancyRate);
    return {
      average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
      min: Math.min(...rates),
      max: Math.max(...rates)
    };
  };

  const calculateLosSummary = () => {
    if (filteredLosData.length === 0) return { average: 0, min: 0, max: 0 };
    
    const los = filteredLosData.map(item => item.averageLOS);
    return {
      average: los.reduce((sum, val) => sum + val, 0) / los.length,
      min: Math.min(...los),
      max: Math.max(...los)
    };
  };

  const calculateRevenueSummary = () => {
    if (filteredRevenueData.length === 0) return { total: 0, average: 0 };
    
    const revenues = filteredRevenueData.map(item => item.totalRevenue);
    return {
      total: revenues.reduce((sum, val) => sum + val, 0),
      average: revenues.reduce((sum, val) => sum + val, 0) / revenues.length
    };
  };

  const calculateTurnoverSummary = () => {
    if (filteredTurnoverData.length === 0) return { average: 0, min: 0, max: 0 };
    
    const times = filteredTurnoverData.map(item => item.averageTurnoverTime);
    return {
      average: times.reduce((sum, val) => sum + val, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    };
  };

  const occupancySummary = calculateOccupancySummary();
  const losSummary = calculateLosSummary();
  const revenueSummary = calculateRevenueSummary();
  const turnoverSummary = calculateTurnoverSummary();

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              name="startDate"
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              name="endDate"
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Ward</InputLabel>
              <Select
                name="ward"
                value={filters.ward}
                onChange={handleFilterChange}
                label="Filter by Ward"
              >
                <MenuItem value="">All Wards</MenuItem>
                <MenuItem value="General">General Ward</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
                <MenuItem value="Pediatric">Pediatric</MenuItem>
                <MenuItem value="Maternity">Maternity</MenuItem>
                <MenuItem value="Surgery">Surgery</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Bed Type</InputLabel>
              <Select
                name="bedType"
                value={filters.bedType}
                onChange={handleFilterChange}
                label="Filter by Bed Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="STANDARD">Standard</MenuItem>
                <MenuItem value="ELECTRIC">Electric</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
                <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
                <MenuItem value="BARIATRIC">Bariatric</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs" variant="scrollable" scrollButtons="auto">
            <Tab label="Bed Occupancy" />
            <Tab label="Length of Stay" />
            <Tab label="Room Revenue" />
            <Tab label="Bed Turnover" />
            <Tab label="Ward Efficiency" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Bed Occupancy Analysis</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToPDF('Bed Occupancy')}
                sx={{ mr: 1 }}
              >
                PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToExcel('Bed Occupancy')}
              >
                Excel
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Average Occupancy</Typography>
                      <Typography variant="h3" color="primary">
                        {occupancySummary.average.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Minimum Occupancy</Typography>
                      <Typography variant="h3" color="error">
                        {occupancySummary.min.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Maximum Occupancy</Typography>
                      <Typography variant="h3" color="success">
                        {occupancySummary.max.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>Occupancy by Ward and Bed Type</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Occupancy chart visualization would be displayed here
                </Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>Seasonal Occupancy Patterns</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Seasonal patterns chart would be displayed here
                </Typography>
              </Box>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Length of Stay Analysis</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToPDF('Length of Stay')}
                sx={{ mr: 1 }}
              >
                PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToExcel('Length of Stay')}
              >
                Excel
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Average LOS</Typography>
                      <Typography variant="h3" color="primary">
                        {losSummary.average.toFixed(1)} days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Minimum LOS</Typography>
                      <Typography variant="h3" color="info.main">
                        {losSummary.min.toFixed(1)} days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Maximum LOS</Typography>
                      <Typography variant="h3" color="warning.main">
                        {losSummary.max.toFixed(1)} days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>LOS by Department</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Department LOS chart would be displayed here
                </Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>LOS by Diagnosis</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Diagnosis LOS chart would be displayed here
                </Typography>
              </Box>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Room Revenue Reports</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToPDF('Room Revenue')}
                sx={{ mr: 1 }}
              >
                PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToExcel('Room Revenue')}
              >
                Excel
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                      <Typography variant="h3" color="primary">
                        ₹{revenueSummary.total.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Average Revenue per Room</Typography>
                      <Typography variant="h3" color="secondary">
                        ₹{revenueSummary.average.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>Revenue by Room Type</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Room type revenue chart would be displayed here
                </Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>Upgrade/Downgrade Financial Impact</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Upgrade/downgrade impact chart would be displayed here
                </Typography>
              </Box>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Bed Turnover Rate Analytics</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToPDF('Bed Turnover')}
                sx={{ mr: 1 }}
              >
                PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToExcel('Bed Turnover')}
              >
                Excel
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Average Turnover Time</Typography>
                      <Typography variant="h3" color="primary">
                        {turnoverSummary.average.toFixed(1)} hrs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Fastest Turnover</Typography>
                      <Typography variant="h3" color="success.main">
                        {turnoverSummary.min.toFixed(1)} hrs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Slowest Turnover</Typography>
                      <Typography variant="h3" color="error">
                        {turnoverSummary.max.toFixed(1)} hrs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>Turnover Time by Ward</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Ward turnover chart would be displayed here
                </Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>Room Preparation Efficiency</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Room preparation efficiency chart would be displayed here
                </Typography>
              </Box>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Ward Efficiency Dashboards</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToPDF('Ward Efficiency')}
                sx={{ mr: 1 }}
              >
                PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => exportToExcel('Ward Efficiency')}
              >
                Excel
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>Staff-to-Patient Ratio by Ward</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Staff-to-patient ratio chart would be displayed here
                </Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>Resource Utilization by Ward</Typography>
              <Box sx={{ height: '300px', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                  Resource utilization chart would be displayed here
                </Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>Key Performance Indicators</Typography>
              <Grid container spacing={2}>
                {filteredEfficiencyData.map((ward, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>{ward.ward}</Typography>
                        <Typography variant="body2">
                          Staff-to-Patient Ratio: {ward.staffToPatientRatio.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Bed Utilization: {ward.bedUtilization.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Average LOS: {ward.averageLOS.toFixed(1)} days
                        </Typography>
                        <Typography variant="body2">
                          Readmission Rate: {ward.readmissionRate.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AnalyticsReporting;
