import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Tab, Tabs,
  TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, SelectChangeEvent, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`billing-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface BedBillingData {
  id: string;
  allocationId: string;
  patientName: string;
  bedNumber: string;
  roomNumber: string;
  roomType: string;
  baseRate: number;
  totalDays: number;
  additionalCharges: number;
  discounts: number;
  totalAmount: number;
  billingStatus: string;
  allocatedAt: string;
  dischargedAt: string | null;
}

interface BedPricing {
  id: string;
  bedType: string;
  roomType: string;
  baseRate: number;
  hourlyRate: number | null;
  minimumStay: number;
  discountAfterDays: number | null;
  discountPercentage: number | null;
  taxPercentage: number;
  isActive: boolean;
}

interface PackageDeal {
  id: string;
  name: string;
  roomType: string;
  bedType: string;
  days: number;
  basePrice: number;
  description: string;
  isActive: boolean;
}

const BedBilling: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [billings, setBillings] = useState<BedBillingData[]>([]);
  const [pricingRates, setPricingRates] = useState<BedPricing[]>([]);
  const [packages, setPackages] = useState<PackageDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPricingDialog, setOpenPricingDialog] = useState(false);
  const [openPackageDialog, setOpenPackageDialog] = useState(false);
  const [openAdjustmentDialog, setOpenAdjustmentDialog] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BedBillingData | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form states
  const [pricingForm, setPricingForm] = useState<Omit<BedPricing, 'id'>>({
    bedType: 'STANDARD',
    roomType: 'GENERAL_WARD',
    baseRate: 0,
    hourlyRate: null,
    minimumStay: 1,
    discountAfterDays: null,
    discountPercentage: null,
    taxPercentage: 0,
    isActive: true
  });
  
  const [packageForm, setPackageForm] = useState<Omit<PackageDeal, 'id'>>({
    name: '',
    roomType: 'GENERAL_WARD',
    bedType: 'STANDARD',
    days: 1,
    basePrice: 0,
    description: '',
    isActive: true
  });
  
  const [adjustmentForm, setAdjustmentForm] = useState({
    additionalCharges: 0,
    discounts: 0,
    reason: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch billing data
        const billingsResponse = await fetch('/api/beds/billing');
        if (billingsResponse.ok) {
          const data = await billingsResponse.json();
          setBillings(data);
        }
        
        // Fetch pricing rates
        const pricingResponse = await fetch('/api/beds/billing/pricing');
        if (pricingResponse.ok) {
          const data = await pricingResponse.json();
          setPricingRates(data);
        }
        
        // Fetch package deals
        const packagesResponse = await fetch('/api/beds/billing/packages');
        if (packagesResponse.ok) {
          const data = await packagesResponse.json();
          setPackages(data);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load billing data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formSetter: React.Dispatch<React.SetStateAction<any>>, form: any) => {
    const { name, value } = e.target;
    formSetter({
      ...form,
      [name]: name.includes('Rate') || name.includes('Price') || name.includes('Percentage') || name.includes('charges') || name.includes('discounts') 
        ? parseFloat(value) || 0 
        : name === 'days' || name === 'minimumStay' 
          ? parseInt(value) || 1
          : value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent, formSetter: React.Dispatch<React.SetStateAction<any>>, form: any) => {
    const { name, value } = e.target;
    formSetter({
      ...form,
      [name]: value,
    });
  };

  const handleSavePricing = async () => {
    try {
      const response = await fetch('/api/beds/billing/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingForm),
      });

      if (response.ok) {
        const newPricing = await response.json();
        setPricingRates([...pricingRates, newPricing]);
        setOpenPricingDialog(false);
        resetPricingForm();
        setSnackbar({
          open: true,
          message: 'Pricing rate added successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to add pricing rate');
      }
    } catch (error) {
      console.error('Error adding pricing rate:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add pricing rate',
        severity: 'error'
      });
    }
  };

  const handleSavePackage = async () => {
    try {
      const response = await fetch('/api/beds/billing/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageForm),
      });

      if (response.ok) {
        const newPackage = await response.json();
        setPackages([...packages, newPackage]);
        setOpenPackageDialog(false);
        resetPackageForm();
        setSnackbar({
          open: true,
          message: 'Package deal added successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to add package deal');
      }
    } catch (error) {
      console.error('Error adding package deal:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add package deal',
        severity: 'error'
      });
    }
  };

  const handleAdjustBilling = async () => {
    if (!selectedBilling) return;
    
    try {
      const response = await fetch(`/api/beds/billing/${selectedBilling.id}/adjust`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adjustmentForm),
      });

      if (response.ok) {
        const updatedBilling = await response.json();
        setBillings(billings.map(billing => 
          billing.id === updatedBilling.id ? updatedBilling : billing
        ));
        setOpenAdjustmentDialog(false);
        resetAdjustmentForm();
        setSnackbar({
          open: true,
          message: 'Billing adjusted successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to adjust billing');
      }
    } catch (error) {
      console.error('Error adjusting billing:', error);
      setSnackbar({
        open: true,
        message: 'Failed to adjust billing',
        severity: 'error'
      });
    }
  };

  const generateInvoice = async (billingId: string) => {
    try {
      const response = await fetch(`/api/beds/billing/${billingId}/invoice`, {
        method: 'POST',
      });

      if (response.ok) {
        const updatedBilling = await response.json();
        setBillings(billings.map(billing => 
          billing.id === updatedBilling.id ? updatedBilling : billing
        ));
        setSnackbar({
          open: true,
          message: 'Invoice generated successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate invoice',
        severity: 'error'
      });
    }
  };

  const resetPricingForm = () => {
    setPricingForm({
      bedType: 'STANDARD',
      roomType: 'GENERAL_WARD',
      baseRate: 0,
      hourlyRate: null,
      minimumStay: 1,
      discountAfterDays: null,
      discountPercentage: null,
      taxPercentage: 0,
      isActive: true
    });
  };

  const resetPackageForm = () => {
    setPackageForm({
      name: '',
      roomType: 'GENERAL_WARD',
      bedType: 'STANDARD',
      days: 1,
      basePrice: 0,
      description: '',
      isActive: true
    });
  };

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      additionalCharges: 0,
      discounts: 0,
      reason: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'BILLED':
        return 'primary';
      case 'PARTIALLY_PAID':
        return 'info';
      case 'PAID':
        return 'success';
      case 'WAIVED':
        return 'secondary';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="bed billing tabs">
            <Tab label="Current Billings" />
            <Tab label="Pricing Rates" />
            <Tab label="Package Deals" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Room Billing Records</Typography>
          </Box>
          
          {loading ? (
            <Typography>Loading billing data...</Typography>
          ) : billings.length === 0 ? (
            <Typography>No billing records found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Room/Bed</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Base Rate</TableCell>
                    <TableCell>Additional</TableCell>
                    <TableCell>Discounts</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billings.map((billing) => (
                    <TableRow key={billing.id}>
                      <TableCell>{billing.patientName}</TableCell>
                      <TableCell>{`${billing.roomNumber} / ${billing.bedNumber}`}</TableCell>
                      <TableCell>{`${billing.totalDays} days`}</TableCell>
                      <TableCell>{`₹${billing.baseRate.toFixed(2)}`}</TableCell>
                      <TableCell>{`₹${billing.additionalCharges.toFixed(2)}`}</TableCell>
                      <TableCell>{`₹${billing.discounts.toFixed(2)}`}</TableCell>
                      <TableCell>{`₹${billing.totalAmount.toFixed(2)}`}</TableCell>
                      <TableCell>
                        <Chip 
                          label={billing.billingStatus} 
                          color={getStatusColor(billing.billingStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setSelectedBilling(billing);
                            setOpenAdjustmentDialog(true);
                          }}
                          sx={{ mr: 1 }}
                        >
                          Adjust
                        </Button>
                        {billing.billingStatus === 'PENDING' && (
                          <Button 
                            size="small" 
                            startIcon={<ReceiptIcon />}
                            onClick={() => generateInvoice(billing.id)}
                          >
                            Invoice
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Bed & Room Pricing Rates</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setOpenPricingDialog(true)}
            >
              Add Pricing Rate
            </Button>
          </Box>
          
          {loading ? (
            <Typography>Loading pricing rates...</Typography>
          ) : pricingRates.length === 0 ? (
            <Typography>No pricing rates found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Room Type</TableCell>
                    <TableCell>Bed Type</TableCell>
                    <TableCell>Base Rate (Daily)</TableCell>
                    <TableCell>Hourly Rate</TableCell>
                    <TableCell>Min. Stay</TableCell>
                    <TableCell>Discount After</TableCell>
                    <TableCell>Discount %</TableCell>
                    <TableCell>Tax %</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pricingRates.map((pricing) => (
                    <TableRow key={pricing.id}>
                      <TableCell>{pricing.roomType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{pricing.bedType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{`₹${pricing.baseRate.toFixed(2)}`}</TableCell>
                      <TableCell>{pricing.hourlyRate ? `₹${pricing.hourlyRate.toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>{`${pricing.minimumStay} days`}</TableCell>
                      <TableCell>{pricing.discountAfterDays ? `${pricing.discountAfterDays} days` : 'N/A'}</TableCell>
                      <TableCell>{pricing.discountPercentage ? `${pricing.discountPercentage}%` : 'N/A'}</TableCell>
                      <TableCell>{`${pricing.taxPercentage}%`}</TableCell>
                      <TableCell>
                        <Chip 
                          label={pricing.isActive ? 'Active' : 'Inactive'} 
                          color={pricing.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Package Deals</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setOpenPackageDialog(true)}
            >
              Add Package Deal
            </Button>
          </Box>
          
          {loading ? (
            <Typography>Loading package deals...</Typography>
          ) : packages.length === 0 ? (
            <Typography>No package deals found.</Typography>
          ) : (
            <Grid container spacing={2}>
              {packages.map((pkg) => (
                <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="div">
                          {pkg.name}
                        </Typography>
                        <Chip 
                          label={pkg.isActive ? 'Active' : 'Inactive'} 
                          color={pkg.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography color="text.secondary" gutterBottom>
                        {pkg.roomType.replace(/_/g, ' ')} with {pkg.bedType.replace(/_/g, ' ')} bed
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Duration: {pkg.days} days
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        ₹{pkg.basePrice.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {pkg.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Add Pricing Rate Dialog */}
      <Dialog open={openPricingDialog} onClose={() => setOpenPricingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Pricing Rate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Room Type</InputLabel>
                <Select
                  name="roomType"
                  value={pricingForm.roomType}
                  onChange={(e) => handleSelectChange(e, setPricingForm, pricingForm)}
                  label="Room Type"
                >
                  <MenuItem value="GENERAL_WARD">General Ward</MenuItem>
                  <MenuItem value="SEMI_PRIVATE">Semi-Private</MenuItem>
                  <MenuItem value="PRIVATE">Private</MenuItem>
                  <MenuItem value="DELUXE">Deluxe</MenuItem>
                  <MenuItem value="SUITE">Suite</MenuItem>
                  <MenuItem value="ICU">ICU</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Bed Type</InputLabel>
                <Select
                  name="bedType"
                  value={pricingForm.bedType}
                  onChange={(e) => handleSelectChange(e, setPricingForm, pricingForm)}
                  label="Bed Type"
                >
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="ELECTRIC">Electric</MenuItem>
                  <MenuItem value="ICU">ICU</MenuItem>
                  <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
                  <MenuItem value="BARIATRIC">Bariatric</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="baseRate"
                label="Base Rate (Daily)"
                type="number"
                value={pricingForm.baseRate}
                onChange={(e) => handleInputChange(e, setPricingForm, pricingForm)}
                fullWidth
                required
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="hourlyRate"
                label="Hourly Rate (Optional)"
                type="number"
                value={pricingForm.hourlyRate || ''}
                onChange={(e) => handleInputChange(e, setPricingForm, pricingForm)}
                fullWidth
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="minimumStay"
                label="Minimum Stay (Days)"
                type="number"
                value={pricingForm.minimumStay}
                onChange={(e) => handleInputChange(e, setPricingForm, pricingForm)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="discountAfterDays"
                label="Discount After Days (Optional)"
                type="number"
                value={pricingForm.discountAfterDays || ''}
                onChange={(e) => handleInputChange(e, setPricingForm, pricingForm)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="discountPercentage"
                label="Discount Percentage (Optional)"
                type="number"
                value={pricingForm.discountPercentage || ''}
                onChange={(e) => handleInputChange(e, setPricingForm, pricingForm)}
                fullWidth
                InputProps={{ endAdornment: '%' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="taxPercentage"
                label="Tax Percentage"
                type="number"
                value={pricingForm.taxPercentage}
                onChange={(e) => handleInputChange(e, setPricingForm, pricingForm)}
                fullWidth
                required
                InputProps={{ endAdornment: '%' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPricingDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePricing} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Package Deal Dialog */}
      <Dialog open={openPackageDialog} onClose={() => setOpenPackageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Package Deal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Package Name"
                value={packageForm.name}
                onChange={(e) => handleInputChange(e, setPackageForm, packageForm)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Room Type</InputLabel>
                <Select
                  name="roomType"
                  value={packageForm.roomType}
                  onChange={(e) => handleSelectChange(e, setPackageForm, packageForm)}
                  label="Room Type"
                >
                  <MenuItem value="GENERAL_WARD">General Ward</MenuItem>
                  <MenuItem value="SEMI_PRIVATE">Semi-Private</MenuItem>
                  <MenuItem value="PRIVATE">Private</MenuItem>
                  <MenuItem value="DELUXE">Deluxe</MenuItem>
                  <MenuItem value="SUITE">Suite</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Bed Type</InputLabel>
                <Select
                  name="bedType"
                  value={packageForm.bedType}
                  onChange={(e) => handleSelectChange(e, setPackageForm, packageForm)}
                  label="Bed Type"
                >
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="ELECTRIC">Electric</MenuItem>
                  <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
                  <MenuItem value="BARIATRIC">Bariatric</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="days"
                label="Duration (Days)"
                type="number"
                value={packageForm.days}
                onChange={(e) => handleInputChange(e, setPackageForm, packageForm)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="basePrice"
                label="Package Price"
                type="number"
                value={packageForm.basePrice}
                onChange={(e) => handleInputChange(e, setPackageForm, packageForm)}
                fullWidth
                required
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={packageForm.description}
                onChange={(e) => handleInputChange(e, setPackageForm, packageForm)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPackageDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePackage} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Billing Adjustment Dialog */}
      <Dialog open={openAdjustmentDialog} onClose={() => setOpenAdjustmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Billing</DialogTitle>
        <DialogContent>
          {selectedBilling && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Patient: {selectedBilling.patientName}
                </Typography>
                <Typography variant="body2">
                  Room: {selectedBilling.roomNumber}, Bed: {selectedBilling.bedNumber}
                </Typography>
                <Typography variant="body2">
                  Current Total: ₹{selectedBilling.totalAmount.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="additionalCharges"
                  label="Additional Charges"
                  type="number"
                  value={adjustmentForm.additionalCharges}
                  onChange={(e) => handleInputChange(e, setAdjustmentForm, adjustmentForm)}
                  fullWidth
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="discounts"
                  label="Discounts"
                  type="number"
                  value={adjustmentForm.discounts}
                  onChange={(e) => handleInputChange(e, setAdjustmentForm, adjustmentForm)}
                  fullWidth
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="reason"
                  label="Reason for Adjustment"
                  value={adjustmentForm.reason}
                  onChange={(e) => handleInputChange(e, setAdjustmentForm, adjustmentForm)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdjustmentDialog(false)}>Cancel</Button>
          <Button onClick={handleAdjustBilling} variant="contained">Apply Adjustment</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BedBilling;
