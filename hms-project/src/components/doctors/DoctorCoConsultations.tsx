import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
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
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  LocalHospital as LocalHospitalIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  Note as NoteIcon,
  Analytics as AnalyticsIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, addMinutes } from 'date-fns';
import DoctorSharedNotes from './DoctorSharedNotes';
import DoctorBillingDistribution from './DoctorBillingDistribution';
import DoctorCoConsultationAnalytics from './DoctorCoConsultationAnalytics';

interface CoConsultation {
  id: string;
  primaryDoctorId: string;
  secondaryDoctorId: string;
  patientId: string;
  reason: string;
  notes: string | null;
  scheduledTime: string;
  duration: number;
  status: string;
  appointmentId: string | null;
  createdAt: string;
  updatedAt: string;
  primaryDoctor: {
    id: string;
    user: {
      name: string;
    };
    specialization: string;
    department: string | null;
  };
  secondaryDoctor: {
    id: string;
    user: {
      name: string;
    };
    specialization: string;
    department: string | null;
  };
  patient: {
    id: string;
    name: string;
    patientId: string;
    gender: string;
    dateOfBirth: string;
  };
  appointment?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  billingDistribution?: {
    id: string;
    primaryDoctorPercentage: number;
    secondaryDoctorPercentage: number;
    primaryDoctorAmount: number;
    secondaryDoctorAmount: number;
    totalAmount: number;
    isCustom: boolean;
  };
  sharedNotes?: Array<{
    id: string;
    doctorId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const DoctorCoConsultations = ({ doctorId }: { doctorId?: string }) => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [coConsultations, setCoConsultations] = useState<CoConsultation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDetailDialog, setOpenDetailDialog] = useState<boolean>(false);
  const [editingCoConsultation, setEditingCoConsultation] = useState<CoConsultation | null>(null);
  const [selectedCoConsultation, setSelectedCoConsultation] = useState<CoConsultation | null>(null);
  const [detailTabValue, setDetailTabValue] = useState<number>(0);
  const [formData, setFormData] = useState<any>({
    secondaryDoctorId: '',
    patientId: '',
    reason: '',
    notes: '',
    scheduledTime: new Date(),
    duration: 30
  });
  const [editFormData, setEditFormData] = useState<any>({
    status: '',
    notes: '',
    scheduledTime: new Date(),
    duration: 30
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCoConsultations();
    }
  }, [status, doctorId, statusFilter, pagination.page]);

  useEffect(() => {
    if (status === 'authenticated' && openDialog) {
      fetchDoctors();
      fetchPatients();
    }
  }, [status, openDialog]);

  const fetchCoConsultations = async () => {
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
      
      let url = `/api/doctors/co-consultations?doctorId=${id}&page=${pagination.page}&limit=${pagination.limit}`;
      
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCoConsultations(data.data.coConsultations);
        setPagination(data.data.pagination);
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch co-consultations');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching co-consultations:', error);
      setSnackbarMessage('An error occurred while fetching co-consultations');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors?limit=100');
      const data = await response.json();
      
      if (data.success) {
        // Filter out current doctor
        const currentDoctorId = doctorId || session?.user.doctorId;
        const availableDoctors = data.data.doctors.filter(
          (doctor: any) => doctor.id !== currentDoctorId
        );
        setDoctors(availableDoctors);
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch doctors');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setSnackbarMessage('An error occurred while fetching doctors');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100');
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data.patients);
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch patients');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setSnackbarMessage('An error occurred while fetching patients');
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

  const handleStatusFilterChange = (e: any) => {
    setStatusFilter(e.target.value);
    setPagination({
      ...pagination,
      page: 1
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
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

  const handleScheduledTimeChange = (date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        scheduledTime: date
      });
    }
  };

  const handleEditScheduledTimeChange = (date: Date | null) => {
    if (date) {
      setEditFormData({
        ...editFormData,
        scheduledTime: date
      });
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      secondaryDoctorId: '',
      patientId: '',
      reason: '',
      notes: '',
      scheduledTime: new Date(),
      duration: 30
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenEditDialog = (coConsultation: CoConsultation) => {
    setEditingCoConsultation(coConsultation);
    setEditFormData({
      status: coConsultation.status,
      notes: coConsultation.notes || '',
      scheduledTime: new Date(coConsultation.scheduledTime),
      duration: coConsultation.duration
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingCoConsultation(null);
  };

  const handleOpenDetailDialog = (coConsultation: CoConsultation) => {
    setSelectedCoConsultation(coConsultation);
    setDetailTabValue(0);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedCoConsultation(null);
  };

  const handleDetailTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setDetailTabValue(newValue);
  };

  const handleToggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
  };

  const validateForm = () => {
    if (!formData.secondaryDoctorId) {
      setSnackbarMessage('Please select a secondary doctor');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    
    if (!formData.patientId) {
      setSnackbarMessage('Please select a patient');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    
    if (!formData.reason) {
      setSnackbarMessage('Reason for co-consultation is required');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    
    if (!formData.scheduledTime) {
      setSnackbarMessage('Scheduled time is required');
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
    
    if (!editFormData.scheduledTime) {
      setSnackbarMessage('Scheduled time is required');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    
    return true;
  };

  const handleCreateCoConsultation = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const id = doctorId || session?.user.doctorId;
      
      const response = await fetch('/api/doctors/co-consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryDoctorId: id,
          secondaryDoctorId: formData.secondaryDoctorId,
          patientId: formData.patientId,
          reason: formData.reason,
          notes: formData.notes,
          scheduledTime: formData.scheduledTime.toISOString(),
          duration: parseInt(formData.duration)
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Co-consultation created successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        handleCloseDialog();
        fetchCoConsultations();
      } else {
        setSnackbarMessage(data.error || 'Failed to create co-consultation');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error creating co-consultation:', error);
      setSnackbarMessage('An error occurred while creating co-consultation');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCoConsultation = async () => {
    if (!validateEditForm() || !editingCoConsultation) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/doctors/co-consultations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCoConsultation.id,
          status: editFormData.status,
          notes: editFormData.notes,
          scheduledTime: editFormData.scheduledTime.toISOString(),
          duration: parseInt(editFormData.duration)
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Co-consultation updated successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        handleCloseEditDialog();
        fetchCoConsultations();
      } else {
        setSnackbarMessage(data.error || 'Failed to update co-consultation');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error updating co-consultation:', error);
      setSnackbarMessage('An error occurred while updating co-consultation');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
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
                Co-Consultations
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
              >
                Request Co-Consultation
              </Button>
            </Box>

            <Box mb={3}>
              <Grid container spacing={2} alignItems="center">
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
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="ACCEPTED">Accepted</MenuItem>
                      <MenuItem value="REJECTED">Rejected</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {coConsultations.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="textSecondary">
                  No co-consultations found for the selected criteria.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Patient</TableCell>
                        <TableCell>Primary Doctor</TableCell>
                        <TableCell>Secondary Doctor</TableCell>
                        <TableCell>Scheduled Time</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {coConsultations.map((coConsultation) => (
                        <TableRow key={coConsultation.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 1 }}>
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">{coConsultation.patient.name}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {coConsultation.patient.patientId}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocalHospitalIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {coConsultation.primaryDoctor.user.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocalHospitalIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {coConsultation.secondaryDoctor.user.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <EventIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {format(parseISO(coConsultation.scheduledTime), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {coConsultation.duration} min
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={coConsultation.reason}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {coConsultation.reason.length > 30
                                  ? `${coConsultation.reason.substring(0, 30)}...`
                                  : coConsultation.reason}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={coConsultation.status}
                              color={getStatusColor(coConsultation.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDetailDialog(coConsultation)}
                                title="View Details"
                              >
                                <NoteIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDialog(coConsultation)}
                                title="Edit"
                              >
                                <EditIcon fontSize="small" />
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

      {/* Create Co-Consultation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Request Co-Consultation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="secondary-doctor-label">Secondary Doctor</InputLabel>
                <Select
                  labelId="secondary-doctor-label"
                  name="secondaryDoctorId"
                  value={formData.secondaryDoctorId}
                  onChange={handleSelectChange}
                  label="Secondary Doctor"
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.user.name} ({doctor.specialization})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="patient-label">Patient</InputLabel>
                <Select
                  labelId="patient-label"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleSelectChange}
                  label="Patient"
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.patientId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Scheduled Time"
                  value={formData.scheduledTime}
                  onChange={handleScheduledTimeChange}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                InputProps={{
                  inputProps: { min: 15, max: 120, step: 5 }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Co-Consultation"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreateCoConsultation}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Request Co-Consultation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Co-Consultation Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Update Co-Consultation</DialogTitle>
        <DialogContent>
          {editingCoConsultation && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Co-Consultation Details
                </Typography>
                <Box mt={1}>
                  <Typography variant="body2">
                    <strong>Primary Doctor:</strong> {editingCoConsultation.primaryDoctor.user.name} ({editingCoConsultation.primaryDoctor.specialization})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Secondary Doctor:</strong> {editingCoConsultation.secondaryDoctor.user.name} ({editingCoConsultation.secondaryDoctor.specialization})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Patient:</strong> {editingCoConsultation.patient.name} ({editingCoConsultation.patient.patientId})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Reason:</strong> {editingCoConsultation.reason}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {format(parseISO(editingCoConsultation.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
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
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="ACCEPTED">Accepted</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Scheduled Time"
                    value={editFormData.scheduledTime}
                    onChange={handleEditScheduledTimeChange}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  name="duration"
                  type="number"
                  value={editFormData.duration}
                  onChange={handleEditInputChange}
                  InputProps={{
                    inputProps: { min: 15, max: 120, step: 5 }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditInputChange}
                  multiline
                  rows={3}
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
            onClick={handleUpdateCoConsultation}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Co-Consultation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Co-Consultation Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          Co-Consultation Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedCoConsultation && (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={detailTabValue} onChange={handleDetailTabChange} aria-label="co-consultation details tabs">
                  <Tab label="Details" icon={<InfoIcon />} iconPosition="start" />
                  <Tab label="Shared Notes" icon={<NoteIcon />} iconPosition="start" />
                  <Tab label="Billing Distribution" icon={<AttachMoneyIcon />} iconPosition="start" />
                </Tabs>
              </Box>
              
              {/* Details Tab */}
              {detailTabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Primary Doctor</Typography>
                    <Typography variant="body1">{selectedCoConsultation.primaryDoctor.user.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedCoConsultation.primaryDoctor.specialization}
                      {selectedCoConsultation.primaryDoctor.department && ` (${selectedCoConsultation.primaryDoctor.department})`}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Secondary Doctor</Typography>
                    <Typography variant="body1">{selectedCoConsultation.secondaryDoctor.user.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedCoConsultation.secondaryDoctor.specialization}
                      {selectedCoConsultation.secondaryDoctor.department && ` (${selectedCoConsultation.secondaryDoctor.department})`}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Patient</Typography>
                    <Typography variant="body1">{selectedCoConsultation.patient.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {selectedCoConsultation.patient.patientId} • 
                      Gender: {selectedCoConsultation.patient.gender} • 
                      DOB: {format(new Date(selectedCoConsultation.patient.dateOfBirth), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Schedule</Typography>
                    <Typography variant="body1">
                      {format(new Date(selectedCoConsultation.scheduledTime), 'EEEE, MMMM dd, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {format(new Date(selectedCoConsultation.scheduledTime), 'h:mm a')} • 
                      Duration: {selectedCoConsultation.duration} minutes
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>Reason</Typography>
                    <Typography variant="body1">{selectedCoConsultation.reason}</Typography>
                  </Grid>
                  
                  {selectedCoConsultation.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Notes</Typography>
                      <Typography variant="body1">{selectedCoConsultation.notes}</Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>Status</Typography>
                    <Chip
                      label={selectedCoConsultation.status}
                      color={getStatusColor(selectedCoConsultation.status)}
                    />
                  </Grid>
                </Grid>
              )}
              
              {/* Shared Notes Tab */}
              {detailTabValue === 1 && (
                <DoctorSharedNotes 
                  coConsultationId={selectedCoConsultation.id} 
                  doctorId={doctorId || session?.user.doctorId || ''} 
                />
              )}
              
              {/* Billing Distribution Tab */}
              {detailTabValue === 2 && (
                <DoctorBillingDistribution 
                  coConsultationId={selectedCoConsultation.id} 
                  doctorId={doctorId || session?.user.doctorId || ''} 
                />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics Section */}
      {showAnalytics && (
        <Box mt={4}>
          <Paper elevation={3}>
            <Box p={3}>
              <Typography variant="h5" gutterBottom>Co-Consultation Analytics</Typography>
              <DoctorCoConsultationAnalytics doctorId={doctorId || session?.user.doctorId || ''} />
            </Box>
          </Paper>
        </Box>
      )}

      <Box display="flex" justifyContent="center" mt={3}>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={showAnalytics ? <AnalyticsIcon /> : <AnalyticsIcon />}
          onClick={handleToggleAnalytics}
        >
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </Button>
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

export default DoctorCoConsultations;
