import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const OPDBilling: React.FC = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        OPD Billing
      </Typography>
      {/* TODO: Integrate with OPD billing API and patient visit data */}
      <Box>
        <Typography variant="body1">
          This module will allow you to view, manage, and process billing for OPD visits. Integration with OPD visit records and billing API will be implemented here.
        </Typography>
      </Box>
    </Paper>
  );
};

export default OPDBilling;
