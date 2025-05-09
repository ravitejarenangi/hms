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
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Note as NoteIcon,
} from '@mui/icons-material';

interface Appointment {
  id: number;
  patientName: string;
  time: string;
  status: string;
  type: string;
  duration: number;
  notes: string;
}

interface AppointmentsToday {
  total: number;
  completed: number;
  upcoming: number;
  appointments: Appointment[];
}

export default function AppointmentsWidget() {
  const [data, setData] = useState<AppointmentsToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/doctor/appointments-today');
        if (!response.ok) {
          throw new Error('Failed to fetch appointments data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching appointments data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'waiting':
        return 'warning';
      case 'scheduled':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'waiting':
        return 'Waiting';
      case 'scheduled':
        return 'Scheduled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Today's Appointments" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Today's Appointments" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="Today's Appointments" />
        <CardContent>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Filter upcoming appointments (waiting or scheduled)
  const upcomingAppointments = data.appointments.filter(
    app => app.status === 'waiting' || app.status === 'scheduled'
  ).sort((a, b) => {
    // Sort by time
    return a.time.localeCompare(b.time);
  });

  return (
    <Card>
      <CardHeader 
        title="Today's Appointments" 
        subheader={`${data.total} total • ${data.completed} completed • ${data.upcoming} upcoming`}
      />
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Upcoming Appointments
        </Typography>
        <List dense>
          {upcomingAppointments.slice(0, 5).map((appointment, index) => (
            <Box key={appointment.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Appointment">
                      <IconButton edge="end" aria-label="edit" size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel Appointment">
                      <IconButton edge="end" aria-label="cancel" size="small">
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Notes">
                      <IconButton edge="end" aria-label="notes" size="small">
                        <NoteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" component="span">
                        {appointment.patientName}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={getStatusLabel(appointment.status)} 
                        color={getStatusColor(appointment.status)} 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <AccessTimeIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {appointment.time} • {appointment.duration} min • {appointment.type}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {appointment.notes}
                      </Typography>
                    </>
                  } 
                />
              </ListItem>
            </Box>
          ))}
        </List>
        
        {upcomingAppointments.length > 5 && (
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Button size="small">View All Appointments</Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
