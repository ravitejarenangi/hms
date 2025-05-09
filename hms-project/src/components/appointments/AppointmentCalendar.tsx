import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Snackbar,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO } from 'date-fns';

type Doctor = {
  id: string;
  user: {
    name: string;
    email: string;
  };
  specialization: string;
  department: string | null;
};

type Department = {
  id: string;
  name: string;
};

type AppointmentEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  extendedProps: {
    status: string;
    patientName: string;
    patientId: string;
    doctorName: string;
    doctorId: string;
    appointmentType: string;
    location?: string;
    description?: string;
    notes?: string;
  };
};

type AppointmentDetailsProps = {
  appointment: AppointmentEvent | null;
  onClose: () => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
  onCheckIn: (id: string) => void;
  onComplete: (id: string) => void;
};

const statusColors: Record<string, string> = {
  SCHEDULED: '#1976d2', // Blue
  CONFIRMED: '#2e7d32', // Green
  CHECKED_IN: '#ed6c02', // Orange
  IN_PROGRESS: '#9c27b0', // Purple
  COMPLETED: '#1b5e20', // Dark Green
  CANCELLED: '#d32f2f', // Red
  RESCHEDULED: '#0288d1', // Light Blue
  NO_SHOW: '#616161' // Grey
};

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointment,
  onClose,
  onReschedule,
  onCancel,
  onCheckIn,
  onComplete
}) => {
  if (!appointment) return null;

  const { extendedProps } = appointment;
  const startTime = parseISO(appointment.start);
  const endTime = parseISO(appointment.end);

  return (
    <Dialog open={!!appointment} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Appointment Details
        <Chip 
          label={extendedProps.status} 
          color={
            extendedProps.status === 'SCHEDULED' ? 'primary' :
            extendedProps.status === 'CONFIRMED' ? 'success' :
            extendedProps.status === 'CHECKED_IN' || extendedProps.status === 'IN_PROGRESS' ? 'warning' :
            extendedProps.status === 'COMPLETED' ? 'success' :
            'error'
          }
          size="small"
          sx={{ ml: 2 }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
          <Box component="div" sx={{ gridColumn: 'span 12' }}>
            <Typography variant="h6">{appointment.title}</Typography>
          </Box>
          
          <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
            <Typography variant="body1">
              {format(startTime, 'MMMM d, yyyy')}
              <br />
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </Typography>
          </Box>
          
          <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <Typography variant="subtitle2" color="text.secondary">Appointment Type</Typography>
            <Typography variant="body1">{extendedProps.appointmentType}</Typography>
          </Box>
          
          <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
            <Typography variant="body1">{extendedProps.patientName}</Typography>
          </Box>
          
          <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <Typography variant="subtitle2" color="text.secondary">Doctor</Typography>
            <Typography variant="body1">{extendedProps.doctorName}</Typography>
          </Box>
          
          {extendedProps.location && (
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <Typography variant="subtitle2" color="text.secondary">Location</Typography>
              <Typography variant="body1">{extendedProps.location}</Typography>
            </Box>
          )}
          
          {extendedProps.description && (
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography variant="body1">{extendedProps.description}</Typography>
            </Box>
          )}
          
          {extendedProps.notes && (
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
              <Typography variant="body1">{extendedProps.notes}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {['SCHEDULED', 'CONFIRMED'].includes(extendedProps.status) && (
          <>
            <Button onClick={() => onCheckIn(appointment.id)} color="warning">
              Check In
            </Button>
            <Button onClick={() => onReschedule(appointment.id)} color="primary">
              Reschedule
            </Button>
            <Button onClick={() => onCancel(appointment.id)} color="error">
              Cancel
            </Button>
          </>
        )}
        
        {extendedProps.status === 'CHECKED_IN' && (
          <Button onClick={() => onComplete(appointment.id)} color="success">
            Complete
          </Button>
        )}
        
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const AppointmentCalendar: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<AppointmentEvent[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentEvent | null>(null);

  // Load initial data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDoctors();
      fetchDepartments();
      
      // Set default values from query parameters
      const { doctorId, departmentId, date, view } = router.query;
      
      if (doctorId) setSelectedDoctor(doctorId as string);
      if (departmentId) setSelectedDepartment(departmentId as string);
      if (date) setSelectedDate(new Date(date as string));
      if (view) {
        if (['dayGridMonth', 'timeGridWeek', 'timeGridDay'].includes(view as string)) {
          setCalendarView(view as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay');
        }
      }
    }
  }, [status, router.query]);

  // Fetch appointments when filters change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAppointments();
    }
  }, [selectedDoctor, selectedDepartment, selectedDate, calendarView, status]);

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

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/departments');
      const data = await response.json();
      
      if (data.success) {
        setDepartments(data.data.departments);
      } else {
        setError('Failed to fetch departments');
      }
    } catch (err) {
      setError('An error occurred while fetching departments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Get the date range based on the calendar view
      let startDate, endDate;
      
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        startDate = calendarApi.view.activeStart.toISOString();
        endDate = calendarApi.view.activeEnd.toISOString();
      } else {
        // Fallback if calendar is not yet initialized
        const currentDate = selectedDate || new Date();
        
        if (calendarView === 'dayGridMonth') {
          // Month view: start from the 1st day of the month
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
          // End on the last day of the month
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        } else if (calendarView === 'timeGridWeek') {
          // Week view: start from Sunday of the current week
          const day = currentDate.getDay();
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - day).toISOString();
          // End on Saturday
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - day)).toISOString();
        } else {
          // Day view: just the current day
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString();
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1).toISOString();
        }
      }
      
      // Build the query parameters
      let url = `/api/appointments/calendar?startDate=${startDate}&endDate=${endDate}`;
      
      if (selectedDoctor) {
        url += `&doctorId=${selectedDoctor}`;
      }
      
      if (selectedDepartment) {
        url += `&departmentId=${selectedDepartment}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data.events);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (err) {
      setError('An error occurred while fetching appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (arg: any) => {
    // Navigate to appointment booking page with the selected date
    router.push(`/appointments/new?date=${arg.dateStr}`);
  };

  const handleEventClick = (arg: { event: { extendedProps: AppointmentEvent } }) => {
    // Show appointment details
    setSelectedAppointment(arg.event.extendedProps);
  };

  const handleReschedule = (appointmentId: string) => {
    // Navigate to appointment rescheduling page
    router.push(`/appointments/${appointmentId}/reschedule`);
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          status: 'CANCELLED',
          reason: 'Cancelled from calendar view'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Appointment cancelled successfully');
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh the calendar
      } else {
        setError(data.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      setError('An error occurred while cancelling the appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          status: 'CHECKED_IN'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Patient checked in successfully');
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh the calendar
      } else {
        setError(data.error || 'Failed to check in patient');
      }
    } catch (err) {
      setError('An error occurred while checking in the patient');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          status: 'COMPLETED'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Appointment completed successfully');
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh the calendar
      } else {
        setError(data.error || 'Failed to complete appointment');
      }
    } catch (err) {
      setError('An error occurred while completing the appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setCalendarView(view);
    
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date());
    
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
      setSelectedDate(calendarRef.current.getApi().getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
      setSelectedDate(calendarRef.current.getApi().getDate());
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
      <Container maxWidth="lg">
        <Box my={4} textAlign="center">
          <Typography variant="h5" component="h1" gutterBottom>
            Please sign in to view the appointment calendar
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
    <Container maxWidth="lg">
      <Box my={4}>
        <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, alignItems: 'center', mb: 3 }}>
          <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <Typography variant="h4" component="h1">
              Appointment Calendar
            </Typography>
          </Box>
          
          <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' }, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => router.push('/appointments/new')}
            >
              New Appointment
            </Button>
            
            <IconButton onClick={handleToday} color="primary" title="Today">
              <TodayIcon />
            </IconButton>
            
            <IconButton onClick={handlePrev} color="primary" title="Previous">
              <ChevronLeftIcon />
            </IconButton>
            
            <IconButton onClick={handleNext} color="primary" title="Next">
              <ChevronRightIcon />
            </IconButton>
            
            <IconButton onClick={() => fetchAppointments()} color="primary" title="Refresh">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, alignItems: 'center' }}>
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
              <FormControl fullWidth>
                <InputLabel id="doctor-label">Doctor</InputLabel>
                <Select
                  labelId="doctor-label"
                  id="doctor"
                  value={selectedDoctor}
                  label="Doctor"
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                  <MenuItem value="">All Doctors</MenuItem>
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.user.name} ({doctor.specialization})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
              <FormControl fullWidth>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  id="department"
                  value={selectedDepartment}
                  label="Department"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={calendarView === 'dayGridMonth' ? 'contained' : 'outlined'}
                  onClick={() => handleViewChange('dayGridMonth')}
                >
                  Month
                </Button>
                <Button
                  variant={calendarView === 'timeGridWeek' ? 'contained' : 'outlined'}
                  onClick={() => handleViewChange('timeGridWeek')}
                >
                  Week
                </Button>
                <Button
                  variant={calendarView === 'timeGridDay' ? 'contained' : 'outlined'}
                  onClick={() => handleViewChange('timeGridDay')}
                >
                  Day
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
        
        <Paper elevation={3} sx={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            headerToolbar={false} // We're using our own custom header
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="100%"
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            nowIndicator={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
              startTime: '08:00',
              endTime: '18:00',
            }}
            eventContent={(eventInfo) => {
              const status = eventInfo.event.extendedProps.status;
              const patientName = eventInfo.event.extendedProps.patientName;
              const doctorName = eventInfo.event.extendedProps.doctorName;
              
              return (
                <Tooltip title={`${eventInfo.event.title} - ${patientName} with ${doctorName}`}>
                  <Box sx={{ 
                    p: 0.5, 
                    overflow: 'hidden',
                    backgroundColor: statusColors[status] || eventInfo.event.backgroundColor,
                    color: '#fff',
                    borderRadius: 1,
                    width: '100%',
                    height: '100%'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      {format(parseISO(eventInfo.event.startStr), 'h:mm a')}
                    </Typography>
                    <Typography variant="body2" noWrap>
                      {eventInfo.event.title}
                    </Typography>
                    <Typography variant="caption" noWrap>
                      {patientName}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            }}
          />
        </Paper>
      </Box>

      {/* Appointment Details Dialog */}
      <AppointmentDetails
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
        onCheckIn={handleCheckIn}
        onComplete={handleComplete}
      />

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

export default AppointmentCalendar;
