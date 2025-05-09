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
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

interface PatientsSeen {
  today: number;
  dailyAverage: number;
  breakdown: {
    type: string;
    count: number;
  }[];
  hourlyDistribution: {
    hour: string;
    count: number;
  }[];
  patients: {
    id: number;
    name: string;
    time: string;
    type: string;
    diagnosis: string;
  }[];
}

export default function PatientSeenWidget() {
  const [data, setData] = useState<PatientsSeen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/doctor/patients-seen');
        if (!response.ok) {
          throw new Error('Failed to fetch patients seen data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching patients seen data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader title="OPD Patients Seen Today" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="OPD Patients Seen Today" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="OPD Patients Seen Today" />
        <CardContent>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const comparisonToAverage = data.today - data.dailyAverage;
  const percentageChange = ((comparisonToAverage) / data.dailyAverage) * 100;

  return (
    <Card>
      <CardHeader title="OPD Patients Seen Today" />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" component="div" sx={{ mr: 2 }}>
            {data.today}
          </Typography>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {comparisonToAverage >= 0 ? (
                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
              ) : (
                <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
              )}
              <Typography 
                variant="body2" 
                color={comparisonToAverage >= 0 ? 'success.main' : 'error.main'}
              >
                {Math.abs(percentageChange).toFixed(1)}% {comparisonToAverage >= 0 ? 'above' : 'below'} average
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Daily average: {data.dailyAverage}
            </Typography>
          </Box>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Patient Type Breakdown
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {data.breakdown.map((item) => (
            <Grid item xs={4} key={item.type}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h6">{item.count}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.type}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="subtitle2" gutterBottom>
          Recent Patients
        </Typography>
        <List dense>
          {data.patients.slice(0, 5).map((patient, index) => (
            <Box key={patient.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem>
                <ListItemText 
                  primary={patient.name} 
                  secondary={
                    <>
                      <AccessTimeIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {patient.time} • {patient.diagnosis}
                    </>
                  } 
                />
                <Chip size="small" label={patient.type} />
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
