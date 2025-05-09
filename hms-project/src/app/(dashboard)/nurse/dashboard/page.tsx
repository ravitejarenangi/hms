"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Box,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Button,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  MedicalInformation as MedicalIcon,
  Medication as MedicationIcon,
  EventNote as EventIcon,
} from "@mui/icons-material";

// Import nurse dashboard components
import PatientList from "@/components/dashboard/nurse/PatientList";
import VitalSignsMonitoring from "@/components/dashboard/nurse/VitalSignsMonitoring";

export default function NurseDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has nurse role
      const userRoles = (session?.user as any)?.roles || [];
      if (!userRoles.includes("nurse") && !userRoles.includes("admin") && !userRoles.includes("superadmin")) {
        router.push("/dashboard");
      }
      setLoading(false);
    }
  }, [status, router, session]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Nurse Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {session?.user?.name}
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        aria-label="dashboard tabs"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Patients" icon={<AssignmentIcon />} iconPosition="start" />
        <Tab label="Vital Signs" icon={<MedicalIcon />} iconPosition="start" />
        <Tab label="Medications" icon={<MedicationIcon />} iconPosition="start" disabled />
        <Tab label="Tasks" icon={<EventIcon />} iconPosition="start" disabled />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PatientList />
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <VitalSignsMonitoring />
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Medication Management
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                This feature is currently under development.
              </Typography>
              <Button variant="contained" disabled>
                Coming Soon
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Task Management
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                This feature is currently under development.
              </Typography>
              <Button variant="contained" disabled>
                Coming Soon
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
