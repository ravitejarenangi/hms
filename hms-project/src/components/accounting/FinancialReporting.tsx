import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const FinancialReporting: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Financial Reporting
      </Typography>
      <FinancialReportManager />
    </Paper>
  );
};

export default FinancialReporting;
