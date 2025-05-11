import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';

interface RadiologyService {
  id: string;
  code: string;
  name: string;
  modalityType: string;
  price: number;
}

interface RadiologyRequest {
  id?: string;
  patientId: string;
  doctorId: string;
  serviceCatalogId: string;
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
}

interface RadiologyRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (request: RadiologyRequest) => Promise<void>;
  request: RadiologyRequest | null;
  mode: 'add' | 'edit';
}

const initialRequest: RadiologyRequest = {
  patientId: '',
  doctorId: '',
  serviceCatalogId: '',
  requestedAt: new Date().toISOString(),
  scheduledAt: null,
  priority: 'ROUTINE',
  status: 'REQUESTED',
  clinicalInfo: '',
  reasonForExam: '',
  patientPregnant: false,
  patientAllergies: '',
  previousExams: '',
  notes: ''
};

const RadiologyRequestForm: React.FC<RadiologyRequestFormProps> = ({
  open,
  onClose,
  onSave,
  request,
  mode
}) => {
  const [formData, setFormData] = useState<RadiologyRequest>(initialRequest);
  const [services, setServices] = useState<RadiologyService[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  // Fetch services for dropdown
  useEffect(() => {
    const fetchServices = async () => {
      setServiceLoading(true);
      try {
        const response = await fetch('/api/radiology/services?isActive=true');
        if (!response.ok) {
          throw new Error('Failed to fetch radiology services');
        }
        const data = await response.json();
        setServices(data.services);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setServiceLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Set form data when request changes
  useEffect(() => {
    if (request && mode === 'edit') {
      setFormData({
        ...request,
      });
      
      if (request.scheduledAt) {
        setScheduledDate(new Date(request.scheduledAt));
      } else {
        setScheduledDate(null);
      }
    } else {
      setFormData(initialRequest);
      setScheduledDate(null);
    }
  }, [request, mode, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleScheduledDateChange = (date: Date | null) => {
    setScheduledDate(date);
    setFormData({
      ...formData,
      scheduledAt: date ? date.toISOString() : null,
      status: date ? 'SCHEDULED' : 'REQUESTED',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Create New Imaging Request' : 'Edit Imaging Request'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient ID"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                required
                disabled={mode === 'edit'}
                helperText={mode === 'edit' ? 'Patient cannot be changed' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Referring Doctor ID"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="service-label">Imaging Service</InputLabel>
                <Select
                  labelId="service-label"
                  name="serviceCatalogId"
                  value={formData.serviceCatalogId}
                  onChange={handleSelectChange}
                  label="Imaging Service"
                  disabled={mode === 'edit'}
                >
                  {serviceLoading ? (
                    <MenuItem value="">
                      <CircularProgress size={20} /> Loading...
                    </MenuItem>
                  ) : (
                    services.map((service) => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.name} - {service.modalityType} (${service.price})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  name="priority"
                  value={formData.priority}
                  onChange={handleSelectChange}
                  label="Priority"
                >
                  <MenuItem value="STAT">STAT (Immediate)</MenuItem>
                  <MenuItem value="URGENT">Urgent (24 hours)</MenuItem>
                  <MenuItem value="ROUTINE">Routine (72 hours)</MenuItem>
                  <MenuItem value="ELECTIVE">Elective (When convenient)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Schedule Date & Time"
                  value={scheduledDate}
                  onChange={handleScheduledDateChange}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Exam"
                name="reasonForExam"
                value={formData.reasonForExam}
                onChange={handleInputChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Clinical Information"
                name="clinicalInfo"
                value={formData.clinicalInfo || ''}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.patientPregnant}
                    onChange={handleInputChange}
                    name="patientPregnant"
                    color="primary"
                  />
                }
                label="Patient is Pregnant"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Allergies"
                name="patientAllergies"
                value={formData.patientAllergies || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Previous Related Exams"
                name="previousExams"
                value={formData.previousExams || ''}
                onChange={handleInputChange}
                multiline
                rows={2}
                placeholder="List any previous related exams with dates if known"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : mode === 'add' ? 'Create Request' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RadiologyRequestForm;
