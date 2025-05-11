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
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Save as SaveIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Define payment methods
const paymentMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NETBANKING', label: 'Net Banking' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'OTHER', label: 'Other' },
];

// Define validation schema
const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  paymentMethod: z.enum([
    'CASH', 
    'CREDIT_CARD', 
    'DEBIT_CARD', 
    'UPI', 
    'NETBANKING', 
    'CHEQUE', 
    'INSURANCE', 
    'WALLET',
    'OTHER'
  ]),
  amount: z.number().positive('Amount must be positive'),
  transactionId: z.string().optional(),
  chequeNumber: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
  sendReceipt: z.boolean(),
  sendReceiptVia: z.enum(['EMAIL', 'WHATSAPP', 'BOTH']).optional(),
}).refine(data => {
  // Require transaction ID for digital payment methods
  if (['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NETBANKING', 'WALLET'].includes(data.paymentMethod) && !data.transactionId) {
    return false;
  }
  // Require cheque number and bank name for cheque payments
  if (data.paymentMethod === 'CHEQUE' && (!data.chequeNumber || !data.bankName)) {
    return false;
  }
  return true;
}, {
  message: "Additional payment details are required for the selected payment method",
  path: ["paymentMethod"],
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  invoiceData: any;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ invoiceData }) => {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Initialize form with default values
  const defaultValues: PaymentFormValues = {
    invoiceId: invoiceData?.id || '',
    paymentMethod: 'CASH',
    amount: invoiceData?.balanceAmount || 0,
    transactionId: '',
    chequeNumber: '',
    bankName: '',
    notes: '',
    sendReceipt: true,
    sendReceiptVia: 'EMAIL',
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues,
  });

  const watchPaymentMethod = watch('paymentMethod');
  const watchSendReceipt = watch('sendReceipt');
  const watchAmount = watch('amount');

  // Handle form submission
  const onSubmit = async (data: PaymentFormValues) => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }

      const result = await response.json();
      toast.success('Payment processed successfully');
      router.push(`/billing/invoices/${invoiceData.id}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'An error occurred while processing the payment');
    } finally {
      setLoading(false);
    }
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
          Process Payment
        </Typography>

        <Grid container spacing={3}>
          {/* Invoice Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Invoice Number:</strong> {invoiceData?.invoiceNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Patient:</strong> {invoiceData?.patient?.firstName} {invoiceData?.patient?.lastName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Invoice Date:</strong> {new Date(invoiceData?.invoiceDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Due Date:</strong> {new Date(invoiceData?.dueDate).toLocaleDateString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Amount:</Typography>
                  <Typography variant="body2">{formatCurrency(invoiceData?.totalAmount || 0)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Amount Paid:</Typography>
                  <Typography variant="body2">{formatCurrency(invoiceData?.paidAmount || 0)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Balance Due:
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                    {formatCurrency(invoiceData?.balanceAmount || 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Payment Amount"
                          type="number"
                          fullWidth
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          inputProps={{ 
                            min: 0.01, 
                            max: invoiceData?.balanceAmount || 0,
                            step: 0.01 
                          }}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          error={!!errors.amount}
                          helperText={errors.amount?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="paymentMethod"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.paymentMethod}>
                          <InputLabel id="payment-method-label">Payment Method</InputLabel>
                          <Select
                            {...field}
                            labelId="payment-method-label"
                            label="Payment Method"
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method.value} value={method.value}>
                                {method.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.paymentMethod && (
                            <FormHelperText>{errors.paymentMethod.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {/* Conditional fields based on payment method */}
                  {['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NETBANKING', 'WALLET'].includes(watchPaymentMethod) && (
                    <Grid item xs={12}>
                      <Controller
                        name="transactionId"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Transaction ID"
                            fullWidth
                            error={!!errors.transactionId}
                            helperText={errors.transactionId?.message}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  {watchPaymentMethod === 'CHEQUE' && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="chequeNumber"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Cheque Number"
                              fullWidth
                              error={!!errors.chequeNumber}
                              helperText={errors.chequeNumber?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="bankName"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Bank Name"
                              fullWidth
                              error={!!errors.bankName}
                              helperText={errors.bankName?.message}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Notes"
                          multiline
                          rows={2}
                          fullWidth
                          placeholder="Add any additional notes here..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Receipt Options */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Receipt Options
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="sendReceipt"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Send receipt to patient"
                  />
                )}
              />
            </Grid>

            {watchSendReceipt && (
              <Grid item xs={12}>
                <Controller
                  name="sendReceiptVia"
                  control={control}
                  render={({ field }) => (
                    <FormControl component="fieldset">
                      <RadioGroup row {...field}>
                        <FormControlLabel value="EMAIL" control={<Radio />} label="Email" />
                        <FormControlLabel value="WHATSAPP" control={<Radio />} label="WhatsApp" />
                        <FormControlLabel value="BOTH" control={<Radio />} label="Both" />
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Payment Summary */}
        <Box sx={{ mt: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Invoice Total:</Typography>
                <Typography variant="body1">{formatCurrency(invoiceData?.totalAmount || 0)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Previously Paid:</Typography>
                <Typography variant="body1">{formatCurrency(invoiceData?.paidAmount || 0)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Current Payment:</Typography>
                <Typography variant="body1">{formatCurrency(watchAmount || 0)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Remaining Balance:
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold"
                  color={
                    (invoiceData?.balanceAmount || 0) - (watchAmount || 0) <= 0 
                      ? 'success.main' 
                      : 'error.main'
                  }
                >
                  {formatCurrency(Math.max(0, (invoiceData?.balanceAmount || 0) - (watchAmount || 0)))}
                </Typography>
              </Box>
            </CardContent>
          </Card>
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
              type="submit"
              variant="contained"
              startIcon={<ReceiptIcon />}
              disabled={loading || watchAmount <= 0 || watchAmount > (invoiceData?.balanceAmount || 0)}
            >
              {loading ? 'Processing...' : 'Process Payment'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default PaymentForm;
