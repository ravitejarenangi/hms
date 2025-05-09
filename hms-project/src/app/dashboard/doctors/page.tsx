'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  DoctorProfile,
  DoctorAvailability,
  DoctorPerformance,
  DoctorPatients,
  DoctorReferrals,
  DoctorCoConsultations
} from '@/components/doctors';
import { DashboardLayout } from '@/components/layouts';

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
      id={`doctor-management-tabpanel-${index}`}
      aria-labelledby={`doctor-management-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `doctor-management-tab-${index}`,
    'aria-controls': `doctor-management-tabpanel-${index}`,
  };
}

export default function DoctorManagementPage() {
  const { data: session, status } = useSession();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!session?.user.doctorId && session?.user.role !== 'admin') {
    return (
      <DashboardLayout>
        <Container maxWidth="lg">
          <Box my={4} textAlign="center">
            <Typography variant="h5" color="error">
              Access Denied
            </Typography>
            <Typography variant="body1" mt={2}>
              You do not have permission to access the doctor management module.
            </Typography>
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Doctor Management
          </Typography>
          
          <Paper sx={{ mt: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="doctor management tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Profile" {...a11yProps(0)} />
                <Tab label="Availability" {...a11yProps(1)} />
                <Tab label="Performance" {...a11yProps(2)} />
                <Tab label="Patients" {...a11yProps(3)} />
                <Tab label="Referrals" {...a11yProps(4)} />
                <Tab label="Co-Consultations" {...a11yProps(5)} />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <DoctorProfile doctorId={session?.user.doctorId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <DoctorAvailability doctorId={session?.user.doctorId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <DoctorPerformance doctorId={session?.user.doctorId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <DoctorPatients doctorId={session?.user.doctorId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={4}>
              <DoctorReferrals doctorId={session?.user.doctorId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={5}>
              <DoctorCoConsultations doctorId={session?.user.doctorId} />
            </TabPanel>
          </Paper>
        </Box>
      </Container>
    </DashboardLayout>
  );
}
