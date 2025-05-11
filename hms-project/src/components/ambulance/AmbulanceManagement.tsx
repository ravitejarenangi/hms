import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Tabs,
  Tab,
  Typography,
  useTheme,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocalShipping as DispatchIcon,
  Person as DriverIcon,
  History as HistoryIcon,
  AttachMoney as BillingIcon,
} from '@mui/icons-material';
import AmbulanceInventory from './AmbulanceInventory';
import AmbulanceDispatchSystem from './AmbulanceDispatchSystem';
import DriverAssignmentSystem from './DriverAssignmentSystem';
import AmbulanceServiceHistory from './AmbulanceServiceHistory';
import BillingIntegration from './BillingIntegration';

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
      id={`ambulance-tab-${index}`}
      aria-labelledby={`ambulance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AmbulanceManagement: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Ambulance Management System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Track, dispatch, and manage ambulance services with real-time updates and billing integrations
        </Typography>

        <Paper sx={{ mt: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<CarIcon />} label="Inventory" />
            <Tab icon={<DispatchIcon />} label="Dispatch" />
            <Tab icon={<DriverIcon />} label="Drivers" />
            <Tab icon={<HistoryIcon />} label="Service History" />
            <Tab icon={<BillingIcon />} label="Billing" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <AmbulanceInventory />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <AmbulanceDispatchSystem />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <DriverAssignmentSystem />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <AmbulanceServiceHistory />
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <BillingIntegration />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default AmbulanceManagement;
