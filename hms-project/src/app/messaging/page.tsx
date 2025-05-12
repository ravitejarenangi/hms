'use client';

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import MessagingDashboard from '../../components/messaging/MessagingDashboard';
import { redirect, useRouter } from 'next/navigation';

export default function MessagingPage() {
  // In a client component, we'll use React hooks for auth state
  const router = useRouter();
  
  // For now, we'll just render the messaging component
  // In a real app, you would check auth state and redirect if needed
  
  return (
    <Container maxWidth={false} disableGutters sx={{ height: 'calc(100vh - 64px)' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MessagingDashboard />
      </Box>
    </Container>
  );
}
