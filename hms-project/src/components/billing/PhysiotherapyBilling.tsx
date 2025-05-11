import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PhysiotherapyBilling: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Physiotherapy Billing
      </Typography>
      {/* TODO: Integrate with Physiotherapy billing API and therapy session data */}
      <Box>
        <Typography variant="body1">
          This module will allow you to view, manage, and process billing for physiotherapy sessions. Integration with therapy session records and billing API will be implemented here.
        </Typography>
      </Box>
    </Paper>
  );
};

export default PhysiotherapyBilling;
