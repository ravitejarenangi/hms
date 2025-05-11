import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import { GridItem, GridContainer } from './GridItem';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  FilterListOff as FilterListOffIcon
} from '@mui/icons-material';
import { RadiologyService, Modality } from '@/types/radiology';

interface RadiologyServiceCatalogProps {
  services: RadiologyService[];
  modalities: Modality[];
  onAdd: (service: RadiologyService) => Promise<void>;
  onEdit: (service: RadiologyService) => Promise<void>;
  onDelete: (serviceId: string) => Promise<void>;
}

export const RadiologyServiceCatalog: React.FC<RadiologyServiceCatalogProps> = ({
  services,
  modalities,
  onAdd,
  onEdit,
  onDelete
}) => {
  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [bodyPartFilter, setBodyPartFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // State for the service dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [currentService, setCurrentService] = useState<RadiologyService | null>(null);
  const [formData, setFormData] = useState<Partial<RadiologyService>>({
    active: true,
    requiresContrast: false,
    dicomSupported: true
  });
  
  // State for notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Get unique body parts from services
  const bodyParts = Array.from(new Set(services.map(service => service.bodyPart)));
  
  // Filter services based on search and filters
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModality = modalityFilter === 'all' || service.modalityType === modalityFilter;
    const matchesBodyPart = bodyPartFilter === 'all' || service.bodyPart === bodyPartFilter;
    
    let matchesActive = true;
    if (activeFilter === 'active') matchesActive = service.active;
    if (activeFilter === 'inactive') matchesActive = !service.active;
    
    return matchesSearch && matchesModality && matchesBodyPart && matchesActive;
  });
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle filter changes
  const handleModalityFilterChange = (e: SelectChangeEvent) => {
    setModalityFilter(e.target.value);
  };
  
  const handleBodyPartFilterChange = (e: SelectChangeEvent) => {
    setBodyPartFilter(e.target.value);
  };
  
  const handleActiveFilterChange = (e: SelectChangeEvent) => {
    setActiveFilter(e.target.value);
  };
  
  // Handle dialog open for adding a new service
  const handleAddClick = () => {
    setMode('add');
    setFormData({
      code: '',
      name: '',
      description: '',
      modalityType: '',
      bodyPart: '',
      price: 0,
      estimatedDuration: 30,
      preparationNotes: '',
      active: true,
      requiresContrast: false,
      dicomSupported: true
    });
    setDialogOpen(true);
  };
  
  // Handle dialog open for editing a service
  const handleEditClick = (service: RadiologyService) => {
    setMode('edit');
    setCurrentService(service);
    setFormData({ ...service });
    setDialogOpen(true);
  };
  
  // Handle dialog close
  const handleClose = () => {
    setDialogOpen(false);
    setCurrentService(null);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<RadiologyService>) => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<RadiologyService>) => ({ ...prev, [name]: value }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: Partial<RadiologyService>) => ({ ...prev, [name]: checked }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'add') {
        await onAdd(formData as RadiologyService);
        setSuccessMessage('Service added successfully');
      } else {
        await onEdit({ ...currentService, ...formData } as RadiologyService);
        setSuccessMessage('Service updated successfully');
      }
      
      setDialogOpen(false);
      setCurrentService(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setErrorMessage('Error saving service: ' + (error instanceof Error ? error.message : String(error)));
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };
  
  // Handle service deletion
  const handleDeleteClick = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await onDelete(serviceId);
        setSuccessMessage('Service deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        setErrorMessage('Error deleting service: ' + (error instanceof Error ? error.message : String(error)));
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      }
    }
  };
  
  return (
    <Box>
      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <GridContainer spacing={2} alignItems="center">
          <GridItem xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Services"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </GridItem>
          <GridItem xs={12} sm={6} md={4}>
            <Box display="flex" alignItems="center">
              <Button
                startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ mr: 2 }}
                color="primary"
                variant="outlined"
                size="small"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                color="primary"
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
              >
                Add Service
              </Button>
            </Box>
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
              >
                Add Service
              </Button>
            </Box>
          </GridItem>
          {showFilters && (
            <>
              <GridItem xs={12} sm={4} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="modality-filter-label">Modality</InputLabel>
                  <Select
                    labelId="modality-filter-label"
                    id="modality-filter"
                    value={modalityFilter}
                    label="Modality"
                    onChange={handleModalityFilterChange}
                  >
                    <MenuItem value="all">All Modalities</MenuItem>
                    {modalities.map(modality => (
                      <MenuItem key={modality.id} value={modality.type}>
                        {modality.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem xs={12} sm={4} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="body-part-filter-label">Body Part</InputLabel>
                  <Select
                    labelId="body-part-filter-label"
                    id="body-part-filter"
                    value={bodyPartFilter}
                    label="Body Part"
                    onChange={handleBodyPartFilterChange}
                  >
                    <MenuItem value="all">All Body Parts</MenuItem>
                    {bodyParts.map(part => (
                      <MenuItem key={part} value={part}>
                        {part}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem xs={12} sm={4} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="active-filter-label">Status</InputLabel>
                  <Select
                    labelId="active-filter-label"
                    id="active-filter"
                    value={activeFilter}
                    label="Status"
                    onChange={handleActiveFilterChange}
                  >
                    <MenuItem value="all">All Services</MenuItem>
                    <MenuItem value="active">Active Only</MenuItem>
                    <MenuItem value="inactive">Inactive Only</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
            </>
          )}
        </GridContainer>
      </Paper>

      {/* Error and Success Messages */}
      {errorMessage && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
          <Typography color="error">{errorMessage}</Typography>
        </Paper>
      )}
      {successMessage && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.light' }}>
          <Typography color="success.dark">{successMessage}</Typography>
        </Paper>
      )}

      {/* Services List */}
      <GridContainer spacing={2}>
        {filteredServices.length === 0 ? (
          <GridItem xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No services found matching your criteria.</Typography>
            </Paper>
          </GridItem>
        ) : (
          filteredServices.map(service => (
            <GridItem xs={12} sm={6} md={4} key={service.id}>
              <Paper sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                opacity: service.active ? 1 : 0.7,
                position: 'relative'
              }}>
                {!service.active && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10, 
                      bgcolor: 'warning.main', 
                      color: 'warning.contrastText',
                      px: 1,
                      borderRadius: 1,
                      fontSize: '0.75rem'
                    }}
                  >
                    Inactive
                  </Box>
                )}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
                    {service.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Code: {service.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Modality: {service.modalityType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Body Part: {service.bodyPart}
                  </Typography>
                  {service.description && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {service.description}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Price: ${service.price}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Duration: {service.estimatedDuration} min
                  </Typography>
                  {service.requiresContrast && (
                    <Typography variant="body2" color="warning.main" sx={{ mb: 0.5 }}>
                      Requires Contrast
                    </Typography>
                  )}
                </Box>
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => handleEditClick(service)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteClick(service.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            </GridItem>
          ))
        )}
      </GridContainer>

      {/* Add/Edit Service Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{mode === 'add' ? 'Add New Service' : 'Edit Service'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <GridContainer spacing={2}>
              <GridItem xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Service Code"
                  name="code"
                  value={formData.code || ''}
                  onChange={handleInputChange}
                  required
                  disabled={mode === 'edit'}
                  helperText={mode === 'edit' ? 'Code cannot be changed' : ''}
                />
              </GridItem>
              <GridItem xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Service Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                />
              </GridItem>
              <GridItem xs={12} sm={12} md={8}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </GridItem>
              <GridItem xs={12} sm={6} md={4}>
                <FormControl fullWidth required>
                  <InputLabel id="modality-label">Modality Type</InputLabel>
                  <Select
                    labelId="modality-label"
                    id="modalityType"
                    name="modalityType"
                    value={formData.modalityType || ''}
                    label="Modality Type"
                    onChange={handleSelectChange}
                  >
                    {modalities.map(modality => (
                      <MenuItem key={modality.id} value={modality.type}>
                        {modality.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Body Part"
                  name="bodyPart"
                  value={formData.bodyPart || ''}
                  onChange={handleInputChange}
                  required
                />
              </GridItem>
              <GridItem xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </GridItem>
              <GridItem xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Estimated Duration"
                  name="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration || ''}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">min</InputAdornment>,
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Preparation Notes"
                  name="preparationNotes"
                  value={formData.preparationNotes || ''}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </GridItem>
              <GridItem xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.active || false}
                      onChange={handleSwitchChange}
                      name="active"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </GridItem>
              <GridItem xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.requiresContrast || false}
                      onChange={handleSwitchChange}
                      name="requiresContrast"
                      color="primary"
                    />
                  }
                  label="Requires Contrast"
                />
              </GridItem>
              <GridItem xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.dicomSupported || false}
                      onChange={handleSwitchChange}
                      name="dicomSupported"
                      color="primary"
                    />
                  }
                  label="DICOM Supported"
                />
              </GridItem>
            </GridContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {mode === 'add' ? 'Add Service' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RadiologyServiceCatalog;
