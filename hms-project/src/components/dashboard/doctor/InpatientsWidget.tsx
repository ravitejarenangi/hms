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
} from '@mui/material';
import { 
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

interface Patient {
  id: number;
  name: string;
  age: number;
  ward: string;
  room: string;
  admissionDate: string;
  diagnosis: string;
  critical: boolean;
  lengthOfStay: number;
}

interface InpatientsData {
  total: number;
  byWard: {
    ward: string;
    count: number;
  }[];
  patients: Patient[];
}

export default function InpatientsWidget() {
  const [data, setData] = useState<InpatientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/doctor/inpatients');
        if (!response.ok) {
          throw new Error('Failed to fetch inpatients data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching inpatients data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader title="Inpatients Under Your Care" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Inpatients Under Your Care" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="Inpatients Under Your Care" />
        <CardContent>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Inpatients Under Your Care" 
        subheader={`${data.total} patients in total`}
      />
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Distribution by Ward
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {data.byWard.map((item) => (
            <Grid item xs={6} sm={4} key={item.ward}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h6">{item.count}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.ward}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="subtitle2" gutterBottom>
          Patient List
        </Typography>
        <List dense>
          {data.patients.slice(0, 5).map((patient, index) => (
            <Box key={patient.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" component="span">
                        {patient.name}
                      </Typography>
                      {patient.critical && (
                        <Chip 
                          icon={<WarningIcon />}
                          size="small" 
                          label="Critical" 
                          color="error" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <HospitalIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {patient.ward} • Room {patient.room} • {patient.diagnosis}
                      <Box sx={{ mt: 0.5 }}>
                        <AccessTimeIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        <Typography variant="caption" component="span">
                          {patient.lengthOfStay} days • Admitted on {patient.admissionDate}
                        </Typography>
                      </Box>
                    </>
                  } 
                />
              </ListItem>
            </Box>
          ))}
        </List>
        
        {data.patients.length > 5 && (
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Button size="small">View All Patients</Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
