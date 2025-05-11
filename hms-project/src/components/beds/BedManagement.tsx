import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography, Paper } from '@mui/material';
import BedInventory from './BedInventory';
import BedAllocationSystem from './BedAllocationSystem';
import BedDashboard from './BedDashboard';
import BedBilling from './BedBilling';
import RoomServiceManagement from './RoomServiceManagement';
import BedTracking from './BedTracking';
import AnalyticsReporting from './AnalyticsReporting';

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
      id={`bed-tabpanel-${index}`}
      aria-labelledby={`bed-tab-${index}`}
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
    id: `bed-tab-${index}`,
    'aria-controls': `bed-tabpanel-${index}`,
  };
}

const BedManagement: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bed & Room Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive system for managing hospital beds, room allocation, transfers, and related services.
        </Typography>
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="bed management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Bed Inventory" {...a11yProps(0)} />
            <Tab label="Allocation & Transfer" {...a11yProps(1)} />
            <Tab label="Visual Dashboard" {...a11yProps(2)} />
            <Tab label="Room Billing" {...a11yProps(3)} />
            <Tab label="Room Services" {...a11yProps(4)} />
            <Tab label="Patient Tracking" {...a11yProps(5)} />
            <Tab label="Analytics & Reports" {...a11yProps(6)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <BedInventory />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <BedAllocationSystem />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <BedDashboard />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <BedBilling />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <RoomServiceManagement />
        </TabPanel>
        <TabPanel value={value} index={5}>
          <BedTracking />
        </TabPanel>
        <TabPanel value={value} index={6}>
          <AnalyticsReporting />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default BedManagement;
