import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Autocomplete,
  Chip,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert
} from '@mui/material';
import {
  DateTimePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addMinutes } from 'date-fns';

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  department: string;
};

type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type AppointmentType = {
  id: string;
  name: string;
  duration: number;
  color: string;
};

const CoConsultationRequest = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { patientId } = router.query;

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPrimaryDoctor, setSelectedPrimaryDoctor] = useState<string>('');
  const [selectedCoConsultingDoctors, setSelectedCoConsultingDoctors] = useState<Doctor[]>([]);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(addMinutes(new Date(), 30));
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('MEDIUM');
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('/api/doctors');
        const data = await response.json();
        if (data.success) {
          setDoctors(data.data.doctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };

    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patients');
        const data = await response.json();
        if (data.success) {
          setPatients(data.data.patients);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    const fetchAppointmentTypes = async () => {
      try {
        const response = await fetch('/api/appointments/types');
        const data = await response.json();
        if (data.success) {
          setAppointmentTypes(data.data.appointmentTypes);
        }
      } catch (error) {
        console.error('Error fetching appointment types:', error);
      }
    };

    setLoading(true);
    Promise.all([fetchDoctors(), fetchPatients(), fetchAppointmentTypes()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (patientId && patients.length > 0) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [patientId, patients]);

  useEffect(() => {
    if (selectedAppointmentType && appointmentTypes.length > 0) {
      const appointmentType = appointmentTypes.find(type => type.id === selectedAppointmentType);
      if (appointmentType && startTime) {
        setEndTime(addMinutes(startTime, appointmentType.duration));
      }
    }
  }, [selectedAppointmentType, startTime, appointmentTypes]);

  const handleStartTimeChange = (newValue: Date | null) => {
    setStartTime(newValue);
    if (newValue && selectedAppointmentType) {
      const appointmentType = appointmentTypes.find(type => type.id === selectedAppointmentType);
      if (appointmentType) {
        setEndTime(addMinutes(newValue, appointmentType.duration));
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedPatient) {
      newErrors.patient = 'Patient is required';
    }

    if (!selectedPrimaryDoctor) {
      newErrors.primaryDoctor = 'Primary doctor is required';
    }

    if (selectedCoConsultingDoctors.length === 0) {
      newErrors.coConsultingDoctors = 'At least one co-consulting doctor is required';
    }

    if (!selectedAppointmentType) {
      newErrors.appointmentType = 'Appointment type is required';
    }

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason for co-consultation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/appointments/co-consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient?.id,
          primaryDoctorId: selectedPrimaryDoctor,
          coConsultingDoctorIds: selectedCoConsultingDoctors.map(doctor => doctor.id),
          appointmentTypeId: selectedAppointmentType,
          title,
          description,
          startTime,
          endTime,
          location,
          notes,
          urgency,
          reason
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSnackbarMessage('Co-consultation appointment created successfully!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        
        // Reset form
        setSelectedPatient(null);
        setSelectedPrimaryDoctor('');
        setSelectedCoConsultingDoctors([]);
        setSelectedAppointmentType('');
        setTitle('');
        setDescription('');
        setStartTime(new Date());
        setEndTime(addMinutes(new Date(), 30));
        setLocation('');
        setNotes('');
        setReason('');
        setUrgency('MEDIUM');
        
        // Redirect to appointment details
        router.push(`/appointments/${data.data.appointment.id}`);
      } else {
        setSnackbarMessage(data.error || 'Failed to create co-consultation appointment');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error creating co-consultation appointment:', error);
      setSnackbarMessage('An error occurred while creating the co-consultation appointment');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Request Co-Consultation
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Create a new co-consultation appointment with multiple doctors
        </Typography>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Autocomplete
                    id="patient-select"
                    options={patients}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={selectedPatient}
                    onChange={(_, newValue) => setSelectedPatient(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Patient"
                        variant="outlined"
                        fullWidth
                        required
                        error={!!errors.patient}
                        helperText={errors.patient}
                      />
                    )}
                  />
                </Box>

                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <FormControl fullWidth error={!!errors.primaryDoctor} required>
                    <InputLabel id="primary-doctor-label">Primary Doctor</InputLabel>
                    <Select
                      labelId="primary-doctor-label"
                      id="primary-doctor"
                      value={selectedPrimaryDoctor}
                      label="Primary Doctor"
                      onChange={(e) => setSelectedPrimaryDoctor(e.target.value)}
                    >
                      {doctors.map((doctor) => (
                        <MenuItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.primaryDoctor && (
                      <FormHelperText>{errors.primaryDoctor}</FormHelperText>
                    )}
                  </FormControl>
                </Box>

                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <Autocomplete
                    multiple
                    id="co-consulting-doctors"
                    options={doctors.filter(doctor => doctor.id !== selectedPrimaryDoctor)}
                    getOptionLabel={(option) => `${option.name} - ${option.specialization}`}
                    value={selectedCoConsultingDoctors}
                    onChange={(_, newValue) => setSelectedCoConsultingDoctors(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Co-Consulting Doctors"
                        variant="outlined"
                        fullWidth
                        required
                        error={!!errors.coConsultingDoctors}
                        helperText={errors.coConsultingDoctors}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={`${option.name} - ${option.specialization}`}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                </Box>

                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <FormControl fullWidth error={!!errors.appointmentType} required>
                    <InputLabel id="appointment-type-label">Appointment Type</InputLabel>
                    <Select
                      labelId="appointment-type-label"
                      id="appointment-type"
                      value={selectedAppointmentType}
                      label="Appointment Type"
                      onChange={(e) => setSelectedAppointmentType(e.target.value)}
                    >
                      {appointmentTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name} ({type.duration} min)
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.appointmentType && (
                      <FormHelperText>{errors.appointmentType}</FormHelperText>
                    )}
                  </FormControl>
                </Box>

                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <TextField
                    id="title"
                    label="Appointment Title"
                    variant="outlined"
                    fullWidth
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={!!errors.title}
                    helperText={errors.title}
                  />
                </Box>

                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <TextField
                    id="description"
                    label="Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Box>

                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Start Time"
                      value={startTime}
                      onChange={handleStartTimeChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          required: true,
                          error: !!errors.startTime,
                          helperText: errors.startTime
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Box>

                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="End Time"
                      value={endTime}
                      onChange={(newValue) => setEndTime(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          required: true,
                          error: !!errors.endTime,
                          helperText: errors.endTime
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Box>

                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <TextField
                    id="location"
                    label="Location"
                    variant="outlined"
                    fullWidth
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </Box>

                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <TextField
                    id="reason"
                    label="Reason for Co-Consultation"
                    variant="outlined"
                    fullWidth
                    required
                    multiline
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    error={!!errors.reason}
                    helperText={errors.reason}
                  />
                </Box>

                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Urgency</FormLabel>
                    <RadioGroup
                      row
                      name="urgency"
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                    >
                      <FormControlLabel value="LOW" control={<Radio />} label="Low" />
                      <FormControlLabel value="MEDIUM" control={<Radio />} label="Medium" />
                      <FormControlLabel value="HIGH" control={<Radio />} label="High" />
                    </RadioGroup>
                  </FormControl>
                </Box>

                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <TextField
                    id="notes"
                    label="Additional Notes"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Box>

                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      type="button"
                      variant="outlined"
                      color="secondary"
                      sx={{ mr: 2 }}
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submitting}
                    >
                      {submitting ? <CircularProgress size={24} /> : 'Request Co-Consultation'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CoConsultationRequest;
