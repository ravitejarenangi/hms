import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Paper,
  Slider,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Doctor {
  id: string;
  consultationFee: number;
  user: {
    name: string;
  };
}

interface BillingDistribution {
  id?: string;
  coConsultationId: string;
  primaryDoctorPercentage: number;
  secondaryDoctorPercentage: number;
  primaryDoctorAmount: number;
  secondaryDoctorAmount: number;
  totalAmount: number;
  isCustom: boolean;
}

interface DoctorBillingDistributionProps {
  coConsultationId: string;
  doctorId: string;
}

const DoctorBillingDistribution: React.FC<DoctorBillingDistributionProps> = ({
  coConsultationId,
  doctorId
}) => {
  const { data: session } = useSession();
  const [distribution, setDistribution] = useState<BillingDistribution | null>(null);
  const [primaryDoctor, setPrimaryDoctor] = useState<Doctor | null>(null);
  const [secondaryDoctor, setSecondaryDoctor] = useState<Doctor | null>(null);
  const [primaryPercentage, setPrimaryPercentage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPrimaryDoctor, setIsPrimaryDoctor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session) {
      setIsAdmin(session.user.isAdmin || false);
    }
  }, [session]);

  // Fetch billing distribution
  const fetchBillingDistribution = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/doctors/billing/distribution?coConsultationId=${coConsultationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing distribution');
      }
      
      const data = await response.json();
      
      setDistribution(data.data.billingDistribution);
      setPrimaryDoctor(data.data.primaryDoctor);
      setSecondaryDoctor(data.data.secondaryDoctor);
      setPrimaryPercentage(data.data.billingDistribution.primaryDoctorPercentage);
      
      // Check if current user is primary doctor
      setIsPrimaryDoctor(doctorId === data.data.primaryDoctor.id);
      
    } catch (err) {
      setError('Error loading billing distribution. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coConsultationId) {
      fetchBillingDistribution();
    }
  }, [coConsultationId]);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      setPrimaryPercentage(newValue);
    }
  };

  const handleSaveDistribution = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/doctors/billing/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coConsultationId,
          primaryDoctorPercentage: primaryPercentage,
          secondaryDoctorPercentage: 100 - primaryPercentage,
          isCustom: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save billing distribution');
      }
      
      setSuccess('Billing distribution saved successfully');
      fetchBillingDistribution();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error saving billing distribution. Please try again.');
      }
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setPrimaryPercentage(50);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (!distribution || !primaryDoctor || !secondaryDoctor) {
    return (
      <Alert severity="error">
        Could not load billing distribution information.
      </Alert>
    );
  }

  // Calculate amounts based on current slider position
  const totalAmount = distribution.totalAmount;
  const primaryAmount = (totalAmount * primaryPercentage) / 100;
  const secondaryAmount = (totalAmount * (100 - primaryPercentage)) / 100;

  const canEdit = isPrimaryDoctor || isAdmin;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Co-Consultation Billing Distribution
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Total Consultation Fee: {formatCurrency(totalAmount)}
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary">
                  {primaryDoctor.user.name} (Primary)
                </Typography>
                <Typography variant="h6">
                  {primaryPercentage}% ({formatCurrency(primaryAmount)})
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Base Fee: {formatCurrency(Number(primaryDoctor.consultationFee))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="secondary">
                  {secondaryDoctor.user.name} (Secondary)
                </Typography>
                <Typography variant="h6">
                  {100 - primaryPercentage}% ({formatCurrency(secondaryAmount)})
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Base Fee: {formatCurrency(Number(secondaryDoctor.consultationFee))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {canEdit ? (
          <>
            <Typography id="billing-distribution-slider" gutterBottom>
              Adjust Distribution
            </Typography>
            <Slider
              value={primaryPercentage}
              onChange={handleSliderChange}
              aria-labelledby="billing-distribution-slider"
              valueLabelDisplay="auto"
              step={5}
              marks
              min={0}
              max={100}
              disabled={saving}
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveDistribution}
                disabled={saving || primaryPercentage === distribution.primaryDoctorPercentage}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Distribution'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetToDefault}
                disabled={saving || primaryPercentage === 50}
              >
                Reset to 50/50
              </Button>
            </Box>
          </>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            Only the primary doctor or an administrator can modify the billing distribution.
          </Alert>
        )}
      </Paper>
      
      <Typography variant="body2" color="textSecondary">
        Note: The billing distribution determines how the total consultation fee is split between the primary and secondary doctors for this co-consultation.
      </Typography>
    </Box>
  );
};

export default DoctorBillingDistribution;
