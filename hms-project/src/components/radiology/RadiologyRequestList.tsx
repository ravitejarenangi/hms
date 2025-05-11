import React, { useState } from 'react';
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
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  FilterListOff as FilterListOffIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { RadiologyRequest, RadiologyStatus } from '@/types/radiology';

interface RadiologyRequestListProps {
  requests: RadiologyRequest[];
  onAdd: () => void;
  onView: (request: RadiologyRequest) => void;
  onEdit: (request: RadiologyRequest) => void;
  onDelete: (request: RadiologyRequest) => Promise<void>;
}

export const RadiologyRequestList: React.FC<RadiologyRequestListProps> = ({
  requests,
  onAdd,
  onView,
  onEdit,
  onDelete
}) => {
  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // State for notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle filter changes
  const handleStatusFilterChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
  };
  
  // Filter requests based on search and filters
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.referringPhysician?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle request deletion
  const handleDeleteClick = async (request: RadiologyRequest) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await onDelete(request);
        setSuccessMessage('Request deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        setErrorMessage('Error deleting request: ' + (error instanceof Error ? error.message : String(error)));
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      }
    }
  };
  
  // Get status chip color based on status
  const getStatusChipColor = (status: RadiologyStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      case 'PENDING':
      default:
        return 'default';
    }
  };
  
  return (
    <Box>
      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Requests"
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
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" alignItems="center">
              <Button
                startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
                sx={{ mr: 1 }}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              {filteredRequests.length > 0 && (
                <Typography variant="body2" color="textSecondary">
                  {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} found
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={onAdd}
              >
                New Request
              </Button>
            </Box>
          </Grid>
          
          {showFilters && (
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
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

      {/* Requests List */}
      <Grid container spacing={2}>
        {filteredRequests.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No requests found matching your criteria.</Typography>
            </Paper>
          </Grid>
        ) : (
          filteredRequests.map(request => (
            <Grid item xs={12} sm={6} md={4} key={request.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
                      {request.serviceName}
                    </Typography>
                    <Chip 
                      label={request.status} 
                      size="small" 
                      color={getStatusChipColor(request.status as RadiologyStatus)}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Patient: {request.patientName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Patient ID: {request.patientId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Referring Physician: {request.referringPhysician}
                  </Typography>
                  {request.scheduledDate && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Scheduled: {new Date(request.scheduledDate).toLocaleString()}
                    </Typography>
                  )}
                  {request.urgency && (
                    <Typography 
                      variant="body2" 
                      color={request.urgency === 'URGENT' ? 'error.main' : 'text.secondary'} 
                      sx={{ mb: 0.5, fontWeight: request.urgency === 'URGENT' ? 'bold' : 'normal' }}
                    >
                      Urgency: {request.urgency}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                  <IconButton size="small" color="primary" onClick={() => onView(request)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => onEdit(request)}
                    disabled={request.status === 'COMPLETED' || request.status === 'CANCELLED'}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteClick(request)}
                    disabled={request.status === 'COMPLETED' || request.status === 'IN_PROGRESS'}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default RadiologyRequestList;
