import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  TextField,
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
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, isValid } from 'date-fns';

// Day of week mapping
const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

interface AvailabilitySlot {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  date: string | null;
  isAvailable: boolean;
  slotDuration: number;
  maxPatients: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DoctorInfo {
  id: string;
  user: {
    name: string;
  };
  availableFrom: string | null;
  availableTo: string | null;
  availableDays: number[];
  maxAppointmentsPerDay: number;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

const DoctorAvailability = ({ doctorId }: { doctorId?: string }) => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [formData, setFormData] = useState<any>({
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    isRecurring: true,
    date: null,
    isAvailable: true,
    slotDuration: 30,
    maxPatients: 0,
    notes: ''
  });
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30))
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDoctorAvailability();
    }
  }, [status, doctorId, dateRange]);

  const fetchDoctorAvailability = async () => {
    try {
      setLoading(true);
      const id = doctorId || session?.user.doctorId;
      
      if (!id) {
        setSnackbarMessage('No doctor ID provided');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }
      
      let url = `/api/doctors/availability?doctorId=${id}`;
      
      if (dateRange.startDate && dateRange.endDate) {
        url += `&startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setDoctor(data.data.doctor);
        setAvailabilitySlots(data.data.availability);
        setAppointments(data.data.appointments || []);
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch doctor availability');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      setSnackbarMessage('An error occurred while fetching doctor availability');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      date
    });
  };

  const handleOpenDialog = (slot?: AvailabilitySlot) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isRecurring: slot.isRecurring,
        date: slot.date ? new Date(slot.date) : null,
        isAvailable: slot.isAvailable,
        slotDuration: slot.slotDuration,
        maxPatients: slot.maxPatients,
        notes: slot.notes || ''
      });
    } else {
      setEditingSlot(null);
      setFormData({
        dayOfWeek: 0,
        startTime: doctor?.availableFrom || '09:00',
        endTime: doctor?.availableTo || '17:00',
        isRecurring: true,
        date: null,
        isAvailable: true,
        slotDuration: 30,
        maxPatients: 0,
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSlot(null);
  };

  const validateForm = () => {
    if (!formData.startTime || !formData.endTime) {
      setSnackbarMessage('Start time and end time are required');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(formData.startTime) || !timeRegex.test(formData.endTime)) {
      setSnackbarMessage('Invalid time format. Use HH:MM format (24-hour)');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }

    // Validate start time is before end time
    if (formData.startTime >= formData.endTime) {
      setSnackbarMessage('Start time must be before end time');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }

    // Validate date for non-recurring slots
    if (!formData.isRecurring && !formData.date) {
      setSnackbarMessage('Date is required for non-recurring slots');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }

    return true;
  };

  const handleSaveAvailability = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const id = doctorId || session?.user.doctorId;
      
      const payload = {
        doctorId: id,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isRecurring: formData.isRecurring,
        date: formData.date ? formData.date.toISOString() : null,
        isAvailable: formData.isAvailable,
        slotDuration: parseInt(formData.slotDuration),
        maxPatients: parseInt(formData.maxPatients),
        notes: formData.notes
      };
      
      let response;
      
      if (editingSlot) {
        response = await fetch('/api/doctors/availability', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingSlot.id,
            ...payload
          }),
        });
      } else {
        response = await fetch('/api/doctors/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage(editingSlot ? 'Availability updated successfully' : 'Availability created successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        handleCloseDialog();
        fetchDoctorAvailability();
      } else {
        setSnackbarMessage(data.error || 'Failed to save availability');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      setSnackbarMessage('An error occurred while saving availability');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvailability = async (slotId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/doctors/availability', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: slotId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Availability deleted successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        fetchDoctorAvailability();
      } else {
        setSnackbarMessage(data.error || 'Failed to delete availability');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
      setSnackbarMessage('An error occurred while deleting availability');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!doctor) {
    return (
      <Container maxWidth="lg">
        <Box my={4} textAlign="center">
          <Typography variant="h5" color="textSecondary">
            Doctor information not found
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Paper elevation={3}>
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" component="h1">
                Availability Management
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Availability
              </Button>
            </Box>

            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Doctor: {doctor.user.name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Regular Hours
                      </Typography>
                      <Typography variant="body2">
                        {doctor.availableFrom && doctor.availableTo
                          ? `${doctor.availableFrom} - ${doctor.availableTo}`
                          : 'No regular hours set'}
                      </Typography>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Available Days
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {doctor.availableDays && doctor.availableDays.length > 0
                          ? doctor.availableDays.map((day) => (
                              <Chip key={day} label={DAYS_OF_WEEK[day]} color="primary" size="small" />
                            ))
                          : 'No available days set'}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Date Range
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <DatePicker
                              label="Start Date"
                              value={dateRange.startDate}
                              onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <DatePicker
                              label="End Date"
                              value={dateRange.endDate}
                              onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                            />
                          </Grid>
                        </Grid>
                      </LocalizationProvider>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Availability Schedule
            </Typography>

            {availabilitySlots.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="textSecondary">
                  No availability slots found for the selected date range.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Day</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availabilitySlots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell>{DAYS_OF_WEEK[slot.dayOfWeek]}</TableCell>
                        <TableCell>
                          {slot.isRecurring ? (
                            <Chip size="small" label="Recurring" color="info" />
                          ) : (
                            slot.date && isValid(parseISO(slot.date))
                              ? format(parseISO(slot.date), 'MMM dd, yyyy')
                              : 'Invalid date'
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                            {slot.startTime} - {slot.endTime}
                          </Box>
                        </TableCell>
                        <TableCell>{slot.slotDuration} mins</TableCell>
                        <TableCell>
                          {slot.maxPatients > 0
                            ? `Limited (${slot.maxPatients} max)`
                            : 'Unlimited'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={slot.isAvailable ? 'Available' : 'Unavailable'}
                            color={slot.isAvailable ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(slot)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAvailability(slot.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {appointments.length > 0 && (
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Scheduled Appointments
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            {format(parseISO(appointment.startTime), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(appointment.startTime), 'HH:mm')} - {format(parseISO(appointment.endTime), 'HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={appointment.status}
                              color={
                                appointment.status === 'CONFIRMED'
                                  ? 'success'
                                  : appointment.status === 'SCHEDULED'
                                  ? 'info'
                                  : 'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Add/Edit Availability Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSlot ? 'Edit Availability' : 'Add Availability'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="day-of-week-label">Day of Week</InputLabel>
                <Select
                  labelId="day-of-week-label"
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleSelectChange}
                  label="Day of Week"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <MenuItem key={index} value={index}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    name="isRecurring"
                    color="primary"
                  />
                }
                label="Recurring Schedule"
              />
            </Grid>
            {!formData.isRecurring && (
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={handleDateChange}
                  />
                </LocalizationProvider>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                placeholder="HH:MM"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                placeholder="HH:MM"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slot Duration (minutes)"
                name="slotDuration"
                type="number"
                value={formData.slotDuration}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Patients (0 for unlimited)"
                name="maxPatients"
                type="number"
                value={formData.maxPatients}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    name="isAvailable"
                    color="primary"
                  />
                }
                label="Available"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveAvailability}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default DoctorAvailability;
