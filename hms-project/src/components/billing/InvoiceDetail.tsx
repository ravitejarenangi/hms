import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Download as DownloadIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

// Types
interface InvoiceItem {
  id: string;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRateType: string;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

interface Payment {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  transactionId?: string;
  chequeNumber?: string;
  bankName?: string;
  notes?: string;
  receivedBy: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    contactNumber: string;
    email: string;
    address: string;
  };
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  termsAndConditions?: string;
  isGSTRegistered: boolean;
  customerGSTIN?: string;
  placeOfSupply: string;
  hospitalGSTIN: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  invoiceItems: InvoiceItem[];
  payments: Payment[];
}

interface InvoiceDetailProps {
  invoice: Invoice;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoice }) => {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Get status chip color
  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'warning';
      case 'PENDING':
        return 'info';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Format status label
  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  // Format payment method
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Cash';
      case 'CREDIT_CARD':
        return 'Credit Card';
      case 'DEBIT_CARD':
        return 'Debit Card';
      case 'UPI':
        return 'UPI';
      case 'NETBANKING':
        return 'Net Banking';
      case 'CHEQUE':
        return 'Cheque';
      case 'INSURANCE':
        return 'Insurance';
      case 'WALLET':
        return 'Wallet';
      default:
        return 'Other';
    }
  };
  
  // Handle invoice cancellation
  const handleCancelInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/cancel`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel invoice');
      }
      
      toast.success('Invoice cancelled successfully');
      router.refresh();
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error('Failed to cancel invoice');
    } finally {
      setLoading(false);
      setCancelDialogOpen(false);
    }
  };
  
  // Handle sending invoice via email
  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/send-email`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to send invoice via email');
      }
      
      toast.success('Invoice sent via email successfully');
    } catch (error) {
      console.error('Error sending invoice via email:', error);
      toast.error('Failed to send invoice via email');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sending invoice via WhatsApp
  const handleSendWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/send-whatsapp`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to send invoice via WhatsApp');
      }
      
      toast.success('Invoice sent via WhatsApp successfully');
    } catch (error) {
      console.error('Error sending invoice via WhatsApp:', error);
      toast.error('Failed to send invoice via WhatsApp');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle downloading invoice as PDF
  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to download invoice PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      toast.error('Failed to download invoice PDF');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
          >
            Back to Invoices
          </Button>
          
          <Stack direction="row" spacing={1}>
            {invoice.status !== 'CANCELLED' && invoice.balanceAmount > 0 && (
              <Button
                variant="contained"
                color="success"
                startIcon={<PaymentIcon />}
                onClick={() => router.push(`/billing/invoices/${invoice.id}/payment`)}
              >
                Add Payment
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>
            
            {invoice.status !== 'CANCELLED' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Invoice
              </Button>
            )}
          </Stack>
        </Box>
        
        {/* Invoice Header */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Tax Invoice
            </Typography>
            <Typography variant="h6" color="primary">
              {invoice.invoiceNumber}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={formatStatusLabel(invoice.status)}
                color={getStatusChipColor(invoice.status) as any}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="body2">
              <strong>Invoice Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body2">
              <strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
            </Typography>
            {invoice.isGSTRegistered && (
              <>
                <Typography variant="body2">
                  <strong>Hospital GSTIN:</strong> {invoice.hospitalGSTIN}
                </Typography>
                <Typography variant="body2">
                  <strong>Place of Supply:</strong> {invoice.placeOfSupply}
                </Typography>
              </>
            )}
          </Grid>
        </Grid>
        
        {/* Customer and Billing Information */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Bill To
                </Typography>
                <Typography variant="body1">
                  {invoice.patient.firstName} {invoice.patient.lastName}
                </Typography>
                <Typography variant="body2">
                  UHID: {invoice.patient.uhid}
                </Typography>
                <Typography variant="body2">
                  {invoice.patient.address}
                </Typography>
                <Typography variant="body2">
                  Phone: {invoice.patient.contactNumber}
                </Typography>
                <Typography variant="body2">
                  Email: {invoice.patient.email || 'N/A'}
                </Typography>
                {invoice.isGSTRegistered && invoice.customerGSTIN && (
                  <Typography variant="body2">
                    GSTIN: {invoice.customerGSTIN}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Payment Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Amount:</Typography>
                  <Typography variant="body2">{formatCurrency(invoice.totalAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Amount Paid:</Typography>
                  <Typography variant="body2">{formatCurrency(invoice.paidAmount)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">Balance Due:</Typography>
                  <Typography 
                    variant="subtitle2" 
                    color={invoice.balanceAmount > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(invoice.balanceAmount)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Invoice Items */}
        <Typography variant="h6" gutterBottom>
          Invoice Items
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>HSN/SAC</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Discount</TableCell>
                <TableCell align="right">Taxable Value</TableCell>
                {invoice.isGSTRegistered && (
                  <>
                    <TableCell align="right">CGST</TableCell>
                    <TableCell align="right">SGST</TableCell>
                  </>
                )}
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.invoiceItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.hsnSacCode}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell align="right">
                    {item.discountPercent > 0 ? `${item.discountPercent}% (${formatCurrency(item.discountAmount)})` : '-'}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(item.taxableAmount)}</TableCell>
                  {invoice.isGSTRegistered && (
                    <>
                      <TableCell align="right">
                        {item.cgstRate > 0 ? `${item.cgstRate}% (${formatCurrency(item.cgstAmount)})` : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {item.sgstRate > 0 ? `${item.sgstRate}% (${formatCurrency(item.sgstAmount)})` : '-'}
                      </TableCell>
                    </>
                  )}
                  <TableCell align="right">{formatCurrency(item.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Invoice Totals */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2">
                  {invoice.notes || 'No notes provided.'}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Terms and Conditions
                </Typography>
                <Typography variant="body2">
                  {invoice.termsAndConditions || 'No terms and conditions provided.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Invoice Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">{formatCurrency(invoice.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2">-{formatCurrency(invoice.discountAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Taxable Amount:</Typography>
                  <Typography variant="body2">{formatCurrency(invoice.taxableAmount)}</Typography>
                </Box>
                {invoice.isGSTRegistered && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">CGST:</Typography>
                      <Typography variant="body2">{formatCurrency(invoice.cgstAmount)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">SGST:</Typography>
                      <Typography variant="body2">{formatCurrency(invoice.sgstAmount)}</Typography>
                    </Box>
                  </>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">Total Amount:</Typography>
                  <Typography variant="subtitle2">{formatCurrency(invoice.totalAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">Amount Paid:</Typography>
                  <Typography variant="subtitle2">{formatCurrency(invoice.paidAmount)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Balance Due:
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold"
                    color={invoice.balanceAmount > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(invoice.balanceAmount)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Payment History
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Receipt #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.receiptNumber}</TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>{formatPaymentMethod(payment.paymentMethod)}</TableCell>
                      <TableCell>
                        {payment.transactionId || payment.chequeNumber || '-'}
                        {payment.chequeNumber && payment.bankName && ` (${payment.bankName})`}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Print Receipt">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/billing/payments/${payment.id}`)}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
      
      {/* Cancel Invoice Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this invoice? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
          <Button 
            onClick={handleCancelInvoice} 
            color="error" 
            disabled={loading}
          >
            Yes, Cancel Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceDetail;
