import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PatientAutocomplete } from '@/components/patients/PatientAutocomplete';
import { DoctorAutocomplete } from '@/components/doctors/DoctorAutocomplete';
import { DepartmentAutocomplete } from '@/components/departments/DepartmentAutocomplete';

// Define GST rate types
const gstRateTypes = [
  { value: 'EXEMPT', label: 'Exempt (0%)', rate: 0 },
  { value: 'ZERO', label: 'Zero Rated (0%)', rate: 0 },
  { value: 'FIVE', label: 'GST 5%', rate: 5 },
  { value: 'TWELVE', label: 'GST 12%', rate: 12 },
  { value: 'EIGHTEEN', label: 'GST 18%', rate: 18 },
  { value: 'TWENTYEIGHT', label: 'GST 28%', rate: 28 },
];

// Define HSN/SAC codes for common medical services
const hsnSacCodes = [
  { code: '9983', description: 'Medical and health services' },
  { code: '9984', description: 'Sewage and waste collection, treatment and disposal' },
  { code: '9985', description: 'Support services' },
  { code: '9986', description: 'Support services to agriculture, hunting, forestry, fishing, mining and utilities' },
  { code: '9987', description: 'Maintenance, repair and installation (except construction) services' },
  { code: '9988', description: 'Manufacturing services on physical inputs (goods) owned by others' },
  { code: '9989', description: 'Other manufacturing services; publishing, printing and reproduction services; materials recovery services' },
];

// Define validation schema
const invoiceItemSchema = z.object({
  itemType: z.string().min(1, 'Item type is required'),
  description: z.string().min(1, 'Description is required'),
  hsnSacCode: z.string().min(1, 'HSN/SAC code is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discountPercent: z.number().min(0).max(100, 'Discount cannot exceed 100%'),
  gstRateType: z.string().min(1, 'GST rate type is required'),
  departmentId: z.string().optional(),
  doctorId: z.string().optional(),
});

const invoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  dueDate: z.date().min(new Date(), 'Due date must be in the future'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  isGSTRegistered: z.boolean(),
  customerGSTIN: z.string().optional(),
  placeOfSupply: z.string().min(1, 'Place of supply is required'),
  hospitalGSTIN: z.string().min(1, 'Hospital GSTIN is required'),
  sendEmail: z.boolean(),
  sendWhatsApp: z.boolean(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: any;
  isEditing?: boolean;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, isEditing = false }) => {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Initialize form with default values or existing data
  const defaultValues: InvoiceFormValues = {
    patientId: initialData?.patientId || '',
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : addDays(new Date(), 15),
    items: initialData?.items || [
      {
        itemType: 'SERVICE',
        description: '',
        hsnSacCode: '9983',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        gstRateType: 'EXEMPT',
        departmentId: '',
        doctorId: '',
      },
    ],
    notes: initialData?.notes || '',
    termsAndConditions: initialData?.termsAndConditions || 'Payment is due within 15 days from the invoice date. Late payments may incur additional charges.',
    isGSTRegistered: initialData?.isGSTRegistered ?? true,
    customerGSTIN: initialData?.customerGSTIN || '',
    placeOfSupply: initialData?.placeOfSupply || 'Maharashtra',
    hospitalGSTIN: initialData?.hospitalGSTIN || '27AADCH1234A1Z5',
    sendEmail: initialData?.sendEmail ?? false,
    sendWhatsApp: initialData?.sendWhatsApp ?? false,
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchIsGSTRegistered = watch('isGSTRegistered');

  // Calculate invoice totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalTaxableAmount = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;
    let totalIgstAmount = 0;
    let totalAmount = 0;

    watchItems?.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const discountAmount = (lineTotal * item.discountPercent) / 100;
      const taxableAmount = lineTotal - discountAmount;

      let cgstRate = 0;
      let sgstRate = 0;
      let igstRate = 0;

      // Get GST rates based on the selected rate type
      const selectedGstRate = gstRateTypes.find((rate) => rate.value === item.gstRateType);
      if (selectedGstRate) {
        // For intra-state supply, split the rate between CGST and SGST
        cgstRate = selectedGstRate.rate / 2;
        sgstRate = selectedGstRate.rate / 2;
        // For inter-state supply, use IGST (not implemented in this example)
        // igstRate = selectedGstRate.rate;
      }

      const cgstAmount = (taxableAmount * cgstRate) / 100;
      const sgstAmount = (taxableAmount * sgstRate) / 100;
      const igstAmount = (taxableAmount * igstRate) / 100;
      const itemTotalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

      subtotal += lineTotal;
      totalDiscountAmount += discountAmount;
      totalTaxableAmount += taxableAmount;
      totalCgstAmount += cgstAmount;
      totalSgstAmount += sgstAmount;
      totalIgstAmount += igstAmount;
      totalAmount += itemTotalAmount;
    });

    return {
      subtotal,
      totalDiscountAmount,
      totalTaxableAmount,
      totalCgstAmount,
      totalSgstAmount,
      totalIgstAmount,
      totalAmount,
    };
  };

  const totals = calculateTotals();

  // Handle form submission
  const onSubmit = async (data: InvoiceFormValues) => {
    setLoading(true);
    try {
      const endpoint = isEditing ? `/api/billing/invoices/${initialData.id}` : '/api/billing/invoices';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save invoice');
      }

      const result = await response.json();
      toast.success(isEditing ? 'Invoice updated successfully' : 'Invoice created successfully');
      router.push(`/billing/invoices/${result.id}`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error.message || 'An error occurred while saving the invoice');
    } finally {
      setLoading(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient: any) => {
    if (patient) {
      setSelectedPatient(patient);
      setValue('patientId', patient.id);
    } else {
      setSelectedPatient(null);
      setValue('patientId', '');
    }
  };

  // Add a new invoice item
  const handleAddItem = () => {
    append({
      itemType: 'SERVICE',
      description: '',
      hsnSacCode: '9983',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      gstRateType: 'EXEMPT',
      departmentId: '',
      doctorId: '',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
        </Typography>

        <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Patient Information
                </Typography>
                <Controller
                  name="patientId"
                  control={control}
                  render={({ field }) => (
                    <PatientAutocomplete
                      value={selectedPatient}
                      onChange={handlePatientSelect}
                      error={!!errors.patientId}
                      helperText={errors.patientId?.message}
                    />
                  )}
                />

                {selectedPatient && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>UHID:</strong> {selectedPatient.uhid}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Contact:</strong> {selectedPatient.contactNumber}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedPatient.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Address:</strong> {selectedPatient.address || 'N/A'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Invoice Details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Controller
                        name="dueDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Due Date"
                            value={field.value}
                            onChange={field.onChange}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.dueDate,
                                helperText: errors.dueDate?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="isGSTRegistered"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          }
                          label="GST Registered"
                        />
                      )}
                    />
                  </Grid>

                  {watchIsGSTRegistered && (
                    <>
                      <Grid item xs={12}>
                        <Controller
                          name="hospitalGSTIN"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Hospital GSTIN"
                              fullWidth
                              error={!!errors.hospitalGSTIN}
                              helperText={errors.hospitalGSTIN?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="customerGSTIN"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Customer GSTIN (Optional)"
                              fullWidth
                              error={!!errors.customerGSTIN}
                              helperText={errors.customerGSTIN?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="placeOfSupply"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Place of Supply"
                              fullWidth
                              error={!!errors.placeOfSupply}
                              helperText={errors.placeOfSupply?.message}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Invoice Items */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Invoice Items</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>HSN/SAC</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Discount %</TableCell>
                  <TableCell align="right">GST Rate</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => {
                  const item = watchItems[index];
                  const lineTotal = item?.quantity * item?.unitPrice || 0;
                  const discountAmount = (lineTotal * (item?.discountPercent || 0)) / 100;
                  const taxableAmount = lineTotal - discountAmount;

                  // Get GST rate
                  const selectedGstRate = gstRateTypes.find((rate) => rate.value === item?.gstRateType);
                  const gstRate = selectedGstRate?.rate || 0;

                  // Calculate GST amounts
                  const cgstRate = gstRate / 2;
                  const sgstRate = gstRate / 2;
                  const cgstAmount = (taxableAmount * cgstRate) / 100;
                  const sgstAmount = (taxableAmount * sgstRate) / 100;
                  const totalAmount = taxableAmount + cgstAmount + sgstAmount;

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`items.${index}.description`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              placeholder="Description"
                              fullWidth
                              size="small"
                              error={!!errors.items?.[index]?.description}
                              helperText={errors.items?.[index]?.description?.message}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`items.${index}.hsnSacCode`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth size="small" error={!!errors.items?.[index]?.hsnSacCode}>
                              <Select
                                {...field}
                                displayEmpty
                              >
                                {hsnSacCodes.map((code) => (
                                  <MenuItem key={code.code} value={code.code}>
                                    {code.code} - {code.description}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.items?.[index]?.hsnSacCode && (
                                <FormHelperText>{errors.items?.[index]?.hsnSacCode?.message}</FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              inputProps={{ min: 1, step: 1 }}
                              size="small"
                              sx={{ width: '70px' }}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              error={!!errors.items?.[index]?.quantity}
                              helperText={errors.items?.[index]?.quantity?.message}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Controller
                          name={`items.${index}.unitPrice`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              inputProps={{ min: 0, step: 0.01 }}
                              size="small"
                              sx={{ width: '100px' }}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                              }}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              error={!!errors.items?.[index]?.unitPrice}
                              helperText={errors.items?.[index]?.unitPrice?.message}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Controller
                          name={`items.${index}.discountPercent`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              inputProps={{ min: 0, max: 100, step: 0.01 }}
                              size="small"
                              sx={{ width: '80px' }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              error={!!errors.items?.[index]?.discountPercent}
                              helperText={errors.items?.[index]?.discountPercent?.message}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Controller
                          name={`items.${index}.gstRateType`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth size="small" error={!!errors.items?.[index]?.gstRateType}>
                              <Select
                                {...field}
                                displayEmpty
                              >
                                {gstRateTypes.map((rate) => (
                                  <MenuItem key={rate.value} value={rate.value}>
                                    {rate.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.items?.[index]?.gstRateType && (
                                <FormHelperText>{errors.items?.[index]?.gstRateType?.message}</FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(totalAmount)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Invoice Totals */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Card variant="outlined" sx={{ width: { xs: '100%', md: '400px' } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">{formatCurrency(totals.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Discount:</Typography>
                <Typography variant="body2">-{formatCurrency(totals.totalDiscountAmount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Taxable Amount:</Typography>
                <Typography variant="body2">{formatCurrency(totals.totalTaxableAmount)}</Typography>
              </Box>
              {watchIsGSTRegistered && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">CGST:</Typography>
                    <Typography variant="body2">{formatCurrency(totals.totalCgstAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">SGST:</Typography>
                    <Typography variant="body2">{formatCurrency(totals.totalSgstAmount)}</Typography>
                  </Box>
                </>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Amount:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatCurrency(totals.totalAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Notes and Terms */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Add any additional notes here..."
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="termsAndConditions"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Terms and Conditions"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Add terms and conditions here..."
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Send Options */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Send Options
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="sendEmail"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Send invoice via email"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="sendWhatsApp"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Send invoice via WhatsApp"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              disabled={!isEditing}
            >
              Print
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default InvoiceForm;
