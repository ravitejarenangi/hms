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
  Typography,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  AttachFile as AttachmentIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface InsuranceClaimDetailProps {
  claim: any;
  onEdit: () => void;
}

const InsuranceClaimDetail: React.FC<InsuranceClaimDetailProps> = ({ claim, onEdit }) => {
  const theme = useTheme();
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleClaimAction = async (action: string) => {
    setProcessing(true);
    setActionResult(null);
    
    try {
      const response = await fetch('/api/billing/tpa', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId: claim.id,
          action,
        }),
      });
      
      if (response.ok) {
        setActionResult({
          type: 'success',
          message: `Claim successfully ${action === 'APPROVE' ? 'approved' : action === 'REJECT' ? 'rejected' : 'processed'}`,
        });
      } else {
        const error = await response.json();
        setActionResult({
          type: 'error',
          message: error.error || 'Failed to process claim',
        });
      }
    } catch (error) {
      setActionResult({
        type: 'error',
        message: 'An error occurred while processing the claim',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return theme.palette.info.main;
      case 'SUBMITTED_TO_TPA':
        return theme.palette.warning.main;
      case 'APPROVED':
        return theme.palette.success.main;
      case 'REJECTED':
        return theme.palette.error.main;
      case 'INFO_REQUESTED':
        return theme.palette.warning.light;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      {actionResult && (
        <Alert 
          severity={actionResult.type} 
          sx={{ mb: 2 }}
          onClose={() => setActionResult(null)}
        >
          {actionResult.message}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Claim #{claim.claimNumber}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            label={claim.status.replace('_', ' ')}
            sx={{
              bgcolor: `${getStatusColor(claim.status)}20`,
              color: getStatusColor(claim.status),
              fontWeight: 'medium',
            }}
          />
          <IconButton size="small" onClick={onEdit}>
            <EditIcon />
          </IconButton>
          <IconButton size="small">
            <PrintIcon />
          </IconButton>
          <IconButton size="small">
            <EmailIcon />
          </IconButton>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Claim Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1">
                  {claim.patient?.firstName} {claim.patient?.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient ID
                </Typography>
                <Typography variant="body1">
                  {claim.patient?.patientId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Invoice Number
                </Typography>
                <Typography variant="body1">
                  {claim.invoice?.invoiceNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Invoice Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(claim.invoice?.invoiceDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Insurance Provider
                </Typography>
                <Typography variant="body1">
                  {claim.insuranceProvider?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Policy Number
                </Typography>
                <Typography variant="body1">
                  {claim.policyNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Submission Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(claim.submissionDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  TPA Submission Date
                </Typography>
                <Typography variant="body1">
                  {claim.tpaSubmissionDate ? formatDate(claim.tpaSubmissionDate) : 'Not submitted yet'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Financial Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Invoice Amount
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(claim.invoice?.totalAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Claim Amount
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(claim.claimAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Coverage Percentage
                </Typography>
                <Typography variant="body1">
                  {claim.coveragePercentage}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Approved Amount
                </Typography>
                <Typography 
                  variant="body1" 
                  fontWeight="bold"
                  color={claim.status === 'APPROVED' ? 'success.main' : 'text.primary'}
                >
                  {claim.approvedAmount ? formatCurrency(claim.approvedAmount) : 'Pending approval'}
                </Typography>
              </Grid>
              {claim.status === 'APPROVED' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient Responsibility
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(claim.invoice?.totalAmount - claim.approvedAmount)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {claim.notes && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                {claim.notes}
              </Typography>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              {claim.status === 'SUBMITTED' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AttachmentIcon />}
                  fullWidth
                  disabled={processing}
                  onClick={() => handleClaimAction('SUBMIT_TO_TPA')}
                >
                  {processing ? <CircularProgress size={24} /> : 'Submit to TPA'}
                </Button>
              )}
              
              {claim.status === 'SUBMITTED_TO_TPA' && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    fullWidth
                    disabled={processing}
                    onClick={() => handleClaimAction('APPROVE')}
                  >
                    {processing ? <CircularProgress size={24} /> : 'Approve Claim'}
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<RejectIcon />}
                    fullWidth
                    disabled={processing}
                    onClick={() => handleClaimAction('REJECT')}
                  >
                    {processing ? <CircularProgress size={24} /> : 'Reject Claim'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<InfoIcon />}
                    fullWidth
                    disabled={processing}
                    onClick={() => handleClaimAction('REQUEST_INFO')}
                  >
                    {processing ? <CircularProgress size={24} /> : 'Request Information'}
                  </Button>
                </>
              )}
              
              {claim.status === 'INFO_REQUESTED' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AttachmentIcon />}
                  fullWidth
                  disabled={processing}
                  onClick={() => handleClaimAction('SUBMIT_TO_TPA')}
                >
                  {processing ? <CircularProgress size={24} /> : 'Resubmit to TPA'}
                </Button>
              )}
              
              {claim.status === 'APPROVED' && (
                <Alert severity="success">
                  This claim has been approved for {formatCurrency(claim.approvedAmount)}
                </Alert>
              )}
              
              {claim.status === 'REJECTED' && (
                <Alert severity="error">
                  This claim has been rejected
                </Alert>
              )}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Documents
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {claim.documents && claim.documents.length > 0 ? (
              <Stack spacing={1}>
                {claim.documents.map((doc: any, index: number) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <AttachmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {doc.fileName || `Document ${index + 1}`}
                    </Typography>
                    <IconButton size="small">
                      <PrintIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No documents attached
              </Typography>
            )}
            
            <Button
              variant="outlined"
              startIcon={<AttachmentIcon />}
              fullWidth
              sx={{ mt: 2 }}
            >
              Upload Document
            </Button>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2">
                  Claim Submitted
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(claim.submissionDate)}
                </Typography>
              </Box>
              
              {claim.tpaSubmissionDate && (
                <Box>
                  <Typography variant="subtitle2">
                    Submitted to TPA
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(claim.tpaSubmissionDate)}
                  </Typography>
                </Box>
              )}
              
              {claim.status === 'INFO_REQUESTED' && (
                <Box>
                  <Typography variant="subtitle2">
                    Information Requested
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(claim.updatedAt)}
                  </Typography>
                </Box>
              )}
              
              {claim.tpaApprovalDate && (
                <Box>
                  <Typography variant="subtitle2">
                    Claim Approved
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(claim.tpaApprovalDate)}
                  </Typography>
                </Box>
              )}
              
              {claim.tpaRejectionDate && (
                <Box>
                  <Typography variant="subtitle2">
                    Claim Rejected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(claim.tpaRejectionDate)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InsuranceClaimDetail;
