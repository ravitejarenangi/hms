import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  SelectChangeEvent,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EventIcon from '@mui/icons-material/Event';

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
      id={`allocation-tabpanel-${index}`}
      aria-labelledby={`allocation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Bed {
  id: string;
  bedNumber: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  wing: string;
  bedType: string;
  status: string;
}

interface Patient {
  id: string;
  name: string;
  gender: string;
  age: number;
  mrn: string;
}

interface BedAllocation {
  id: string;
  bedId: string;
  bed: Bed;
  patientId: string;
  patient: Patient;
  allocatedAt: string;
  expectedDischarge: string | null;
  status: string;
}

interface BedTransfer {
  id: string;
  patientId: string;
  patient: Patient;
  fromBedId: string;
  fromBed: Bed;
  toBedId: string | null;
  toBed: Bed | null;
  transferReason: string;
  requestedAt: string;
  completedAt: string | null;
  status: string;
}

interface BedReservation {
  id: string;
  bedId: string;
  bed: Bed;
  patientId: string | null;
  patient: Patient | null;
  reservationType: string;
  startTime: string;
  endTime: string | null;
  status: string;
}

const BedAllocationSystem: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [transfers, setTransfers] = useState<BedTransfer[]>([]);
  const [reservations, setReservations] = useState<BedReservation[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Dialog states
  const [openAllocationDialog, setOpenAllocationDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [openReservationDialog, setOpenReservationDialog] = useState(false);
  
  // Form states
  const [allocationForm, setAllocationForm] = useState({
    bedId: '',
    patientId: '',
    expectedDischarge: '',
    notes: ''
  });
  
  const [transferForm, setTransferForm] = useState({
    patientId: '',
    fromBedId: '',
    toBedId: '',
    transferReason: '',
    notes: ''
  });
  
  const [reservationForm, setReservationForm] = useState({
    bedId: '',
    patientId: '',
    reservationType: 'PRE_ADMISSION',
    startTime: '',
    endTime: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch allocations
        const allocationsResponse = await fetch('/api/beds/allocation');
        if (allocationsResponse.ok) {
          const data = await allocationsResponse.json();
          setAllocations(data);
        }
        
        // Fetch transfers
        const transfersResponse = await fetch('/api/beds/allocation/transfers');
        if (transfersResponse.ok) {
          const data = await transfersResponse.json();
          setTransfers(data);
        }
        
        // Fetch reservations
        const reservationsResponse = await fetch('/api/beds/allocation/reservations');
        if (reservationsResponse.ok) {
          const data = await reservationsResponse.json();
          setReservations(data);
        }
        
        // Fetch available beds
        const bedsResponse = await fetch('/api/beds?status=AVAILABLE');
        if (bedsResponse.ok) {
          const data = await bedsResponse.json();
          setAvailableBeds(data);
        }
        
        // Fetch patients
        const patientsResponse = await fetch('/api/patients');
        if (patientsResponse.ok) {
          const data = await patientsResponse.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data',
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

  const handleAllocation = async () => {
    try {
      const response = await fetch('/api/beds/allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(allocationForm),
      });

      if (response.ok) {
        const newAllocation = await response.json();
        setAllocations([...allocations, newAllocation]);
        setOpenAllocationDialog(false);
        resetAllocationForm();
        setSnackbar({
          open: true,
          message: 'Bed allocated successfully',
          severity: 'success'
        });
        
        // Refresh available beds
        const bedsResponse = await fetch('/api/beds?status=AVAILABLE');
        if (bedsResponse.ok) {
          const data = await bedsResponse.json();
          setAvailableBeds(data);
        }
      } else {
        throw new Error('Failed to allocate bed');
      }
    } catch (error) {
      console.error('Error allocating bed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to allocate bed',
        severity: 'error'
      });
    }
  };

  const handleTransfer = async () => {
    try {
      const response = await fetch('/api/beds/allocation/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferForm),
      });

      if (response.ok) {
        const newTransfer = await response.json();
        setTransfers([...transfers, newTransfer]);
        setOpenTransferDialog(false);
        resetTransferForm();
        setSnackbar({
          open: true,
          message: 'Transfer request created successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to create transfer request');
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create transfer request',
        severity: 'error'
      });
    }
  };

  const handleReservation = async () => {
    try {
      const response = await fetch('/api/beds/allocation/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationForm),
      });

      if (response.ok) {
        const newReservation = await response.json();
        setReservations([...reservations, newReservation]);
        setOpenReservationDialog(false);
        resetReservationForm();
        setSnackbar({
          open: true,
          message: 'Bed reserved successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to reserve bed');
      }
    } catch (error) {
      console.error('Error reserving bed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reserve bed',
        severity: 'error'
      });
    }
  };

  const resetAllocationForm = () => {
    setAllocationForm({
      bedId: '',
      patientId: '',
      expectedDischarge: '',
      notes: ''
    });
  };

  const resetTransferForm = () => {
    setTransferForm({
      patientId: '',
      fromBedId: '',
      toBedId: '',
      transferReason: '',
      notes: ''
    });
  };

  const resetReservationForm = () => {
    setReservationForm({
      bedId: '',
      patientId: '',
      reservationType: 'PRE_ADMISSION',
      startTime: '',
      endTime: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CURRENT':
      case 'CONFIRMED':
        return 'success';
      case 'DISCHARGED':
      case 'COMPLETED':
        return 'info';
      case 'TRANSFERRED':
        return 'warning';
      case 'REQUESTED':
        return 'primary';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="bed allocation tabs">
            <Tab label="Current Allocations" />
            <Tab label="Transfer Requests" />
            <Tab label="Bed Reservations" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Current Bed Allocations</Typography>
            <Button 
              variant="contained" 
              startIcon={<AssignmentIcon />} 
              onClick={() => setOpenAllocationDialog(true)}
            >
              Allocate Bed
            </Button>
          </Box>
          
          {loading ? (
            <Typography>Loading allocations...</Typography>
          ) : allocations.length === 0 ? (
            <Typography>No current bed allocations found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Bed</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Allocated On</TableCell>
                    <TableCell>Expected Discharge</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>{allocation.patient.name}</TableCell>
                      <TableCell>{allocation.bed.bedNumber}</TableCell>
                      <TableCell>{allocation.bed.roomNumber}</TableCell>
                      <TableCell>{new Date(allocation.allocatedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {allocation.expectedDischarge 
                          ? new Date(allocation.expectedDischarge).toLocaleDateString() 
                          : 'Not set'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={allocation.status} 
                          color={getStatusColor(allocation.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<SwapHorizIcon />}
                          onClick={() => {
                            setTransferForm({
                              ...transferForm,
                              patientId: allocation.patientId,
                              fromBedId: allocation.bedId
                            });
                            setOpenTransferDialog(true);
                          }}
                        >
                          Transfer
                        </Button>
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
            <Typography variant="h6">Bed Transfer Requests</Typography>
            <Button 
              variant="contained" 
              startIcon={<SwapHorizIcon />} 
              onClick={() => setOpenTransferDialog(true)}
            >
              New Transfer
            </Button>
          </Box>
          
          {loading ? (
            <Typography>Loading transfers...</Typography>
          ) : transfers.length === 0 ? (
            <Typography>No transfer requests found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>From Bed</TableCell>
                    <TableCell>To Bed</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Requested On</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>{transfer.patient.name}</TableCell>
                      <TableCell>{transfer.fromBed.bedNumber}</TableCell>
                      <TableCell>{transfer.toBed ? transfer.toBed.bedNumber : 'Not assigned'}</TableCell>
                      <TableCell>{transfer.transferReason}</TableCell>
                      <TableCell>{new Date(transfer.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={transfer.status} 
                          color={getStatusColor(transfer.status) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Bed Reservations</Typography>
            <Button 
              variant="contained" 
              startIcon={<EventIcon />} 
              onClick={() => setOpenReservationDialog(true)}
            >
              Reserve Bed
            </Button>
          </Box>
          
          {loading ? (
            <Typography>Loading reservations...</Typography>
          ) : reservations.length === 0 ? (
            <Typography>No bed reservations found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bed</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>{reservation.bed.bedNumber}</TableCell>
                      <TableCell>{reservation.patient ? reservation.patient.name : 'Not assigned'}</TableCell>
                      <TableCell>{reservation.reservationType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{new Date(reservation.startTime).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {reservation.endTime 
                          ? new Date(reservation.endTime).toLocaleDateString() 
                          : 'Not set'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={reservation.status} 
                          color={getStatusColor(reservation.status) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Bed Allocation Dialog */}
      <Dialog open={openAllocationDialog} onClose={() => setOpenAllocationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Allocate Bed</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Patient</InputLabel>
                <Select
                  name="patientId"
                  value={allocationForm.patientId}
                  onChange={(e) => handleSelectChange(e, setAllocationForm, allocationForm)}
                  label="Patient"
                >
                  {patients.map(patient => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name} (MRN: {patient.mrn})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Bed</InputLabel>
                <Select
                  name="bedId"
                  value={allocationForm.bedId}
                  onChange={(e) => handleSelectChange(e, setAllocationForm, allocationForm)}
                  label="Bed"
                >
                  {availableBeds.map(bed => (
                    <MenuItem key={bed.id} value={bed.id}>
                      Bed #{bed.bedNumber} (Room: {bed.roomNumber}, Floor: {bed.floor})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="expectedDischarge"
                label="Expected Discharge Date"
                type="date"
                value={allocationForm.expectedDischarge}
                onChange={(e) => handleInputChange(e, setAllocationForm, allocationForm)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={allocationForm.notes}
                onChange={(e) => handleInputChange(e, setAllocationForm, allocationForm)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAllocationDialog(false)}>Cancel</Button>
          <Button onClick={handleAllocation} variant="contained">Allocate</Button>
        </DialogActions>
      </Dialog>

      {/* Bed Transfer Dialog */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Patient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Patient</InputLabel>
                <Select
                  name="patientId"
                  value={transferForm.patientId}
                  onChange={(e) => handleSelectChange(e, setTransferForm, transferForm)}
                  label="Patient"
                >
                  {patients.map(patient => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name} (MRN: {patient.mrn})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>From Bed</InputLabel>
                <Select
                  name="fromBedId"
                  value={transferForm.fromBedId}
                  onChange={(e) => handleSelectChange(e, setTransferForm, transferForm)}
                  label="From Bed"
                >
                  {allocations
                    .filter(a => a.patientId === transferForm.patientId)
                    .map(allocation => (
                      <MenuItem key={allocation.bedId} value={allocation.bedId}>
                        Bed #{allocation.bed.bedNumber} (Room: {allocation.bed.roomNumber})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>To Bed</InputLabel>
                <Select
                  name="toBedId"
                  value={transferForm.toBedId}
                  onChange={(e) => handleSelectChange(e, setTransferForm, transferForm)}
                  label="To Bed"
                >
                  {availableBeds.map(bed => (
                    <MenuItem key={bed.id} value={bed.id}>
                      Bed #{bed.bedNumber} (Room: {bed.roomNumber})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Transfer Reason</InputLabel>
                <Select
                  name="transferReason"
                  value={transferForm.transferReason}
                  onChange={(e) => handleSelectChange(e, setTransferForm, transferForm)}
                  label="Transfer Reason"
                >
                  <MenuItem value="MEDICAL_NECESSITY">Medical Necessity</MenuItem>
                  <MenuItem value="PATIENT_REQUEST">Patient Request</MenuItem>
                  <MenuItem value="FACILITY_NEEDS">Facility Needs</MenuItem>
                  <MenuItem value="ISOLATION_REQUIRED">Isolation Required</MenuItem>
                  <MenuItem value="UPGRADE">Room Upgrade</MenuItem>
                  <MenuItem value="DOWNGRADE">Room Downgrade</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={transferForm.notes}
                onChange={(e) => handleInputChange(e, setTransferForm, transferForm)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained">Request Transfer</Button>
        </DialogActions>
      </Dialog>

      {/* Bed Reservation Dialog */}
      <Dialog open={openReservationDialog} onClose={() => setOpenReservationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reserve Bed</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Patient (Optional)</InputLabel>
                <Select
                  name="patientId"
                  value={reservationForm.patientId}
                  onChange={(e) => handleSelectChange(e, setReservationForm, reservationForm)}
                  label="Patient (Optional)"
                >
                  <MenuItem value="">Not Selected</MenuItem>
                  {patients.map(patient => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name} (MRN: {patient.mrn})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Bed</InputLabel>
                <Select
                  name="bedId"
                  value={reservationForm.bedId}
                  onChange={(e) => handleSelectChange(e, setReservationForm, reservationForm)}
                  label="Bed"
                >
                  {availableBeds.map(bed => (
                    <MenuItem key={bed.id} value={bed.id}>
                      Bed #{bed.bedNumber} (Room: {bed.roomNumber}, Floor: {bed.floor})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Reservation Type</InputLabel>
                <Select
                  name="reservationType"
                  value={reservationForm.reservationType}
                  onChange={(e) => handleSelectChange(e, setReservationForm, reservationForm)}
                  label="Reservation Type"
                >
                  <MenuItem value="PRE_ADMISSION">Pre-Admission</MenuItem>
                  <MenuItem value="POST_SURGERY">Post-Surgery</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  <MenuItem value="TRANSFER">Transfer</MenuItem>
                  <MenuItem value="TEMPORARY">Temporary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="startTime"
                label="Start Date"
                type="date"
                value={reservationForm.startTime}
                onChange={(e) => handleInputChange(e, setReservationForm, reservationForm)}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="endTime"
                label="End Date (Optional)"
                type="date"
                value={reservationForm.endTime}
                onChange={(e) => handleInputChange(e, setReservationForm, reservationForm)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={reservationForm.notes}
                onChange={(e) => handleInputChange(e, setReservationForm, reservationForm)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReservationDialog(false)}>Cancel</Button>
          <Button onClick={handleReservation} variant="contained">Reserve</Button>
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

export default BedAllocationSystem;
