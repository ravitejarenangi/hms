import React, { useState } from 'react';
import { Box, Tab, Tabs, Paper, Typography } from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

import InvoiceManagement from './InvoiceManagement';
import PaymentManagement from './PaymentManagement';
import CreditNoteManagement from './CreditNoteManagement';
import PriceListManagement from './PriceListManagement';
import BillingSettings from './BillingSettings';
import BillingDashboard from './BillingDashboard';
import BillingAnalytics from './BillingAnalytics';
import DepartmentBilling from './DepartmentBilling';

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
      id={`billing-tabpanel-${index}`}
      aria-labelledby={`billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `billing-tab-${index}`,
    'aria-controls': `billing-tabpanel-${index}`,
  };
}

const BillingManagement: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="billing management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<DashboardIcon />} label="Dashboard" {...a11yProps(0)} />
            <Tab icon={<ReceiptIcon />} label="Invoices" {...a11yProps(1)} />
            <Tab icon={<PaymentIcon />} label="Payments" {...a11yProps(2)} />
            <Tab icon={<AssignmentReturnIcon />} label="Credit Notes" {...a11yProps(3)} />
            <Tab icon={<ListAltIcon />} label="Price Lists" {...a11yProps(4)} />
            <Tab icon={<LocalHospitalIcon />} label="OPD Billing" {...a11yProps(5)} />
            <Tab icon={<MedicationIcon />} label="Pharmacy" {...a11yProps(6)} />
            <Tab icon={<MedicalServicesIcon />} label="Laboratory" {...a11yProps(7)} />
            <Tab icon={<MedicalServicesIcon />} label="Radiology" {...a11yProps(8)} />
            <Tab icon={<FitnessCenterIcon />} label="Physiotherapy" {...a11yProps(9)} />
            <Tab icon={<MedicalServicesIcon />} label="Dental" {...a11yProps(10)} />
            <Tab icon={<AnalyticsIcon />} label="Analytics" {...a11yProps(11)} />
            <Tab icon={<SettingsIcon />} label="Settings" {...a11yProps(12)} />
          </Tabs>
        </Box>
      </Paper>

      <TabPanel value={value} index={0}>
        <BillingDashboard />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <InvoiceManagement />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <PaymentManagement />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <CreditNoteManagement />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <PriceListManagement />
      </TabPanel>
      <TabPanel value={value} index={5}>
        <DepartmentBilling department="OPD" />
      </TabPanel>
      <TabPanel value={value} index={6}>
        <DepartmentBilling department="Pharmacy" />
      </TabPanel>
      <TabPanel value={value} index={7}>
        <DepartmentBilling department="Laboratory" />
      </TabPanel>
      <TabPanel value={value} index={8}>
        <DepartmentBilling department="Radiology" />
      </TabPanel>
      <TabPanel value={value} index={9}>
        <DepartmentBilling department="Physiotherapy" />
      </TabPanel>
      <TabPanel value={value} index={10}>
        <DepartmentBilling department="Dental" />
      </TabPanel>
      <TabPanel value={value} index={11}>
        <BillingAnalytics />
      </TabPanel>
      <TabPanel value={value} index={12}>
        <BillingSettings />
      </TabPanel>
    </Box>
  );
};

export default BillingManagement;
