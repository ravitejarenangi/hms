"use client";

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent,
  CardHeader,
  Button, 
  Divider,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import { GridItem, GridContainer } from '@/components/radiology/GridItem';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  MedicalServices as MedicalIcon,
  MonetizationOn as MoneyIcon,
  BugReport as BugIcon,
  DeveloperBoard as DevBoardIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

// Mock data for admin dashboard
const systemHealth = {
  status: 'Operational',
  uptime: '99.98%',
  incidents: 0,
  lastMaintenance: '2025-04-28',
  cpuUsage: 42,
  memoryUsage: 56,
  storageUsage: 38,
  databaseConnections: 157,
  activeUsers: 86
};

const userStats = {
  totalUsers: 876,
  newUsersToday: 12,
  activeUsersToday: 245,
  doctors: 87,
  nurses: 156,
  admins: 23,
  patients: 610
};

const recentActivities = [
  {
    id: 1,
    user: 'Dr. Michael Williams',
    action: 'Updated patient records',
    time: '10 minutes ago',
    avatar: null
  },
  {
    id: 2,
    user: 'Admin Sarah Thompson',
    action: 'Added new staff member',
    time: '35 minutes ago',
    avatar: null
  },
  {
    id: 3,
    user: 'Nurse James Wilson',
    action: 'Processed lab results',
    time: '1 hour ago',
    avatar: null
  },
  {
    id: 4,
    user: 'System',
    action: 'Backup completed successfully',
    time: '2 hours ago',
    avatar: null
  },
  {
    id: 5,
    user: 'Dr. Jessica Lee',
    action: 'Updated department schedule',
    time: '3 hours ago',
    avatar: null
  }
];

const pendingTasks = [
  {
    id: 1,
    title: 'User account approval',
    count: 8,
    priority: 'high'
  },
  {
    id: 2,
    title: 'System updates',
    count: 2,
    priority: 'medium'
  },
  {
    id: 3,
    title: 'License renewals',
    count: 5,
    priority: 'low'
  },
  {
    id: 4,
    title: 'Security audits',
    count: 1,
    priority: 'high'
  }
];

const AdminDashboardPage = () => {
  const theme = useTheme();

  const getPriorityChip = (priority: string) => {
    const colors: Record<string, any> = {
      high: { color: 'error', icon: <WarningIcon fontSize="small" /> },
      medium: { color: 'warning', icon: null },
      low: { color: 'success', icon: null }
    };
    
    return (
      <Chip 
        label={priority.charAt(0).toUpperCase() + priority.slice(1)} 
        color={colors[priority].color} 
        size="small"
        icon={colors[priority].icon}
        sx={{ 
          borderRadius: 2,
          fontWeight: 600,
          textTransform: 'capitalize',
          '& .MuiChip-label': {
            px: colors[priority].icon ? 0.5 : 1.5
          }
        }}
      />
    );
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<SecurityIcon />}
              sx={{ 
                borderRadius: '12px', 
                borderColor: alpha(theme.palette.primary.main, 0.5),
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              Security Center
            </Button>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
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
              System Settings
            </Button>
          </Box>
        </Box>

        <GridContainer spacing={3}>
          {/* System Health Dashboard */}
          <GridItem xs={12} md={8}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                mb: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  System Health
                </Typography>
                <Chip
                  label="System Operational"
                  color="success"
                  icon={<CheckCircleIcon />}
                  sx={{
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: 'success.main',
                    }
                  }}
                />
              </Box>
              
              <GridContainer spacing={3}>
                <GridItem xs={12} sm={6} md={3}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        System Uptime
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {systemHealth.uptime}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last 30 days
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                
                <GridItem xs={12} sm={6} md={3}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Active Users
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {systemHealth.activeUsers}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Currently online
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                
                <GridItem xs={12} sm={6} md={3}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        DB Connections
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {systemHealth.databaseConnections}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Active connections
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                
                <GridItem xs={12} sm={6} md={3}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Incidents
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {systemHealth.incidents}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last 7 days
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
              </GridContainer>
              
              <Box sx={{ mt: 3 }}>
                <GridContainer spacing={3}>
                  <GridItem xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      CPU Usage
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemHealth.cpuUsage} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        mb: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: systemHealth.cpuUsage > 70 ? 'error.main' : 'primary.main'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {systemHealth.cpuUsage}% of available resources
                    </Typography>
                  </GridItem>
                  
                  <GridItem xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Memory Usage
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemHealth.memoryUsage} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        mb: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: systemHealth.memoryUsage > 80 ? 'error.main' : 'primary.main'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {systemHealth.memoryUsage}% of total capacity
                    </Typography>
                  </GridItem>
                  
                  <GridItem xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Storage Usage
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemHealth.storageUsage} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        mb: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'primary.main'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {systemHealth.storageUsage}% of total storage
                    </Typography>
                  </GridItem>
                </GridContainer>
              </Box>
            </Paper>
            
            <GridContainer spacing={3}>
              <GridItem xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 4,
                    height: '100%',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Recent Activity
                  </Typography>
                  
                  <List sx={{ px: 0 }}>
                    {recentActivities.map((activity) => (
                      <ListItem 
                        key={activity.id}
                        alignItems="flex-start"
                        sx={{ 
                          px: 0, 
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          '&:last-child': { border: 'none' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={activity.avatar || undefined} sx={{ bgcolor: 'primary.main' }}>
                            {activity.user === 'System' ? <DevBoardIcon /> : activity.user.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.user}
                          secondary={
                            <React.Fragment>
                              <Typography variant="body2" component="span">
                                {activity.action}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" component="div">
                                {activity.time}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button 
                      variant="text" 
                      sx={{ 
                        borderRadius: 2,
                        color: 'primary.main'
                      }}
                    >
                      View All Activities
                    </Button>
                  </Box>
                </Paper>
              </GridItem>
              
              <GridItem xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 4,
                    height: '100%',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Pending Tasks
                  </Typography>
                  
                  <List sx={{ px: 0 }}>
                    {pendingTasks.map((task) => (
                      <ListItem 
                        key={task.id}
                        alignItems="center"
                        sx={{ 
                          px: 2, 
                          py: 1.5,
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: alpha(theme.palette.background.default, 0.5),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                        secondaryAction={getPriorityChip(task.priority)}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={500}>{task.title}</Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {task.count} item{task.count !== 1 ? 's' : ''} pending
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      sx={{ 
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(63, 81, 181, 0.15)',
                        bgcolor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }}
                    >
                      Process All Tasks
                    </Button>
                  </Box>
                </Paper>
              </GridItem>
            </GridContainer>
          </GridItem>
          
          {/* User Statistics */}
          <GridItem xs={12} md={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                mb: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                User Statistics
              </Typography>
              
              <Box sx={{ p: 2, textAlign: 'center', mb: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {userStats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <TrendingUpIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                  {userStats.newUsersToday} new users today
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <GridContainer spacing={2}>
                <GridItem xs={12}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                        <MedicalIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {userStats.doctors}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Doctors
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                
                <GridItem xs={12}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      bgcolor: alpha(theme.palette.info.main, 0.05)
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                      <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                        <PeopleIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" color="info.main">
                        {userStats.nurses}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nurses
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                
                <GridItem xs={12}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      bgcolor: alpha(theme.palette.success.main, 0.05)
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                      <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                        <PeopleIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {userStats.patients}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Patients
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                
                <GridItem xs={12}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      bgcolor: alpha(theme.palette.warning.main, 0.05)
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                      <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                        <SettingsIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {userStats.admins}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Admins
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
              </GridContainer>
            </Paper>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              
              <GridContainer spacing={2} sx={{ mt: 1 }}>
                <GridItem xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    Manage Users
                  </Button>
                </GridItem>
                
                <GridItem xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SecurityIcon />}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    User Permissions
                  </Button>
                </GridItem>
                
                <GridItem xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<BugIcon />}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    Error Logs
                  </Button>
                </GridItem>
                
                <GridItem xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<InventoryIcon />}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    Backup System
                  </Button>
                </GridItem>
                
                <GridItem xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    System Audit
                  </Button>
                </GridItem>
                
                <GridItem xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<NotificationIcon />}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    Notifications
                  </Button>
                </GridItem>
              </GridContainer>
            </Paper>
          </GridItem>
        </GridContainer>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
