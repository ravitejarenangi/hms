import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSession } from 'next-auth/react';

export default function PrescriptionManagement() {
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [openDispenseDialog, setOpenDispenseDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [dispensationData, setDispensationData] = useState<any>({
    prescriptionId: '',
    medications: [],
    createSale: true,
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    updatePrescriptionStatus: true,
    prescriptionStatus: 'COMPLETED',
    notes: ''
  });
  const [availableBatches, setAvailableBatches] = useState<any>({});

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilterStatus(event.target.value as string);
    setPage(0);
  };

  const handleOpenDispenseDialog = async (prescription: any) => {
    setSelectedPrescription(prescription);
    
    // Initialize dispensation data
    const medications = prescription.medications.map((med: any) => ({
      medicationId: med.medicationId,
      batchId: '',
      quantity: med.quantity,
      unitPrice: 0,
      discount: 0,
      tax: 0
    }));
    
    setDispensationData({
      prescriptionId: prescription.id,
      medications,
      createSale: true,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      updatePrescriptionStatus: true,
      prescriptionStatus: 'COMPLETED',
      notes: ''
    });
    
    // Fetch available batches for each medication
    const batchesData: any = {};
    for (const med of prescription.medications) {
      try {
        const response = await fetch(`/api/pharmacy/batches?medicineId=${med.medicationId}&status=AVAILABLE`);
        if (response.ok) {
          const data = await response.json();
          batchesData[med.medicationId] = data.batches;
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
      }
    }
    
    setAvailableBatches(batchesData);
    setOpenDispenseDialog(true);
  };

  const handleCloseDispenseDialog = () => {
    setOpenDispenseDialog(false);
    setSelectedPrescription(null);
  };

  const handleDispensationChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setDispensationData({
      ...dispensationData,
      [name as string]: value
    });
  };

  const handleMedicationChange = (index: number, field: string, value: any) => {
    const updatedMedications = [...dispensationData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    
    // If batch is selected, update the unit price from the batch
    if (field === 'batchId' && value) {
      const medicationId = updatedMedications[index].medicationId;
      const selectedBatch = availableBatches[medicationId]?.find((b: any) => b.id === value);
      if (selectedBatch) {
        updatedMedications[index].unitPrice = selectedBatch.sellingPrice;
      }
    }
    
    setDispensationData({
      ...dispensationData,
      medications: updatedMedications
    });
  };

  const handleDispenseMedication = async () => {
    try {
      // Validate that all medications have batches selected
      const invalidMedication = dispensationData.medications.find((med: any) => !med.batchId);
      if (invalidMedication) {
        setError('Please select a batch for each medication');
        return;
      }

      const response = await fetch('/api/pharmacy/prescriptions/dispense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dispensationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to dispense medication');
      }

      // Refresh prescriptions data
      fetchPrescriptions();
      handleCloseDispenseDialog();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pharmacy/prescriptions?status=${filterStatus}`);
      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }
      const data = await response.json();
      setPrescriptions(data.prescriptions);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPrescriptions();
    }
  }, [session, filterStatus]);

  // Filter prescriptions based on search term
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const patientName = prescription.patient?.user?.name || '';
    const doctorName = prescription.doctor?.user?.name || '';
    const prescriptionNumber = prescription.prescriptionNumber || '';
    
    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'EXPIRED':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Prescription Management</Typography>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Search Prescriptions"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 250 }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={filterStatus}
              onChange={handleFilterChange}
              label="Status"
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
              <MenuItem value="ALL">All</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Prescription #</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Prescribed Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrescriptions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {prescription.prescriptionNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {prescription.patient?.user?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {prescription.doctor?.user?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatDate(prescription.prescribedDate)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={prescription.status} 
                        color={getStatusColor(prescription.status) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" color="info">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {prescription.status === 'ACTIVE' && (
                        <Tooltip title="Dispense Medication">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDispenseDialog(prescription)}
                          >
                            <ShoppingCartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {filteredPrescriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No prescriptions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPrescriptions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Dispense Medication Dialog */}
      <Dialog 
        open={openDispenseDialog} 
        onClose={handleCloseDispenseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Dispense Medication</DialogTitle>
        <DialogContent>
          {selectedPrescription && (
            <>
              <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mb: 3 }}>
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Prescription #
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPrescription.prescriptionNumber}
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Prescribed Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedPrescription.prescribedDate)}
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPrescription.patient?.user?.name || 'N/A'}
                  </Typography>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Doctor
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPrescription.doctor?.user?.name || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Medications
              </Typography>
              
              {selectedPrescription.medications.map((medication: any, index: number) => (
                <Accordion key={medication.id} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      {medication.medication.name} - {medication.dosage} ({medication.quantity} units)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <FormControl fullWidth size="small" margin="dense">
                          <InputLabel id={`batch-label-${index}`}>Select Batch</InputLabel>
                          <Select
                            labelId={`batch-label-${index}`}
                            value={dispensationData.medications[index]?.batchId || ''}
                            onChange={(e) => handleMedicationChange(index, 'batchId', e.target.value)}
                            label="Select Batch"
                          >
                            {availableBatches[medication.medicationId]?.map((batch: any) => (
                              <MenuItem key={batch.id} value={batch.id}>
                                {batch.batchNumber} - Exp: {formatDate(batch.expiryDate)} (Stock: {batch.quantity})
                              </MenuItem>
                            ))}
                            {(!availableBatches[medication.medicationId] || 
                              availableBatches[medication.medicationId].length === 0) && (
                              <MenuItem disabled value="">
                                No batches available
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField
                          fullWidth
                          size="small"
                          margin="dense"
                          label="Quantity"
                          type="number"
                          value={dispensationData.medications[index]?.quantity || 0}
                          onChange={(e) => handleMedicationChange(index, 'quantity', parseInt(e.target.value))}
                          inputProps={{ min: 1 }}
                        />
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                        <TextField
                          fullWidth
                          size="small"
                          margin="dense"
                          label="Unit Price"
                          type="number"
                          value={dispensationData.medications[index]?.unitPrice || 0}
                          onChange={(e) => handleMedicationChange(index, 'unitPrice', parseFloat(e.target.value))}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                        <TextField
                          fullWidth
                          size="small"
                          margin="dense"
                          label="Discount"
                          type="number"
                          value={dispensationData.medications[index]?.discount || 0}
                          onChange={(e) => handleMedicationChange(index, 'discount', parseFloat(e.target.value))}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Box>
                      
                      <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                        <TextField
                          fullWidth
                          size="small"
                          margin="dense"
                          label="Tax"
                          type="number"
                          value={dispensationData.medications[index]?.tax || 0}
                          onChange={(e) => handleMedicationChange(index, 'tax', parseFloat(e.target.value))}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Box>
                    </Box>
                    
                    <Box mt={1}>
                      <Typography variant="body2" color="textSecondary">
                        Instructions: {medication.instructions || 'None'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Frequency: {medication.frequency}, Route: {medication.route}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <FormControl fullWidth size="small" margin="dense">
                    <InputLabel id="payment-method-label">Payment Method</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      name="paymentMethod"
                      value={dispensationData.paymentMethod}
                      onChange={handleDispensationChange}
                      label="Payment Method"
                    >
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="CARD">Card</MenuItem>
                      <MenuItem value="INSURANCE">Insurance</MenuItem>
                      <MenuItem value="MOBILE">Mobile Payment</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <FormControl fullWidth size="small" margin="dense">
                    <InputLabel id="payment-status-label">Payment Status</InputLabel>
                    <Select
                      labelId="payment-status-label"
                      name="paymentStatus"
                      value={dispensationData.paymentStatus}
                      onChange={handleDispensationChange}
                      label="Payment Status"
                    >
                      <MenuItem value="PAID">Paid</MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="PARTIAL">Partial</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box component="div" sx={{ gridColumn: 'span 12' }}>
                  <TextField
                    fullWidth
                    margin="dense"
                    name="notes"
                    label="Notes"
                    multiline
                    rows={2}
                    value={dispensationData.notes}
                    onChange={handleDispensationChange}
                  />
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDispenseDialog}>Cancel</Button>
          <Button 
            onClick={handleDispenseMedication} 
            variant="contained" 
            color="primary"
            startIcon={<CheckCircleIcon />}
          >
            Dispense Medication
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
