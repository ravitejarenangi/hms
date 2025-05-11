import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export const CalcRateSection: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    distance: 10,
    vehicleType: 'BASIC_LIFE_SUPPORT',
    serviceLevel: 'STANDARD',
    timeOfDay: 'NORMAL',
    waitingTime: 0,
    zone: 'URBAN',
    equipment: [] as string[],
    medicalStaff: [] as { type: string; count: number }[],
  });
  const [billingResult, setBillingResult] = useState<any>(null);

  // Vehicle types
  const vehicleTypes = [
    { value: 'BASIC_LIFE_SUPPORT', label: 'Basic Life Support (BLS)' },
    { value: 'ADVANCED_LIFE_SUPPORT', label: 'Advanced Life Support (ALS)' },
    { value: 'PATIENT_TRANSPORT', label: 'Patient Transport' },
    { value: 'NEONATAL', label: 'Neonatal Ambulance' },
    { value: 'MOBILE_ICU', label: 'Mobile ICU' },
  ];

  // Service levels
  const serviceLevels = [
    { value: 'BASIC', label: 'Basic' },
    { value: 'STANDARD', label: 'Standard' },
    { value: 'PREMIUM', label: 'Premium' },
  ];

  // Time of day options
  const timeOfDayOptions = [
    { value: 'NORMAL', label: 'Normal Hours (6 AM - 10 PM)' },
    { value: 'NIGHT', label: 'Night Hours (10 PM - 6 AM)' },
    { value: 'HOLIDAY', label: 'Public Holiday' },
  ];

  // Zone options
  const zoneOptions = [
    { value: 'URBAN', label: 'Urban' },
    { value: 'SUBURBAN', label: 'Suburban' },
    { value: 'RURAL', label: 'Rural' },
    { value: 'HIGHWAY', label: 'Highway' },
  ];

  // Equipment options
  const equipmentOptions = [
    { value: 'OXYGEN', label: 'Oxygen', price: 200 },
    { value: 'VENTILATOR', label: 'Ventilator', price: 500 },
    { value: 'CARDIAC_MONITOR', label: 'Cardiac Monitor', price: 300 },
    { value: 'DEFIBRILLATOR', label: 'Defibrillator', price: 400 },
    { value: 'INFUSION_PUMP', label: 'Infusion Pump', price: 250 },
    { value: 'SUCTION_MACHINE', label: 'Suction Machine', price: 150 },
  ];

  // Medical staff options
  const staffOptions = [
    { value: 'PARAMEDIC', label: 'Paramedic', price: 300 },
    { value: 'NURSE', label: 'Nurse', price: 500 },
    { value: 'DOCTOR', label: 'Doctor', price: 1000 },
    { value: 'SPECIALIST', label: 'Specialist Doctor', price: 2000 },
  ];

  // Handle form value changes
  const handleChange = (field: string, value: any) => {
    setFormValues({
      ...formValues,
      [field]: value,
    });
  };

  // Toggle equipment selection
  const toggleEquipment = (equipment: string) => {
    const currentEquipment = [...formValues.equipment];
    const index = currentEquipment.indexOf(equipment);
    
    if (index === -1) {
      currentEquipment.push(equipment);
    } else {
      currentEquipment.splice(index, 1);
    }
    
    setFormValues({
      ...formValues,
      equipment: currentEquipment,
    });
  };

  // Toggle staff selection
  const toggleStaff = (staffType: string) => {
    const currentStaff = [...formValues.medicalStaff];
    const existingStaff = currentStaff.find(s => s.type === staffType);
    
    if (existingStaff) {
      const updatedStaff = currentStaff.filter(s => s.type !== staffType);
      setFormValues({
        ...formValues,
        medicalStaff: updatedStaff,
      });
    } else {
      currentStaff.push({ type: staffType, count: 1 });
      setFormValues({
        ...formValues,
        medicalStaff: currentStaff,
      });
    }
  };

  // Update staff count
  const updateStaffCount = (staffType: string, count: number) => {
    const currentStaff = [...formValues.medicalStaff];
    const staffIndex = currentStaff.findIndex(s => s.type === staffType);
    
    if (staffIndex !== -1) {
      currentStaff[staffIndex].count = count;
      setFormValues({
        ...formValues,
        medicalStaff: currentStaff,
      });
    }
  };

  // Calculate billing
  const calculateBilling = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ambulances/billing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate billing');
      }
      
      const result = await response.json();
      setBillingResult(result);
      toast.success('Billing calculated successfully');
    } catch (error) {
      console.error('Error calculating billing:', error);
      toast.error('Failed to calculate billing');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Ambulance Rate Calculator</Typography>
      
      <Grid container spacing={3}>
        {/* Rate Calculator Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Billing Parameters</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography gutterBottom>Distance (km): {formValues.distance} km</Typography>
                <Slider
                  value={formValues.distance}
                  onChange={(_, value) => handleChange('distance', value)}
                  min={1}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={formValues.vehicleType}
                    label="Vehicle Type"
                    onChange={(e) => handleChange('vehicleType', e.target.value)}
                  >
                    {vehicleTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Service Level</InputLabel>
                  <Select
                    value={formValues.serviceLevel}
                    label="Service Level"
                    onChange={(e) => handleChange('serviceLevel', e.target.value)}
                  >
                    {serviceLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Time of Day</InputLabel>
                  <Select
                    value={formValues.timeOfDay}
                    label="Time of Day"
                    onChange={(e) => handleChange('timeOfDay', e.target.value)}
                  >
                    {timeOfDayOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Zone</InputLabel>
                  <Select
                    value={formValues.zone}
                    label="Zone"
                    onChange={(e) => handleChange('zone', e.target.value)}
                  >
                    {zoneOptions.map((zone) => (
                      <MenuItem key={zone.value} value={zone.value}>
                        {zone.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>Waiting Time (minutes): {formValues.waitingTime} min</Typography>
                <Slider
                  value={formValues.waitingTime}
                  onChange={(_, value) => handleChange('waitingTime', value)}
                  min={0}
                  max={60}
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Equipment Used</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {equipmentOptions.map((equipment) => (
                    <Button
                      key={equipment.value}
                      variant={formValues.equipment.includes(equipment.value) ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => toggleEquipment(equipment.value)}
                      sx={{ mb: 1 }}
                    >
                      {equipment.label} (₹{equipment.price})
                    </Button>
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Medical Staff</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {staffOptions.map((staff) => {
                    const staffEntry = formValues.medicalStaff.find(s => s.type === staff.value);
                    return (
                      <Box key={staff.value} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Button
                          variant={staffEntry ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => toggleStaff(staff.value)}
                          sx={{ minWidth: 120 }}
                        >
                          {staff.label}
                        </Button>
                        {staffEntry && (
                          <TextField
                            label="Count"
                            type="number"
                            size="small"
                            value={staffEntry.count}
                            onChange={(e) => updateStaffCount(staff.value, parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, max: 5 }}
                            sx={{ width: 80 }}
                          />
                        )}
                        <Typography variant="body2" color="text.secondary">
                          ₹{staff.price} each
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CalculateIcon />}
                  onClick={calculateBilling}
                  disabled={loading}
                  fullWidth
                >
                  Calculate Billing
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Billing Result */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Billing Breakdown</Typography>
            
            {!billingResult && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <Typography variant="body1" color="text.secondary">
                  Enter parameters and click "Calculate Billing" to see the breakdown
                </Typography>
              </Box>
            )}
            
            {billingResult && (
              <Box>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h5" color="primary" gutterBottom>
                      Total: {formatCurrency(billingResult.breakdown.totalAmount)}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Base Rate:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {formatCurrency(billingResult.breakdown.baseRate)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Distance Charge:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {formatCurrency(billingResult.breakdown.distanceCharge)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({formValues.distance} km × ₹{billingResult.rates.distanceRate}/km)
                        </Typography>
                      </Grid>
                      
                      {billingResult.breakdown.waitingCharge > 0 && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Waiting Charge:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body1">
                              {formatCurrency(billingResult.breakdown.waitingCharge)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                      
                      {billingResult.breakdown.equipmentCharge > 0 && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Equipment Charge:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body1">
                              {formatCurrency(billingResult.breakdown.equipmentCharge)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                      
                      {billingResult.breakdown.staffCharge > 0 && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Medical Staff Charge:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body1">
                              {formatCurrency(billingResult.breakdown.staffCharge)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {formatCurrency(billingResult.breakdown.subtotal)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">GST ({(billingResult.rates.gstRate * 100).toFixed(0)}%):</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {formatCurrency(billingResult.breakdown.tax)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="h6">Total Amount:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(billingResult.breakdown.totalAmount)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                
                <Typography variant="subtitle2" gutterBottom>Rate Information</Typography>
                <Box sx={{ backgroundColor: theme.palette.background.default, p: 2, borderRadius: 1 }}>
                  <Typography variant="body2">Base Rate: ₹{billingResult.rates.baseRate}</Typography>
                  <Typography variant="body2">Distance Rate: ₹{billingResult.rates.distanceRate}/km</Typography>
                  <Typography variant="body2">Time Adjustment: {billingResult.rates.timeAdjustment}x</Typography>
                  <Typography variant="body2">GST Rate: {(billingResult.rates.gstRate * 100).toFixed(0)}%</Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
