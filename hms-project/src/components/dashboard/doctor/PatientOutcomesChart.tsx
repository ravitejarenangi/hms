"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Box, 
  Typography, 
  CircularProgress,
  Divider,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';

interface PatientOutcomesData {
  recoveryRates: {
    doctor: number;
    department: number;
    hospital: number;
  };
  treatmentEffectiveness: {
    doctor: number;
    department: number;
    hospital: number;
  };
  byCondition: {
    condition: string;
    recoveryRate: number;
    treatmentEffectiveness: number;
    patientCount: number;
  }[];
  trends: {
    month: string;
    recoveryRate: number;
    treatmentEffectiveness: number;
  }[];
  patientSatisfaction: {
    average: number;
    distribution: {
      rating: number;
      percentage: number;
    }[];
  };
}

export default function PatientOutcomesChart() {
  const [data, setData] = useState<PatientOutcomesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/doctor/patient-outcomes');
        if (!response.ok) {
          throw new Error('Failed to fetch patient outcomes data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching patient outcomes data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Patient Outcome Metrics" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Patient Outcome Metrics" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="Patient Outcome Metrics" />
        <CardContent>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Patient Outcome Metrics" />
      <CardContent>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="patient outcomes tabs" sx={{ mb: 2 }}>
          <Tab label="Overview" />
          <Tab label="By Condition" />
          <Tab label="Satisfaction" />
        </Tabs>

        {activeTab === 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Recovery Rates
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {data.recoveryRates.doctor}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">
                    {data.recoveryRates.department}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">
                    {data.recoveryRates.hospital}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hospital
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" gutterBottom>
              Treatment Effectiveness
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {data.treatmentEffectiveness.doctor}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">
                    {data.treatmentEffectiveness.department}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">
                    {data.treatmentEffectiveness.hospital}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hospital
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Condition</TableCell>
                  <TableCell align="right">Patients</TableCell>
                  <TableCell align="right">Recovery</TableCell>
                  <TableCell align="right">Effectiveness</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.byCondition.map((row) => (
                  <TableRow key={row.condition}>
                    <TableCell component="th" scope="row">
                      {row.condition}
                    </TableCell>
                    <TableCell align="right">{row.patientCount}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={row.recoveryRate} 
                            color={row.recoveryRate > 85 ? "success" : row.recoveryRate > 75 ? "primary" : "warning"}
                            sx={{ height: 8, borderRadius: 5 }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{row.recoveryRate}%</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={row.treatmentEffectiveness} 
                            color={row.treatmentEffectiveness > 85 ? "success" : row.treatmentEffectiveness > 75 ? "primary" : "warning"}
                            sx={{ height: 8, borderRadius: 5 }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{row.treatmentEffectiveness}%</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h3" color="primary">
                {data.patientSatisfaction.average}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Average Patient Satisfaction (out of 5)
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Rating Distribution
            </Typography>
            {data.patientSatisfaction.distribution.map((item) => (
              <Box key={item.rating} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ minWidth: 20 }}>
                    {item.rating}★
                  </Typography>
                  <Box sx={{ width: '100%', ml: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.percentage} 
                      color={item.rating > 3 ? "success" : item.rating > 2 ? "primary" : "warning"}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ ml: 1, minWidth: 35 }}>
                    {item.percentage}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
