"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Box, 
  Typography, 
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  SelectChangeEvent,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { 
  Search as SearchIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  Assignment as TaskIcon,
  Favorite as HeartIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

interface Task {
  id: number;
  description: string;
  dueTime: string;
  completed: boolean;
}

interface Vitals {
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  oxygenSaturation: number;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  ward: string;
  room: string;
  bed: string;
  admissionDate: string;
  diagnosis: string;
  status: string;
  priority: string;
  vitals: Vitals;
  alerts: string[];
  tasks: Task[];
}

interface PatientListData {
  total: number;
  filtered?: number;
  byWard: {
    ward: string;
    count: number;
  }[];
  patients: Patient[];
}

export default function PatientList() {
  const [data, setData] = useState<PatientListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyWithTasks, setShowOnlyWithTasks] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build query parameters for filtering
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (wardFilter) params.append('ward', wardFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        
        const response = await fetch(`/api/dashboard/nurse/patient-list?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch patient list data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching patient list data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, wardFilter, statusFilter, priorityFilter]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleWardFilterChange = (event: SelectChangeEvent) => {
    setWardFilter(event.target.value);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handlePriorityFilterChange = (event: SelectChangeEvent) => {
    setPriorityFilter(event.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleShowOnlyWithTasksChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyWithTasks(event.target.checked);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'unstable':
        return 'error';
      case 'stable':
        return 'success';
      case 'improving':
        return 'success';
      case 'post-op':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getVitalSignsStatus = (vitals: Vitals) => {
    // Simple check for abnormal vital signs
    if (vitals.temperature > 38.0 || vitals.temperature < 36.0) return 'warning';
    if (vitals.heartRate > 100 || vitals.heartRate < 60) return 'warning';
    if (vitals.respiratoryRate > 20 || vitals.respiratoryRate < 12) return 'warning';
    if (vitals.oxygenSaturation < 92) return 'warning';
    
    // Parse blood pressure
    const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
    if (systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60) return 'warning';
    
    return 'success';
  };

  const getPendingTasksCount = (tasks: Task[]) => {
    return tasks.filter(task => !task.completed).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Patient List" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Patient List" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="Patient List" />
        <CardContent>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Filter patients with pending tasks if the switch is on
  const displayedPatients = showOnlyWithTasks 
    ? data.patients.filter(patient => getPendingTasksCount(patient.tasks) > 0)
    : data.patients;

  return (
    <Card>
      <CardHeader 
        title="Patient List" 
        subheader={`${data.filtered || data.total} patients`}
        action={
          <Tooltip title="Toggle Filters">
            <IconButton onClick={toggleFilters}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name or diagnosis..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {showFilters && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ward</InputLabel>
                  <Select
                    value={wardFilter}
                    label="Ward"
                    onChange={handleWardFilterChange}
                  >
                    <MenuItem value="">All Wards</MenuItem>
                    {data.byWard.map((ward) => (
                      <MenuItem key={ward.ward} value={ward.ward}>
                        {ward.ward} ({ward.count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                    <MenuItem value="Unstable">Unstable</MenuItem>
                    <MenuItem value="Stable">Stable</MenuItem>
                    <MenuItem value="Improving">Improving</MenuItem>
                    <MenuItem value="Post-Op">Post-Op</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={priorityFilter}
                    label="Priority"
                    onChange={handlePriorityFilterChange}
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          <FormControlLabel
            control={
              <Switch 
                checked={showOnlyWithTasks} 
                onChange={handleShowOnlyWithTasksChange} 
                color="primary"
              />
            }
            label="Show only patients with pending tasks"
          />
        </Box>

        <Grid container spacing={2}>
          {displayedPatients.map((patient) => (
            <Grid item xs={12} sm={6} md={4} key={patient.id}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderLeft: 4,
                  borderColor: getPriorityColor(patient.priority) + '.main'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {patient.name}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={patient.status} 
                    color={getStatusColor(patient.status)}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <PersonIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {patient.age} yrs, {patient.gender}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <HospitalIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {patient.ward} • Room {patient.room}{patient.bed ? `, Bed ${patient.bed}` : ''}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {patient.diagnosis}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Tooltip title="Vital Signs">
                    <IconButton size="small" color={getVitalSignsStatus(patient.vitals)}>
                      <HeartIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={`${patient.alerts.length} Alert(s)`}>
                    <IconButton 
                      size="small" 
                      color={patient.alerts.length > 0 ? 'warning' : 'default'}
                      disabled={patient.alerts.length === 0}
                    >
                      <Badge badgeContent={patient.alerts.length} color="warning">
                        <WarningIcon fontSize="small" />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={`${getPendingTasksCount(patient.tasks)} Pending Task(s)`}>
                    <IconButton 
                      size="small" 
                      color={getPendingTasksCount(patient.tasks) > 0 ? 'primary' : 'default'}
                      disabled={getPendingTasksCount(patient.tasks) === 0}
                    >
                      <Badge badgeContent={getPendingTasksCount(patient.tasks)} color="primary">
                        <TaskIcon fontSize="small" />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={`Admitted: ${patient.admissionDate}`}>
                    <IconButton size="small">
                      <TimeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        
        {displayedPatients.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No patients match the current filters
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
