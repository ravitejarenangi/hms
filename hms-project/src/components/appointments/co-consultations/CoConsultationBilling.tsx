import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  consultationFee: number;
};

type BillingItem = {
  id: string;
  description: string;
  amount: number;
  doctorId: string;
  doctorName: string;
  insuranceCode?: string;
  notes?: string;
  createdAt: string;
};

type BillingBreakdown = {
  doctorId: string;
  doctorName: string;
  specialization: string;
  role: string;
  fee: number;
};

type BillingData = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  appointmentType: string;
  appointmentDate: string;
  primaryDoctorFee: number;
  coConsultingDoctorsFees: number;
  additionalServicesFees: number;
  totalAmount: number;
  billingBreakdown: BillingBreakdown[];
  servicesBreakdown: BillingItem[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
};

interface CoConsultationBillingProps {
  appointmentId: string;
  doctors: Doctor[];
  isEditable: boolean;
}

const CoConsultationBilling: React.FC<CoConsultationBillingProps> = ({
  appointmentId,
  doctors,
  isEditable
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [insuranceCode, setInsuranceCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchBillingData();
  }, [appointmentId]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/co-consultations/billing?appointmentId=${appointmentId}`);
      const data = await response.json();
      
      if (data.success) {
        setBillingData(data.data);
      } else {
        setSnackbarMessage(data.error || 'Failed to load billing data');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching co-consultation billing:', error);
      setSnackbarMessage('Failed to load billing data');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!description.trim() || !amount || !selectedDoctor) {
      setSnackbarMessage('Description, amount, and doctor are required');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await fetch('/api/appointments/co-consultations/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          doctorId: selectedDoctor,
          description,
          amount: parseFloat(amount),
          insuranceCode: insuranceCode || undefined,
          notes: notes || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDescription('');
        setAmount('');
        setSelectedDoctor('');
        setInsuranceCode('');
        setNotes('');
        setOpenAddDialog(false);
        fetchBillingData(); // Refresh billing data
        setSnackbarMessage('Billing item added successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage(data.error || 'Failed to add billing item');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error adding billing item:', error);
      setSnackbarMessage('An error occurred while adding billing item');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItemId) return;

    try {
      const response = await fetch('/api/appointments/co-consultations/billing', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingItemId: selectedItemId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedItemId(null);
        setOpenDeleteDialog(false);
        fetchBillingData(); // Refresh billing data
        setSnackbarMessage('Billing item deleted successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage(data.error || 'Failed to delete billing item');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error deleting billing item:', error);
      setSnackbarMessage('An error occurred while deleting billing item');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const confirmDeleteItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setOpenDeleteDialog(true);
  };

  const handlePrintBill = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!billingData) {
    return (
      <Box textAlign="center" py={3}>
        <Typography variant="body1" color="textSecondary">
          No billing data available for this appointment.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Co-Consultation Billing
            </Typography>
            <Box>
              {isEditable && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddDialog(true)}
                  sx={{ mr: 1 }}
                >
                  Add Service
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintBill}
              >
                Print
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Patient</Typography>
              <Typography variant="body1">{billingData.patientName}</Typography>
              {billingData.insuranceProvider && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Insurance</Typography>
                  <Typography variant="body1">
                    {billingData.insuranceProvider} - Policy #{billingData.insurancePolicyNumber}
                  </Typography>
                </>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Appointment</Typography>
              <Typography variant="body1">
                {billingData.appointmentType} on {format(new Date(billingData.appointmentDate), 'PPpp')}
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Total Amount</Typography>
              <Typography variant="h6" color="primary">
                ${billingData.totalAmount.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>Doctor Fees</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billingData.billingBreakdown.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.doctorName}</TableCell>
                    <TableCell>{item.specialization}</TableCell>
                    <TableCell>{item.role}</TableCell>
                    <TableCell align="right">${item.fee.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                    Subtotal
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ${(billingData.primaryDoctorFee + billingData.coConsultingDoctorsFees).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ mb: 2 }}>Additional Services</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Insurance Code</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  {isEditable && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {billingData.servicesBreakdown.length > 0 ? (
                  <>
                    {billingData.servicesBreakdown.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.doctorName}</TableCell>
                        <TableCell>{item.insuranceCode || 'N/A'}</TableCell>
                        <TableCell align="right">${item.amount.toFixed(2)}</TableCell>
                        {isEditable && (
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => confirmDeleteItem(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={isEditable ? 3 : 3} align="right" sx={{ fontWeight: 'bold' }}>
                        Subtotal
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ${billingData.additionalServicesFees.toFixed(2)}
                      </TableCell>
                      {isEditable && <TableCell />}
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={isEditable ? 5 : 4} align="center">
                      No additional services
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
            <Grid container>
              <Grid item xs={8}>
                <Typography variant="h6">Total</Typography>
              </Grid>
              <Grid item xs={4} textAlign="right">
                <Typography variant="h6" color="primary">
                  ${billingData.totalAmount.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Add Service Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Service</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={selectedDoctor}
                label="Doctor"
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Amount"
              variant="outlined"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              label="Insurance Code"
              variant="outlined"
              value={insuranceCode}
              onChange={(e) => setInsuranceCode(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              variant="outlined"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddItem} color="primary" variant="contained">
            Add Service
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this service? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteItem} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </Box>
  );
};

export default CoConsultationBilling;
