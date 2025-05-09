import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Stack,
  Button
} from '@mui/material';
import MedicineIcon from '@mui/icons-material/Medication';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MedicineInventory from './MedicineInventory';
import PrescriptionManagement from './PrescriptionManagement';
import SupplierManagement from './SupplierManagement';
import PurchaseOrderManagement from './PurchaseOrderManagement';
import PharmacyAnalytics from './PharmacyAnalytics';
import PharmacyBilling from './PharmacyBilling';
import StockAlerts from './StockAlerts';
import RealTimeInventory from './RealTimeInventory';

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
      id={`pharmacy-tabpanel-${index}`}
      aria-labelledby={`pharmacy-tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `pharmacy-tab-${index}`,
    'aria-controls': `pharmacy-tabpanel-${index}`,
  };
}

export default function PharmacyDashboard() {
  const { data: session, status } = useSession();
  const [value, setValue] = useState(0);
  const [showRealTimeUpdates, setShowRealTimeUpdates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>({
    lowStockItems: 0,
    expiringItems: 0,
    pendingPrescriptions: 0,
    pendingOrders: 0,
    totalMedicines: 0,
    totalSuppliers: 0
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch low stock items
        const inventoryRes = await fetch('/api/pharmacy/inventory?lowStock=true');
        const inventoryData = await inventoryRes.json();
        
        // Fetch expiring items
        const expiringRes = await fetch('/api/pharmacy/inventory?expiringWithin=30');
        const expiringData = await expiringRes.json();
        
        // Fetch pending prescriptions
        const prescriptionsRes = await fetch('/api/pharmacy/prescriptions?status=ACTIVE');
        const prescriptionsData = await prescriptionsRes.json();
        
        // Fetch pending orders
        const ordersRes = await fetch('/api/pharmacy/purchase-orders?status=PENDING');
        const ordersData = await ordersRes.json();
        
        // Fetch total medicines
        const medicinesRes = await fetch('/api/pharmacy/medicines?limit=1');
        const medicinesData = await medicinesRes.json();
        
        // Fetch total suppliers
        const suppliersRes = await fetch('/api/pharmacy/suppliers?limit=1');
        const suppliersData = await suppliersRes.json();
        
        setDashboardData({
          lowStockItems: inventoryData.inventory?.length || 0,
          expiringItems: expiringData.expiringBatches?.length || 0,
          pendingPrescriptions: prescriptionsData.pagination?.total || 0,
          pendingOrders: ordersData.pagination?.total || 0,
          totalMedicines: medicinesData.pagination?.total || 0,
          totalSuppliers: suppliersData.pagination?.total || 0
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    if (session) {
      fetchDashboardData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('You must be logged in to access this page.');
    }
  }, [session, status]);

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pharmacy Management
        </Typography>
        
        {/* Dashboard Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setValue(5)}>
                  <Box mr={2}>
                    <InventoryIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h6">{dashboardData.lowStockItems}</Typography>
                    <Typography variant="body2" color="textSecondary">Low Stock Items</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setValue(1)}>
                  <Box mr={2}>
                    <ReceiptIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h6">{dashboardData.pendingPrescriptions}</Typography>
                    <Typography variant="body2" color="textSecondary">Pending Prescriptions</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setValue(2)}>
                  <Box mr={2}>
                    <AssignmentIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h6">{dashboardData.totalSuppliers}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Suppliers</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setValue(3)}>
                  <Box mr={2}>
                    <LocalShippingIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h6">{dashboardData.pendingOrders}</Typography>
                    <Typography variant="body2" color="textSecondary">Pending Orders</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setValue(4)}>
                  <Box mr={2}>
                    <TrendingUpIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h6">{dashboardData.totalMedicines}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Medicines</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<MedicineIcon />} label="Inventory" {...a11yProps(0)} />
            <Tab icon={<ReceiptIcon />} label="Prescriptions" {...a11yProps(1)} />
            <Tab icon={<AssignmentIcon />} label="Suppliers" {...a11yProps(2)} />
            <Tab icon={<LocalShippingIcon />} label="Purchase Orders" {...a11yProps(3)} />
            <Tab icon={<TrendingUpIcon />} label="Analytics" {...a11yProps(4)} />
            <Tab icon={<InventoryIcon />} label="Alerts" {...a11yProps(5)} />
            <Tab icon={<ReceiptIcon />} label="Billing" {...a11yProps(6)} />
          </Tabs>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setShowRealTimeUpdates(!showRealTimeUpdates)}
            sx={{ mr: 2 }}
          >
            {showRealTimeUpdates ? 'Hide' : 'Show'} Real-time Updates
          </Button>
        </Box>
      </Paper>

      <TabPanel value={value} index={0}>
        <MedicineInventory />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <PrescriptionManagement />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <SupplierManagement />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <PurchaseOrderManagement />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <PharmacyAnalytics />
      </TabPanel>
      <TabPanel value={value} index={5}>
        <StockAlerts />
      </TabPanel>
      <TabPanel value={value} index={6}>
        <PharmacyBilling />
      </TabPanel>
      
      {showRealTimeUpdates && (
        <Box mt={3}>
          <RealTimeInventory />
        </Box>
      )}
    </Box>
  );
}
