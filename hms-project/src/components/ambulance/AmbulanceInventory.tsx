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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  LocalHospital as MedicalIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

// Define validation schema
const ambulanceSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  vehicleModel: z.string().min(1, 'Vehicle model is required'),
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  manufacturingYear: z.number().min(1950, 'Invalid manufacturing year'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  features: z.array(z.string()).optional(),
  purchaseDate: z.date(),
  insuranceExpiry: z.date(),
});

type AmbulanceFormValues = z.infer<typeof ambulanceSchema>;

// Ambulance vehicle types
const vehicleTypes = [
  { value: 'BASIC_LIFE_SUPPORT', label: 'Basic Life Support (BLS)' },
  { value: 'ADVANCED_LIFE_SUPPORT', label: 'Advanced Life Support (ALS)' },
  { value: 'PATIENT_TRANSPORT', label: 'Patient Transport Vehicle (PTV)' },
  { value: 'NEONATAL', label: 'Neonatal Ambulance' },
  { value: 'MOBILE_ICU', label: 'Mobile ICU' },
];

// Ambulance status types
const statusOptions = [
  { value: 'AVAILABLE', label: 'Available', color: 'success' },
  { value: 'IN_USE', label: 'In Use', color: 'primary' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'warning' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: 'error' },
];

const AmbulanceInventory: React.FC = () => {
  const theme = useTheme();
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<string | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalAmbulances, setTotalAmbulances] = useState(0);

  // Setup form with default values
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<AmbulanceFormValues>({
    resolver: zodResolver(ambulanceSchema),
    defaultValues: {
      registrationNumber: '',
      vehicleModel: '',
      vehicleType: 'BASIC_LIFE_SUPPORT',
      manufacturingYear: new Date().getFullYear(),
      capacity: 2,
      features: [],
      purchaseDate: new Date(),
      insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    }
  });

  // Fetch ambulances
  const fetchAmbulances = async () => {
    setLoading(true);
    try {
      let url = `/api/ambulances/inventory?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (filterStatus !== 'ALL') {
        url += `&status=${filterStatus}`;
      }
      
      if (filterType !== 'ALL') {
        url += `&vehicleType=${filterType}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ambulances');
      }
      
      const result = await response.json();
      setAmbulances(result.data);
      setTotalAmbulances(result.meta.total);
    } catch (error) {
      console.error('Error fetching ambulances:', error);
      toast.error('Failed to load ambulance inventory');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load and when filters/pagination change
  useEffect(() => {
    fetchAmbulances();
  }, [page, rowsPerPage, filterStatus, filterType]);

  // Handle form submission
  const onSubmit = async (data: AmbulanceFormValues) => {
    setLoading(true);
    
    try {
      const endpoint = '/api/ambulances/inventory';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...data } : data;
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save ambulance');
      }
      
      toast.success(editingId ? 'Ambulance updated successfully' : 'New ambulance added successfully');
      setOpen(false);
      fetchAmbulances();
      reset();
      setEditingId(null);
    } catch (error) {
      console.error('Error saving ambulance:', error);
      toast.error(error.message || 'An error occurred while saving the ambulance');
    } finally {
      setLoading(false);
    }
  };

  // Edit ambulance
  const handleEdit = (ambulance: any) => {
    setEditingId(ambulance.id);
    
    // Set form values
    setValue('registrationNumber', ambulance.registrationNumber);
    setValue('vehicleModel', ambulance.vehicleModel);
    setValue('vehicleType', ambulance.vehicleType);
    setValue('manufacturingYear', ambulance.manufacturingYear);
    setValue('capacity', ambulance.capacity);
    setValue('features', ambulance.features);
    setValue('purchaseDate', new Date(ambulance.purchaseDate));
    setValue('insuranceExpiry', new Date(ambulance.insuranceExpiry));
    
    setOpen(true);
  };

  // Delete ambulance
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ambulance?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ambulances/inventory?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete ambulance');
      }
      
      toast.success('Ambulance deleted successfully');
      fetchAmbulances();
    } catch (error) {
      console.error('Error deleting ambulance:', error);
      toast.error(error.message || 'An error occurred while deleting the ambulance');
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get status chip color
  const getStatusChip = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return (
      <Chip
        label={statusOption?.label || status}
        color={statusOption?.color as any || 'default'}
        size="small"
      />
    );
  };

  // Check if insurance is expiring soon (within 30 days)
  const isInsuranceExpiringSoon = (date: string) => {
    const expiryDate = new Date(date);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ambulance Inventory</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingId(null);
            reset();
            setOpen(true);
          }}
        >
          Add Ambulance
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={filterType}
                label="Vehicle Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                {vehicleTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Ambulance List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Registration</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Insurance Expiry</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from(new Array(rowsPerPage)).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: '100%', height: 10, bgcolor: 'grey.200', borderRadius: 1 }} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            
            {!loading && ambulances.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography align="center">No ambulances found.</Typography>
                </TableCell>
              </TableRow>
            )}
            
            {!loading && ambulances.map((ambulance) => (
              <TableRow key={ambulance.id}>
                <TableCell>{ambulance.registrationNumber}</TableCell>
                <TableCell>{ambulance.vehicleModel}</TableCell>
                <TableCell>
                  {vehicleTypes.find(t => t.value === ambulance.vehicleType)?.label || ambulance.vehicleType}
                </TableCell>
                <TableCell>{ambulance.capacity}</TableCell>
                <TableCell>{getStatusChip(ambulance.status)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {format(new Date(ambulance.insuranceExpiry), 'dd/MM/yyyy')}
                    {isInsuranceExpiringSoon(ambulance.insuranceExpiry) && (
                      <Chip size="small" label="Expiring Soon" color="warning" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(ambulance)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(ambulance.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalAmbulances}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit Ambulance Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingId ? 'Edit Ambulance' : 'Add New Ambulance'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="registrationNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Registration Number"
                      fullWidth
                      error={!!errors.registrationNumber}
                      helperText={errors.registrationNumber?.message}
                      disabled={!!editingId}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="vehicleModel"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Vehicle Model"
                      fullWidth
                      error={!!errors.vehicleModel}
                      helperText={errors.vehicleModel?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="vehicleType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.vehicleType}>
                      <InputLabel>Vehicle Type</InputLabel>
                      <Select {...field} label="Vehicle Type">
                        {vehicleTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="manufacturingYear"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      label="Manufacturing Year"
                      type="number"
                      fullWidth
                      value={value}
                      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                      error={!!errors.manufacturingYear}
                      helperText={errors.manufacturingYear?.message}
                      InputProps={{
                        inputProps: {
                          min: 1950,
                          max: new Date().getFullYear(),
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="capacity"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      label="Capacity"
                      type="number"
                      fullWidth
                      value={value}
                      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                      error={!!errors.capacity}
                      helperText={errors.capacity?.message}
                      InputProps={{
                        inputProps: { min: 1 },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="purchaseDate"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <DatePicker
                        {...field}
                        label="Purchase Date"
                        value={value}
                        onChange={onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.purchaseDate,
                            helperText: errors.purchaseDate?.message,
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="insuranceExpiry"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <DatePicker
                        {...field}
                        label="Insurance Expiry Date"
                        value={value}
                        onChange={onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.insuranceExpiry,
                            helperText: errors.insuranceExpiry?.message,
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AmbulanceInventory;
