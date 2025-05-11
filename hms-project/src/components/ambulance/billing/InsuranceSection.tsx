import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Check as CheckIcon,
  Add as AddIcon,
  Sync as SyncIcon,
  Error as ErrorIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export const InsuranceSection: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [insuranceDetails, setInsuranceDetails] = useState({
    policyNumber: '',
    patientName: '',
    coverageType: '',
  });
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  // List of insurance providers integrated with the system
  const insuranceProviders = [
    { id: 'STAR_HEALTH', name: 'Star Health Insurance' },
    { id: 'APOLLO_MUNICH', name: 'Apollo Munich Health Insurance' },
    { id: 'MAX_BUPA', name: 'Max Bupa Health Insurance' },
    { id: 'ICICI_LOMBARD', name: 'ICICI Lombard Health Insurance' },
    { id: 'HDFC_ERGO', name: 'HDFC ERGO Health Insurance' },
    { id: 'NATIONAL', name: 'National Insurance' },
    { id: 'NEW_INDIA', name: 'New India Assurance' },
    { id: 'ORIENTAL', name: 'Oriental Insurance' },
  ];

  // Coverage types
  const coverageTypes = [
    { id: 'BASIC', name: 'Basic Coverage (60%)' },
    { id: 'STANDARD', name: 'Standard Coverage (80%)' },
    { id: 'PREMIUM', name: 'Premium Coverage (90%)' },
    { id: 'FULL', name: 'Full Coverage (100%)' },
  ];

  // Fetch pending insurance claims
  const fetchPendingClaims = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ambulances/billing?paymentStatus=INSURANCE_PENDING');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending insurance claims');
      }
      
      const result = await response.json();
      setPendingClaims(result.data);
    } catch (error) {
      console.error('Error fetching pending claims:', error);
      toast.error('Failed to load pending insurance claims');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load
  useEffect(() => {
    fetchPendingClaims();
  }, []);

  // Handle insurance provider selection
  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    setVerificationResult(null);
  };

  // Handle insurance details change
  const handleDetailsChange = (field: string, value: string) => {
    setInsuranceDetails({
      ...insuranceDetails,
      [field]: value,
    });
  };

  // Verify insurance coverage
  const verifyInsurance = async () => {
    if (!selectedProvider || !insuranceDetails.policyNumber || !insuranceDetails.patientName) {
      toast.error('Please fill all required fields');
      return;
    }

    setVerificationLoading(true);
    try {
      // In a real implementation, this would call the actual insurance provider's API
      // For now, we'll simulate a verification response
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate random verification result (for demonstration)
      const isVerified = Math.random() > 0.3; // 70% chance of successful verification
      
      if (isVerified) {
        const coverage = coverageTypes.find(c => c.id === insuranceDetails.coverageType) || coverageTypes[0];
        setVerificationResult({
          verified: true,
          policyHolder: insuranceDetails.patientName,
          policyNumber: insuranceDetails.policyNumber,
          provider: insuranceProviders.find(p => p.id === selectedProvider)?.name,
          coverageType: coverage.name,
          coveragePercentage: coverage.id === 'BASIC' ? 60 : coverage.id === 'STANDARD' ? 80 : coverage.id === 'PREMIUM' ? 90 : 100,
          ambulanceCoverage: true,
          claimLimit: Math.floor(Math.random() * 500000) + 500000, // Random limit between 5-10 lakhs
          remainingLimit: Math.floor(Math.random() * 400000) + 100000, // Random remaining limit
          verificationId: `VER${Date.now().toString().substring(7)}`,
          verificationDate: new Date(),
        });
        toast.success('Insurance policy verified successfully');
      } else {
        setVerificationResult({
          verified: false,
          error: 'Policy not found or inactive',
          errorCode: 'POL_404',
          checkTime: new Date(),
        });
        toast.error('Insurance verification failed');
      }
    } catch (error) {
      console.error('Error verifying insurance:', error);
      toast.error('Failed to verify insurance coverage');
      setVerificationResult({
        verified: false,
        error: 'Verification service unavailable',
        errorCode: 'SVC_503',
        checkTime: new Date(),
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  // Submit insurance claim
  const submitClaim = async (billingId: string) => {
    if (!selectedClaim && !billingId) {
      toast.error('No claim selected for submission');
      return;
    }

    const claimId = billingId || selectedClaim?.id;
    setLoading(true);
    
    try {
      // In a real implementation, this would submit the claim to the insurance provider's API
      // For now, we'll simulate a submission response
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the billing record to reflect the insurance claim submission
      const response = await fetch('/api/ambulances/billing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: claimId,
          insuranceCovered: true,
          insuranceProvider: verificationResult.provider || selectedProvider,
          insurancePolicyNumber: verificationResult.policyNumber || insuranceDetails.policyNumber,
          notes: `Insurance claim submitted on ${format(new Date(), 'dd/MM/yyyy HH:mm')}. Verification ID: ${verificationResult?.verificationId || 'N/A'}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update billing record');
      }
      
      toast.success('Insurance claim submitted successfully');
      fetchPendingClaims();
      
      // Clear selections
      if (billingId === selectedClaim?.id) {
        setSelectedClaim(null);
      }
    } catch (error) {
      console.error('Error submitting insurance claim:', error);
      toast.error('Failed to submit insurance claim');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Insurance Claim Integration</Typography>
      
      <Grid container spacing={3}>
        {/* Insurance Verification */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Insurance Verification</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Insurance Provider</InputLabel>
                  <Select
                    value={selectedProvider}
                    label="Insurance Provider"
                    onChange={(e) => handleProviderChange(e.target.value)}
                  >
                    <MenuItem value="">Select Provider</MenuItem>
                    {insuranceProviders.map((provider) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Policy Number"
                  fullWidth
                  value={insuranceDetails.policyNumber}
                  onChange={(e) => handleDetailsChange('policyNumber', e.target.value)}
                  placeholder="e.g., HLTH1234567890"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Patient Name"
                  fullWidth
                  value={insuranceDetails.patientName}
                  onChange={(e) => handleDetailsChange('patientName', e.target.value)}
                  placeholder="Enter name as it appears on policy"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Coverage Type</InputLabel>
                  <Select
                    value={insuranceDetails.coverageType}
                    label="Coverage Type"
                    onChange={(e) => handleDetailsChange('coverageType', e.target.value)}
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    {coverageTypes.map((coverage) => (
                      <MenuItem key={coverage.id} value={coverage.id}>
                        {coverage.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={verifyInsurance}
                  disabled={verificationLoading || !selectedProvider || !insuranceDetails.policyNumber}
                  fullWidth
                  startIcon={<SyncIcon />}
                >
                  {verificationLoading ? 'Verifying...' : 'Verify Insurance Coverage'}
                </Button>
              </Grid>
              
              {verificationLoading && (
                <Grid item xs={12}>
                  <LinearProgress />
                </Grid>
              )}
              
              {verificationResult && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    {verificationResult.verified ? (
                      <Alert severity="success" icon={<CheckIcon />}>
                        Insurance policy verified successfully
                      </Alert>
                    ) : (
                      <Alert severity="error" icon={<ErrorIcon />}>
                        {verificationResult.error}
                      </Alert>
                    )}
                  </Box>
                  
                  {verificationResult.verified && (
                    <Card sx={{ mt: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Verification Details
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Policy Holder:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">{verificationResult.policyHolder}</Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Policy Number:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">{verificationResult.policyNumber}</Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Provider:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">{verificationResult.provider}</Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Coverage:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">{verificationResult.coverageType}</Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Ambulance Coverage:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              {verificationResult.ambulanceCoverage ? 'Yes' : 'No'}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Claim Limit:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              {formatCurrency(verificationResult.claimLimit)}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Remaining Limit:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              {formatCurrency(verificationResult.remainingLimit)}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Verification ID:</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">{verificationResult.verificationId}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
        
        {/* Pending Insurance Claims */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Pending Insurance Claims</Typography>
            
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            
            {!loading && pendingClaims.length === 0 && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body1" color="text.secondary">
                  No pending insurance claims found
                </Typography>
              </Box>
            )}
            
            {!loading && pendingClaims.map((claim) => (
              <Card 
                key={claim.id} 
                sx={{ 
                  mb: 2, 
                  cursor: 'pointer',
                  border: selectedClaim?.id === claim.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                }}
                onClick={() => setSelectedClaim(claim)}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle1">
                        Ambulance #{claim.AmbulanceDispatch?.Ambulance?.registrationNumber || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Patient ID: {claim.AmbulanceDispatch?.patientId || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {formatDate(claim.createdAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Service: {claim.AmbulanceDispatch?.purpose || 'Emergency Transport'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                        {formatCurrency(claim.totalAmount)}
                      </Typography>
                      <Chip
                        label="Insurance Pending"
                        color="secondary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            
            {selectedClaim && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" gutterBottom>Selected Claim</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Claim ID:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">{selectedClaim.id}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(selectedClaim.totalAmount)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Base Charge:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {formatCurrency(selectedClaim.baseCharge)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Distance Charge:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {formatCurrency(selectedClaim.distanceCharge)}
                    </Typography>
                  </Grid>
                  
                  {selectedClaim.waitingCharge > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Waiting Charge:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {formatCurrency(selectedClaim.waitingCharge)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {selectedClaim.equipmentCharge > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Equipment Charge:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {formatCurrency(selectedClaim.equipmentCharge)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<HospitalIcon />}
                      onClick={() => submitClaim(selectedClaim.id)}
                      disabled={!verificationResult?.verified || loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Insurance Claim'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
