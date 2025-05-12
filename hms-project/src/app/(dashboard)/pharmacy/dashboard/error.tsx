'use client';

import React, { useEffect } from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon, MedicalServices as PharmacyIcon } from '@mui/icons-material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box 
          sx={{ 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'error.light',
          }}
        >
          <ErrorIcon sx={{ fontSize: 40, color: 'white' }} />
        </Box>
        
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="error.main">
          Pharmacy Dashboard Error
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '80%' }}>
          We encountered an issue while loading the pharmacy dashboard. This could be due to a temporary server problem or an issue with the inventory data.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={reset}
          startIcon={<RefreshIcon />}
          sx={{ 
            py: 1.5, 
            px: 3, 
            borderRadius: 2,
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
            }
          }}
        >
          Try Again
        </Button>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
          Error Reference: {error.digest}
        </Typography>
      </Paper>
    </Container>
  );
}
