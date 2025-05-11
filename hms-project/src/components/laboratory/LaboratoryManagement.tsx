import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Paper, Container } from '@mui/material';
import TestCatalogManagement from './TestCatalogManagement';
import TestRequestManagement from './TestRequestManagement';
import SampleManagement from './SampleManagement';
import ResultManagement from './ResultManagement';
import ReportManagement from './ReportManagement';
import LaboratoryBilling from './LaboratoryBilling';
import AnalyticsComponent from './AnalyticsComponent';
import NotificationsComponent from './NotificationsComponent';

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
      id={`laboratory-tabpanel-${index}`}
      aria-labelledby={`laboratory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `laboratory-tab-${index}`,
    'aria-controls': `laboratory-tabpanel-${index}`,
  };
}

const LaboratoryManagement: React.FC = () => {
  const [value, setValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Laboratory Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage laboratory tests, samples, results, and reports. Track test requests, monitor sample collection, 
          and generate comprehensive reports for patients and doctors.
        </Typography>
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="laboratory management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Test Catalog" {...a11yProps(0)} />
            <Tab label="Test Requests" {...a11yProps(1)} />
            <Tab label="Sample Management" {...a11yProps(2)} />
            <Tab label="Results" {...a11yProps(3)} />
            <Tab label="Reports" {...a11yProps(4)} />
            <Tab label="Billing" {...a11yProps(5)} />
            <Tab label="Notifications" {...a11yProps(6)} />
            <Tab label="Analytics" {...a11yProps(7)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <TestCatalogManagement />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TestRequestManagement />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <SampleManagement />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <ResultManagement />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <ReportManagement />
        </TabPanel>
        <TabPanel value={value} index={5}>
          <LaboratoryBilling />
        </TabPanel>
        <TabPanel value={value} index={6}>
          <NotificationsComponent />
        </TabPanel>
        <TabPanel value={value} index={7}>
          <AnalyticsComponent />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default LaboratoryManagement;
