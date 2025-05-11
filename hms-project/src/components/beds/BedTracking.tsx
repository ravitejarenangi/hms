import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Tab, Tabs,
  TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, SelectChangeEvent, Snackbar, Alert, IconButton, Avatar
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tracking-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface PatientRoom {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  gender: string;
  age: number;
  bedId: string;
  bedNumber: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  wing: string;
  admissionDate: string;
  expectedDischargeDate: string | null;
  doctorName: string;
  primaryNurse: string;
  status: string;
}

interface RoomHistory {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  roomNumber: string;
  admissionDate: string;
  dischargeDate: string;
  stayDuration: number;
  totalCharges: number;
}

const BedTracking: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [patientRooms, setPatientRooms] = useState<PatientRoom[]>([]);
  const [roomHistory, setRoomHistory] = useState<RoomHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDischargeDialog, setOpenDischargeDialog] = useState(false);
  const [openTransferAlertDialog, setOpenTransferAlertDialog] = useState(false);
  const [openWhatsAppDialog, setOpenWhatsAppDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRoom | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form states
  const [dischargeForm, setDischargeForm] = useState({
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeNotes: '',
    sendWhatsAppNotification: true
  });
  
  const [transferAlertForm, setTransferAlertForm] = useState({
    alertMessage: '',
    alertRecipients: [] as string[],
    urgency: 'NORMAL'
  });
  
  const [whatsAppForm, setWhatsAppForm] = useState({
    message: '',
    includeDischargeInstructions: true,
    includeMedicationReminders: true,
    includeFollowUpDetails: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current patient room assignments
        const roomsResponse = await fetch('/api/beds/tracking');
        if (roomsResponse.ok) {
          const data = await roomsResponse.json();
          setPatientRooms(data);
        }
        
        // Fetch room history
        const historyResponse = await fetch('/api/beds/tracking/history');
        if (historyResponse.ok) {
          const data = await historyResponse.json();
          setRoomHistory(data);
        }
      } catch (error) {
        console.error('Error fetching tracking data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load tracking data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formSetter: React.Dispatch<React.SetStateAction<any>>, form: any) => {
    const { name, value } = e.target;
    formSetter({
      ...form,
      [name]: value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent, formSetter: React.Dispatch<React.SetStateAction<any>>, form: any) => {
    const { name, value } = e.target;
    formSetter({
      ...form,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, formSetter: React.Dispatch<React.SetStateAction<any>>, form: any) => {
    const { name, checked } = e.target;
    formSetter({
      ...form,
      [name]: checked,
    });
  };

  const handleDischargePatient = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/beds/tracking/${selectedPatient.id}/discharge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dischargeForm),
      });

      if (response.ok) {
        // Update the patient list
        const updatedPatientRooms = patientRooms.filter(
          patient => patient.id !== selectedPatient.id
        );
        setPatientRooms(updatedPatientRooms);
        
        // Refresh room history
        const historyResponse = await fetch('/api/beds/tracking/history');
        if (historyResponse.ok) {
          const data = await historyResponse.json();
          setRoomHistory(data);
        }
        
        setOpenDischargeDialog(false);
        resetDischargeForm();
        setSnackbar({
          open: true,
          message: 'Patient discharged successfully',
          severity: 'success'
        });
        
        // If WhatsApp notification is enabled, open the dialog
        if (dischargeForm.sendWhatsAppNotification) {
          setOpenWhatsAppDialog(true);
        }
      } else {
        throw new Error('Failed to discharge patient');
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
      setSnackbar({
        open: true,
        message: 'Failed to discharge patient',
        severity: 'error'
      });
    }
  };

  const handleSendTransferAlert = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/beds/tracking/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transferAlertForm,
          patientId: selectedPatient.patientId
        }),
      });

      if (response.ok) {
        setOpenTransferAlertDialog(false);
        resetTransferAlertForm();
        setSnackbar({
          open: true,
          message: 'Transfer alert sent successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to send transfer alert');
      }
    } catch (error) {
      console.error('Error sending transfer alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send transfer alert',
        severity: 'error'
      });
    }
  };

  const handleSendWhatsAppMessage = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/beds/tracking/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...whatsAppForm,
          patientId: selectedPatient.patientId
        }),
      });

      if (response.ok) {
        setOpenWhatsAppDialog(false);
        resetWhatsAppForm();
        setSnackbar({
          open: true,
          message: 'WhatsApp message sent successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to send WhatsApp message');
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send WhatsApp message',
        severity: 'error'
      });
    }
  };

  const resetDischargeForm = () => {
    setDischargeForm({
      dischargeDate: new Date().toISOString().split('T')[0],
      dischargeNotes: '',
      sendWhatsAppNotification: true
    });
  };

  const resetTransferAlertForm = () => {
    setTransferAlertForm({
      alertMessage: '',
      alertRecipients: [],
      urgency: 'NORMAL'
    });
  };

  const resetWhatsAppForm = () => {
    setWhatsAppForm({
      message: '',
      includeDischargeInstructions: true,
      includeMedicationReminders: true,
      includeFollowUpDetails: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ADMITTED':
        return 'success';
      case 'CRITICAL':
        return 'error';
      case 'STABLE':
        return 'info';
      case 'RECOVERING':
        return 'primary';
      case 'PENDING_DISCHARGE':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="bed tracking tabs">
            <Tab label="Current Patients" />
            <Tab label="Room History" />
            <Tab label="Discharge Planning" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Current Patient Room Assignments</Typography>
          </Box>
          
          {loading ? (
            <Typography>Loading patient data...</Typography>
          ) : patientRooms.length === 0 ? (
            <Typography>No patients currently admitted.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Room/Bed</TableCell>
                    <TableCell>Admission Date</TableCell>
                    <TableCell>Expected Discharge</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Primary Nurse</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patientRooms.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 1, bgcolor: patient.gender === 'MALE' ? 'primary.main' : 'secondary.main' }}>
                            {patient.patientName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{patient.patientName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              MRN: {patient.patientMrn} | Age: {patient.age}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{`Room ${patient.roomNumber}, Bed ${patient.bedNumber}`}</TableCell>
                      <TableCell>{new Date(patient.admissionDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {patient.expectedDischargeDate 
                          ? new Date(patient.expectedDischargeDate).toLocaleDateString() 
                          : 'Not set'}
                      </TableCell>
                      <TableCell>{patient.doctorName}</TableCell>
                      <TableCell>{patient.primaryNurse}</TableCell>
                      <TableCell>
                        <Chip 
                          label={patient.status} 
                          color={getStatusColor(patient.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setOpenTransferAlertDialog(true);
                          }}
                          title="Send Transfer Alert"
                        >
                          <NotificationsIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setOpenDischargeDialog(true);
                          }}
                          title="Discharge Patient"
                        >
                          <CalendarTodayIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setOpenWhatsAppDialog(true);
                          }}
                          title="Send WhatsApp Message"
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Patient Room History</Typography>
          </Box>
          
          {loading ? (
            <Typography>Loading history data...</Typography>
          ) : roomHistory.length === 0 ? (
            <Typography>No room history found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Room/Bed</TableCell>
                    <TableCell>Admission Date</TableCell>
                    <TableCell>Discharge Date</TableCell>
                    <TableCell>Stay Duration</TableCell>
                    <TableCell>Total Charges</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>{history.patientName}</TableCell>
                      <TableCell>{`Room ${history.roomNumber}, Bed ${history.bedNumber}`}</TableCell>
                      <TableCell>{new Date(history.admissionDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(history.dischargeDate).toLocaleDateString()}</TableCell>
                      <TableCell>{`${history.stayDuration} days`}</TableCell>
                      <TableCell>{`₹${history.totalCharges.toFixed(2)}`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Discharge Planning</Typography>
          </Box>
          
          {loading ? (
            <Typography>Loading patient data...</Typography>
          ) : patientRooms.length === 0 ? (
            <Typography>No patients currently admitted.</Typography>
          ) : (
            <Grid container spacing={2}>
              {patientRooms
                .filter(patient => patient.expectedDischargeDate)
                .sort((a, b) => {
                  if (!a.expectedDischargeDate) return 1;
                  if (!b.expectedDischargeDate) return -1;
                  return new Date(a.expectedDischargeDate).getTime() - new Date(b.expectedDischargeDate).getTime();
                })
                .map((patient) => (
                  <Grid item xs={12} sm={6} md={4} key={patient.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div">
                            {patient.patientName}
                          </Typography>
                          <Chip 
                            label={patient.status} 
                            color={getStatusColor(patient.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography color="text.secondary" gutterBottom>
                          MRN: {patient.patientMrn} | Age: {patient.age}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Room: {patient.roomNumber}, Bed: {patient.bedNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Admitted: {new Date(patient.admissionDate).toLocaleDateString()}
                        </Typography>
                        {patient.expectedDischargeDate && (
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                            Expected Discharge: {new Date(patient.expectedDischargeDate).toLocaleDateString()}
                          </Typography>
                        )}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button 
                            size="small" 
                            startIcon={<CalendarTodayIcon />}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setOpenDischargeDialog(true);
                            }}
                            variant="contained"
                          >
                            Discharge
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Discharge Patient Dialog */}
      <Dialog open={openDischargeDialog} onClose={() => setOpenDischargeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Discharge Patient</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Patient: {selectedPatient.patientName}
                </Typography>
                <Typography variant="body2">
                  Room: {selectedPatient.roomNumber}, Bed: {selectedPatient.bedNumber}
                </Typography>
                <Typography variant="body2">
                  Admitted: {new Date(selectedPatient.admissionDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="dischargeDate"
                  label="Discharge Date"
                  type="date"
                  value={dischargeForm.dischargeDate}
                  onChange={(e) => handleInputChange(e, setDischargeForm, dischargeForm)}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="dischargeNotes"
                  label="Discharge Notes"
                  value={dischargeForm.dischargeNotes}
                  onChange={(e) => handleInputChange(e, setDischargeForm, dischargeForm)}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography variant="body2">
                    <input
                      type="checkbox"
                      name="sendWhatsAppNotification"
                      checked={dischargeForm.sendWhatsAppNotification}
                      onChange={(e) => handleCheckboxChange(e, setDischargeForm, dischargeForm)}
                    />
                    {' '}Send WhatsApp discharge notification
                  </Typography>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDischargeDialog(false)}>Cancel</Button>
          <Button onClick={handleDischargePatient} variant="contained">Discharge</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Alert Dialog */}
      <Dialog open={openTransferAlertDialog} onClose={() => setOpenTransferAlertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Transfer Alert</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Patient: {selectedPatient.patientName}
                </Typography>
                <Typography variant="body2">
                  Current Room: {selectedPatient.roomNumber}, Bed: {selectedPatient.bedNumber}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="alertMessage"
                  label="Alert Message"
                  value={transferAlertForm.alertMessage}
                  onChange={(e) => handleInputChange(e, setTransferAlertForm, transferAlertForm)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Urgency</InputLabel>
                  <Select
                    name="urgency"
                    value={transferAlertForm.urgency}
                    onChange={(e) => handleSelectChange(e, setTransferAlertForm, transferAlertForm)}
                    label="Urgency"
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="NORMAL">Normal</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransferAlertDialog(false)}>Cancel</Button>
          <Button onClick={handleSendTransferAlert} variant="contained">Send Alert</Button>
        </DialogActions>
      </Dialog>

      {/* WhatsApp Message Dialog */}
      <Dialog open={openWhatsAppDialog} onClose={() => setOpenWhatsAppDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send WhatsApp Message</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Patient: {selectedPatient.patientName}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="message"
                  label="Message"
                  value={whatsAppForm.message}
                  onChange={(e) => handleInputChange(e, setWhatsAppForm, whatsAppForm)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography variant="body2">
                    <input
                      type="checkbox"
                      name="includeDischargeInstructions"
                      checked={whatsAppForm.includeDischargeInstructions}
                      onChange={(e) => handleCheckboxChange(e, setWhatsAppForm, whatsAppForm)}
                    />
                    {' '}Include discharge instructions
                  </Typography>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography variant="body2">
                    <input
                      type="checkbox"
                      name="includeMedicationReminders"
                      checked={whatsAppForm.includeMedicationReminders}
                      onChange={(e) => handleCheckboxChange(e, setWhatsAppForm, whatsAppForm)}
                    />
                    {' '}Include medication reminders
                  </Typography>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography variant="body2">
                    <input
                      type="checkbox"
                      name="includeFollowUpDetails"
                      checked={whatsAppForm.includeFollowUpDetails}
                      onChange={(e) => handleCheckboxChange(e, setWhatsAppForm, whatsAppForm)}
                    />
                    {' '}Include follow-up appointment details
                  </Typography>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWhatsAppDialog(false)}>Cancel</Button>
          <Button onClick={handleSendWhatsAppMessage} variant="contained">Send Message</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BedTracking;
