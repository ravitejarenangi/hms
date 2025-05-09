import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  Typography,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Chip,
  Card,
  CardContent,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addMinutes, isWeekend, isAfter, isBefore, parseISO } from 'date-fns';

type AppointmentDetails = {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentTypeId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  location: string | null;
  notes: string | null;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string;
    department: string | null;
    availableFrom: string | null;
    availableTo: string | null;
    availableDays: number[];
  };
  appointmentType: {
    id: string;
    name: string;
    duration: number;
    color: string;
  };
};

type TimeSlot = {
  startTime: Date;
  endTime: Date;
  available: boolean;
};

const AppointmentReschedule: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  // State variables
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);

  // Load appointment details
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchAppointmentDetails(id as string);
    }
  }, [status, id]);

  // When date changes, fetch available time slots
  useEffect(() => {
    if (appointment && selectedDate) {
      fetchTimeSlots(appointment.doctorId, selectedDate);
    }
  }, [appointment, selectedDate]);

  const fetchAppointmentDetails = async (appointmentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`);
      const data = await response.json();
      
      if (data.success) {
        setAppointment(data.data.appointment);
        
        // Set initial selected date to the current appointment date
        const currentAppointmentDate = new Date(data.data.appointment.startTime);
        setSelectedDate(currentAppointmentDate);
      } else {
        setError('Failed to fetch appointment details');
      }
    } catch (err) {
      setError('An error occurred while fetching appointment details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async (doctorId: string, date: Date) => {
    try {
      setLoading(true);
      
      // Check if the selected date is a day the doctor works
      if (appointment) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        if (!appointment.doctor.availableDays.includes(dayOfWeek)) {
          setTimeSlots([]);
          setError('Doctor is not available on this day');
          return;
        }
      }

      // Get existing appointments for the selected doctor and date
      const startDateStr = format(new Date(date.setHours(0, 0, 0, 0)), "yyyy-MM-dd'T'HH:mm:ss");
      const endDateStr = format(new Date(date.setHours(23, 59, 59, 999)), "yyyy-MM-dd'T'HH:mm:ss");
      
      const response = await fetch(`/api/appointments?doctorId=${doctorId}&startDate=${startDateStr}&endDate=${endDateStr}`);
      const data = await response.json();
      
      if (data.success) {
        // Filter out the current appointment from the list of existing appointments
        const filteredAppointments = data.data.appointments.filter(
          (apt: any) => apt.id !== id
        );
        
        setExistingAppointments(filteredAppointments);
        
        // Generate time slots based on doctor's availability
        if (appointment) {
          const availableFrom = appointment.doctor.availableFrom || '09:00';
          const availableTo = appointment.doctor.availableTo || '17:00';
          
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
            const isAvailable = !filteredAppointments.some((apt: any) => {
              const appointmentStart = new Date(apt.startTime);
              const appointmentEnd = new Date(apt.endTime);
              
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
        }
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
    if (!selectedDate || !selectedTime) {
      setError('Please select a new date and time for the appointment');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Calculate end time based on appointment duration
      const startTime = new Date(selectedTime);
      const endTime = addMinutes(startTime, appointment?.duration || 30);
      
      // Reschedule the appointment
      const response = await fetch('/api/appointments/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: appointment?.duration || 30,
          notes: rescheduleReason,
          createReminders: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Appointment rescheduled successfully');
        
        // Redirect back to the appointment details page
        setTimeout(() => {
          router.push(`/appointments/${id}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to reschedule appointment');
      }
    } catch (err) {
      setError('An error occurred while rescheduling the appointment');
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
            Please sign in to reschedule appointments
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

  if (!appointment) {
    return (
      <Container maxWidth="md">
        <Box my={4} textAlign="center">
          <Typography variant="h5" component="h1" gutterBottom>
            Appointment not found
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/appointments')}
          >
            Back to Appointments
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reschedule Appointment
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Current Appointment Details
          </Typography>
          
          <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
              <Typography variant="body1">{appointment.patient.name}</Typography>
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <Typography variant="subtitle2" color="text.secondary">Doctor</Typography>
              <Typography variant="body1">Dr. {appointment.doctor.name}</Typography>
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
              <Typography variant="body1">
                {format(parseISO(appointment.startTime), 'MMMM d, yyyy')} at {format(parseISO(appointment.startTime), 'h:mm a')}
              </Typography>
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <Typography variant="subtitle2" color="text.secondary">Appointment Type</Typography>
              <Typography variant="body1">{appointment.appointmentType.name}</Typography>
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip 
                label={appointment.status} 
                color={
                  appointment.status === 'SCHEDULED' ? 'primary' :
                  appointment.status === 'CONFIRMED' ? 'success' :
                  appointment.status === 'CHECKED_IN' ? 'warning' :
                  'error'
                }
                size="small"
              />
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Reschedule to New Date & Time
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
              {/* Date Selection */}
              <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="New Appointment Date"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    disablePast
                    shouldDisableDate={(date) => {
                      // Disable weekends if the doctor doesn't work on weekends
                      const dayOfWeek = date.getDay();
                      return !appointment.doctor.availableDays.includes(dayOfWeek);
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

              {/* Reschedule Reason */}
              <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Reason for Rescheduling"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Please provide a reason for rescheduling"
                />
              </Box>

              {/* Time Slots */}
              <Box component="div" sx={{ gridColumn: 'span 12' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Time Slots
                </Typography>
                {selectedDate ? (
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
                    Please select a date to view available time slots.
                  </Typography>
                )}
              </Box>

              {/* Submit Button */}
              <Box component="div" sx={{ gridColumn: 'span 12' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={submitting || !selectedDate || !selectedTime}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Reschedule Appointment'}
                </Button>
              </Box>
              
              <Box component="div" sx={{ gridColumn: 'span 12' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={() => router.back()}
                >
                  Cancel
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

export default AppointmentReschedule;
