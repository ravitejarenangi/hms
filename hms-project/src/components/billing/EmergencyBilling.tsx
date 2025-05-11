import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const EmergencyBilling: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Emergency Department Billing
      </Typography>
      {/* TODO: Integrate with Emergency billing API and patient triage data */}
      <Box>
        <Typography variant="body1">
          This module will allow you to view, manage, and process billing for emergency department visits. Integration with triage records and billing API will be implemented here.
        </Typography>
      </Box>
    </Paper>
  );
};

export default EmergencyBilling;
