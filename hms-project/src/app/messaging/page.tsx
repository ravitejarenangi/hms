'use client';

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import MessagingDashboard from '../../components/messaging/MessagingDashboard';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'HMS - Internal Messaging',
  description: 'Hospital Management System Internal Messaging Platform',
};

export default async function MessagingPage() {
  // Check authentication on the server side
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login?callbackUrl=/messaging');
  }
  
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
