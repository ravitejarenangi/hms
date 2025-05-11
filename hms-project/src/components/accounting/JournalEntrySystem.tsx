import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const JournalEntrySystem: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Journal Entry System
      </Typography>
      <JournalEntryManager />
    </Paper>
  );
};

export default JournalEntrySystem;
