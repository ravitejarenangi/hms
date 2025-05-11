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
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Badge as BadgeIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-hot-toast';
import { format, differenceInDays, isAfter } from 'date-fns';

// Define validation schema
const driverSchema = z.object({
  ambulanceId: z.string().min(1, 'Ambulance is required'),
  driverId: z.string().min(1, 'Driver ID is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiry: z.date(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

const DriverAssignmentSystem: React.FC = () => {
  const theme = useTheme();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [filterAvailable, setFilterAvailable] = useState<string>('ALL');
  const [filterAmbulance, setFilterAmbulance] = useState<string>('ALL');

  // Setup form with default values
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      ambulanceId: '',
      driverId: '',
      licenseNumber: '',
      licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
    }
  });

  // Fetch ambulances for dropdown
  const fetchAmbulances = async () => {
    try {
      const response = await fetch('/api/ambulances/inventory');
      
      if (!response.ok) {
        throw new Error('Failed to fetch ambulances');
      }
      
      const result = await response.json();
      setAmbulances(result.data);
    } catch (error) {
      console.error('Error fetching ambulances:', error);
      toast.error('Failed to load ambulances');
    }
  };

  // Fetch drivers
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      let url = `/api/ambulances/drivers?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (filterAvailable !== 'ALL') {
        url += `&available=${filterAvailable === 'AVAILABLE'}`;
      }
      
      if (filterAmbulance !== 'ALL') {
        url += `&ambulanceId=${filterAmbulance}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      
      const result = await response.json();
      setDrivers(result.data);
      setTotalDrivers(result.meta.total);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load driver assignments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load and when filters/pagination change
  useEffect(() => {
    fetchDrivers();
  }, [page, rowsPerPage, filterAvailable, filterAmbulance]);

  // Fetch ambulances on initial load
  useEffect(() => {
    fetchAmbulances();
  }, []);

  // Handle form submission
  const onSubmit = async (data: DriverFormValues) => {
    setLoading(true);
    
    try {
      const endpoint = '/api/ambulances/drivers';
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
        throw new Error(errorData.error || 'Failed to save driver assignment');
      }
      
      toast.success(editingId ? 'Driver assignment updated successfully' : 'Driver assigned successfully');
      setOpen(false);
      fetchDrivers();
      reset();
      setEditingId(null);
    } catch (error) {
      console.error('Error saving driver assignment:', error);
      toast.error(error.message || 'An error occurred while saving the driver assignment');
    } finally {
      setLoading(false);
    }
  };

  // Edit driver assignment
  const handleEdit = (driver: any) => {
    setEditingId(driver.id);
    
    // Set form values
    setValue('ambulanceId', driver.ambulanceId);
    setValue('driverId', driver.driverId);
    setValue('licenseNumber', driver.licenseNumber);
    setValue('licenseExpiry', new Date(driver.licenseExpiry));
    
    setOpen(true);
  };

  // Delete driver assignment
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this driver assignment?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ambulances/drivers?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove driver assignment');
      }
      
      toast.success('Driver assignment removed successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Error removing driver assignment:', error);
      toast.error(error.message || 'An error occurred while removing the driver assignment');
    } finally {
      setLoading(false);
    }
  };

  // Toggle driver availability
  const toggleDriverAvailability = async (driver: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ambulances/drivers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: driver.id,
          isAvailable: !driver.isAvailable,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update driver availability');
      }
      
      toast.success(`Driver ${!driver.isAvailable ? 'is now available' : 'is now unavailable'}`);
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver availability:', error);
      toast.error(error.message || 'An error occurred while updating driver availability');
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

  // Format date
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  // Check if license is expiring soon (within 30 days) or expired
  const isLicenseExpiringSoon = (date: string) => {
    const expiryDate = new Date(date);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  };

  const isLicenseExpired = (date: string) => {
    const expiryDate = new Date(date);
    return isAfter(new Date(), expiryDate);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Driver Assignment System</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingId(null);
            reset();
            setOpen(true);
          }}
        >
          Assign Driver
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Availability</InputLabel>
              <Select
                value={filterAvailable}
                label="Availability"
                onChange={(e) => setFilterAvailable(e.target.value)}
              >
                <MenuItem value="ALL">All Drivers</MenuItem>
                <MenuItem value="AVAILABLE">Available Only</MenuItem>
                <MenuItem value="UNAVAILABLE">Unavailable Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Ambulance</InputLabel>
              <Select
                value={filterAmbulance}
                label="Ambulance"
                onChange={(e) => setFilterAmbulance(e.target.value)}
              >
                <MenuItem value="ALL">All Ambulances</MenuItem>
                {ambulances.map((ambulance) => (
                  <MenuItem key={ambulance.id} value={ambulance.id}>
                    {ambulance.registrationNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Driver Assignments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Driver ID</TableCell>
              <TableCell>Ambulance</TableCell>
              <TableCell>License Number</TableCell>
              <TableCell>License Expiry</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from(new Array(rowsPerPage)).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: '100%', height: 10, bgcolor: 'grey.200', borderRadius: 1 }} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            
            {!loading && drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography align="center">No driver assignments found.</Typography>
                </TableCell>
              </TableRow>
            )}
            
            {!loading && drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell>{driver.driverId}</TableCell>
                <TableCell>
                  {driver.Ambulance?.registrationNumber || 'Not Available'}
                </TableCell>
                <TableCell>{driver.licenseNumber}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formatDate(driver.licenseExpiry)}
                    {isLicenseExpired(driver.licenseExpiry) && (
                      <Chip size="small" label="Expired" color="error" icon={<WarningIcon />} />
                    )}
                    {!isLicenseExpired(driver.licenseExpiry) && isLicenseExpiringSoon(driver.licenseExpiry) && (
                      <Chip size="small" label="Expiring Soon" color="warning" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={driver.isAvailable ? 'Available' : 'Unavailable'}
                    color={driver.isAvailable ? 'success' : 'error'}
                    size="small"
                    onClick={() => toggleDriverAvailability(driver)}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(driver)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(driver.id)}>
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
          count={totalDrivers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit Driver Assignment Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingId ? 'Edit Driver Assignment' : 'Assign Driver to Ambulance'}
          </DialogTitle>
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
                  name="driverId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Driver ID"
                      fullWidth
                      error={!!errors.driverId}
                      helperText={errors.driverId?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="licenseNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="License Number"
                      fullWidth
                      error={!!errors.licenseNumber}
                      helperText={errors.licenseNumber?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="licenseExpiry"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <DatePicker
                        {...field}
                        label="License Expiry Date"
                        value={value}
                        onChange={onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.licenseExpiry,
                            helperText: errors.licenseExpiry?.message,
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
              {loading ? 'Saving...' : editingId ? 'Update' : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DriverAssignmentSystem;
