import React, { useState, useEffect, useRef } from 'react';
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
  LocalShipping as AmbulanceIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PatientAutocomplete } from '@/components/patients/PatientAutocomplete';
import { toast } from 'react-hot-toast';
import { format, differenceInMinutes } from 'date-fns';

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
      id={`ambulance-tabpanel-${index}`}
      aria-labelledby={`ambulance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Status colors and priority colors
const statusColors = {
  REQUESTED: 'info',
  ASSIGNED: 'secondary',
  DISPATCHED: 'primary',
  ARRIVED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const priorityColors = {
  LOW: 'info',
  NORMAL: 'success',
  HIGH: 'warning',
  EMERGENCY: 'error',
};

// Define validation schema
const dispatchSchema = z.object({
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropLocation: z.string().min(1, 'Drop location is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'EMERGENCY']),
  patientId: z.string().optional(),
  notes: z.string().optional(),
});

type DispatchFormValues = z.infer<typeof dispatchSchema>;

const AmbulanceDispatchSystem: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [activeDispatches, setActiveDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalDispatches, setTotalDispatches] = useState(0);
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>({});
  const sseRef = useRef<EventSource | null>(null);

  // Setup form with default values
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      pickupLocation: '',
      dropLocation: '',
      purpose: '',
      priority: 'NORMAL',
      notes: '',
    }
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch all dispatches
  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ambulances/dispatch?page=${page + 1}&limit=${rowsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dispatches');
      }
      
      const result = await response.json();
      setDispatches(result.data);
      setTotalDispatches(result.meta.total);
    } catch (error) {
      console.error('Error fetching dispatches:', error);
      toast.error('Failed to load dispatch requests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch active dispatches
  const fetchActiveDispatches = async () => {
    try {
      const response = await fetch('/api/ambulances/dispatch?status=DISPATCHED');
      
      if (!response.ok) {
        throw new Error('Failed to fetch active dispatches');
      }
      
      const result = await response.json();
      setActiveDispatches(result.data);
    } catch (error) {
      console.error('Error fetching active dispatches:', error);
    }
  };

  // Initialize map
  const initializeMap = () => {
    if (!mapInitialized && typeof window !== 'undefined' && window.google && window.google.maps) {
      // Maps would be initialized here using Google Maps or a similar API
      // For demonstration purposes, we're mocking this functionality
      console.log('Map initialized');
      setMapInitialized(true);
    }
  };

  // Setup SSE connection for real-time updates
  const setupSSE = () => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    // In a real implementation, connect to the SSE endpoint
    // sseRef.current = new EventSource('/api/ambulances/location-sse');
    
    // Mock SSE for demonstration
    console.log('SSE connection established');
    
    // Handle location updates
    if (sseRef.current) {
      sseRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateAmbulanceMarker(data);
      };

      sseRef.current.onerror = (error) => {
        console.error('SSE connection error:', error);
        if (sseRef.current) {
          sseRef.current.close();
          sseRef.current = null;
        }
      };
    }
  };

  // Update ambulance marker on map
  const updateAmbulanceMarker = (locationData: any) => {
    if (!mapInitialized) return;
    
    // In a real implementation, this would update a marker on the map
    console.log('Updating ambulance marker:', locationData);
  };

  // Fetch on initial load and when filters/pagination change
  useEffect(() => {
    fetchDispatches();
  }, [page, rowsPerPage]);

  // Load active dispatches and setup map on tab change
  useEffect(() => {
    if (tabValue === 1) {
      fetchActiveDispatches();
      initializeMap();
      setupSSE();
    }

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [tabValue]);

  // Handle form submission
  const onSubmit = async (data: DispatchFormValues) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ambulances/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          requestedBy: "current-user-id", // In a real app, this would come from the auth session
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dispatch request');
      }
      
      toast.success('Dispatch request created successfully');
      setOpen(false);
      fetchDispatches();
      reset();
    } catch (error) {
      console.error('Error creating dispatch request:', error);
      toast.error(error.message || 'An error occurred while creating the dispatch request');
    } finally {
      setLoading(false);
    }
  };

  // Update dispatch status
  const updateDispatchStatus = async (id: string, status: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ambulances/dispatch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update dispatch status');
      }
      
      toast.success(`Dispatch ${status.toLowerCase()} successfully`);
      fetchDispatches();
      
      if (selectedDispatch && selectedDispatch.id === id) {
        setSelectedDispatch(null);
      }
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      toast.error(error.message || 'An error occurred while updating the dispatch status');
    } finally {
      setLoading(false);
    }
  };

  // View dispatch details
  const viewDispatchDetails = async (id: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/ambulances/dispatch?id=${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dispatch details');
      }
      
      const dispatchDetails = await response.json();
      setSelectedDispatch(dispatchDetails);
    } catch (error) {
      console.error('Error fetching dispatch details:', error);
      toast.error(error.message || 'An error occurred while fetching dispatch details');
    } finally {
      setLoading(false);
    }
  };

  // Calculate ETA
  const calculateETA = (dispatch: any) => {
    // In a real implementation, this would use actual location data and traffic information
    // For demonstration, we'll return a fixed value
    return '15 minutes';
  };

  // Format date with time
  const formatDateTime = (date: string | Date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  // Get status chip
  const getStatusChip = (status: string) => {
    return (
      <Chip
        label={status}
        color={statusColors[status as keyof typeof statusColors] as any || 'default'}
        size="small"
      />
    );
  };

  // Get priority chip
  const getPriorityChip = (priority: string) => {
    return (
      <Chip
        label={priority}
        color={priorityColors[priority as keyof typeof priorityColors] as any || 'default'}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="ambulance dispatch tabs">
          <Tab label="Dispatch Requests" />
          <Tab label="Active Tracking" />
        </Tabs>
      </Box>

      {/* Dispatch Requests Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Ambulance Dispatch Requests</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              reset();
              setOpen(true);
            }}
          >
            New Dispatch Request
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Dispatch List */}
          <Grid item xs={12} md={selectedDispatch ? 7 : 12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recent Requests</Typography>
              
              {loading && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <Typography>Loading...</Typography>
                </Box>
              )}
              
              {!loading && dispatches.length === 0 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <Typography>No dispatch requests found.</Typography>
                </Box>
              )}
              
              {!loading && dispatches.map((dispatch) => (
                <Card key={dispatch.id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => viewDispatchDetails(dispatch.id)}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="subtitle1">
                          {dispatch.purpose}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          From: {dispatch.pickupLocation}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          To: {dispatch.dropLocation}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Box sx={{ mb: 1 }}>{getStatusChip(dispatch.status)}</Box>
                        <Box>{getPriorityChip(dispatch.priority)}</Box>
                        <Typography variant="caption" sx={{ mt: 1 }}>
                          {formatDateTime(dispatch.requestedAt)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>

          {/* Dispatch Details */}
          {selectedDispatch && (
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Dispatch Details</Typography>
                  <IconButton size="small" onClick={() => setSelectedDispatch(null)}>
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedDispatch.status)}</Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Priority</Typography>
                  <Box sx={{ mt: 0.5 }}>{getPriorityChip(selectedDispatch.priority)}</Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Purpose</Typography>
                  <Typography variant="body1">{selectedDispatch.purpose}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Pickup Location</Typography>
                  <Typography variant="body1">{selectedDispatch.pickupLocation}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Drop Location</Typography>
                  <Typography variant="body1">{selectedDispatch.dropLocation}</Typography>
                </Box>

                {selectedDispatch.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Notes</Typography>
                    <Typography variant="body1">{selectedDispatch.notes}</Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Ambulance</Typography>
                  <Typography variant="body1">
                    {selectedDispatch.Ambulance?.vehicleModel} ({selectedDispatch.Ambulance?.registrationNumber})
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Driver</Typography>
                  <Typography variant="body1">
                    {selectedDispatch.AmbulanceDriver?.driverId || 'Not assigned'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Requested At</Typography>
                  <Typography variant="body1">{formatDateTime(selectedDispatch.requestedAt)}</Typography>
                </Box>

                {selectedDispatch.dispatchedAt && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Dispatched At</Typography>
                    <Typography variant="body1">{formatDateTime(selectedDispatch.dispatchedAt)}</Typography>
                  </Box>
                )}

                {selectedDispatch.arrivedAt && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Arrived At</Typography>
                    <Typography variant="body1">{formatDateTime(selectedDispatch.arrivedAt)}</Typography>
                  </Box>
                )}

                {selectedDispatch.completedAt && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Completed At</Typography>
                    <Typography variant="body1">{formatDateTime(selectedDispatch.completedAt)}</Typography>
                  </Box>
                )}

                {/* Status update buttons based on current status */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {selectedDispatch.status === 'ASSIGNED' && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<AmbulanceIcon />}
                      onClick={() => updateDispatchStatus(selectedDispatch.id, 'DISPATCHED')}
                    >
                      Dispatch
                    </Button>
                  )}

                  {selectedDispatch.status === 'DISPATCHED' && (
                    <Button 
                      variant="contained" 
                      color="warning" 
                      startIcon={<LocationIcon />}
                      onClick={() => updateDispatchStatus(selectedDispatch.id, 'ARRIVED')}
                    >
                      Mark Arrived
                    </Button>
                  )}

                  {selectedDispatch.status === 'ARRIVED' && (
                    <Button 
                      variant="contained" 
                      color="success" 
                      startIcon={<CheckIcon />}
                      onClick={() => updateDispatchStatus(selectedDispatch.id, 'COMPLETED')}
                    >
                      Complete
                    </Button>
                  )}

                  {['REQUESTED', 'ASSIGNED', 'DISPATCHED'].includes(selectedDispatch.status) && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={<CancelIcon />}
                      onClick={() => updateDispatchStatus(selectedDispatch.id, 'CANCELLED')}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Active Tracking Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Ambulance Live Tracking</Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Map for tracking */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 0, height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/* In a real app, this would be a Google Maps or similar component */}
              <Box
                ref={mapRef}
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: 'grey.200',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Map View (Google Maps integration would be implemented here)
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Active dispatches list */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Active Ambulances</Typography>
              
              {activeDispatches.length === 0 ? (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <Typography>No active ambulances.</Typography>
                </Box>
              ) : (
                activeDispatches.map((dispatch) => (
                  <Card key={dispatch.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {dispatch.Ambulance?.registrationNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dispatch.purpose}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <SpeedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Speed: 45 km/h
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          ETA: {calculateETA(dispatch)}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<PhoneIcon />}
                          onClick={() => alert(`Calling driver for ${dispatch.Ambulance?.registrationNumber}`)}
                        >
                          Contact Driver
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Create Dispatch Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Create New Dispatch Request</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="pickupLocation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Pickup Location"
                      fullWidth
                      error={!!errors.pickupLocation}
                      helperText={errors.pickupLocation?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="dropLocation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Drop Location"
                      fullWidth
                      error={!!errors.dropLocation}
                      helperText={errors.dropLocation?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="purpose"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Purpose"
                      fullWidth
                      error={!!errors.purpose}
                      helperText={errors.purpose?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.priority}>
                      <InputLabel>Priority</InputLabel>
                      <Select {...field} label="Priority">
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="NORMAL">Normal</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                        <MenuItem value="EMERGENCY">Emergency</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <PatientAutocomplete
                  onChange={(patient) => {
                    if (patient) {
                      setValue('patientId', patient.id);
                    } else {
                      setValue('patientId', '');
                    }
                  }}
                />
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
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Dispatch'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AmbulanceDispatchSystem;
