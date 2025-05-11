import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const IPDBilling: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        IPD Billing
      </Typography>
      {/* TODO: Integrate with IPD billing API and admission/discharge data */}
      <Box>
        <Typography variant="body1">
          This module will allow you to view, manage, and process billing for IPD admissions. Integration with IPD admission records and billing API will be implemented here.
        </Typography>
      </Box>
    </Paper>
  );
};

export default IPDBilling;
