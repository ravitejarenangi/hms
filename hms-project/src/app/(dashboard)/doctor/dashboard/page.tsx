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
} from "@mui/material";

// Import doctor dashboard components
import WaitingTimeGauge from "@/components/dashboard/doctor/WaitingTimeGauge";
import PatientSeenWidget from "@/components/dashboard/doctor/PatientSeenWidget";
import AppointmentsWidget from "@/components/dashboard/doctor/AppointmentsWidget";
import InpatientsWidget from "@/components/dashboard/doctor/InpatientsWidget";
import SurgeriesScheduledWidget from "@/components/dashboard/doctor/SurgeriesScheduledWidget";
import SurgeriesPerformedWidget from "@/components/dashboard/doctor/SurgeriesPerformedWidget";
import PatientOutcomesChart from "@/components/dashboard/doctor/PatientOutcomesChart";

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has doctor role
      const userRoles = (session?.user as any)?.roles || [];
      if (!userRoles.includes("doctor") && !userRoles.includes("admin") && !userRoles.includes("superadmin")) {
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
        Doctor Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, Dr. {session?.user?.name}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="dashboard tabs"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Patients & Appointments" />
        <Tab label="Surgeries" />
        <Tab label="Outcomes" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* First row */}
          <Grid item xs={12} md={6}>
            <WaitingTimeGauge />
          </Grid>
          <Grid item xs={12} md={6}>
            <PatientSeenWidget />
          </Grid>

          {/* Second row */}
          <Grid item xs={12} md={6}>
            <AppointmentsWidget />
          </Grid>
          <Grid item xs={12} md={6}>
            <InpatientsWidget />
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SurgeriesScheduledWidget />
          </Grid>
          <Grid item xs={12} md={6}>
            <SurgeriesPerformedWidget />
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PatientOutcomesChart />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
