import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  Assignment as AssignmentIcon,
  LocationOn as LocationOnIcon,
  Notes as NotesIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

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
  createdAt: string;
  updatedAt: string;
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
  };
  appointmentType: {
    id: string;
    name: string;
    duration: number;
    color: string;
  };
  appointmentNotes: Array<{
    id: string;
    content: string;
    createdAt: string;
    createdBy: {
      id: string;
      name: string;
    };
  }>;
  referrals: Array<{
    id: string;
    fromDepartmentId: string;
    toDepartmentId: string;
    reason: string;
    status: string;
    createdAt: string;
    fromDepartment: {
      id: string;
      name: string;
    };
    toDepartment: {
      id: string;
      name: string;
    };
  }>;
  prescriptions: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string | null;
    createdAt: string;
  }>;
};

type AppointmentHistoryItem = {
  id: string;
  appointmentId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`appointment-tabpanel-${index}`}
      aria-labelledby={`appointment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AppointmentDetails: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [appointmentHistory, setAppointmentHistory] = useState<AppointmentHistoryItem[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Load appointment details
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchAppointmentDetails(id as string);
      fetchAppointmentHistory(id as string);
    }
  }, [status, id]);

  const fetchAppointmentDetails = async (appointmentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`);
      const data = await response.json();
      
      if (data.success) {
        setAppointment(data.data.appointment);
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

  const fetchAppointmentHistory = async (appointmentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/history?appointmentId=${appointmentId}`);
      const data = await response.json();
      
      if (data.success) {
        setAppointmentHistory(data.data.history);
      } else {
        setError('Failed to fetch appointment history');
      }
    } catch (err) {
      setError('An error occurred while fetching appointment history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReschedule = () => {
    router.push(`/appointments/${id}/reschedule`);
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: id,
          status: 'CANCELLED',
          notes: cancelReason
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Appointment cancelled successfully');
        setCancelDialogOpen(false);
        
        // Refresh appointment details
        fetchAppointmentDetails(id as string);
        fetchAppointmentHistory(id as string);
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

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: id,
          status: 'CHECKED_IN'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Patient checked in successfully');
        
        // Refresh appointment details
        fetchAppointmentDetails(id as string);
        fetchAppointmentHistory(id as string);
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

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: id,
          status: 'COMPLETED'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Appointment completed successfully');
        
        // Refresh appointment details
        fetchAppointmentDetails(id as string);
        fetchAppointmentHistory(id as string);
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

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setError('Note cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: id,
          content: newNote
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Note added successfully');
        setAddNoteDialogOpen(false);
        setNewNote('');
        
        // Refresh appointment details
        fetchAppointmentDetails(id as string);
      } else {
        setError(data.error || 'Failed to add note');
      }
    } catch (err) {
      setError('An error occurred while adding the note');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
            Please sign in to view appointment details
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

  const isUpcoming = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  const isInProgress = ['CHECKED_IN', 'IN_PROGRESS'].includes(appointment.status);

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Appointment Details
          </Typography>
          
          <Box>
            <IconButton onClick={handlePrint} title="Print">
              <PrintIcon />
            </IconButton>
            
            <Button
              variant="outlined"
              onClick={() => router.push('/appointments')}
              sx={{ ml: 1 }}
            >
              Back to Appointments
            </Button>
          </Box>
        </Box>
        
        <Paper elevation={3} sx={{ mb: 4 }}>
          <Box p={3}>
            <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
              <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
                <Typography variant="h5" gutterBottom>
                  {appointment.title}
                </Typography>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <EventIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {format(parseISO(appointment.startTime), 'EEEE, MMMM d, yyyy')}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {format(parseISO(appointment.startTime), 'h:mm a')} - {format(parseISO(appointment.endTime), 'h:mm a')}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    Patient: {appointment.patient.name}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <MedicalServicesIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    Doctor: Dr. {appointment.doctor.name} ({appointment.doctor.specialization})
                  </Typography>
                </Box>
                
                {appointment.location && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Location: {appointment.location}
                    </Typography>
                  </Box>
                )}
                
                <Box display="flex" alignItems="center" mb={1}>
                  <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    Type: {appointment.appointmentType.name} ({appointment.duration} minutes)
                  </Typography>
                </Box>
                
                {appointment.description && (
                  <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      Description:
                    </Typography>
                    <Typography variant="body1">
                      {appointment.description}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Status
                    </Typography>
                    
                    <Box display="flex" justifyContent="center" mb={2}>
                      <Chip 
                        label={appointment.status} 
                        color={
                          appointment.status === 'SCHEDULED' ? 'primary' :
                          appointment.status === 'CONFIRMED' ? 'success' :
                          appointment.status === 'CHECKED_IN' || appointment.status === 'IN_PROGRESS' ? 'warning' :
                          appointment.status === 'COMPLETED' ? 'success' :
                          'error'
                        }
                        size="medium"
                        sx={{ fontSize: '1rem', py: 2, px: 1 }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Actions
                    </Typography>
                    
                    <Box display="flex" flexDirection="column" gap={1}>
                      {isUpcoming && (
                        <>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<ScheduleIcon />}
                            onClick={handleReschedule}
                            fullWidth
                          >
                            Reschedule
                          </Button>
                          
                          <Button
                            variant="contained"
                            color="warning"
                            startIcon={<CheckCircleIcon />}
                            onClick={handleCheckIn}
                            fullWidth
                          >
                            Check In
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => setCancelDialogOpen(true)}
                            fullWidth
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      
                      {isInProgress && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={handleComplete}
                          fullWidth
                        >
                          Complete
                        </Button>
                      )}
                      
                      <Button
                        variant="outlined"
                        startIcon={<NotesIcon />}
                        onClick={() => setAddNoteDialogOpen(true)}
                        fullWidth
                      >
                        Add Note
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
          
          <Divider />
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="appointment tabs">
              <Tab label="Notes" id="appointment-tab-0" aria-controls="appointment-tabpanel-0" />
              <Tab label="History" id="appointment-tab-1" aria-controls="appointment-tabpanel-1" />
              <Tab label="Prescriptions" id="appointment-tab-2" aria-controls="appointment-tabpanel-2" />
              <Tab label="Referrals" id="appointment-tab-3" aria-controls="appointment-tabpanel-3" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Appointment Notes
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<NotesIcon />}
                onClick={() => setAddNoteDialogOpen(true)}
              >
                Add Note
              </Button>
            </Box>
            
            {appointment.appointmentNotes && appointment.appointmentNotes.length > 0 ? (
              appointment.appointmentNotes.map((note) => (
                <Card key={note.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1">
                      {note.content}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <Typography variant="caption" color="text.secondary">
                        Added by: {note.createdBy.name}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(note.createdAt), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary">
                No notes have been added to this appointment.
              </Typography>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Appointment History
            </Typography>
            
            {appointmentHistory.length > 0 ? (
              appointmentHistory.map((historyItem) => (
                <Card key={historyItem.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip 
                        label={historyItem.status} 
                        color={
                          historyItem.status === 'SCHEDULED' ? 'primary' :
                          historyItem.status === 'CONFIRMED' ? 'success' :
                          historyItem.status === 'CHECKED_IN' || historyItem.status === 'IN_PROGRESS' ? 'warning' :
                          historyItem.status === 'COMPLETED' ? 'success' :
                          'error'
                        }
                        size="small"
                      />
                      
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(historyItem.createdAt), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </Box>
                    
                    {historyItem.notes && (
                      <Typography variant="body2" mt={1}>
                        {historyItem.notes}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Updated by: {historyItem.createdBy.name}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary">
                No history records found for this appointment.
              </Typography>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Prescriptions
            </Typography>
            
            {appointment.prescriptions && appointment.prescriptions.length > 0 ? (
              appointment.prescriptions.map((prescription) => (
                <Card key={prescription.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {prescription.medicationName}
                    </Typography>
                    
                    <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Dosage
                        </Typography>
                        <Typography variant="body2">
                          {prescription.dosage}
                        </Typography>
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Frequency
                        </Typography>
                        <Typography variant="body2">
                          {prescription.frequency}
                        </Typography>
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Duration
                        </Typography>
                        <Typography variant="body2">
                          {prescription.duration}
                        </Typography>
                      </Box>
                      
                      {prescription.notes && (
                        <Box component="div" sx={{ gridColumn: 'span 12' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Notes
                          </Typography>
                          <Typography variant="body2">
                            {prescription.notes}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box component="div" sx={{ gridColumn: 'span 12' }}>
                        <Typography variant="caption" color="text.secondary">
                          Prescribed on: {format(parseISO(prescription.createdAt), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary">
                No prescriptions have been added to this appointment.
              </Typography>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Referrals
            </Typography>
            
            {appointment.referrals && appointment.referrals.length > 0 ? (
              appointment.referrals.map((referral) => (
                <Card key={referral.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Referral to {referral.toDepartment.name}
                    </Typography>
                    
                    <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          From Department
                        </Typography>
                        <Typography variant="body2">
                          {referral.fromDepartment.name}
                        </Typography>
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          To Department
                        </Typography>
                        <Typography variant="body2">
                          {referral.toDepartment.name}
                        </Typography>
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: 'span 12' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Reason
                        </Typography>
                        <Typography variant="body2">
                          {referral.reason}
                        </Typography>
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: 'span 12' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Chip 
                            label={referral.status} 
                            color={
                              referral.status === 'PENDING' ? 'warning' :
                              referral.status === 'ACCEPTED' ? 'success' :
                              referral.status === 'COMPLETED' ? 'success' :
                              'error'
                            }
                            size="small"
                          />
                          
                          <Typography variant="caption" color="text.secondary">
                            Created on: {format(parseISO(referral.createdAt), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary">
                No referrals have been created for this appointment.
              </Typography>
            )}
          </TabPanel>
        </Paper>
      </Box>

      {/* Cancel Appointment Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="cancelReason"
            label="Reason for Cancellation"
            type="text"
            fullWidth
            variant="outlined"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            No, Keep Appointment
          </Button>
          <Button onClick={handleCancel} color="error">
            Yes, Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog
        open={addNoteDialogOpen}
        onClose={() => setAddNoteDialogOpen(false)}
      >
        <DialogTitle>Add Appointment Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="note"
            label="Note"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddNoteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddNote} color="primary">
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

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

export default AppointmentDetails;
