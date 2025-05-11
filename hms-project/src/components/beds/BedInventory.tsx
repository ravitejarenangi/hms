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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  SelectChangeEvent,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ScheduleIcon from '@mui/icons-material/Schedule';

interface Bed {
  id: string;
  bedNumber: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  wing: string;
  bedType: string;
  status: string;
  features: string[];
  lastMaintenance: string | null;
}

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  wing: string;
  roomType: string;
}

const BedInventory: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [currentBed, setCurrentBed] = useState<Bed | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form states
  const [formData, setFormData] = useState({
    bedNumber: '',
    roomId: '',
    bedType: 'STANDARD',
    features: [] as string[],
    notes: ''
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    bedType: '',
    status: '',
    floor: '',
    wing: '',
    roomType: ''
  });

  // Maintenance form
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: 'ROUTINE',
    scheduledAt: '',
    description: ''
  });

  useEffect(() => {
    // Fetch beds data
    const fetchBeds = async () => {
      try {
        const response = await fetch('/api/beds');
        if (response.ok) {
          const data = await response.json();
          setBeds(data);
        } else {
          throw new Error('Failed to fetch beds');
        }
      } catch (error) {
        console.error('Error fetching beds:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load beds data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    // Fetch rooms data
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        } else {
          throw new Error('Failed to fetch rooms');
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    fetchBeds();
    fetchRooms();
  }, []);

  const handleAddBed = async () => {
    try {
      const response = await fetch('/api/beds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newBed = await response.json();
        setBeds([...beds, newBed]);
        setOpenAddDialog(false);
        resetForm();
        setSnackbar({
          open: true,
          message: 'Bed added successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to add bed');
      }
    } catch (error) {
      console.error('Error adding bed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add bed',
        severity: 'error'
      });
    }
  };

  const handleEditBed = async () => {
    if (!currentBed) return;
    
    try {
      const response = await fetch(`/api/beds/${currentBed.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedBed = await response.json();
        setBeds(beds.map(bed => bed.id === updatedBed.id ? updatedBed : bed));
        setOpenEditDialog(false);
        resetForm();
        setSnackbar({
          open: true,
          message: 'Bed updated successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to update bed');
      }
    } catch (error) {
      console.error('Error updating bed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update bed',
        severity: 'error'
      });
    }
  };

  const handleDeleteBed = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;
    
    try {
      const response = await fetch(`/api/beds/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBeds(beds.filter(bed => bed.id !== id));
        setSnackbar({
          open: true,
          message: 'Bed deleted successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to delete bed');
      }
    } catch (error) {
      console.error('Error deleting bed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete bed',
        severity: 'error'
      });
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!currentBed) return;
    
    try {
      const response = await fetch(`/api/beds/${currentBed.id}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceForm),
      });

      if (response.ok) {
        setOpenMaintenanceDialog(false);
        setSnackbar({
          open: true,
          message: 'Maintenance scheduled successfully',
          severity: 'success'
        });
        
        // Refresh beds data
        const bedsResponse = await fetch('/api/beds');
        if (bedsResponse.ok) {
          const data = await bedsResponse.json();
          setBeds(data);
        }
      } else {
        throw new Error('Failed to schedule maintenance');
      }
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      setSnackbar({
        open: true,
        message: 'Failed to schedule maintenance',
        severity: 'error'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFilterChange = (e: SelectChangeEvent | React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleMaintenanceChange = (e: SelectChangeEvent | React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaintenanceForm({
      ...maintenanceForm,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      bedNumber: '',
      roomId: '',
      bedType: 'STANDARD',
      features: [],
      notes: ''
    });
    setCurrentBed(null);
  };

  const editBed = (bed: Bed) => {
    setCurrentBed(bed);
    setFormData({
      bedNumber: bed.bedNumber,
      roomId: bed.roomId,
      bedType: bed.bedType,
      features: bed.features,
      notes: ''
    });
    setOpenEditDialog(true);
  };

  const scheduleMaintenance = (bed: Bed) => {
    setCurrentBed(bed);
    setMaintenanceForm({
      maintenanceType: 'ROUTINE',
      scheduledAt: new Date().toISOString().split('T')[0],
      description: ''
    });
    setOpenMaintenanceDialog(true);
  };

  const applyFilters = () => {
    setOpenFilterDialog(false);
    // Filters will be applied in the UI rendering
  };

  const resetFilters = () => {
    setFilters({
      bedType: '',
      status: '',
      floor: '',
      wing: '',
      roomType: ''
    });
  };

  const filteredBeds = beds.filter(bed => {
    if (filters.bedType && bed.bedType !== filters.bedType) return false;
    if (filters.status && bed.status !== filters.status) return false;
    if (filters.floor && bed.floor !== parseInt(filters.floor)) return false;
    if (filters.wing && bed.wing !== filters.wing) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'OCCUPIED':
        return 'error';
      case 'RESERVED':
        return 'warning';
      case 'UNDER_MAINTENANCE':
        return 'info';
      case 'CLEANING':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Bed Inventory & Categorization
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />} 
            onClick={() => setOpenFilterDialog(true)}
            sx={{ mr: 1 }}
          >
            Filter
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenAddDialog(true)}
          >
            Add New Bed
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {loading ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography>Loading beds...</Typography>
            </Paper>
          </Grid>
        ) : filteredBeds.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography>No beds found. Add a new bed to get started.</Typography>
            </Paper>
          </Grid>
        ) : (
          filteredBeds.map(bed => (
            <Grid item xs={12} sm={6} md={4} key={bed.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div">
                      Bed #{bed.bedNumber}
                    </Typography>
                    <Chip 
                      label={bed.status} 
                      color={getStatusColor(bed.status) as any}
                      size="small"
                    />
                  </Box>
                  <Typography color="text.secondary" gutterBottom>
                    Room: {bed.roomNumber} | Floor: {bed.floor} | Wing: {bed.wing}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Type: {bed.bedType.replace(/_/g, ' ')}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {bed.features.map((feature, index) => (
                      <Chip 
                        key={index} 
                        label={feature} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <IconButton size="small" onClick={() => editBed(bed)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteBed(bed.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Button 
                      size="small" 
                      startIcon={<ScheduleIcon />}
                      onClick={() => scheduleMaintenance(bed)}
                    >
                      Maintenance
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add Bed Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Bed</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="bedNumber"
                label="Bed Number"
                value={formData.bedNumber}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Room</InputLabel>
                <Select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleSelectChange}
                  label="Room"
                >
                  {rooms.map(room => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.roomNumber} (Floor {room.floor}, {room.wing})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Bed Type</InputLabel>
                <Select
                  name="bedType"
                  value={formData.bedType}
                  onChange={handleSelectChange}
                  label="Bed Type"
                >
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="ELECTRIC">Electric</MenuItem>
                  <MenuItem value="ICU">ICU</MenuItem>
                  <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
                  <MenuItem value="BARIATRIC">Bariatric</MenuItem>
                  <MenuItem value="LABOR_DELIVERY">Labor & Delivery</MenuItem>
                  <MenuItem value="STRETCHER">Stretcher</MenuItem>
                  <MenuItem value="PSYCHIATRIC">Psychiatric</MenuItem>
                  <MenuItem value="HOMECARE">Homecare</MenuItem>
                  <MenuItem value="SURGICAL">Surgical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddBed} variant="contained">Add Bed</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Bed Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Bed</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="bedNumber"
                label="Bed Number"
                value={formData.bedNumber}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Room</InputLabel>
                <Select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleSelectChange}
                  label="Room"
                >
                  {rooms.map(room => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.roomNumber} (Floor {room.floor}, {room.wing})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Bed Type</InputLabel>
                <Select
                  name="bedType"
                  value={formData.bedType}
                  onChange={handleSelectChange}
                  label="Bed Type"
                >
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="ELECTRIC">Electric</MenuItem>
                  <MenuItem value="ICU">ICU</MenuItem>
                  <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
                  <MenuItem value="BARIATRIC">Bariatric</MenuItem>
                  <MenuItem value="LABOR_DELIVERY">Labor & Delivery</MenuItem>
                  <MenuItem value="STRETCHER">Stretcher</MenuItem>
                  <MenuItem value="PSYCHIATRIC">Psychiatric</MenuItem>
                  <MenuItem value="HOMECARE">Homecare</MenuItem>
                  <MenuItem value="SURGICAL">Surgical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditBed} variant="contained">Update Bed</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={openMaintenanceDialog} onClose={() => setOpenMaintenanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">
                Bed #{currentBed?.bedNumber}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Maintenance Type</InputLabel>
                <Select
                  name="maintenanceType"
                  value={maintenanceForm.maintenanceType}
                  onChange={handleMaintenanceChange}
                  label="Maintenance Type"
                >
                  <MenuItem value="ROUTINE">Routine</MenuItem>
                  <MenuItem value="PREVENTIVE">Preventive</MenuItem>
                  <MenuItem value="CORRECTIVE">Corrective</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  <MenuItem value="INSPECTION">Inspection</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="scheduledAt"
                label="Scheduled Date"
                type="date"
                value={maintenanceForm.scheduledAt}
                onChange={handleMaintenanceChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={maintenanceForm.description}
                onChange={handleMaintenanceChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaintenanceDialog(false)}>Cancel</Button>
          <Button onClick={handleScheduleMaintenance} variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={openFilterDialog} onClose={() => setOpenFilterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Beds</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Bed Type</InputLabel>
                <Select
                  name="bedType"
                  value={filters.bedType}
                  onChange={handleFilterChange}
                  label="Bed Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="ELECTRIC">Electric</MenuItem>
                  <MenuItem value="ICU">ICU</MenuItem>
                  <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
                  <MenuItem value="BARIATRIC">Bariatric</MenuItem>
                  <MenuItem value="LABOR_DELIVERY">Labor & Delivery</MenuItem>
                  <MenuItem value="STRETCHER">Stretcher</MenuItem>
                  <MenuItem value="PSYCHIATRIC">Psychiatric</MenuItem>
                  <MenuItem value="HOMECARE">Homecare</MenuItem>
                  <MenuItem value="SURGICAL">Surgical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="OCCUPIED">Occupied</MenuItem>
                  <MenuItem value="RESERVED">Reserved</MenuItem>
                  <MenuItem value="UNDER_MAINTENANCE">Under Maintenance</MenuItem>
                  <MenuItem value="CLEANING">Cleaning</MenuItem>
                  <MenuItem value="OUT_OF_SERVICE">Out of Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="floor"
                label="Floor"
                value={filters.floor}
                onChange={handleFilterChange}
                fullWidth
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="wing"
                label="Wing"
                value={filters.wing}
                onChange={handleFilterChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFilters}>Reset</Button>
          <Button onClick={applyFilters} variant="contained">Apply Filters</Button>
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

export default BedInventory;
