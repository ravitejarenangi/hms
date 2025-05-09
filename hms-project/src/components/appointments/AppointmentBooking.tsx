import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';

type Doctor = {
  id: string;
  user: {
    name: string;
    email: string;
  };
  specialization: string;
  department: string | null;
  availableFrom: string | null;
  availableTo: string | null;
  availableDays: number[];
};

type Patient = {
  id: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
};

type AppointmentType = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  color: string;
};

type TimeSlot = {
  startTime: Date;
  endTime: Date;
  available: boolean;
};

const AppointmentBooking: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const { patientId, doctorId } = router.query;

  // State variables
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Array<{startTime: string; endTime: string}>>([]);

  // Load initial data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDoctors();
      fetchPatients();
      fetchAppointmentTypes();
      
      // Set default values from query parameters
      if (patientId) setSelectedPatient(patientId as string);
      if (doctorId) {
        setSelectedDoctor(doctorId as string);
        // If doctor is selected from query params, fetch available time slots
        if (selectedDate) {
          fetchTimeSlots(doctorId as string, selectedDate);
        }
      }
    }
  }, [status, patientId, doctorId]);

  // When doctor or date changes, fetch available time slots
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchTimeSlots(selectedDoctor, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  // When appointment type changes, update title
  useEffect(() => {
    if (selectedAppointmentType) {
      const appointmentType = appointmentTypes.find(type => type.id === selectedAppointmentType);
      if (appointmentType) {
        setAppointmentTitle(`${appointmentType.name} Appointment`);
      }
    }
  }, [selectedAppointmentType, doctors]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/doctors');
      const data = await response.json();
      
      if (data.success) {
        setDoctors(data.data.doctors);
      } else {
        setError('Failed to fetch doctors');
      }
    } catch (err) {
      setError('An error occurred while fetching doctors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data.patients);
      } else {
        setError('Failed to fetch patients');
      }
    } catch (err) {
      setError('An error occurred while fetching patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointment-types');
      const data = await response.json();
      
      if (data.success) {
        setAppointmentTypes(data.data.appointmentTypes);
      } else {
        setError('Failed to fetch appointment types');
      }
    } catch (err) {
      setError('An error occurred while fetching appointment types');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async (doctorId: string, date: Date) => {
    try {
      setLoading(true);
      
      // Get the doctor's availability
      const doctor = doctors.find(d => d.id === doctorId);
      if (!doctor) {
        setError('Doctor not found');
        return;
      }

      // Check if the selected date is a day the doctor works
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      if (!doctor.availableDays.includes(dayOfWeek)) {
        setTimeSlots([]);
        setError('Doctor is not available on this day');
        return;
      }

      // Get existing appointments for the selected doctor and date
      const startDateStr = format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss");
      const endDateStr = format(endOfDay(date), "yyyy-MM-dd'T'HH:mm:ss");
      
      const response = await fetch(`/api/appointments?doctorId=${doctorId}&startDate=${startDateStr}&endDate=${endDateStr}`);
      const data = await response.json();
      
      if (data.success) {
        setExistingAppointments(data.data.appointments);
        
        // Generate time slots based on doctor's availability
        const availableFrom = doctor.availableFrom || '09:00';
        const availableTo = doctor.availableTo || '17:00';
        
        const [fromHours, fromMinutes] = availableFrom.split(':').map(Number);
        const [toHours, toMinutes] = availableTo.split(':').map(Number);
        
        const startTime = new Date(date);
        startTime.setHours(fromHours, fromMinutes, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(toHours, toMinutes, 0, 0);
        
        // Generate 30-minute slots
        const slots: TimeSlot[] = [];
        let currentSlot = new Date(startTime);
        
        while (currentSlot < endTime) {
          const slotEndTime = addMinutes(currentSlot, 30);
          
          // Check if the slot conflicts with any existing appointment
          const isAvailable = !data.data.appointments.some((appointment: any) => {
            const appointmentStart = new Date(appointment.startTime);
            const appointmentEnd = new Date(appointment.endTime);
            
            return (
              (currentSlot >= appointmentStart && currentSlot < appointmentEnd) ||
              (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
              (currentSlot <= appointmentStart && slotEndTime >= appointmentEnd)
            );
          });
          
          slots.push({
            startTime: new Date(currentSlot),
            endTime: new Date(slotEndTime),
            available: isAvailable
          });
          
          currentSlot = new Date(slotEndTime);
        }
        
        setTimeSlots(slots);
      } else {
        setError('Failed to fetch existing appointments');
      }
    } catch (err) {
      setError('An error occurred while fetching time slots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedDoctor || !selectedPatient || !selectedDate || !selectedTime || !selectedAppointmentType || !appointmentTitle) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Find the selected appointment type to get the duration
      const appointmentType = appointmentTypes.find(type => type.id === selectedAppointmentType);
      if (!appointmentType) {
        setError('Invalid appointment type');
        return;
      }
      
      // Calculate end time based on appointment type duration
      const startTime = new Date(selectedTime);
      const endTime = addMinutes(startTime, appointmentType.duration);
      
      // Create the appointment
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          doctorId: selectedDoctor,
          appointmentTypeId: selectedAppointmentType,
          title: appointmentTitle,
          description: appointmentNotes,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: appointmentType.duration,
          notes: appointmentNotes,
          createReminders: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Appointment booked successfully');
        
        // Reset form
        setSelectedDate(null);
        setSelectedTime(null);
        setAppointmentTitle('');
        setAppointmentNotes('');
        
        // Redirect to the appointment details page
        setTimeout(() => {
          router.push(`/appointments/${data.data.appointment.id}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      setError('An error occurred while booking the appointment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="md">
        <Box my={4} textAlign="center">
          <Typography variant="h5" component="h1" gutterBottom>
            Please sign in to book an appointment
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/login')}
          >
            Sign In
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Book an Appointment
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
              {/* Patient Selection */}
              <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                <FormControl fullWidth required>
                  <InputLabel id="patient-label">Patient</InputLabel>
                  <Select
                    labelId="patient-label"
                    id="patient"
                    value={selectedPatient}
                    label="Patient"
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    disabled={!!patientId}
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.user.name} ({patient.user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Doctor Selection */}
              <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                <FormControl fullWidth required>
                  <InputLabel id="doctor-label">Doctor</InputLabel>
                  <Select
                    labelId="doctor-label"
                    id="doctor"
                    value={selectedDoctor}
                    label="Doctor"
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    disabled={!!doctorId}
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.user.name} ({doctor.specialization})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Appointment Type */}
              <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                <FormControl fullWidth required>
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
                        {type.name} ({type.duration} mins)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Date Selection */}
              <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Appointment Date"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    disablePast
                    shouldDisableDate={(date) => {
                      if (!selectedDoctor) return false;
                      
                      const doctor = doctors.find(d => d.id === selectedDoctor);
                      if (!doctor) return false;
                      
                      // Disable weekends if the doctor doesn't work on weekends
                      const dayOfWeek = date.getDay();
                      return !doctor.availableDays.includes(dayOfWeek);
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Box>

              {/* Time Slots */}
              <Box gridColumn="span 12">
                <Typography variant="subtitle1" gutterBottom>
                  Available Time Slots
                </Typography>
                {selectedDoctor && selectedDate ? (
                  timeSlots.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {timeSlots.map((slot, index) => (
                        <Chip
                          key={index}
                          label={format(slot.startTime, 'h:mm a')}
                          color={slot.available ? 'primary' : 'default'}
                          variant={selectedTime && format(selectedTime, 'h:mm a') === format(slot.startTime, 'h:mm a') ? 'filled' : 'outlined'}
                          onClick={() => {
                            if (slot.available) {
                              setSelectedTime(slot.startTime);
                            }
                          }}
                          disabled={!slot.available}
                          sx={{ cursor: slot.available ? 'pointer' : 'not-allowed' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography color="error">
                      No available time slots for the selected date.
                    </Typography>
                  )
                ) : (
                  <Typography color="textSecondary">
                    Please select a doctor and date to view available time slots.
                  </Typography>
                )}
              </Box>

              {/* Appointment Title */}
              <Box gridColumn="span 12">
                <TextField
                  fullWidth
                  label="Appointment Title"
                  value={appointmentTitle}
                  onChange={(e) => setAppointmentTitle(e.target.value)}
                  required
                />
              </Box>

              {/* Appointment Notes */}
              <Box gridColumn="span 12">
                <TextField
                  fullWidth
                  label="Notes"
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  multiline
                  rows={4}
                />
              </Box>

              {/* Submit Button */}
              <Box gridColumn="span 12">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={submitting || !selectedDoctor || !selectedPatient || !selectedDate || !selectedTime || !selectedAppointmentType}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Book Appointment'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>

      {/* Error and Success Messages */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AppointmentBooking;
