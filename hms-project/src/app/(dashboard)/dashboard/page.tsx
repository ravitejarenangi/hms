"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  People as PeopleIcon,
  AdminPanelSettings as RolesIcon,
  Settings as SettingsIcon,
  LocalHospital as DoctorIcon,
  MedicalServices as NurseIcon,
  AccountBalance as AdminIcon,
} from "@mui/icons-material";

export default function Dashboard() {
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
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardHeader title="User Information" />
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

      {(isDoctor || isNurse || isAdmin) && (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Role-Specific Dashboards" />
          <CardContent>
            <Stack spacing={2}>
              {isDoctor && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<DoctorIcon />}
                  onClick={() => navigateToDashboard("doctor")}
                >
                  Doctor Dashboard
                </Button>
              )}
              {isNurse && (
                <Button
                  variant="contained"
                  color="info"
                  fullWidth
                  startIcon={<NurseIcon />}
                  onClick={() => navigateToDashboard("nurse")}
                >
                  Nurse Dashboard
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  startIcon={<AdminIcon />}
                  onClick={() => navigateToDashboard("admin")}
                  disabled={true} // Remove when admin dashboard is implemented
                >
                  Admin Dashboard
                </Button>
              )}
            </Stack>
            {isAdmin && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Admin dashboard is still under development.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<PeopleIcon />}
                >
                  View Users
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<RolesIcon />}
                >
                  Manage Roles
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={<SettingsIcon />}
                >
                  System Settings
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardHeader title="System Status" />
            <CardContent>
              <List dense>
                <ListItem
                  secondaryAction={
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      Connected
                    </Typography>
                  }
                >
                  <ListItemText primary="Database" />
                </ListItem>
                <Divider component="li" />
                <ListItem
                  secondaryAction={
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      Online
                    </Typography>
                  }
                >
                  <ListItemText primary="API Services" />
                </ListItem>
                <Divider component="li" />
                <ListItem
                  secondaryAction={
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      Running
                    </Typography>
                  }
                >
                  <ListItemText primary="Background Jobs" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardHeader title="Recent Activity" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                No recent activity to display
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
