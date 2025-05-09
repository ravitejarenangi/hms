"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Box, 
  Typography, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';

interface WaitingTimeData {
  currentAverage: number;
  threshold: {
    low: number;
    medium: number;
    high: number;
  };
  historical: {
    date: string;
    average: number;
  }[];
  queue: {
    id: number;
    patientName: string;
    waitingTime: number;
    status: string;
  }[];
}

export default function WaitingTimeGauge() {
  const [data, setData] = useState<WaitingTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/doctor/waiting-time');
        if (!response.ok) {
          throw new Error('Failed to fetch waiting time data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching waiting time data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getThresholdColor = (waitTime: number) => {
    if (!data) return 'info.main';
    if (waitTime <= data.threshold.low) return 'success.main';
    if (waitTime <= data.threshold.medium) return 'warning.main';
    return 'error.main';
  };

  const getThresholdLabel = (waitTime: number) => {
    if (!data) return 'Loading...';
    if (waitTime <= data.threshold.low) return 'Good';
    if (waitTime <= data.threshold.medium) return 'Moderate';
    return 'High';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="OPD Patient Waiting Time" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="OPD Patient Waiting Time" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="OPD Patient Waiting Time" />
        <CardContent>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const color = getThresholdColor(data.currentAverage);
  const label = getThresholdLabel(data.currentAverage);
  const progress = Math.min(100, (data.currentAverage / data.threshold.high) * 100);

  return (
    <Card>
      <CardHeader title="OPD Patient Waiting Time" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={progress}
              size={120}
              thickness={5}
              sx={{ color }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h4" component="div" color={color}>
                {data.currentAverage}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Average waiting time (minutes)
          </Typography>
          <Chip 
            label={label} 
            color={
              label === 'Good' ? 'success' : 
              label === 'Moderate' ? 'warning' : 'error'
            } 
            sx={{ mt: 1 }}
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Current Patient Queue
        </Typography>
        <List dense>
          {data.queue.map((patient, index) => (
            <Box key={patient.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem>
                <ListItemText 
                  primary={patient.patientName} 
                  secondary={`Waiting: ${patient.waitingTime} mins`} 
                />
                <Chip 
                  size="small" 
                  label={patient.status} 
                  color={patient.waitingTime > data.threshold.medium ? 'error' : 'default'} 
                />
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
