import React, { useState } from 'react';
import { Box, Typography, Button, Paper, MenuItem, Select, CircularProgress, Snackbar, Alert } from '@mui/material';

const analyticsTypes = [
  { value: 'profitability', label: 'Profitability Analysis' },
  { value: 'costcenter', label: 'Cost Center Performance' },
  { value: 'revenue', label: 'Revenue Trends' },
  { value: 'expense', label: 'Expense Analysis' }
];

const FinancialAnalyticsManager: React.FC = () => {
  const [analyticsType, setAnalyticsType] = useState('profitability');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await fetch(`/api/accounting/analytics?type=${analyticsType}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Select value={analyticsType} onChange={e => setAnalyticsType(e.target.value)} sx={{ mr: 2 }}>
          {analyticsTypes.map(at => <MenuItem key={at.value} value={at.value}>{at.label}</MenuItem>)}
        </Select>
        <Button variant="contained" onClick={fetchAnalytics} disabled={loading}>
          Generate Analytics
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {data && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">{analyticsTypes.find(at => at.value === analyticsType)?.label}</Typography>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Paper>
      )}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FinancialAnalyticsManager;
