import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
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
  InputAdornment,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  LocalHospital as LocalHospitalIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

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
      id={`referral-tabpanel-${index}`}
      aria-labelledby={`referral-tab-${index}`}
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

function a11yProps(index: number) {
  return {
    id: `referral-tab-${index}`,
    'aria-controls': `referral-tabpanel-${index}`,
  };
}

interface Referral {
  id: string;
  referringDoctorId: string;
  receivingDoctorId: string;
  patientId: string;
  reason: string;
  notes: string | null;
  urgency: string;
  status: string;
  appointmentId: string | null;
  createdAt: string;
  updatedAt: string;
  referringDoctor: {
    id: string;
    user: {
      name: string;
    };
    specialization: string;
    department: string | null;
  };
  receivingDoctor: {
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
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const DoctorReferrals = ({ doctorId }: { doctorId?: string }) => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [tabValue, setTabValue] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [formData, setFormData] = useState<any>({
    receivingDoctorId: '',
    patientId: '',
    reason: '',
    notes: '',
    urgency: 'MEDIUM'
  });
  const [editFormData, setEditFormData] = useState<any>({
    status: '',
    notes: ''
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReferrals();
    }
  }, [status, doctorId, tabValue, statusFilter, pagination.page]);

  useEffect(() => {
    if (status === 'authenticated' && openDialog) {
      fetchDoctors();
      fetchPatients();
    }
  }, [status, openDialog]);

  const fetchReferrals = async () => {
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
      
      let url = `/api/doctors/referrals?doctorId=${id}&page=${pagination.page}&limit=${pagination.limit}`;
      
      if (tabValue === 0) {
        url += '&type=all';
      } else if (tabValue === 1) {
        url += '&type=sent';
      } else if (tabValue === 2) {
        url += '&type=received';
      }
      
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.data.referrals);
        setPagination(data.data.pagination);
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch referrals');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setSnackbarMessage('An error occurred while fetching referrals');
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPagination({
      ...pagination,
      page: 1
    });
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

  const handleOpenDialog = () => {
    setFormData({
      receivingDoctorId: '',
      patientId: '',
      reason: '',
      notes: '',
      urgency: 'MEDIUM'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenEditDialog = (referral: Referral) => {
    setEditingReferral(referral);
    setEditFormData({
      status: referral.status,
      notes: referral.notes || ''
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingReferral(null);
  };

  const validateForm = () => {
    if (!formData.receivingDoctorId) {
      setSnackbarMessage('Please select a receiving doctor');
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
      setSnackbarMessage('Reason for referral is required');
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

  const handleCreateReferral = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const id = doctorId || session?.user.doctorId;
      
      const response = await fetch('/api/doctors/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referringDoctorId: id,
          receivingDoctorId: formData.receivingDoctorId,
          patientId: formData.patientId,
          reason: formData.reason,
          notes: formData.notes,
          urgency: formData.urgency
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Referral created successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        handleCloseDialog();
        fetchReferrals();
      } else {
        setSnackbarMessage(data.error || 'Failed to create referral');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error creating referral:', error);
      setSnackbarMessage('An error occurred while creating referral');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReferral = async () => {
    if (!validateEditForm() || !editingReferral) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/doctors/referrals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingReferral.id,
          status: editFormData.status,
          notes: editFormData.notes
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Referral updated successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        handleCloseEditDialog();
        fetchReferrals();
      } else {
        setSnackbarMessage(data.error || 'Failed to update referral');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error updating referral:', error);
      setSnackbarMessage('An error occurred while updating referral');
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
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
                Doctor Referrals
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
              >
                Create Referral
              </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="referral tabs"
              >
                <Tab label="All Referrals" {...a11yProps(0)} />
                <Tab label="Sent" {...a11yProps(1)} />
                <Tab label="Received" {...a11yProps(2)} />
              </Tabs>
            </Box>

            <Box mb={3} mt={3}>
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

            <TabPanel value={tabValue} index={0}>
              {renderReferralsTable()}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderReferralsTable('sent')}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              {renderReferralsTable('received')}
            </TabPanel>
          </Box>
        </Paper>
      </Box>

      {/* Create Referral Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Referral</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="receiving-doctor-label">Receiving Doctor</InputLabel>
                <Select
                  labelId="receiving-doctor-label"
                  name="receivingDoctorId"
                  value={formData.receivingDoctorId}
                  onChange={handleSelectChange}
                  label="Receiving Doctor"
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
              <FormControl fullWidth>
                <InputLabel id="urgency-label">Urgency</InputLabel>
                <Select
                  labelId="urgency-label"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleSelectChange}
                  label="Urgency"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Referral"
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
            onClick={handleCreateReferral}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Referral'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Referral Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Update Referral Status</DialogTitle>
        <DialogContent>
          {editingReferral && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Referral Details
                </Typography>
                <Box mt={1}>
                  <Typography variant="body2">
                    <strong>From:</strong> {editingReferral.referringDoctor.user.name} ({editingReferral.referringDoctor.specialization})
                  </Typography>
                  <Typography variant="body2">
                    <strong>To:</strong> {editingReferral.receivingDoctor.user.name} ({editingReferral.receivingDoctor.specialization})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Patient:</strong> {editingReferral.patient.name} ({editingReferral.patient.patientId})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Reason:</strong> {editingReferral.reason}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Urgency:</strong> {editingReferral.urgency}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {format(parseISO(editingReferral.createdAt), 'MMM dd, yyyy')}
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
            onClick={handleUpdateReferral}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Referral'}
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

  function renderReferralsTable(type?: string) {
    const filteredReferrals = type === 'sent'
      ? referrals.filter(r => r.referringDoctorId === (doctorId || session?.user.doctorId))
      : type === 'received'
      ? referrals.filter(r => r.receivingDoctorId === (doctorId || session?.user.doctorId))
      : referrals;

    if (filteredReferrals.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            No referrals found for the selected criteria.
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReferrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 1 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{referral.patient.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {referral.patient.patientId}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LocalHospitalIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {referral.referringDoctor.user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <ArrowForwardIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {referral.receivingDoctor.user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={referral.reason}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {referral.reason.length > 30
                          ? `${referral.reason.substring(0, 30)}...`
                          : referral.reason}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={referral.urgency}
                      color={getUrgencyColor(referral.urgency)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={referral.status}
                      color={getStatusColor(referral.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {format(parseISO(referral.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditDialog(referral)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
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
    );
  }
};

export default DoctorReferrals;
