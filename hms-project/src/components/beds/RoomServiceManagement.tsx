import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Tab, Tabs,
  TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, SelectChangeEvent, Snackbar, Alert, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import RoomServiceIcon from '@mui/icons-material/RoomService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`service-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface RoomServiceRequest {
  id: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  wing: string;
  patientId: string | null;
  patientName: string | null;
  requestType: string;
  requestDetails: string;
  requestedBy: string;
  requestedAt: string;
  assignedTo: string | null;
  assignedAt: string | null;
  status: string;
  priority: string;
  completedAt: string | null;
  completedBy: string | null;
}

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  wing: string;
  roomType: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
}

const RoomServiceManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [serviceRequests, setServiceRequests] = useState<RoomServiceRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RoomServiceRequest | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form states
  const [requestForm, setRequestForm] = useState({
    roomId: '',
    patientId: '',
    requestType: 'HOUSEKEEPING',
    requestDetails: '',
    priority: 'NORMAL'
  });
  
  const [assignForm, setAssignForm] = useState({
    assignedTo: '',
    notes: ''
  });
  
  const [completeForm, setCompleteForm] = useState({
    completionNotes: '',
    feedbackRating: 5
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch service requests
        const requestsResponse = await fetch('/api/beds/services');
        if (requestsResponse.ok) {
          const data = await requestsResponse.json();
          setServiceRequests(data);
        }
        
        // Fetch rooms
        const roomsResponse = await fetch('/api/rooms');
        if (roomsResponse.ok) {
          const data = await roomsResponse.json();
          setRooms(data);
        }
        
        // Fetch staff
        const staffResponse = await fetch('/api/staff?department=housekeeping');
        if (staffResponse.ok) {
          const data = await staffResponse.json();
          setStaff(data);
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load service data',
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

  const handleCreateRequest = async () => {
    try {
      const response = await fetch('/api/beds/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestForm),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setServiceRequests([...serviceRequests, newRequest]);
        setOpenRequestDialog(false);
        resetRequestForm();
        setSnackbar({
          open: true,
          message: 'Service request created successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to create service request');
      }
    } catch (error) {
      console.error('Error creating service request:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create service request',
        severity: 'error'
      });
    }
  };

  const handleAssignRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/beds/services/${selectedRequest.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignForm),
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        setServiceRequests(serviceRequests.map(req => 
          req.id === updatedRequest.id ? updatedRequest : req
        ));
        setOpenAssignDialog(false);
        resetAssignForm();
        setSnackbar({
          open: true,
          message: 'Request assigned successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to assign request');
      }
    } catch (error) {
      console.error('Error assigning request:', error);
      setSnackbar({
        open: true,
        message: 'Failed to assign request',
        severity: 'error'
      });
    }
  };

  const handleCompleteRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/beds/services/${selectedRequest.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeForm),
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        setServiceRequests(serviceRequests.map(req => 
          req.id === updatedRequest.id ? updatedRequest : req
        ));
        setOpenCompleteDialog(false);
        resetCompleteForm();
        setSnackbar({
          open: true,
          message: 'Request completed successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to complete request');
      }
    } catch (error) {
      console.error('Error completing request:', error);
      setSnackbar({
        open: true,
        message: 'Failed to complete request',
        severity: 'error'
      });
    }
  };

  const resetRequestForm = () => {
    setRequestForm({
      roomId: '',
      patientId: '',
      requestType: 'HOUSEKEEPING',
      requestDetails: '',
      priority: 'NORMAL'
    });
  };

  const resetAssignForm = () => {
    setAssignForm({
      assignedTo: '',
      notes: ''
    });
  };

  const resetCompleteForm = () => {
    setCompleteForm({
      completionNotes: '',
      feedbackRating: 5
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ASSIGNED':
        return 'info';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'info';
      case 'NORMAL':
        return 'success';
      case 'HIGH':
        return 'warning';
      case 'URGENT':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredRequests = (status: string[]) => {
    return serviceRequests.filter(req => status.includes(req.status));
  };

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="room service tabs">
            <Tab label="Pending Requests" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Pending Service Requests</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setOpenRequestDialog(true)}
            >
              New Request
            </Button>
          </Box>
          
          {loading ? (
            <Typography>Loading requests...</Typography>
          ) : filteredRequests(['PENDING']).length === 0 ? (
            <Typography>No pending requests found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Request Type</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Requested By</TableCell>
                    <TableCell>Requested At</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests(['PENDING']).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.roomNumber}</TableCell>
                      <TableCell>{request.requestType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{request.requestDetails}</TableCell>
                      <TableCell>{request.requestedBy}</TableCell>
                      <TableCell>{new Date(request.requestedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.priority} 
                          color={getPriorityColor(request.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<AssignmentIcon />}
                          onClick={() => {
                            setSelectedRequest(request);
                            setOpenAssignDialog(true);
                          }}
                        >
                          Assign
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
            <Typography variant="h6">In Progress Requests</Typography>
          </Box>
          
          {loading ? (
            <Typography>Loading requests...</Typography>
          ) : filteredRequests(['ASSIGNED', 'IN_PROGRESS']).length === 0 ? (
            <Typography>No in-progress requests found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Request Type</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Assigned At</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests(['ASSIGNED', 'IN_PROGRESS']).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.roomNumber}</TableCell>
                      <TableCell>{request.requestType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{request.assignedTo}</TableCell>
                      <TableCell>{request.assignedAt ? new Date(request.assignedAt).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.priority} 
                          color={getPriorityColor(request.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<CheckCircleIcon />}
                          onClick={() => {
                            setSelectedRequest(request);
                            setOpenCompleteDialog(true);
                          }}
                        >
                          Complete
                        </Button>
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
            <Typography variant="h6">Completed Requests</Typography>
          </Box>
          
          {loading ? (
            <Typography>Loading requests...</Typography>
          ) : filteredRequests(['COMPLETED', 'CANCELLED']).length === 0 ? (
            <Typography>No completed requests found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Request Type</TableCell>
                    <TableCell>Completed By</TableCell>
                    <TableCell>Completed At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests(['COMPLETED', 'CANCELLED']).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.roomNumber}</TableCell>
                      <TableCell>{request.requestType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{request.completedBy || 'N/A'}</TableCell>
                      <TableCell>{request.completedAt ? new Date(request.completedAt).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {/* Rating would be displayed here */}
                        ★★★★★
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Create Request Dialog */}
      <Dialog open={openRequestDialog} onClose={() => setOpenRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Service Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Room</InputLabel>
                <Select
                  name="roomId"
                  value={requestForm.roomId}
                  onChange={(e) => handleSelectChange(e, setRequestForm, requestForm)}
                  label="Room"
                >
                  {rooms.map(room => (
                    <MenuItem key={room.id} value={room.id}>
                      Room {room.roomNumber} (Floor {room.floor}, Wing {room.wing})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Request Type</InputLabel>
                <Select
                  name="requestType"
                  value={requestForm.requestType}
                  onChange={(e) => handleSelectChange(e, setRequestForm, requestForm)}
                  label="Request Type"
                >
                  <MenuItem value="HOUSEKEEPING">Housekeeping</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="FOOD_SERVICE">Food Service</MenuItem>
                  <MenuItem value="LAUNDRY">Laundry</MenuItem>
                  <MenuItem value="MEDICAL_EQUIPMENT">Medical Equipment</MenuItem>
                  <MenuItem value="PATIENT_ASSISTANCE">Patient Assistance</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={requestForm.priority}
                  onChange={(e) => handleSelectChange(e, setRequestForm, requestForm)}
                  label="Priority"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="requestDetails"
                label="Request Details"
                value={requestForm.requestDetails}
                onChange={(e) => handleInputChange(e, setRequestForm, requestForm)}
                fullWidth
                required
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRequest} variant="contained">Create Request</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Request Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Room: {selectedRequest.roomNumber}
                </Typography>
                <Typography variant="body2">
                  Request Type: {selectedRequest.requestType.replace(/_/g, ' ')}
                </Typography>
                <Typography variant="body2">
                  Details: {selectedRequest.requestDetails}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    name="assignedTo"
                    value={assignForm.assignedTo}
                    onChange={(e) => handleSelectChange(e, setAssignForm, assignForm)}
                    label="Assign To"
                  >
                    {staff.map(person => (
                      <MenuItem key={person.id} value={person.id}>
                        {person.name} ({person.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Assignment Notes"
                  value={assignForm.notes}
                  onChange={(e) => handleInputChange(e, setAssignForm, assignForm)}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignRequest} variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Complete Request Dialog */}
      <Dialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Room: {selectedRequest.roomNumber}
                </Typography>
                <Typography variant="body2">
                  Request Type: {selectedRequest.requestType.replace(/_/g, ' ')}
                </Typography>
                <Typography variant="body2">
                  Assigned To: {selectedRequest.assignedTo || 'Not assigned'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="completionNotes"
                  label="Completion Notes"
                  value={completeForm.completionNotes}
                  onChange={(e) => handleInputChange(e, setCompleteForm, completeForm)}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <IconButton 
                      key={rating}
                      onClick={() => setCompleteForm({ ...completeForm, feedbackRating: rating })}
                      color={rating <= completeForm.feedbackRating ? 'primary' : 'default'}
                    >
                      ★
                    </IconButton>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompleteDialog(false)}>Cancel</Button>
          <Button onClick={handleCompleteRequest} variant="contained">Complete</Button>
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

export default RoomServiceManagement;
