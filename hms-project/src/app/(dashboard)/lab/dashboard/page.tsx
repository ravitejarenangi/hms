"use client";

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Button, 
  TextField, 
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip,
  LinearProgress,
  alpha,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Science as ScienceIcon,
  Biotech as BiotechIcon,
  Analytics as AnalyticsIcon,
  Check as CheckIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Timer as TimerIcon,
  Timeline as TimelineIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  DirectionsRun as UrgentIcon
} from '@mui/icons-material';

// Mock data for lab tests
const labTests = [
  {
    id: 'LT-2025-001',
    patientName: 'Emily Johnson',
    patientId: 'P00123',
    doctor: 'Dr. Michael Williams',
    testName: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    requestDate: '2025-05-12',
    status: 'completed',
    priority: 'normal',
    results: {
      available: true,
      abnormal: false
    }
  },
  {
    id: 'LT-2025-002',
    patientName: 'James Smith',
    patientId: 'P00124',
    doctor: 'Dr. Sarah Johnson',
    testName: 'Blood Glucose',
    category: 'Chemistry',
    requestDate: '2025-05-12',
    status: 'processing',
    priority: 'high',
    results: {
      available: false,
      abnormal: null
    }
  },
  {
    id: 'LT-2025-003',
    patientName: 'Robert Brown',
    patientId: 'P00156',
    doctor: 'Dr. David Miller',
    testName: 'Liver Function Test',
    category: 'Chemistry',
    requestDate: '2025-05-11',
    status: 'pending',
    priority: 'normal',
    results: {
      available: false,
      abnormal: null
    }
  },
  {
    id: 'LT-2025-004',
    patientName: 'Lisa Davis',
    patientId: 'P00178',
    doctor: 'Dr. Jessica Lee',
    testName: 'Thyroid Panel',
    category: 'Endocrinology',
    requestDate: '2025-05-11',
    status: 'completed',
    priority: 'normal',
    results: {
      available: true,
      abnormal: true
    }
  },
  {
    id: 'LT-2025-005',
    patientName: 'Daniel Wilson',
    patientId: 'P00189',
    doctor: 'Dr. Michael Williams',
    testName: 'COVID-19 PCR Test',
    category: 'Microbiology',
    requestDate: '2025-05-12',
    status: 'urgent',
    priority: 'urgent',
    results: {
      available: false,
      abnormal: null
    }
  },
  {
    id: 'LT-2025-006',
    patientName: 'Jennifer Taylor',
    patientId: 'P00201',
    doctor: 'Dr. Sarah Johnson',
    testName: 'Lipid Profile',
    category: 'Chemistry',
    requestDate: '2025-05-10',
    status: 'completed',
    priority: 'normal',
    results: {
      available: true,
      abnormal: false
    }
  }
];

// Mock data for lab categories statistics
const labCategories = [
  { name: 'Hematology', count: 27, completion: 82 },
  { name: 'Chemistry', count: 42, completion: 68 },
  { name: 'Microbiology', count: 18, completion: 74 },
  { name: 'Immunology', count: 15, completion: 90 },
  { name: 'Endocrinology', count: 12, completion: 85 }
];

// Mock lab statistics
const labStats = {
  totalTests: 114,
  testsToday: 32,
  pendingTests: 28,
  urgentTests: 5,
  completedToday: 15,
  abnormalResults: 8
};

const LabDashboardPage = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTests, setFilteredTests] = useState(labTests);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query) {
      const filtered = labTests.filter(test => 
        test.patientName.toLowerCase().includes(query) ||
        test.testName.toLowerCase().includes(query) ||
        test.id.toLowerCase().includes(query) ||
        test.patientId.toLowerCase().includes(query)
      );
      setFilteredTests(filtered);
    } else {
      setFilteredTests(labTests);
    }
  };

  const getStatusChip = (status: string) => {
    let color;
    let icon = null;
    
    switch (status) {
      case 'completed':
        color = 'success';
        icon = <CheckIcon fontSize="small" />;
        break;
      case 'processing':
        color = 'info';
        icon = <TimelineIcon fontSize="small" />;
        break;
      case 'pending':
        color = 'warning';
        icon = <PendingIcon fontSize="small" />;
        break;
      case 'urgent':
        color = 'error';
        icon = <UrgentIcon fontSize="small" />;
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={status.charAt(0).toUpperCase() + status.slice(1)} 
        color={color as any} 
        size="small"
        icon={icon}
        sx={{ 
          borderRadius: 2,
          fontWeight: 600,
          textTransform: 'capitalize',
          '& .MuiChip-label': {
            px: icon ? 0.5 : 1.5
          }
        }}
      />
    );
  };

  const getPriorityChip = (priority: string) => {
    let color;
    let icon = null;
    
    switch (priority) {
      case 'urgent':
        color = 'error';
        break;
      case 'high':
        color = 'warning';
        break;
      case 'normal':
        color = 'primary';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={priority.charAt(0).toUpperCase() + priority.slice(1)} 
        color={color as any} 
        size="small"
        variant="outlined"
        sx={{ 
          borderRadius: 2,
          fontWeight: 600,
          textTransform: 'capitalize'
        }}
      />
    );
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Laboratory Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              sx={{ 
                borderRadius: '12px', 
                borderColor: alpha(theme.palette.primary.main, 0.5),
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              Lab Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: '12px', 
                boxShadow: '0 8px 16px rgba(63, 81, 181, 0.15)',
                background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
                '&:hover': {
                  boxShadow: '0 12px 20px rgba(63, 81, 181, 0.25)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              New Test Request
            </Button>
          </Box>
        </Box>

        {/* Dashboard statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    Total Tests
                  </Typography>
                  <ScienceIcon fontSize="small" sx={{ opacity: 0.8 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {labStats.totalTests}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  This month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    Tests Today
                  </Typography>
                  <AssignmentIcon fontSize="small" sx={{ opacity: 0.8 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {labStats.testsToday}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {labStats.completedToday} completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    Pending Tests
                  </Typography>
                  <PendingIcon fontSize="small" sx={{ opacity: 0.8 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {labStats.pendingTests}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Awaiting processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    Urgent Tests
                  </Typography>
                  <UrgentIcon fontSize="small" sx={{ opacity: 0.8 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {labStats.urgentTests}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Requiring immediate attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    Completed Today
                  </Typography>
                  <CheckCircleIcon fontSize="small" sx={{ opacity: 0.8 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {labStats.completedToday}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {Math.round((labStats.completedToday / labStats.testsToday) * 100)}% completion rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    Abnormal Results
                  </Typography>
                  <ErrorIcon fontSize="small" sx={{ opacity: 0.8 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {labStats.abnormalResults}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Requiring review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Lab Test Categories */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                height: '100%',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Test Categories
                </Typography>
                
                <Button 
                  variant="text" 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500
                  }}
                >
                  View All
                </Button>
              </Box>
              
              <List sx={{ px: 0 }}>
                {labCategories.map((category, index) => (
                  <React.Fragment key={category.name}>
                    <ListItem 
                      alignItems="center"
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        borderRadius: 2,
                        mb: 1.5,
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.background.default, 0.8),
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: index % 5 === 0 ? 'primary.main' : 
                                  index % 5 === 1 ? 'info.main' : 
                                  index % 5 === 2 ? 'warning.main' : 
                                  index % 5 === 3 ? 'success.main' : 
                                  'error.main'
                        }}>
                          <BiotechIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight="bold">
                            {category.name}
                          </Typography>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="caption" color="text.secondary" component="span">
                              {category.count} tests in progress
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={category.completion} 
                              sx={{ 
                                height: 4, 
                                borderRadius: 2,
                                mt: 0.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 'primary.main'
                                }
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {category.completion}% completion rate
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<AnalyticsIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(63, 81, 181, 0.15)'
                  }}
                >
                  Category Analytics
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Lab Tests Table */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Lab Tests
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    placeholder="Search tests..."
                    size="small"
                    value={searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      sx: { 
                        borderRadius: 3,
                        bgcolor: theme.palette.background.default,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.divider, 0.3),
                        }
                      }
                    }}
                    sx={{ width: 220 }}
                  />
                </Box>
              </Box>
              
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Test ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Test Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow 
                        key={test.id}
                        hover
                        sx={{ 
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{test.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                mr: 1,
                                fontSize: '0.875rem',
                                bgcolor: 'primary.main'
                              }}
                            >
                              {test.patientName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {test.patientName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {test.patientId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {test.testName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {test.category}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{test.requestDate}</TableCell>
                        <TableCell>{getPriorityChip(test.priority)}</TableCell>
                        <TableCell>{getStatusChip(test.status)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {test.results.available ? (
                              <Tooltip title="View Results">
                                <IconButton 
                                  size="small" 
                                  color={test.results.abnormal ? "error" : "primary"}
                                  sx={{ 
                                    bgcolor: alpha(
                                      test.results.abnormal ? theme.palette.error.main : theme.palette.primary.main, 
                                      0.1
                                    )
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Process Test">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                                >
                                  <ScienceIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Print">
                              <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More">
                              <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<BiotechIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    mr: 2,
                    fontWeight: 600
                  }}
                >
                  Lab Protocols
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(63, 81, 181, 0.15)'
                  }}
                >
                  New Test Request
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LabDashboardPage;
