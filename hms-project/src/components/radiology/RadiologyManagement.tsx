import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Paper, Container } from '@mui/material';
import dynamic from 'next/dynamic';

// Use dynamic imports to avoid issues with server-side rendering of complex components
const RadiologyServiceCatalog = dynamic(() => import('./RadiologyServiceCatalog'), { ssr: false });
const RadiologyRequestList = dynamic(() => import('./RadiologyRequestList'), { ssr: false });
const RadiologyImageViewer = dynamic(() => import('./RadiologyImageViewer'), { ssr: false });
const RadiologyReportManagement = dynamic(() => import('./RadiologyReportManagement'), { ssr: false });
const RadiologyAnalytics = dynamic(() => import('./RadiologyAnalytics'), { ssr: false });

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
      id={`radiology-tabpanel-${index}`}
      aria-labelledby={`radiology-tab-${index}`}
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
    id: `radiology-tab-${index}`,
    'aria-controls': `radiology-tabpanel-${index}`,
  };
}

const RadiologyManagement: React.FC = () => {
  const [value, setValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data for the new components
  const [services, setServices] = useState<any[]>([]);
  const [modalities, setModalities] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Radiology Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage radiology services, imaging requests, DICOM images, and reports. Track imaging studies, 
          monitor workflow, and generate comprehensive reports for patients and doctors.
        </Typography>
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="radiology management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Service Catalog" {...a11yProps(0)} />
            <Tab label="Imaging Requests" {...a11yProps(1)} />
            <Tab label="Image Viewer" {...a11yProps(2)} />
            <Tab label="Reports" {...a11yProps(3)} />
            <Tab label="Analytics" {...a11yProps(4)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <RadiologyServiceCatalog 
            services={services}
            modalities={modalities}
            onAdd={(service) => Promise.resolve()}
            onEdit={(service) => Promise.resolve()}
            onDelete={(serviceId) => Promise.resolve()}
          />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <RadiologyRequestList 
            requests={requests}
            onAdd={() => {}}
            onView={(request) => {}}
            onEdit={(request) => {}}
            onDelete={(request) => Promise.resolve()}
          />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <RadiologyImageViewer />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <RadiologyReportManagement />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <RadiologyAnalytics />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default RadiologyManagement;
