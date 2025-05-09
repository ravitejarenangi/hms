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
  TableRow,
  Pagination,
  Avatar,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, isValid } from 'date-fns';

interface PatientAssignment {
  id: string;
  doctorId: string;
  patientId: string;
  isPrimaryDoctor: boolean;
  status: string;
  assignmentDate: string;
  lastAppointment: string | null;
  nextAppointment: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
    patientId: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
  };
  upcomingAppointments: Array<{
    id: string;
    patientId: string;
    startTime: string;
    endTime: string;
    title: string;
    status: string;
  }>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const DoctorPatients = ({ doctorId }: { doctorId?: string }) => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [patientAssignments, setPatientAssignments] = useState<PatientAssignment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<PatientAssignment | null>(null);
  const [formData, setFormData] = useState<any>({
    patientId: '',
    isPrimaryDoctor: false,
    notes: ''
  });
  const [editFormData, setEditFormData] = useState<any>({
    isPrimaryDoctor: false,
    status: 'ACTIVE',
    notes: '',
    nextAppointment: null
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPatientAssignments();
    }
  }, [status, doctorId, pagination.page, searchTerm, statusFilter]);

  useEffect(() => {
    if (status === 'authenticated' && openDialog) {
      fetchAvailablePatients();
    }
  }, [status, openDialog]);

  const fetchPatientAssignments = async () => {
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
      
      let url = `/api/doctors/patients?doctorId=${id}&page=${pagination.page}&limit=${pagination.limit}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPatientAssignments(data.data.patientAssignments);
        setPagination(data.data.pagination);
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch patient assignments');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching patient assignments:', error);
      setSnackbarMessage('An error occurred while fetching patient assignments');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100');
      const data = await response.json();
      
      if (data.success) {
        // Filter out patients that are already assigned to this doctor
        const assignedPatientIds = patientAssignments.map(assignment => assignment.patientId);
        const availablePatients = data.data.patients.filter(
          (patient: any) => !assignedPatientIds.includes(patient.id)
        );
        setPatients(availablePatients);
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch available patients');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching available patients:', error);
      setSnackbarMessage('An error occurred while fetching available patients');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination({
      ...pagination,
      page: value
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination({
      ...pagination,
      page: 1
    });
  };

  const handleStatusFilterChange = (e: any) => {
    setStatusFilter(e.target.value);
    setPagination({
      ...pagination,
      page: 1
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setEditFormData({
      ...editFormData,
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

  const handleEditSelectChange = (e: any) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleNextAppointmentChange = (date: Date | null) => {
    setEditFormData({
      ...editFormData,
      nextAppointment: date
    });
  };

  const handleOpenDialog = () => {
    setFormData({
      patientId: '',
      isPrimaryDoctor: false,
      notes: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenEditDialog = (assignment: PatientAssignment) => {
    setEditingAssignment(assignment);
    setEditFormData({
      isPrimaryDoctor: assignment.isPrimaryDoctor,
      status: assignment.status,
      notes: assignment.notes || '',
      nextAppointment: assignment.nextAppointment ? new Date(assignment.nextAppointment) : null
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingAssignment(null);
  };

  const validateForm = () => {
    if (!formData.patientId) {
      setSnackbarMessage('Please select a patient');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    return true;
  };

  const validateEditForm = () => {
    if (!editFormData.status) {
      setSnackbarMessage('Status is required');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    return true;
  };

  const handleAssignPatient = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const id = doctorId || session?.user.doctorId;
      
      const response = await fetch('/api/doctors/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: id,
          patientId: formData.patientId,
          isPrimaryDoctor: formData.isPrimaryDoctor,
          notes: formData.notes
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Patient assigned successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        handleCloseDialog();
        fetchPatientAssignments();
      } else {
        setSnackbarMessage(data.error || 'Failed to assign patient');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error assigning patient:', error);
      setSnackbarMessage('An error occurred while assigning patient');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!validateEditForm() || !editingAssignment) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/doctors/patients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingAssignment.id,
          isPrimaryDoctor: editFormData.isPrimaryDoctor,
          status: editFormData.status,
          notes: editFormData.notes,
          nextAppointment: editFormData.nextAppointment ? editFormData.nextAppointment.toISOString() : null
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Patient assignment updated successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        handleCloseEditDialog();
        fetchPatientAssignments();
      } else {
        setSnackbarMessage(data.error || 'Failed to update patient assignment');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error updating patient assignment:', error);
      setSnackbarMessage('An error occurred while updating patient assignment');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/doctors/patients', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: assignmentId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Patient assignment removed successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        fetchPatientAssignments();
      } else {
        setSnackbarMessage(data.error || 'Failed to remove patient assignment');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error removing patient assignment:', error);
      setSnackbarMessage('An error occurred while removing patient assignment');
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

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Paper elevation={3}>
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" component="h1">
                Patient Management
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
              >
                Assign New Patient
              </Button>
            </Box>

            <Box mb={3}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Search Patients"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Search by name or ID"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="status-filter-label">Status Filter</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      label="Status Filter"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                      <MenuItem value="TRANSFERRED">Transferred</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {patientAssignments.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="textSecondary">
                  No patients found for the selected criteria.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Patient</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Primary</TableCell>
                        <TableCell>Next Appointment</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patientAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2 }}>
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">{assignment.patient.name}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {assignment.patient.gender}, {assignment.patient.bloodGroup}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{assignment.patient.patientId}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={assignment.status}
                              color={
                                assignment.status === 'ACTIVE'
                                  ? 'success'
                                  : assignment.status === 'INACTIVE'
                                  ? 'default'
                                  : assignment.status === 'TRANSFERRED'
                                  ? 'warning'
                                  : 'info'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {assignment.isPrimaryDoctor ? (
                              <Tooltip title="Primary Doctor">
                                <StarIcon color="primary" />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Secondary Doctor">
                                <StarBorderIcon color="action" />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.nextAppointment ? (
                              <Box display="flex" alignItems="center">
                                <EventIcon fontSize="small" sx={{ mr: 1 }} />
                                {format(parseISO(assignment.nextAppointment), 'MMM dd, yyyy')}
                              </Box>
                            ) : (
                              assignment.upcomingAppointments && assignment.upcomingAppointments.length > 0 ? (
                                <Box display="flex" alignItems="center">
                                  <EventIcon fontSize="small" sx={{ mr: 1 }} />
                                  {format(parseISO(assignment.upcomingAppointments[0].startTime), 'MMM dd, yyyy')}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No upcoming appointments
                                </Typography>
                              )
                            )}
                          </TableCell>
                          <TableCell>
                            <Box display="flex">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDialog(assignment)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveAssignment(assignment.id)}
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

                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              </>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Assign Patient Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Assign New Patient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="patient-label">Select Patient</InputLabel>
                <Select
                  labelId="patient-label"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleSelectChange}
                  label="Select Patient"
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.patientId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPrimaryDoctor}
                    onChange={handleInputChange}
                    name="isPrimaryDoctor"
                    color="primary"
                  />
                }
                label="Set as Primary Doctor"
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
            onClick={handleAssignPatient}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Assign Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Patient Assignment</DialogTitle>
        <DialogContent>
          {editingAssignment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Patient: {editingAssignment.patient.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ID: {editingAssignment.patient.patientId}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editFormData.isPrimaryDoctor}
                      onChange={handleEditInputChange}
                      name="isPrimaryDoctor"
                      color="primary"
                    />
                  }
                  label="Primary Doctor"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditSelectChange}
                    label="Status"
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="TRANSFERRED">Transferred</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Next Appointment"
                    value={editFormData.nextAppointment}
                    onChange={handleNextAppointmentChange}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleUpdateAssignment}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Assignment'}
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

export default DoctorPatients;
