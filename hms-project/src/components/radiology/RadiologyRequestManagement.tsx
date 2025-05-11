import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import RadiologyRequestList from './RadiologyRequestList';
import RadiologyRequestForm from './RadiologyRequestForm';

interface RadiologyRequest {
  id: string;
  patientId: string;
  doctorId: string;
  serviceCatalogId: string;
  serviceCatalog: {
    name: string;
    modalityType: string;
  };
  requestedAt: string;
  scheduledAt: string | null;
  priority: string;
  status: string;
  clinicalInfo: string | null;
  reasonForExam: string;
  patientPregnant: boolean;
  patientAllergies: string | null;
  previousExams: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const RadiologyRequestManagement: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentRequest, setCurrentRequest] = useState<RadiologyRequest | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleAddRequest = () => {
    setFormMode('add');
    setCurrentRequest(null);
    setOpenForm(true);
  };

  const handleEditRequest = (request: RadiologyRequest) => {
    setFormMode('edit');
    setCurrentRequest(request);
    setOpenForm(true);
  };

  const handleViewRequest = (request: RadiologyRequest) => {
    setCurrentRequest(request);
    setOpenDetails(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentRequest(null);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setCurrentRequest(null);
  };

  const handleSaveRequest = async (request: RadiologyRequest): Promise<void> => {
    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const response = await fetch('/api/radiology/requests', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${formMode} request`);
      }

      setSnackbar({
        open: true,
        message: `Imaging request ${formMode === 'add' ? 'created' : 'updated'} successfully`,
        severity: 'success',
      });
      
      // Close the form
      handleCloseForm();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        severity: 'error',
      });
      throw error;
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/radiology/requests`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setSnackbar({
        open: true,
        message: 'Status updated successfully',
        severity: 'success',
      });
      
      // Close the details dialog and refresh
      handleCloseDetails();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        severity: 'error',
      });
    }
  };

  const getStatusChip = (status: string) => {
    let color:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
    
    switch (status) {
      case 'REQUESTED':
        color = 'default';
        break;
      case 'SCHEDULED':
        color = 'info';
        break;
      case 'CHECKED_IN':
        color = 'secondary';
        break;
      case 'IN_PROGRESS':
        color = 'warning';
        break;
      case 'COMPLETED':
        color = 'success';
        break;
      case 'REPORTED':
        color = 'success';
        break;
      case 'VERIFIED':
        color = 'success';
        break;
      case 'DELIVERED':
        color = 'success';
        break;
      case 'CANCELLED':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status.replace('_', ' ')} color={color} />;
  };

  const getPriorityChip = (priority: string) => {
    let color:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
    
    switch (priority) {
      case 'STAT':
        color = 'error';
        break;
      case 'URGENT':
        color = 'warning';
        break;
      case 'ROUTINE':
        color = 'info';
        break;
      case 'ELECTIVE':
        color = 'default';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={priority} color={color} />;
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Radiology Imaging Requests</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddRequest}
        >
          New Request
        </Button>
      </Paper>

      <RadiologyRequestList
        onEditRequest={handleEditRequest}
        onViewRequest={handleViewRequest}
      />

      {/* Request Form Dialog */}
      <RadiologyRequestForm
        open={openForm}
        onClose={handleCloseForm}
        onSave={handleSaveRequest}
        request={currentRequest}
        mode={formMode}
      />

      {/* Request Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          Imaging Request Details
        </DialogTitle>
        <DialogContent>
          {currentRequest && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Status:</Typography>
                    {getStatusChip(currentRequest.status)}
                    <Typography variant="subtitle2" sx={{ ml: 2 }}>Priority:</Typography>
                    {getPriorityChip(currentRequest.priority)}
                  </Stack>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Patient ID:</Typography>
                  <Typography variant="body1">{currentRequest.patientId}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Referring Doctor:</Typography>
                  <Typography variant="body1">{currentRequest.doctorId}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Examination:</Typography>
                  <Typography variant="body1">
                    {currentRequest.serviceCatalog.name} ({currentRequest.serviceCatalog.modalityType})
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Requested Date:</Typography>
                  <Typography variant="body1">
                    {new Date(currentRequest.requestedAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Scheduled Date:</Typography>
                  <Typography variant="body1">
                    {currentRequest.scheduledAt
                      ? new Date(currentRequest.scheduledAt).toLocaleString()
                      : 'Not scheduled yet'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Reason for Exam:</Typography>
                  <Typography variant="body1">{currentRequest.reasonForExam}</Typography>
                </Grid>
                
                {currentRequest.clinicalInfo && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Clinical Information:</Typography>
                    <Typography variant="body1">{currentRequest.clinicalInfo}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Patient Pregnant:</Typography>
                  <Typography variant="body1">
                    {currentRequest.patientPregnant ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                
                {currentRequest.patientAllergies && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Allergies:</Typography>
                    <Typography variant="body1">{currentRequest.patientAllergies}</Typography>
                  </Grid>
                )}
                
                {currentRequest.previousExams && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Previous Related Exams:</Typography>
                    <Typography variant="body1">{currentRequest.previousExams}</Typography>
                  </Grid>
                )}
                
                {currentRequest.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Additional Notes:</Typography>
                    <Typography variant="body1">{currentRequest.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              {/* Status Update Section */}
              {['REQUESTED', 'SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'].includes(currentRequest.status) && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Update Status
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {currentRequest.status === 'REQUESTED' && (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleUpdateStatus(currentRequest.id, 'SCHEDULED')}
                      >
                        Mark as Scheduled
                      </Button>
                    )}
                    {['REQUESTED', 'SCHEDULED'].includes(currentRequest.status) && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleUpdateStatus(currentRequest.id, 'CHECKED_IN')}
                      >
                        Check In Patient
                      </Button>
                    )}
                    {['SCHEDULED', 'CHECKED_IN'].includes(currentRequest.status) && (
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => handleUpdateStatus(currentRequest.id, 'IN_PROGRESS')}
                      >
                        Start Exam
                      </Button>
                    )}
                    {currentRequest.status === 'IN_PROGRESS' && (
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={() => handleUpdateStatus(currentRequest.id, 'COMPLETED')}
                      >
                        Complete Exam
                      </Button>
                    )}
                    {currentRequest.status === 'COMPLETED' && (
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={() => handleUpdateStatus(currentRequest.id, 'REPORTED')}
                      >
                        Mark as Reported
                      </Button>
                    )}
                    {['REQUESTED', 'SCHEDULED'].includes(currentRequest.status) && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleUpdateStatus(currentRequest.id, 'CANCELLED')}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RadiologyRequestManagement;
