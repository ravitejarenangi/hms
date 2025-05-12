"use client";

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Button, 
  TextField, 
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip,
  LinearProgress,
  alpha,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Medication as MedicationIcon,
  WarningAmber as WarningIcon,
  LocalShipping as ShippingIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  LocalPharmacy as PharmacyIcon,
  Science as ScienceIcon,
  MoreVert as MoreVertIcon,
  Warning as AlertIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

// Mock data for inventory items
const inventoryItems = [
  {
    id: 1,
    name: 'Amoxicillin',
    dosage: '500mg',
    category: 'Antibiotics',
    quantity: 543,
    threshold: 100,
    unit: 'Tablets',
    lastRefilled: '2025-05-01',
    supplier: 'MedPharma Inc.',
    price: 12.50,
    expiryDate: '2026-05-15',
    status: 'In Stock'
  },
  {
    id: 2,
    name: 'Lisinopril',
    dosage: '10mg',
    category: 'Cardiovascular',
    quantity: 320,
    threshold: 80,
    unit: 'Tablets',
    lastRefilled: '2025-04-25',
    supplier: 'GlobalMed',
    price: 15.75,
    expiryDate: '2026-04-30',
    status: 'In Stock'
  },
  {
    id: 3,
    name: 'Ibuprofen',
    dosage: '400mg',
    category: 'Pain Relief',
    quantity: 65,
    threshold: 150,
    unit: 'Tablets',
    lastRefilled: '2025-04-15',
    supplier: 'MedPharma Inc.',
    price: 8.20,
    expiryDate: '2027-03-10',
    status: 'Low Stock'
  },
  {
    id: 4,
    name: 'Salbutamol',
    dosage: '100mcg',
    category: 'Respiratory',
    quantity: 82,
    threshold: 50,
    unit: 'Inhalers',
    lastRefilled: '2025-04-10',
    supplier: 'AeroMed',
    price: 24.99,
    expiryDate: '2026-07-22',
    status: 'In Stock'
  },
  {
    id: 5,
    name: 'Metformin',
    dosage: '500mg',
    category: 'Diabetes',
    quantity: 25,
    threshold: 100,
    unit: 'Tablets',
    lastRefilled: '2025-03-28',
    supplier: 'GlobalMed',
    price: 18.40,
    expiryDate: '2026-03-15',
    status: 'Low Stock'
  },
  {
    id: 6,
    name: 'Cetirizine',
    dosage: '10mg',
    category: 'Allergy',
    quantity: 212,
    threshold: 80,
    unit: 'Tablets',
    lastRefilled: '2025-05-05',
    supplier: 'MedPharma Inc.',
    price: 9.75,
    expiryDate: '2027-01-30',
    status: 'In Stock'
  },
  {
    id: 7,
    name: 'Morphine',
    dosage: '10mg/ml',
    category: 'Pain Relief',
    quantity: 48,
    threshold: 30,
    unit: 'Ampoules',
    lastRefilled: '2025-04-20',
    supplier: 'PharmaPlus',
    price: 56.80,
    expiryDate: '2025-10-15',
    status: 'In Stock'
  },
  {
    id: 8,
    name: 'Warfarin',
    dosage: '5mg',
    category: 'Cardiovascular',
    quantity: 8,
    threshold: 50,
    unit: 'Tablets',
    lastRefilled: '2025-03-15',
    supplier: 'GlobalMed',
    price: 22.30,
    expiryDate: '2025-09-10',
    status: 'Critical'
  }
];

// Mock data for recent prescriptions
const recentPrescriptions = [
  {
    id: 'RX-25-1245',
    patientName: 'Emily Johnson',
    patientId: 'P00123',
    doctor: 'Dr. Michael Williams',
    date: '2025-05-12',
    medications: [
      { name: 'Amoxicillin 500mg', dosage: '1 tablet, 3 times daily, for 7 days' },
      { name: 'Cetirizine 10mg', dosage: '1 tablet daily, as needed for allergies' }
    ],
    status: 'ready'
  },
  {
    id: 'RX-25-1244',
    patientName: 'James Smith',
    patientId: 'P00124',
    doctor: 'Dr. Sarah Johnson',
    date: '2025-05-12',
    medications: [
      { name: 'Ibuprofen 400mg', dosage: '1 tablet, every 6 hours, as needed for pain' }
    ],
    status: 'dispensed'
  },
  {
    id: 'RX-25-1243',
    patientName: 'Robert Brown',
    patientId: 'P00156',
    doctor: 'Dr. David Miller',
    date: '2025-05-11',
    medications: [
      { name: 'Lisinopril 10mg', dosage: '1 tablet daily' },
      { name: 'Metformin 500mg', dosage: '1 tablet twice daily with meals' }
    ],
    status: 'pending'
  },
  {
    id: 'RX-25-1242',
    patientName: 'Lisa Davis',
    patientId: 'P00178',
    doctor: 'Dr. Jessica Lee',
    date: '2025-05-11',
    medications: [
      { name: 'Salbutamol 100mcg', dosage: '2 puffs as needed for breathing difficulty' }
    ],
    status: 'dispensed'
  }
];

// Mock data for pharmacy statistics
const pharmacyStats = {
  totalPrescriptions: 5247,
  prescriptionsToday: 32,
  activePrescriptions: 18,
  lowStockItems: 2,
  criticalStockItems: 1,
  expiringItems: 3,
  revenue: {
    today: 2567.50,
    thisMonth: 78450.75,
    lastMonth: 72340.20
  }
};

const PharmacyDashboardPage = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(inventoryItems);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query) {
      const filtered = inventoryItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(inventoryItems);
    }
  };

  const getStatusChip = (status: string) => {
    let color;
    let icon = null;
    
    switch (status) {
      case 'In Stock':
        color = 'success';
        break;
      case 'Low Stock':
        color = 'warning';
        icon = <WarningIcon fontSize="small" />;
        break;
      case 'Critical':
        color = 'error';
        icon = <AlertIcon fontSize="small" />;
        break;
      case 'Out of Stock':
        color = 'default';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={status} 
        color={color as any} 
        size="small"
        icon={icon}
        sx={{ 
          borderRadius: 2,
          fontWeight: 600,
          '& .MuiChip-label': {
            px: icon ? 0.5 : 1.5
          }
        }}
      />
    );
  };

  const getPrescriptionStatusChip = (status: string) => {
    let color;
    let label;
    
    switch (status) {
      case 'ready':
        color = 'success';
        label = 'Ready for Pickup';
        break;
      case 'pending':
        color = 'warning';
        label = 'Pending';
        break;
      case 'dispensed':
        color = 'info';
        label = 'Dispensed';
        break;
      default:
        color = 'default';
        label = status;
    }
    
    return (
      <Chip 
        label={label} 
        color={color as any} 
        size="small" 
        sx={{ 
          borderRadius: 2,
          fontWeight: 600
        }}
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Pharmacy Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<InventoryIcon />}
              sx={{ 
                borderRadius: '12px', 
                borderColor: alpha(theme.palette.primary.main, 0.5),
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              Inventory Management
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: '12px', 
                boxShadow: '0 8px 16px rgba(63, 81, 181, 0.15)',
                background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
                '&:hover': {
                  boxShadow: '0 12px 20px rgba(63, 81, 181, 0.25)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              New Prescription
            </Button>
          </Box>
        </Box>

        {/* Alert for critical stock */}
        {pharmacyStats.criticalStockItems > 0 && (
          <Alert 
            severity="error" 
            icon={<WarningIcon />}
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              '& .MuiAlert-message': {
                fontWeight: 500
              }
            }}
            action={
              <Button color="error" size="small" sx={{ fontWeight: 600 }}>
                View Items
              </Button>
            }
          >
            <Typography variant="subtitle2">
              {pharmacyStats.criticalStockItems} item{pharmacyStats.criticalStockItems !== 1 ? 's' : ''} in critical stock level!
            </Typography>
          </Alert>
        )}

        {/* Dashboard statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background: `linear-gradient(45deg, transparent 50%, ${alpha(theme.palette.primary.main, 0.1)} 50%)`,
                  zIndex: 0
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      color: 'primary.main',
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    <ReceiptIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {pharmacyStats.prescriptionsToday}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prescriptions Today
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowUpIcon fontSize="inherit" color="success" sx={{ mr: 0.5 }} />
                  +8% from yesterday
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background: `linear-gradient(45deg, transparent 50%, ${alpha(theme.palette.warning.main, 0.1)} 50%)`,
                  zIndex: 0
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1), 
                      color: 'warning.main',
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    <Badge badgeContent={pharmacyStats.lowStockItems + pharmacyStats.criticalStockItems} color="error">
                      <WarningIcon />
                    </Badge>
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {pharmacyStats.lowStockItems + pharmacyStats.criticalStockItems}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Low Stock Items
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  Including {pharmacyStats.criticalStockItems} critical items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background: `linear-gradient(45deg, transparent 50%, ${alpha(theme.palette.success.main, 0.1)} 50%)`,
                  zIndex: 0
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      color: 'success.main',
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    <TimelineIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(pharmacyStats.revenue.today)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Today's Revenue
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowUpIcon fontSize="inherit" color="success" sx={{ mr: 0.5 }} />
                  +12% from yesterday
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background: `linear-gradient(45deg, transparent 50%, ${alpha(theme.palette.info.main, 0.1)} 50%)`,
                  zIndex: 0
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ 
                      bgcolor: alpha(theme.palette.info.main, 0.1), 
                      color: 'info.main',
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    <NotificationsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {pharmacyStats.activePrescriptions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Prescriptions
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  {pharmacyStats.activePrescriptions > 0 ? `${pharmacyStats.activePrescriptions - 5} new today` : 'No pending prescriptions'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Prescriptions */}
          <Grid item xs={12} md={5}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                height: '100%',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Prescriptions
                </Typography>
                
                <Button 
                  variant="text" 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500
                  }}
                >
                  View All
                </Button>
              </Box>
              
              <List sx={{ px: 0 }}>
                {recentPrescriptions.map((prescription, index) => (
                  <React.Fragment key={prescription.id}>
                    <ListItem 
                      alignItems="flex-start"
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.background.default, 0.8),
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {prescription.patientName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {prescription.patientName}
                            </Typography>
                            {getPrescriptionStatusChip(prescription.status)}
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="caption" color="text.secondary" component="span">
                              ID: {prescription.patientId} • Prescribed by {prescription.doctor}
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                              {prescription.medications.map((med, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <MedicationIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                                  <Typography variant="caption">
                                    {med.name}: {med.dosage}
                                  </Typography>
                                </Box>
                              ))}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < recentPrescriptions.length - 1 && <Box sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(63, 81, 181, 0.15)'
                  }}
                >
                  Create Prescription
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Inventory Table */}
          <Grid item xs={12} md={7}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Inventory Status
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    placeholder="Search medication..."
                    size="small"
                    value={searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      sx: { 
                        borderRadius: 3,
                        bgcolor: theme.palette.background.default,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.divider, 0.3),
                        }
                      }
                    }}
                    sx={{ width: 220 }}
                  />
                </Box>
              </Box>
              
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Expiry</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow 
                        key={item.id}
                        hover
                        sx={{ 
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                mr: 1,
                                fontSize: '0.875rem',
                                bgcolor: item.category === 'Antibiotics' ? 'success.main' :
                                        item.category === 'Cardiovascular' ? 'error.main' :
                                        item.category === 'Pain Relief' ? 'warning.main' :
                                        item.category === 'Respiratory' ? 'info.main' :
                                        item.category === 'Diabetes' ? 'secondary.main' :
                                        'primary.main'
                              }}
                            >
                              {item.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.dosage}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {item.quantity} {item.unit}
                            </Typography>
                            {item.quantity < item.threshold && (
                              <LinearProgress 
                                variant="determinate" 
                                value={(item.quantity / item.threshold) * 100} 
                                sx={{ 
                                  height: 4, 
                                  borderRadius: 2,
                                  mt: 0.5,
                                  bgcolor: alpha(
                                    item.quantity < item.threshold * 0.2 ? 
                                      theme.palette.error.main : 
                                      theme.palette.warning.main, 
                                    0.1
                                  ),
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: 
                                      item.quantity < item.threshold * 0.2 ? 
                                        'error.main' : 
                                        'warning.main'
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{item.expiryDate}</TableCell>
                        <TableCell>{getStatusChip(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<ShippingIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    mr: 2,
                    fontWeight: 600
                  }}
                >
                  Order Supplies
                </Button>
                <Button
                  variant="contained"
                  startIcon={<InventoryIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(63, 81, 181, 0.15)'
                  }}
                >
                  Manage Inventory
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PharmacyDashboardPage;
