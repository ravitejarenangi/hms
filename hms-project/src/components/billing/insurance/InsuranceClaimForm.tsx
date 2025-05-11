import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface InsuranceClaimFormProps {
  initialData?: any;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

const InsuranceClaimForm: React.FC<InsuranceClaimFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [insuranceProviders, setInsuranceProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    fetchInsuranceProviders();
    fetchPatients();
    if (initialData?.patientId) {
      fetchInvoices(initialData.patientId);
    }
  }, [initialData]);

  const fetchPatients = async () => {
    setPatientLoading(true);
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      setPatients(data.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setPatientLoading(false);
    }
  };

  const fetchInvoices = async (patientId: string) => {
    if (!patientId) return;
    
    setInvoiceLoading(true);
    try {
      const response = await fetch(`/api/billing/invoices?patientId=${patientId}&status=PAID,PARTIALLY_PAID`);
      const data = await response.json();
      setInvoices(data.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const fetchInsuranceProviders = async () => {
    try {
      const response = await fetch('/api/billing/tpa');
      const data = await response.json();
      setInsuranceProviders(data.data || []);
    } catch (error) {
      console.error('Error fetching insurance providers:', error);
    }
  };

  const validationSchema = Yup.object({
    patientId: Yup.string().required('Patient is required'),
    invoiceId: Yup.string().required('Invoice is required'),
    insuranceProviderId: Yup.string().required('Insurance provider is required'),
    policyNumber: Yup.string().required('Policy number is required'),
    claimAmount: Yup.number()
      .required('Claim amount is required')
      .positive('Claim amount must be positive'),
    coveragePercentage: Yup.number()
      .min(0, 'Coverage percentage must be between 0 and 100')
      .max(100, 'Coverage percentage must be between 0 and 100'),
    status: Yup.string().required('Status is required'),
  });

  const formik = useFormik({
    initialValues: {
      id: initialData?.id || '',
      patientId: initialData?.patientId || '',
      invoiceId: initialData?.invoiceId || '',
      insuranceProviderId: initialData?.insuranceProviderId || '',
      policyNumber: initialData?.policyNumber || '',
      claimAmount: initialData?.claimAmount || '',
      coveragePercentage: initialData?.coveragePercentage || 80,
      approvedAmount: initialData?.approvedAmount || '',
      status: initialData?.status || 'SUBMITTED',
      submissionDate: initialData?.submissionDate ? new Date(initialData.submissionDate) : new Date(),
      documents: initialData?.documents || [],
      notes: initialData?.notes || '',
    },
    validationSchema,
    onSubmit: (values) => {
      setLoading(true);
      onSubmit(values);
      setLoading(false);
    },
  });

  const handlePatientChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const patientId = event.target.value as string;
    formik.setFieldValue('patientId', patientId);
    formik.setFieldValue('invoiceId', '');
    fetchInvoices(patientId);
  };

  const handleInvoiceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const invoiceId = event.target.value as string;
    formik.setFieldValue('invoiceId', invoiceId);
    
    // Find the selected invoice to get the amount
    const selectedInvoice = invoices.find(invoice => invoice.id === invoiceId);
    if (selectedInvoice) {
      // Set claim amount to invoice total by default
      formik.setFieldValue('claimAmount', selectedInvoice.totalAmount);
    }
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Patient & Invoice Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={formik.touched.patientId && Boolean(formik.errors.patientId)}>
            <InputLabel id="patient-label">Patient</InputLabel>
            <Select
              labelId="patient-label"
              id="patientId"
              name="patientId"
              value={formik.values.patientId}
              onChange={(e) => handlePatientChange(e as any)}
              label="Patient"
              disabled={patientLoading || Boolean(initialData)}
            >
              {patientLoading ? (
                <MenuItem value="">
                  <CircularProgress size={20} /> Loading...
                </MenuItem>
              ) : (
                patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.patientId})
                  </MenuItem>
                ))
              )}
            </Select>
            {formik.touched.patientId && formik.errors.patientId && (
              <FormHelperText>{formik.errors.patientId}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={formik.touched.invoiceId && Boolean(formik.errors.invoiceId)}>
            <InputLabel id="invoice-label">Invoice</InputLabel>
            <Select
              labelId="invoice-label"
              id="invoiceId"
              name="invoiceId"
              value={formik.values.invoiceId}
              onChange={(e) => handleInvoiceChange(e as any)}
              label="Invoice"
              disabled={invoiceLoading || !formik.values.patientId || Boolean(initialData)}
            >
              {invoiceLoading ? (
                <MenuItem value="">
                  <CircularProgress size={20} /> Loading...
                </MenuItem>
              ) : (
                invoices.map((invoice) => (
                  <MenuItem key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - ₹{invoice.totalAmount.toFixed(2)}
                  </MenuItem>
                ))
              )}
            </Select>
            {formik.touched.invoiceId && formik.errors.invoiceId && (
              <FormHelperText>{formik.errors.invoiceId}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Insurance Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={formik.touched.insuranceProviderId && Boolean(formik.errors.insuranceProviderId)}>
            <InputLabel id="insurance-provider-label">Insurance Provider</InputLabel>
            <Select
              labelId="insurance-provider-label"
              id="insuranceProviderId"
              name="insuranceProviderId"
              value={formik.values.insuranceProviderId}
              onChange={formik.handleChange}
              label="Insurance Provider"
            >
              {insuranceProviders.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  {provider.name}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.insuranceProviderId && formik.errors.insuranceProviderId && (
              <FormHelperText>{formik.errors.insuranceProviderId}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="policyNumber"
            name="policyNumber"
            label="Policy Number"
            value={formik.values.policyNumber}
            onChange={formik.handleChange}
            error={formik.touched.policyNumber && Boolean(formik.errors.policyNumber)}
            helperText={formik.touched.policyNumber && formik.errors.policyNumber}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            id="claimAmount"
            name="claimAmount"
            label="Claim Amount"
            type="number"
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            value={formik.values.claimAmount}
            onChange={formik.handleChange}
            error={formik.touched.claimAmount && Boolean(formik.errors.claimAmount)}
            helperText={formik.touched.claimAmount && formik.errors.claimAmount}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            id="coveragePercentage"
            name="coveragePercentage"
            label="Coverage Percentage"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            value={formik.values.coveragePercentage}
            onChange={formik.handleChange}
            error={formik.touched.coveragePercentage && Boolean(formik.errors.coveragePercentage)}
            helperText={formik.touched.coveragePercentage && formik.errors.coveragePercentage}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            id="approvedAmount"
            name="approvedAmount"
            label="Approved Amount"
            type="number"
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            value={formik.values.approvedAmount}
            onChange={formik.handleChange}
            error={formik.touched.approvedAmount && Boolean(formik.errors.approvedAmount)}
            helperText={formik.touched.approvedAmount && formik.errors.approvedAmount}
            disabled={!initialData || initialData.status !== 'APPROVED'}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={formik.touched.status && Boolean(formik.errors.status)}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              label="Status"
            >
              <MenuItem value="SUBMITTED">Submitted</MenuItem>
              <MenuItem value="SUBMITTED_TO_TPA">Submitted to TPA</MenuItem>
              <MenuItem value="INFO_REQUESTED">Information Requested</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
            {formik.touched.status && formik.errors.status && (
              <FormHelperText>{formik.errors.status}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Submission Date"
              value={formik.values.submissionDate}
              onChange={(newValue) => {
                formik.setFieldValue('submissionDate', newValue);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: formik.touched.submissionDate && Boolean(formik.errors.submissionDate),
                  helperText: formik.touched.submissionDate && formik.errors.submissionDate as string,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            id="notes"
            name="notes"
            label="Notes"
            multiline
            rows={4}
            value={formik.values.notes}
            onChange={formik.handleChange}
            error={formik.touched.notes && Boolean(formik.errors.notes)}
            helperText={formik.touched.notes && formik.errors.notes}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (initialData ? 'Update' : 'Submit')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InsuranceClaimForm;
