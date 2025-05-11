import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const LedgerManagement: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Ledger Management
      </Typography>
      <LedgerManager />
    </Paper>
  );
};

export default LedgerManagement;
