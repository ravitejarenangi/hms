"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Box, 
  Typography, 
  CircularProgress,
  Grid,
  Paper,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
} from '@mui/material';
import { 
  Thermostat as ThermostatIcon,
  Favorite as HeartIcon,
  Speed as SpeedIcon,
  Air as AirIcon,
  BloodtypeOutlined as BloodPressureIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface VitalReading {
  timestamp: string;
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  oxygenSaturation: number;
  pain: number;
}

interface Alert {
  type: string;
  value: number;
  threshold: number;
  timestamp: string;
}

interface CurrentVitals extends Omit<VitalReading, 'timestamp'> {
  lastUpdated: string;
}

interface Patient {
  id: number;
  name: string;
  room: string;
  bed: string;
  currentVitals: CurrentVitals;
  vitalsTrend: VitalReading[];
  alerts: Alert[];
}

interface VitalRange {
  min: number;
  max: number;
  unit: string;
}

interface VitalRanges {
  temperature: VitalRange;
  heartRate: VitalRange;
  systolicBP: VitalRange;
  diastolicBP: VitalRange;
  respiratoryRate: VitalRange;
  oxygenSaturation: VitalRange;
  pain: VitalRange;
}

interface VitalSignsData {
  patients: Patient[];
  vitalRanges: VitalRanges;
}

export default function VitalSignsMonitoring() {
  const [data, setData] = useState<VitalSignsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedPatientId) {
          params.append('patientId', selectedPatientId);
        }
        
        const response = await fetch(`/api/dashboard/nurse/vital-signs?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch vital signs data');
        }
        const result = await response.json();
        setData(result.data);
        
        // If no patient is selected and we have patients, select the first one
        if (!selectedPatientId && result.data.patients.length > 0) {
          setSelectedPatientId(result.data.patients[0].id.toString());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching vital signs data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPatientId]);

  const handlePatientChange = (event: SelectChangeEvent) => {
    setSelectedPatientId(event.target.value);
  };

  const refreshData = () => {
    setLoading(true);
    // The useEffect will trigger a new fetch
  };

  const isVitalInRange = (value: number, range: VitalRange) => {
    return value >= range.min && value <= range.max;
  };

  const getVitalStatus = (name: string, value: number) => {
    if (!data) return 'default';
    
    switch (name) {
      case 'temperature':
        return isVitalInRange(value, data.vitalRanges.temperature) ? 'success' : 'warning';
      case 'heartRate':
        return isVitalInRange(value, data.vitalRanges.heartRate) ? 'success' : 'warning';
      case 'respiratoryRate':
        return isVitalInRange(value, data.vitalRanges.respiratoryRate) ? 'success' : 'warning';
      case 'oxygenSaturation':
        return isVitalInRange(value, data.vitalRanges.oxygenSaturation) ? 'success' : 'warning';
      case 'pain':
        return value <= 3 ? 'success' : value <= 6 ? 'warning' : 'error';
      default:
        return 'default';
    }
  };

  const getBloodPressureStatus = (bp: string) => {
    if (!data) return 'default';
    
    const [systolic, diastolic] = bp.split('/').map(Number);
    const systolicStatus = isVitalInRange(systolic, data.vitalRanges.systolicBP);
    const diastolicStatus = isVitalInRange(diastolic, data.vitalRanges.diastolicBP);
    
    return systolicStatus && diastolicStatus ? 'success' : 'warning';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Vital Signs Monitoring" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Vital Signs Monitoring" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.patients.length === 0) {
    return (
      <Card>
        <CardHeader title="Vital Signs Monitoring" />
        <CardContent>
          <Typography>No patient data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const selectedPatient = data.patients.find(p => p.id.toString() === selectedPatientId) || data.patients[0];

  return (
    <Card>
      <CardHeader 
        title="Vital Signs Monitoring" 
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200, mr: 1 }} size="small">
              <InputLabel>Patient</InputLabel>
              <Select
                value={selectedPatientId}
                label="Patient"
                onChange={handlePatientChange}
              >
                {data.patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id.toString()}>
                    {patient.name} - Room {patient.room}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Refresh Data">
              <IconButton onClick={refreshData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {selectedPatient.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Room {selectedPatient.room}{selectedPatient.bed ? `, Bed ${selectedPatient.bed}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatDate(selectedPatient.currentVitals.lastUpdated)} {formatTime(selectedPatient.currentVitals.lastUpdated)}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <ThermostatIcon 
                color={getVitalStatus('temperature', selectedPatient.currentVitals.temperature)} 
                sx={{ fontSize: 32, mb: 1 }} 
              />
              <Typography variant="h5" gutterBottom>
                {selectedPatient.currentVitals.temperature}°C
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Temperature
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <HeartIcon 
                color={getVitalStatus('heartRate', selectedPatient.currentVitals.heartRate)} 
                sx={{ fontSize: 32, mb: 1 }} 
              />
              <Typography variant="h5" gutterBottom>
                {selectedPatient.currentVitals.heartRate} bpm
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Heart Rate
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <BloodPressureIcon 
                color={getBloodPressureStatus(selectedPatient.currentVitals.bloodPressure)} 
                sx={{ fontSize: 32, mb: 1 }} 
              />
              <Typography variant="h5" gutterBottom>
                {selectedPatient.currentVitals.bloodPressure}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Blood Pressure
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <AirIcon 
                color={getVitalStatus('respiratoryRate', selectedPatient.currentVitals.respiratoryRate)} 
                sx={{ fontSize: 32, mb: 1 }} 
              />
              <Typography variant="h5" gutterBottom>
                {selectedPatient.currentVitals.respiratoryRate}/min
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Respiratory Rate
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <SpeedIcon 
                color={getVitalStatus('oxygenSaturation', selectedPatient.currentVitals.oxygenSaturation)} 
                sx={{ fontSize: 32, mb: 1 }} 
              />
              <Typography variant="h5" gutterBottom>
                {selectedPatient.currentVitals.oxygenSaturation}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                O₂ Saturation
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Box sx={{ fontSize: 32, mb: 1, color: getVitalStatus('pain', selectedPatient.currentVitals.pain) === 'success' ? 'success.main' : getVitalStatus('pain', selectedPatient.currentVitals.pain) === 'warning' ? 'warning.main' : 'error.main' }}>
                😐
              </Box>
              <Typography variant="h5" gutterBottom>
                {selectedPatient.currentVitals.pain}/10
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pain Level
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {selectedPatient.alerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              Alerts
            </Typography>
            {selectedPatient.alerts.map((alert, index) => (
              <Chip
                key={index}
                label={`${alert.type}: ${alert.value} (Threshold: ${alert.threshold})`}
                color="warning"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">Vital Signs History</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<EditIcon />}
          >
            Record New Vitals
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell align="right">Temp (°C)</TableCell>
                <TableCell align="right">HR (bpm)</TableCell>
                <TableCell align="right">BP (mmHg)</TableCell>
                <TableCell align="right">RR (/min)</TableCell>
                <TableCell align="right">O₂ Sat (%)</TableCell>
                <TableCell align="right">Pain</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedPatient.vitalsTrend.map((reading, index) => (
                <TableRow key={index}>
                  <TableCell>{formatTime(reading.timestamp)}</TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: getVitalStatus('temperature', reading.temperature) === 'warning' ? 'warning.main' : 'inherit'
                    }}
                  >
                    {reading.temperature}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: getVitalStatus('heartRate', reading.heartRate) === 'warning' ? 'warning.main' : 'inherit'
                    }}
                  >
                    {reading.heartRate}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: getBloodPressureStatus(reading.bloodPressure) === 'warning' ? 'warning.main' : 'inherit'
                    }}
                  >
                    {reading.bloodPressure}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: getVitalStatus('respiratoryRate', reading.respiratoryRate) === 'warning' ? 'warning.main' : 'inherit'
                    }}
                  >
                    {reading.respiratoryRate}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: getVitalStatus('oxygenSaturation', reading.oxygenSaturation) === 'warning' ? 'warning.main' : 'inherit'
                    }}
                  >
                    {reading.oxygenSaturation}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: getVitalStatus('pain', reading.pain) === 'warning' ? 'warning.main' : 
                             getVitalStatus('pain', reading.pain) === 'error' ? 'error.main' : 'inherit'
                    }}
                  >
                    {reading.pain}/10
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
