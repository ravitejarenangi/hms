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
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface TeamMember {
  name: string;
  role: string;
}

interface Surgery {
  id: number;
  patientName: string;
  time: string;
  location: string;
  type: string;
  procedure: string;
  duration: number;
  status: string;
  team: TeamMember[];
}

interface SurgeriesScheduledData {
  total: number;
  byType: {
    type: string;
    count: number;
  }[];
  surgeries: Surgery[];
}

export default function SurgeriesScheduledWidget() {
  const [data, setData] = useState<SurgeriesScheduledData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/doctor/surgeries-scheduled');
        if (!response.ok) {
          throw new Error('Failed to fetch surgeries scheduled data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching surgeries scheduled data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'prepared':
        return 'success';
      case 'preparing':
        return 'warning';
      case 'not started':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Surgeries Scheduled Today" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Surgeries Scheduled Today" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="Surgeries Scheduled Today" />
        <CardContent>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Surgeries Scheduled Today" 
        subheader={`${data.total} surgeries scheduled`}
      />
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          By Procedure Type
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {data.byType.map((item) => (
            <Grid item xs={6} sm={3} key={item.type}>
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
          Surgery Schedule
        </Typography>
        <List dense>
          {data.surgeries.map((surgery, index) => (
            <Box key={surgery.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                secondaryAction={
                  <Tooltip title="View Details">
                    <IconButton edge="end" aria-label="info" size="small">
                      <InfoIcon fontSize="small" />
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
                        label={surgery.status} 
                        color={getStatusColor(surgery.status)} 
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
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <PeopleIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" component="span">
                          Team: {surgery.team.map(member => member.name).join(', ')}
                        </Typography>
                      </Box>
                    </>
                  } 
                />
              </ListItem>
            </Box>
          ))}
        </List>
        
        {data.surgeries.length > 5 && (
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Button size="small">View All Surgeries</Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
