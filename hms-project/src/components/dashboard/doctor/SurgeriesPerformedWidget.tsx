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
  Button,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon,
  Room as RoomIcon,
  Note as NoteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface Surgery {
  id: number;
  patientName: string;
  time: string;
  location: string;
  type: string;
  procedure: string;
  duration: number;
  outcome: string;
  notes: string;
  postOpCare: string[];
}

interface SurgeriesPerformedData {
  total: number;
  byOutcome: {
    outcome: string;
    count: number;
  }[];
  surgeries: Surgery[];
}

export default function SurgeriesPerformedWidget() {
  const [data, setData] = useState<SurgeriesPerformedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/doctor/surgeries-performed');
        if (!response.ok) {
          throw new Error('Failed to fetch surgeries performed data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching surgeries performed data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'successful':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'complications':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'successful':
        return 'success';
      case 'complications':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Surgeries Performed Today" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Surgeries Performed Today" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="Surgeries Performed Today" />
        <CardContent>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Surgeries Performed Today" 
        subheader={`${data.total} surgeries completed`}
      />
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          By Outcome
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {data.byOutcome.map((item) => (
            <Grid item xs={4} key={item.outcome}>
              <Card 
                variant="outlined" 
                sx={{ 
                  textAlign: 'center', 
                  p: 1,
                  borderColor: item.outcome.toLowerCase() === 'successful' ? 'success.main' : 
                              item.outcome.toLowerCase() === 'complications' ? 'warning.main' : 
                              item.outcome.toLowerCase() === 'failed' ? 'error.main' : 'divider'
                }}
              >
                <Typography variant="h6">{item.count}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.outcome}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="subtitle2" gutterBottom>
          Completed Surgeries
        </Typography>
        <List dense>
          {data.surgeries.map((surgery, index) => (
            <Box key={surgery.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                secondaryAction={
                  <Tooltip title="View Notes">
                    <IconButton edge="end" aria-label="notes" size="small">
                      <NoteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" component="span">
                        {surgery.patientName}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={surgery.outcome} 
                        color={getOutcomeColor(surgery.outcome)} 
                        icon={getOutcomeIcon(surgery.outcome)}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <AccessTimeIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" component="span" sx={{ mr: 1 }}>
                          {surgery.time} ({surgery.duration} min)
                        </Typography>
                        <RoomIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" component="span">
                          {surgery.location}
                        </Typography>
                      </Box>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {surgery.type}: {surgery.procedure}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        Post-Op: {surgery.postOpCare[0]}{surgery.postOpCare.length > 1 ? '...' : ''}
                      </Typography>
                    </>
                  } 
                />
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
