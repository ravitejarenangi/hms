import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const FinancialAnalytics: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Financial Analytics
      </Typography>
      <FinancialAnalyticsManager />
    </Paper>
  );
};

export default FinancialAnalytics;
