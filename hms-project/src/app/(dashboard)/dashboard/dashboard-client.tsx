"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as React from 'react';
import {
  Typography,
  Card,
  CardHeader,
  CardContent,
  Button,
  Grid,
  Box,
  Stack,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  Avatar,
  Chip,
  Paper,
  IconButton,
  LinearProgress,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  People as PeopleIcon,
  AdminPanelSettings as RolesIcon,
  Settings as SettingsIcon,
  LocalHospital as DoctorIcon,
  MedicalServices as NurseIcon,
  AccountBalance as AdminIcon,
  Dashboard as DashboardIcon,
  Biotech as RadiologyIcon,
  InsertPhoto as ImagesIcon,
  MonitorHeart as MonitoringIcon,
  EventNote as ScheduleIcon,
  Receipt as BillingIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  East as ArrowIcon,
} from "@mui/icons-material";
import Link from "next/link";

// TypeScript interfaces for components
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface ActionCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  buttonText: string;
  path: string;
  color?: string;
}

// Dashboard stat card component
const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        p: 2,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 16px rgba(0,0,0,0.4)' 
          : '0 8px 16px rgba(0,0,0,0.1)',
        borderRadius: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: color,
          borderRadius: '4px 4px 0 0',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: alpha(color, 0.1),
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="medium">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

// Actions card with modern styling
const ActionCard = ({ title, icon, description, buttonText, path, color = 'primary.main' }: ActionCardProps) => {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={0}
      sx={{
        height: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'dark' ? alpha(color, 0.1) : alpha(color, 0.05),
        border: `1px solid ${alpha(color, theme.palette.mode === 'dark' ? 0.2 : 0.1)}`,
        borderRadius: 3,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 10px 20px rgba(0,0,0,0.3)' 
            : '0 10px 20px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Box 
        sx={{
          display: 'flex', 
          alignItems: 'flex-start',
          mb: 1.5
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: alpha(color, 0.2),
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ mt: 'auto' }}>
        <Button 
          component={Link}
          href={path}
          variant="contained" 
          endIcon={<ArrowIcon />}
          sx={{
            bgcolor: color,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? alpha(color, 0.8) 
                : alpha(color, 0.9),
            },
            borderRadius: 2,
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 'bold',
            py: 1
          }}
        >
          {buttonText}
        </Button>
      </Box>
    </Card>
  );
};

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check user roles and redirect to role-specific dashboard if applicable
      const userRoles = (session?.user as any)?.roles || [];

      if (userRoles.includes("doctor")) {
        router.push("/doctor/dashboard");
        return;
      } else if (userRoles.includes("nurse")) {
        router.push("/nurse/dashboard");
        return;
      } else if (userRoles.includes("admin") || userRoles.includes("superadmin")) {
        // Uncomment when admin dashboard is implemented
        // router.push("/admin/dashboard");
        // return;
      }

      setLoading(false);
    }
  }, [status, router, session]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const navigateToDashboard = (dashboardType: string) => {
    router.push(`/${dashboardType}/dashboard`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const userRoles = (session?.user as any)?.roles || [];
  const isDoctor = userRoles.includes("doctor");
  const isNurse = userRoles.includes("nurse");
  const isAdmin = userRoles.includes("admin") || userRoles.includes("superadmin");

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold" 
            sx={{ 
              mb: 1,
              background: theme => 
                theme.palette.mode === 'dark' 
                  ? 'linear-gradient(90deg, #FFFFFF 0%, #A5B4FC 100%)'
                  : 'linear-gradient(90deg, #3F51B5 0%, #2979FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: theme => theme.palette.mode === 'dark' ? 'transparent' : 'transparent',
              display: 'inline-block'
            }}
          >
            Welcome, {session?.user?.name?.split(' ')[0]}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Here's what's happening in your hospital today
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{userRoles[0]?.[0]?.toUpperCase() || 'U'}</Avatar>} 
            label={userRoles[0] || 'User'} 
            variant="outlined" 
            sx={{ textTransform: 'capitalize' }} 
          />
        </Box>
      </Box>

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Active Patients"
            value="127"
            icon={<PeopleIcon />}
            color="#3F51B5"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Radiology Requests"
            value="42"
            icon={<RadiologyIcon />}
            color="#2196F3"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Reports Pending"
            value="18"
            icon={<ImagesIcon />}
            color="#F44336"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value="24"
            icon={<TrendingUpIcon />}
            color="#4CAF50"
          />
        </Grid>
      </Grid>
      
      {/* Radiology Services Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Radiology Management
        </Typography>
        
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid xs={12} sm={6}>
                <ActionCard
                  title="DICOM Viewer"
                  icon={<ImagesIcon />}
                  description="Access and view patient imaging studies in DICOM format"
                  buttonText="View Images"
                  path="/radiology/viewer"
                  color="#2196F3"
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <ActionCard
                  title="Imaging Requests"
                  icon={<ScheduleIcon />}
                  description="Schedule new imaging studies and manage existing requests"
                  buttonText="Manage Requests"
                  path="/radiology/requests"
                  color="#FF9800"
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <ActionCard
                  title="Report Generation"
                  icon={<MonitoringIcon />}
                  description="Create and manage structured radiology reports"
                  buttonText="Create Reports"
                  path="/radiology/reports"
                  color="#4CAF50"
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <ActionCard
                  title="Radiology Billing"
                  icon={<BillingIcon />}
                  description="Manage billing for radiology services and procedures"
                  buttonText="View Billing"
                  path="/radiology/billing"
                  color="#673AB7"
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid xs={12} md={4}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                borderRadius: 3, 
                border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                overflow: 'hidden',
              }}
            >
              <CardHeader 
                title="Recent Radiology Updates" 
                titleTypographyProps={{ fontWeight: 'bold', variant: 'h6' }}
                action={
                  <IconButton size="small">
                    <MoreIcon />
                  </IconButton>
                }
                sx={{ 
                  borderBottom: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}
              />
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <List sx={{ p: 0 }}>
                  <ListItem 
                    divider 
                    sx={{ 
                      borderLeft: '4px solid #4CAF50', 
                      bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
                      px: 2,
                      py: 1.5
                    }}
                  >
                    <ListItemText 
                      primary="CT Scan for John Doe completed"
                      secondary="10 minutes ago"
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem 
                    divider 
                    sx={{ 
                      borderLeft: '4px solid #2196F3', 
                      px: 2,
                      py: 1.5
                    }}
                  >
                    <ListItemText 
                      primary="MRI scheduled for Sarah Smith"
                      secondary="30 minutes ago"
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem 
                    divider 
                    sx={{ 
                      borderLeft: '4px solid #FF9800', 
                      px: 2,
                      py: 1.5
                    }}
                  >
                    <ListItemText 
                      primary="Radiologist report added"
                      secondary="1 hour ago"
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem 
                    sx={{ 
                      borderLeft: '4px solid #F44336', 
                      bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                      px: 2,
                      py: 1.5
                    }}
                  >
                    <ListItemText 
                      primary="New urgent X-ray request"
                      secondary="2 hours ago"
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* User Information and Role-specific Access - More subtle presentation */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          My Access
        </Typography>
        
        <Grid container spacing={3}>
          <Grid xs={12} md={4}>
            <Card 
              sx={{ 
                borderRadius: 3,
                height: '100%',
                boxShadow: theme => theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <CardHeader 
                title="User Information" 
                titleTypographyProps={{ fontWeight: 'bold' }}
              />
              <CardContent>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body1"><strong>Name:</strong> {session?.user?.name}</Typography>}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body1"><strong>Email:</strong> {session?.user?.email}</Typography>}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body1">
                          <strong>Roles:</strong> {userRoles.join(", ") || "No roles"}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {(isDoctor || isNurse || isAdmin) && (
            <Grid xs={12} md={8}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  boxShadow: theme => theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <CardHeader 
                  title="Role-Specific Dashboards" 
                  titleTypographyProps={{ fontWeight: 'bold' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {isDoctor && (
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<DoctorIcon />}
                        onClick={() => navigateToDashboard("doctor")}
                        sx={{ 
                          borderRadius: 2, 
                          p: '8px 16px',
                          textTransform: 'none',
                          fontWeight: 'medium'
                        }}
                      >
                        Doctor Dashboard
                      </Button>
                    )}
                    {isNurse && (
                      <Button
                        variant="outlined"
                        color="info"
                        startIcon={<NurseIcon />}
                        onClick={() => navigateToDashboard("nurse")}
                        sx={{ 
                          borderRadius: 2, 
                          p: '8px 16px',
                          textTransform: 'none',
                          fontWeight: 'medium'
                        }}
                      >
                        Nurse Dashboard
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<AdminIcon />}
                        onClick={() => navigateToDashboard("admin")}
                        disabled={true} // Remove when admin dashboard is implemented
                        sx={{ 
                          borderRadius: 2, 
                          p: '8px 16px',
                          textTransform: 'none',
                          fontWeight: 'medium'
                        }}
                      >
                        Admin Dashboard
                      </Button>
                    )}
                  </Box>
                  {isAdmin && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 2,
                        borderRadius: 2,
                      }}
                    >
                      Admin dashboard is still under development.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}  
        </Grid>
      </Box>

      {/* Quick Actions Grid */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        
        <Grid container spacing={3}>
          <Grid xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: "100%",
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme => theme.palette.mode === 'dark' ? '0 8px 16px rgba(0,0,0,0.4)' : '0 8px 16px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardHeader 
                title="System Management" 
                titleTypographyProps={{ fontWeight: 'bold' }} 
              />
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    component={Link}
                    href="/users"
                    variant="contained"
                    color="primary"
                    startIcon={<PeopleIcon />}
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      fontWeight: 'bold',
                      boxShadow: 'none'
                    }}
                  >
                    View Users
                  </Button>
                  <Button
                    component={Link}
                    href="/roles"
                    variant="contained"
                    color="success"
                    startIcon={<RolesIcon />}
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      fontWeight: 'bold',
                      boxShadow: 'none'
                    }}
                  >
                    Manage Roles
                  </Button>
                  <Button
                    component={Link}
                    href="/settings"
                    variant="contained"
                    color="secondary"
                    startIcon={<SettingsIcon />}
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      fontWeight: 'bold',
                      boxShadow: 'none'
                    }}
                  >
                    System Settings
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
