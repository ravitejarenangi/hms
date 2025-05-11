import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  recipientId: string;
  recipientType: 'PATIENT' | 'DOCTOR' | 'STAFF' | 'ADMIN';
  relatedEntityId?: string;
  relatedEntityType?: 'TEST' | 'SAMPLE' | 'RESULT' | 'REPORT';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  id: string;
  patientId: string;
  user: {
    name: string;
  };
}

interface Doctor {
  id: string;
  doctorId: string;
  user: {
    name: string;
  };
}

interface Staff {
  id: string;
  staffId: string;
  user: {
    name: string;
  };
}

interface Test {
  id: string;
  testCatalogId: string;
  testCatalog: {
    name: string;
  };
  patientId: string;
}

const NotificationsComponent: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState<string>('');
  const [readFilter, setReadFilter] = useState<string>('');
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, recipientTypeFilter, readFilter]);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchStaff();
    fetchTests();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/lab/notifications';
      const queryParams = [];
      
      if (typeFilter) {
        queryParams.push(`type=${encodeURIComponent(typeFilter)}`);
      }
      
      if (recipientTypeFilter) {
        queryParams.push(`recipientType=${encodeURIComponent(recipientTypeFilter)}`);
      }
      
      if (readFilter) {
        queryParams.push(`isRead=${readFilter === 'READ'}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingRecipients(true);
    try {
      const response = await fetch('/api/patients?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      setPatients(data.patients);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchDoctors = async () => {
    setLoadingRecipients(true);
    try {
      const response = await fetch('/api/doctors?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      const data = await response.json();
      setDoctors(data.doctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingRecipients(true);
    try {
      const response = await fetch('/api/staff?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }
      const data = await response.json();
      setStaff(data.staff);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      const response = await fetch('/api/lab/requests?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch tests');
      }
      const data = await response.json();
      setTests(data.tests);
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const handleTypeFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTypeFilter(event.target.value as string);
  };

  const handleRecipientTypeFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setRecipientTypeFilter(event.target.value as string);
  };

  const handleReadFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReadFilter(event.target.value as string);
  };

  const handleOpenDialog = (notification: Notification | null = null) => {
    setCurrentNotification(notification);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentNotification(null);
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/lab/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      setSuccess('Notification deleted successfully');
      fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/lab/notifications/${id}/read`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      setSuccess('Notification marked as read');
      fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleSaveNotification = async (notificationData: any) => {
    setLoading(true);
    setError(null);
    try {
      const method = notificationData.id ? 'PUT' : 'POST';
      const url = notificationData.id 
        ? `/api/lab/notifications/${notificationData.id}` 
        : '/api/lab/notifications';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${notificationData.id ? 'update' : 'create'} notification`);
      }
      
      setSuccess(`Notification ${notificationData.id ? 'updated' : 'created'} successfully`);
      fetchNotifications();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <InfoIcon color="info" />;
      case 'WARNING':
        return <WarningIcon color="warning" />;
      case 'ERROR':
        return <ErrorIcon color="error" />;
      case 'SUCCESS':
        return <CheckIcon color="success" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'info';
      case 'WARNING':
        return 'warning';
      case 'ERROR':
        return 'error';
      case 'SUCCESS':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRecipientName = (recipientId: string, recipientType: string) => {
    switch (recipientType) {
      case 'PATIENT':
        const patient = patients.find(p => p.id === recipientId);
        return patient ? patient.user.name : recipientId;
      case 'DOCTOR':
        const doctor = doctors.find(d => d.id === recipientId);
        return doctor ? doctor.user.name : recipientId;
      case 'STAFF':
        const staffMember = staff.find(s => s.id === recipientId);
        return staffMember ? staffMember.user.name : recipientId;
      default:
        return recipientId;
    }
  };

  const getTestName = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    return test ? test.testCatalog.name : testId;
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="type-filter-label">Notification Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                onChange={handleTypeFilterChange}
                label="Notification Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="recipient-type-filter-label">Recipient Type</InputLabel>
              <Select
                labelId="recipient-type-filter-label"
                value={recipientTypeFilter}
                onChange={handleRecipientTypeFilterChange}
                label="Recipient Type"
              >
                <MenuItem value="">All Recipients</MenuItem>
                <MenuItem value="PATIENT">Patients</MenuItem>
                <MenuItem value="DOCTOR">Doctors</MenuItem>
                <MenuItem value="STAFF">Staff</MenuItem>
                <MenuItem value="ADMIN">Admins</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="read-filter-label">Read Status</InputLabel>
              <Select
                labelId="read-filter-label"
                value={readFilter}
                onChange={handleReadFilterChange}
                label="Read Status"
              >
                <MenuItem value="">All Notifications</MenuItem>
                <MenuItem value="UNREAD">Unread</MenuItem>
                <MenuItem value="READ">Read</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                New Notification
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No notifications found. Try adjusting your filters or create a new notification.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
          >
            Create Notification
          </Button>
        </Paper>
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {notifications.map((notification) => (
            <Card key={notification.id} sx={{ mb: 2, bgcolor: notification.isRead ? 'background.paper' : 'action.hover' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={9}>
                    <Box display="flex" alignItems="center">
                      <ListItemAvatar>
                        {getNotificationIcon(notification.type)}
                      </ListItemAvatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {notification.title}
                          {!notification.isRead && (
                            <Chip
                              label="New"
                              color="primary"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          To: {getRecipientName(notification.recipientId, notification.recipientType)} ({notification.recipientType})
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ mt: 2, ml: 7 }}>
                      {notification.message}
                    </Typography>
                    {notification.relatedEntityId && (
                      <Box sx={{ mt: 1, ml: 7 }}>
                        <Chip
                          label={`${notification.relatedEntityType}: ${
                            notification.relatedEntityType === 'TEST' 
                              ? getTestName(notification.relatedEntityId)
                              : notification.relatedEntityId
                          }`}
                          size="small"
                          color={getNotificationTypeColor(notification.type)}
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box display="flex" flexDirection="column" alignItems="flex-end" height="100%">
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.createdAt)}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Box>
                        {!notification.isRead && (
                          <Tooltip title="Mark as Read">
                            <IconButton
                              edge="end"
                              aria-label="mark as read"
                              onClick={() => handleMarkAsRead(notification.id)}
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteNotification(notification.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      {/* Notification Form Dialog */}
      <NotificationFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        notification={currentNotification}
        onSave={handleSaveNotification}
        patients={patients}
        doctors={doctors}
        staff={staff}
        tests={tests}
        loading={loadingRecipients || loadingTests}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!success || !!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={success ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Notification Form Dialog Component
interface NotificationFormDialogProps {
  open: boolean;
  onClose: () => void;
  notification: Notification | null;
  onSave: (notification: any) => void;
  patients: Patient[];
  doctors: Doctor[];
  staff: Staff[];
  tests: Test[];
  loading: boolean;
}

const NotificationFormDialog: React.FC<NotificationFormDialogProps> = ({
  open,
  onClose,
  notification,
  onSave,
  patients,
  doctors,
  staff,
  tests,
  loading,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    message: '',
    type: 'INFO',
    recipientId: '',
    recipientType: 'PATIENT',
    relatedEntityId: '',
    relatedEntityType: 'TEST',
  });

  useEffect(() => {
    if (notification) {
      setFormData({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        recipientId: notification.recipientId,
        recipientType: notification.recipientType,
        relatedEntityId: notification.relatedEntityId || '',
        relatedEntityType: notification.relatedEntityType || 'TEST',
      });
    } else {
      setFormData({
        id: '',
        title: '',
        message: '',
        type: 'INFO',
        recipientId: '',
        recipientType: 'PATIENT',
        relatedEntityId: '',
        relatedEntityType: 'TEST',
      });
    }
  }, [notification]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{notification ? 'Edit Notification' : 'Create New Notification'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="type-label">Notification Type</InputLabel>
                  <Select
                    labelId="type-label"
                    name="type"
                    value={formData.type}
                    onChange={handleSelectChange}
                    label="Notification Type"
                    required
                  >
                    <MenuItem value="INFO">Info</MenuItem>
                    <MenuItem value="WARNING">Warning</MenuItem>
                    <MenuItem value="ERROR">Error</MenuItem>
                    <MenuItem value="SUCCESS">Success</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="recipient-type-label">Recipient Type</InputLabel>
                  <Select
                    labelId="recipient-type-label"
                    name="recipientType"
                    value={formData.recipientType}
                    onChange={handleSelectChange}
                    label="Recipient Type"
                    required
                  >
                    <MenuItem value="PATIENT">Patient</MenuItem>
                    <MenuItem value="DOCTOR">Doctor</MenuItem>
                    <MenuItem value="STAFF">Staff</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="recipient-label">Recipient</InputLabel>
                  <Select
                    labelId="recipient-label"
                    name="recipientId"
                    value={formData.recipientId}
                    onChange={handleSelectChange}
                    label="Recipient"
                    required
                  >
                    {formData.recipientType === 'PATIENT' && patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.user.name} ({patient.patientId})
                      </MenuItem>
                    ))}
                    {formData.recipientType === 'DOCTOR' && doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        {doctor.user.name} ({doctor.doctorId})
                      </MenuItem>
                    ))}
                    {formData.recipientType === 'STAFF' && staff.map((staffMember) => (
                      <MenuItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.user.name} ({staffMember.staffId})
                      </MenuItem>
                    ))}
                    {formData.recipientType === 'ADMIN' && (
                      <MenuItem value="admin">System Administrator</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="subtitle2">Related Entity (Optional)</Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="related-entity-type-label">Related Entity Type</InputLabel>
                  <Select
                    labelId="related-entity-type-label"
                    name="relatedEntityType"
                    value={formData.relatedEntityType}
                    onChange={handleSelectChange}
                    label="Related Entity Type"
                  >
                    <MenuItem value="TEST">Test</MenuItem>
                    <MenuItem value="SAMPLE">Sample</MenuItem>
                    <MenuItem value="RESULT">Result</MenuItem>
                    <MenuItem value="REPORT">Report</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                {formData.relatedEntityType === 'TEST' ? (
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="related-entity-label">Related Test</InputLabel>
                    <Select
                      labelId="related-entity-label"
                      name="relatedEntityId"
                      value={formData.relatedEntityId}
                      onChange={handleSelectChange}
                      label="Related Test"
                    >
                      <MenuItem value="">None</MenuItem>
                      {tests.map((test) => (
                        <MenuItem key={test.id} value={test.id}>
                          {test.testCatalog.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label={`Related ${formData.relatedEntityType} ID`}
                    name="relatedEntityId"
                    value={formData.relatedEntityId}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading || !formData.title || !formData.message || !formData.recipientId}
          >
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NotificationsComponent;
