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
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

type Department = {
  id: string;
  name: string;
};

type Doctor = {
  id: string;
  user: {
    name: string;
    email: string;
  };
  specialization: string;
  departmentId: string | null;
  department: {
    id: string;
    name: string;
  } | null;
};

type Referral = {
  id: string;
  patientId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromDoctorId: string;
  toDoctorId: string | null;
  appointmentId: string;
  reason: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
  };
  fromDepartment: {
    id: string;
    name: string;
  };
  toDepartment: {
    id: string;
    name: string;
  };
  fromDoctor: {
    id: string;
    name: string;
    specialization: string;
  };
  toDoctor: {
    id: string;
    name: string;
    specialization: string;
  } | null;
  appointment: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  followUpAppointment: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
  } | null;
};

const AppointmentReferral: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { appointmentId } = router.query;

  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form state
  const [fromDepartmentId, setFromDepartmentId] = useState('');
  const [toDepartmentId, setToDepartmentId] = useState('');
  const [fromDoctorId, setFromDoctorId] = useState('');
  const [toDoctorId, setToDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

  // Load initial data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDepartments();
      fetchDoctors();
      fetchReferrals();
    }
  }, [status, page, rowsPerPage, appointmentId]);

  // Filter doctors when department changes
  useEffect(() => {
    if (toDepartmentId) {
      const filtered = doctors.filter(doctor => 
        doctor.departmentId === toDepartmentId
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors([]);
    }
  }, [toDepartmentId, doctors]);

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

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      
      let url = `/api/appointments/referrals?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (appointmentId) {
        url += `&appointmentId=${appointmentId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.data.referrals);
        setTotalCount(data.data.totalCount);
      } else {
        setError('Failed to fetch referrals');
      }
    } catch (err) {
      setError('An error occurred while fetching referrals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateReferral = async () => {
    // Validate form
    if (!fromDepartmentId || !toDepartmentId || !fromDoctorId || !reason) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          fromDepartmentId,
          toDepartmentId,
          fromDoctorId,
          toDoctorId: toDoctorId || null,
          reason,
          notes: notes || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Referral created successfully');
        setCreateDialogOpen(false);
        
        // Reset form
        setFromDepartmentId('');
        setToDepartmentId('');
        setFromDoctorId('');
        setToDoctorId('');
        setReason('');
        setNotes('');
        
        // Refresh referrals
        fetchReferrals();
      } else {
        setError(data.error || 'Failed to create referral');
      }
    } catch (err) {
      setError('An error occurred while creating the referral');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!selectedReferral) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/appointments/referrals/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referralId: selectedReferral.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Follow-up appointment scheduled successfully');
        setScheduleDialogOpen(false);
        
        // Refresh referrals
        fetchReferrals();
        
        // Redirect to the new appointment
        if (data.data.appointmentId) {
          router.push(`/appointments/${data.data.appointmentId}`);
        }
      } else {
        setError(data.error || 'Failed to schedule follow-up appointment');
      }
    } catch (err) {
      setError('An error occurred while scheduling the follow-up appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReferralStatus = async (referralId: string, status: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/appointments/referrals/${referralId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Referral ${status.toLowerCase()} successfully`);
        setViewDialogOpen(false);
        
        // Refresh referrals
        fetchReferrals();
      } else {
        setError(data.error || `Failed to ${status.toLowerCase()} referral`);
      }
    } catch (err) {
      setError(`An error occurred while updating the referral status`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    // Set default values if appointment ID is provided
    if (appointmentId) {
      const currentDoctor = session?.user?.doctorId;
      const currentDepartment = doctors.find(d => d.id === currentDoctor)?.departmentId;
      
      if (currentDoctor) {
        setFromDoctorId(currentDoctor);
      }
      
      if (currentDepartment) {
        setFromDepartmentId(currentDepartment);
      }
    }
    
    setCreateDialogOpen(true);
  };

  const handleViewReferral = (referral: Referral) => {
    setSelectedReferral(referral);
    setViewDialogOpen(true);
  };

  const handleOpenScheduleDialog = (referral: Referral) => {
    setSelectedReferral(referral);
    setScheduleDialogOpen(true);
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
            Please sign in to manage referrals
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Patient Referrals
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Referral
          </Button>
        </Box>
        
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>From Department</TableCell>
                  <TableCell>To Department</TableCell>
                  <TableCell>Referring Doctor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referrals.length > 0 ? (
                  referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>{referral.patient.name}</TableCell>
                      <TableCell>{referral.fromDepartment.name}</TableCell>
                      <TableCell>{referral.toDepartment.name}</TableCell>
                      <TableCell>Dr. {referral.fromDoctor.name}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>{format(parseISO(referral.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleViewReferral(referral)}
                        >
                          View
                        </Button>
                        
                        {referral.status === 'ACCEPTED' && !referral.followUpAppointment && (
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => handleOpenScheduleDialog(referral)}
                          >
                            Schedule
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No referrals found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Create Referral Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Referral</DialogTitle>
        <DialogContent>
          <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mt: 1 }}>
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <FormControl fullWidth>
                <InputLabel id="from-department-label">From Department *</InputLabel>
                <Select
                  labelId="from-department-label"
                  id="from-department"
                  value={fromDepartmentId}
                  label="From Department *"
                  onChange={(e) => setFromDepartmentId(e.target.value)}
                  required
                >
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <FormControl fullWidth>
                <InputLabel id="to-department-label">To Department *</InputLabel>
                <Select
                  labelId="to-department-label"
                  id="to-department"
                  value={toDepartmentId}
                  label="To Department *"
                  onChange={(e) => setToDepartmentId(e.target.value)}
                  required
                >
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <FormControl fullWidth>
                <InputLabel id="from-doctor-label">Referring Doctor *</InputLabel>
                <Select
                  labelId="from-doctor-label"
                  id="from-doctor"
                  value={fromDoctorId}
                  label="Referring Doctor *"
                  onChange={(e) => setFromDoctorId(e.target.value)}
                  required
                >
                  {doctors
                    .filter(doctor => !fromDepartmentId || doctor.departmentId === fromDepartmentId)
                    .map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.user.name} ({doctor.specialization})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <FormControl fullWidth>
                <InputLabel id="to-doctor-label">Referred To Doctor</InputLabel>
                <Select
                  labelId="to-doctor-label"
                  id="to-doctor"
                  value={toDoctorId}
                  label="Referred To Doctor"
                  onChange={(e) => setToDoctorId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Any doctor in department</em>
                  </MenuItem>
                  {filteredDoctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.user.name} ({doctor.specialization})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                label="Reason for Referral *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                multiline
                rows={3}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                label="Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateReferral} 
            color="primary"
            disabled={!fromDepartmentId || !toDepartmentId || !fromDoctorId || !reason}
          >
            Create Referral
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Referral Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedReferral && (
          <>
            <DialogTitle>Referral Details</DialogTitle>
            <DialogContent>
              <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <Box display="flex" justifyContent="center" mb={2}>
                    <Chip 
                      label={selectedReferral.status} 
                      color={
                        selectedReferral.status === 'PENDING' ? 'warning' :
                        selectedReferral.status === 'ACCEPTED' ? 'success' :
                        selectedReferral.status === 'COMPLETED' ? 'success' :
                        'error'
                      }
                      size="medium"
                    />
                  </Box>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1">
                    {selectedReferral.patient.name}
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {format(parseISO(selectedReferral.createdAt), 'MMMM d, yyyy')}
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    From Department
                  </Typography>
                  <Typography variant="body1">
                    {selectedReferral.fromDepartment.name}
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    To Department
                  </Typography>
                  <Typography variant="body1">
                    {selectedReferral.toDepartment.name}
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Referring Doctor
                  </Typography>
                  <Typography variant="body1">
                    Dr. {selectedReferral.fromDoctor.name} ({selectedReferral.fromDoctor.specialization})
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Referred To Doctor
                  </Typography>
                  <Typography variant="body1">
                    {selectedReferral.toDoctor 
                      ? `Dr. ${selectedReferral.toDoctor.name} (${selectedReferral.toDoctor.specialization})`
                      : 'Any doctor in department'}
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reason for Referral
                  </Typography>
                  <Typography variant="body1">
                    {selectedReferral.reason}
                  </Typography>
                </Box>
                
                {selectedReferral.notes && (
                  <Box component="div" sx={{ gridColumn: 'span 12' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Additional Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedReferral.notes}
                    </Typography>
                  </Box>
                )}
                
                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Original Appointment
                  </Typography>
                  <Typography variant="body1">
                    {selectedReferral.appointment.title} on {format(parseISO(selectedReferral.appointment.startTime), 'MMMM d, yyyy')} at {format(parseISO(selectedReferral.appointment.startTime), 'h:mm a')}
                  </Typography>
                </Box>
                
                {selectedReferral.followUpAppointment && (
                  <Box component="div" sx={{ gridColumn: 'span 12' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Follow-up Appointment
                    </Typography>
                    <Typography variant="body1">
                      {selectedReferral.followUpAppointment.title} on {format(parseISO(selectedReferral.followUpAppointment.startTime), 'MMMM d, yyyy')} at {format(parseISO(selectedReferral.followUpAppointment.startTime), 'h:mm a')}
                      <Chip 
                        label={selectedReferral.followUpAppointment.status} 
                        color={
                          selectedReferral.followUpAppointment.status === 'SCHEDULED' ? 'primary' :
                          selectedReferral.followUpAppointment.status === 'CONFIRMED' ? 'success' :
                          selectedReferral.followUpAppointment.status === 'COMPLETED' ? 'success' :
                          'error'
                        }
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              {selectedReferral.status === 'PENDING' && (
                <>
                  <Button 
                    onClick={() => handleUpdateReferralStatus(selectedReferral.id, 'ACCEPTED')} 
                    color="success"
                    startIcon={<CheckIcon />}
                  >
                    Accept
                  </Button>
                  <Button 
                    onClick={() => handleUpdateReferralStatus(selectedReferral.id, 'REJECTED')} 
                    color="error"
                    startIcon={<CloseIcon />}
                  >
                    Reject
                  </Button>
                </>
              )}
              
              {selectedReferral.status === 'ACCEPTED' && !selectedReferral.followUpAppointment && (
                <Button 
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleOpenScheduleDialog(selectedReferral);
                  }} 
                  color="primary"
                  startIcon={<ScheduleIcon />}
                >
                  Schedule Follow-up
                </Button>
              )}
              
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
      >
        <DialogTitle>Schedule Follow-up Appointment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will create a new appointment for the patient with the referred doctor or department. The patient will be notified of the new appointment.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleScheduleAppointment} color="primary">
            Schedule Appointment
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

export default AppointmentReferral;
