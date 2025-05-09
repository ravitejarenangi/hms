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
  Tab,
  Tabs,
  TextField,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  LocalHospital as LocalHospitalIcon,
  AttachMoney as AttachMoneyIcon,
  Event as EventIcon
} from '@mui/icons-material';

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
      id={`doctor-tabpanel-${index}`}
      aria-labelledby={`doctor-tab-${index}`}
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
    id: `doctor-tab-${index}`,
    'aria-controls': `doctor-tabpanel-${index}`,
  };
}

const DoctorProfile = ({ doctorId }: { doctorId?: string }) => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [doctor, setDoctor] = useState<any>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({});
  const [tabValue, setTabValue] = useState<number>(0);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDoctorProfile();
    }
  }, [status, doctorId]);

  const fetchDoctorProfile = async () => {
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
      
      const response = await fetch(`/api/doctors/profile?id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setDoctor(data.data.doctor);
        setFormData({
          licenseNumber: data.data.doctor.licenseNumber,
          specialization: data.data.doctor.specialization,
          department: data.data.doctor.department,
          qualification: data.data.doctor.qualification,
          experience: data.data.doctor.experience,
          consultationFee: data.data.doctor.consultationFee,
          availableFrom: data.data.doctor.availableFrom,
          availableTo: data.data.doctor.availableTo,
          availableDays: data.data.doctor.availableDays,
          maxAppointmentsPerDay: data.data.doctor.maxAppointmentsPerDay,
          isAvailableForOnline: data.data.doctor.isAvailableForOnline,
          about: data.data.doctor.about,
          specialtyFocus: data.data.doctor.specialtyFocus || [],
          certifications: data.data.doctor.certifications || [],
          languages: data.data.doctor.languages || [],
          isAcceptingNewPatients: data.data.doctor.isAcceptingNewPatients,
          maxPatientsPerDay: data.data.doctor.maxPatientsPerDay,
          billingRate: data.data.doctor.billingRate
        });
      } else {
        setSnackbarMessage(data.error || 'Failed to fetch doctor profile');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setSnackbarMessage('An error occurred while fetching doctor profile');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleToggleEdit = () => {
    setEditing(!editing);
    if (!editing) {
      // Reset form data when entering edit mode
      setFormData({
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        department: doctor.department,
        qualification: doctor.qualification,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        availableFrom: doctor.availableFrom,
        availableTo: doctor.availableTo,
        availableDays: doctor.availableDays,
        maxAppointmentsPerDay: doctor.maxAppointmentsPerDay,
        isAvailableForOnline: doctor.isAvailableForOnline,
        about: doctor.about,
        specialtyFocus: doctor.specialtyFocus || [],
        certifications: doctor.certifications || [],
        languages: doctor.languages || [],
        isAcceptingNewPatients: doctor.isAcceptingNewPatients,
        maxPatientsPerDay: doctor.maxPatientsPerDay,
        billingRate: doctor.billingRate
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const id = doctorId || session?.user.doctorId;
      
      const response = await fetch('/api/doctors/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...formData
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDoctor({
          ...doctor,
          ...data.data.doctor
        });
        setEditing(false);
        setSnackbarMessage('Doctor profile updated successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage(data.error || 'Failed to update doctor profile');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      setSnackbarMessage('An error occurred while updating doctor profile');
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
            Doctor profile not found
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
                Doctor Profile
              </Typography>
              {(session?.user.doctorId === doctor.id || session?.user.role === 'admin') && (
                <Button
                  variant={editing ? "outlined" : "contained"}
                  color={editing ? "secondary" : "primary"}
                  startIcon={editing ? <CancelIcon /> : <EditIcon />}
                  onClick={handleToggleEdit}
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </Button>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                      <Avatar
                        sx={{ width: 120, height: 120, mb: 2 }}
                        src={doctor.user?.profile?.avatar || ''}
                      >
                        <PersonIcon sx={{ fontSize: 60 }} />
                      </Avatar>
                      <Typography variant="h5">{doctor.user?.name}</Typography>
                      <Typography variant="subtitle1" color="textSecondary">
                        {doctor.specialization}
                      </Typography>
                      <Box mt={1}>
                        <Chip
                          icon={<LocalHospitalIcon />}
                          label={doctor.department || 'General'}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <SchoolIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Qualification"
                          secondary={doctor.qualification}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <WorkIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Experience"
                          secondary={`${doctor.experience} years`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <AttachMoneyIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Consultation Fee"
                          secondary={`$${doctor.consultationFee}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <EventIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Availability"
                          secondary={`${doctor.availableFrom || '09:00'} - ${doctor.availableTo || '17:00'}`}
                        />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Languages
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {doctor.languages && doctor.languages.length > 0 ? (
                          doctor.languages.map((language: string, index: number) => (
                            <Chip key={index} label={language} size="small" />
                          ))
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No languages specified
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Certifications
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {doctor.certifications && doctor.certifications.length > 0 ? (
                          doctor.certifications.map((cert: string, index: number) => (
                            <Chip key={index} label={cert} size="small" color="info" />
                          ))
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No certifications specified
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                      value={tabValue}
                      onChange={handleTabChange}
                      aria-label="doctor profile tabs"
                    >
                      <Tab label="Overview" {...a11yProps(0)} />
                      <Tab label="Performance" {...a11yProps(1)} />
                      <Tab label="Availability" {...a11yProps(2)} />
                      <Tab label="Patients" {...a11yProps(3)} />
                    </Tabs>
                  </Box>

                  <TabPanel value={tabValue} index={0}>
                    {editing ? (
                      <Box component="form">
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="License Number"
                              name="licenseNumber"
                              value={formData.licenseNumber || ''}
                              onChange={handleInputChange}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Specialization"
                              name="specialization"
                              value={formData.specialization || ''}
                              onChange={handleInputChange}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Department"
                              name="department"
                              value={formData.department || ''}
                              onChange={handleInputChange}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Qualification"
                              name="qualification"
                              value={formData.qualification || ''}
                              onChange={handleInputChange}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Experience (years)"
                              name="experience"
                              type="number"
                              value={formData.experience || 0}
                              onChange={handleInputChange}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Consultation Fee"
                              name="consultationFee"
                              type="number"
                              value={formData.consultationFee || 0}
                              onChange={handleInputChange}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Available From"
                              name="availableFrom"
                              value={formData.availableFrom || ''}
                              onChange={handleInputChange}
                              margin="normal"
                              placeholder="HH:MM"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Available To"
                              name="availableTo"
                              value={formData.availableTo || ''}
                              onChange={handleInputChange}
                              margin="normal"
                              placeholder="HH:MM"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="About"
                              name="about"
                              value={formData.about || ''}
                              onChange={handleInputChange}
                              margin="normal"
                              multiline
                              rows={4}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Box display="flex" justifyContent="flex-end" mt={2}>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveProfile}
                                disabled={loading}
                              >
                                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          About
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {doctor.about || 'No information provided.'}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h6" gutterBottom>
                          Specialty Focus
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                          {doctor.specialtyFocus && doctor.specialtyFocus.length > 0 ? (
                            doctor.specialtyFocus.map((focus: string, index: number) => (
                              <Chip key={index} label={focus} color="primary" />
                            ))
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No specialty focus specified
                            </Typography>
                          )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h6" gutterBottom>
                          Statistics
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={3}>
                            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4">{doctor.totalPatients}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Total Patients
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4">{doctor.totalAppointments}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Total Appointments
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4">
                                {doctor.appointmentCompletionRate ? 
                                  `${doctor.appointmentCompletionRate.toFixed(1)}%` : 
                                  'N/A'}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Completion Rate
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4">{doctor.referralCount}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Referrals Made
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      This tab will display detailed performance metrics, including appointment statistics, patient satisfaction, and revenue generation.
                    </Typography>
                  </TabPanel>

                  <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>
                      Availability Schedule
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      This tab will display and manage the doctor's availability schedule, including regular hours and special availability.
                    </Typography>
                  </TabPanel>

                  <TabPanel value={tabValue} index={3}>
                    <Typography variant="h6" gutterBottom>
                      Patient Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      This tab will display the list of patients assigned to this doctor and allow managing patient assignments.
                    </Typography>
                  </TabPanel>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>
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

export default DoctorProfile;
