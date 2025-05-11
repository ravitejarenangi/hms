import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-hot-toast';
import { format, parseISO, addMonths } from 'date-fns';

// Define validation schema
const maintenanceSchema = z.object({
  ambulanceId: z.string().min(1, 'Ambulance is required'),
  maintenanceType: z.enum([
    'ROUTINE',
    'REPAIR',
    'INSPECTION',
    'EMERGENCY',
    'UPGRADE',
    'OTHER'
  ]),
  description: z.string().min(1, 'Description is required'),
  performedBy: z.string().min(1, 'Performed by is required'),
  performedAt: z.date(),
  cost: z.number().optional(),
  odometer: z.number().optional(),
  nextMaintenanceDue: z.date().optional(),
  notes: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

// Tabs interface
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
      id={`maintenance-tabpanel-${index}`}
      aria-labelledby={`maintenance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const maintenanceTypes = [
  { value: 'ROUTINE', label: 'Routine Maintenance', color: 'primary' },
  { value: 'REPAIR', label: 'Repair', color: 'error' },
  { value: 'INSPECTION', label: 'Inspection', color: 'success' },
  { value: 'EMERGENCY', label: 'Emergency Repair', color: 'warning' },
  { value: 'UPGRADE', label: 'Upgrade/Modification', color: 'info' },
  { value: 'OTHER', label: 'Other', color: 'default' },
];

const dispatchStatuses = {
  REQUESTED: 'info',
  ASSIGNED: 'secondary',
  DISPATCHED: 'primary',
  ARRIVED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const AmbulanceServiceHistory: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<string>('');
  const [historyType, setHistoryType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setMonth(new Date().getMonth() - 3)));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Setup form with default values
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      ambulanceId: '',
      maintenanceType: 'ROUTINE',
      description: '',
      performedBy: '',
      performedAt: new Date(),
      cost: 0,
      odometer: 0,
      nextMaintenanceDue: addMonths(new Date(), 3),
      notes: '',
    }
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch ambulances for dropdown
  const fetchAmbulances = async () => {
    try {
      const response = await fetch('/api/ambulances/inventory');
      
      if (!response.ok) {
        throw new Error('Failed to fetch ambulances');
      }
      
      const result = await response.json();
      setAmbulances(result.data);
      
      // If no ambulance is selected and we have ambulances, select the first one
      if (!selectedAmbulance && result.data.length > 0) {
        setSelectedAmbulance(result.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching ambulances:', error);
      toast.error('Failed to load ambulances');
    }
  };

  // Fetch service history
  const fetchServiceHistory = async () => {
    if (!selectedAmbulance) return;
    
    setLoading(true);
    try {
      let url = `/api/ambulances/history?ambulanceId=${selectedAmbulance}&type=${historyType}&page=${page + 1}&limit=${rowsPerPage}`;
      
      if (startDate) {
        url += `&startDate=${startDate.toISOString()}`;
      }
      
      if (endDate) {
        url += `&endDate=${endDate.toISOString()}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch service history');
      }
      
      const result = await response.json();
      setServiceHistory(result.data);
      setTotalRecords(result.meta.total);
    } catch (error) {
      console.error('Error fetching service history:', error);
      toast.error('Failed to load service history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load
  useEffect(() => {
    fetchAmbulances();
  }, []);

  // Fetch service history when filters change
  useEffect(() => {
    if (selectedAmbulance) {
      fetchServiceHistory();
    }
  }, [selectedAmbulance, historyType, startDate, endDate, page, rowsPerPage]);

  // Handle form submission for maintenance record
  const onSubmitMaintenance = async (data: MaintenanceFormValues) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ambulances/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add maintenance record');
      }
      
      toast.success('Maintenance record added successfully');
      setOpenMaintenanceDialog(false);
      fetchServiceHistory();
      reset();
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      toast.error(error.message || 'An error occurred while adding the maintenance record');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  // Format date with time
  const formatDateTime = (date: string | Date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  // Get maintenance type chip
  const getMaintenanceTypeChip = (type: string) => {
    const maintenanceType = maintenanceTypes.find(t => t.value === type);
    return (
      <Chip
        label={maintenanceType?.label || type}
        color={maintenanceType?.color as any || 'default'}
        size="small"
        icon={<BuildIcon />}
      />
    );
  };

  // Get dispatch status chip
  const getDispatchStatusChip = (status: string) => {
    return (
      <Chip
        label={status}
        color={dispatchStatuses[status as keyof typeof dispatchStatuses] as any || 'default'}
        size="small"
      />
    );
  };

  // Format cost as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ambulance Service History</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            reset();
            setValue('ambulanceId', selectedAmbulance);
            setOpenMaintenanceDialog(true);
          }}
          disabled={!selectedAmbulance}
        >
          Add Maintenance Record
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Ambulance</InputLabel>
              <Select
                value={selectedAmbulance}
                label="Ambulance"
                onChange={(e) => setSelectedAmbulance(e.target.value)}
              >
                {ambulances.map((ambulance) => (
                  <MenuItem key={ambulance.id} value={ambulance.id}>
                    {ambulance.registrationNumber} - {ambulance.vehicleModel}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Record Type</InputLabel>
              <Select
                value={historyType}
                label="Record Type"
                onChange={(e) => setHistoryType(e.target.value)}
              >
                <MenuItem value="ALL">All Records</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance Only</MenuItem>
                <MenuItem value="DISPATCH">Dispatch Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={startDate}
                onChange={(date) => setStartDate(date)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="To Date"
                value={endDate}
                onChange={(date) => setEndDate(date)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>

      {/* Service History */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Service Records</Typography>
        
        {loading && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        )}
        
        {!loading && serviceHistory.length === 0 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Typography>No service history found for the selected criteria.</Typography>
          </Box>
        )}
        
        {!loading && serviceHistory.map((record) => (
          <Card key={record.id} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  {record.type === 'MAINTENANCE' ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getMaintenanceTypeChip(record.details.maintenanceType)}
                        <Typography variant="subtitle1">{record.details.description}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Performed by: {record.details.performedBy}
                      </Typography>
                      {record.details.cost && (
                        <Typography variant="body2" color="text.secondary">
                          Cost: {formatCurrency(record.details.cost)}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getDispatchStatusChip(record.details.status)}
                        <Typography variant="subtitle1">
                          Dispatch from {record.details.from} to {record.details.to}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Driver: {record.details.driver || 'Not assigned'}
                      </Typography>
                      {record.details.billing && (
                        <Typography variant="body2" color="text.secondary">
                          Billing: {formatCurrency(record.details.billing.amount)} ({record.details.billing.status})
                        </Typography>
                      )}
                    </>
                  )}
                </Grid>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">
                    {record.type === 'MAINTENANCE' ? 'Performed on' : 'Dispatched on'}
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(record.date)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Paper>

      {/* Add Maintenance Record Dialog */}
      <Dialog open={openMaintenanceDialog} onClose={() => setOpenMaintenanceDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmitMaintenance)}>
          <DialogTitle>Add Maintenance Record</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="ambulanceId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.ambulanceId}>
                      <InputLabel>Ambulance</InputLabel>
                      <Select {...field} label="Ambulance">
                        {ambulances.map((ambulance) => (
                          <MenuItem key={ambulance.id} value={ambulance.id}>
                            {ambulance.registrationNumber} - {ambulance.vehicleModel}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maintenanceType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.maintenanceType}>
                      <InputLabel>Maintenance Type</InputLabel>
                      <Select {...field} label="Maintenance Type">
                        {maintenanceTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="performedBy"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Performed By"
                      fullWidth
                      error={!!errors.performedBy}
                      helperText={errors.performedBy?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="performedAt"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <DatePicker
                        {...field}
                        label="Performed Date"
                        value={value}
                        onChange={onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.performedAt,
                            helperText: errors.performedAt?.message,
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="cost"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      label="Cost (INR)"
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputLabel position="start">₹</InputLabel>
                        ),
                      }}
                      fullWidth
                      value={value || ''}
                      onChange={(e) => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      error={!!errors.cost}
                      helperText={errors.cost?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="odometer"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      label="Odometer Reading (km)"
                      type="number"
                      fullWidth
                      value={value || ''}
                      onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                      error={!!errors.odometer}
                      helperText={errors.odometer?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="nextMaintenanceDue"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <DatePicker
                        {...field}
                        label="Next Maintenance Due"
                        value={value}
                        onChange={onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.nextMaintenanceDue,
                            helperText: errors.nextMaintenanceDue?.message,
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notes"
                      fullWidth
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMaintenanceDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Add Record'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AmbulanceServiceHistory;
