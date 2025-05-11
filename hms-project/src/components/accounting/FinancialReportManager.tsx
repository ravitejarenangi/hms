import React, { useState } from 'react';
import { Box, Typography, Button, Paper, MenuItem, Select, CircularProgress, Snackbar, Alert, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const reportTypes = [
  { value: 'daybook', label: 'Day Book' },
  { value: 'cashbook', label: 'Cash Book' },
  { value: 'bankbook', label: 'Bank Book' },
  { value: 'trialbalance', label: 'Trial Balance' },
  { value: 'pnl', label: 'Profit & Loss Statement' },
  { value: 'balancesheet', label: 'Balance Sheet' },
  { value: 'gstr1', label: 'GST Report (GSTR-1)' },
  { value: 'gstr2', label: 'GST Report (GSTR-2)' },
  { value: 'gstr3b', label: 'GST Report (GSTR-3B)' },
  { value: 'tds', label: 'TDS Report' }
];

const FinancialReportManager: React.FC = () => {
  const [reportType, setReportType] = useState('daybook');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    let url = `/api/accounting/reports?type=${reportType}`;
    if (fromDate) url += `&from=${fromDate.toISOString().slice(0, 10)}`;
    if (toDate) url += `&to=${toDate.toISOString().slice(0, 10)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch report');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setSnack({ open: true, message: err.message || 'Error fetching report', severity: 'error' });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    if (!Array.isArray(data) || data.length === 0) {
      setSnack({ open: true, message: 'No tabular data to export.', severity: 'error' });
      return;
    }
    if (type === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${reportType}-report.csv`);
      setSnack({ open: true, message: 'CSV exported successfully.', severity: 'success' });
    } else if (type === 'pdf') {
      const doc = new jsPDF();
      // @ts-ignore
      doc.autoTable({
        head: [Object.keys(data[0])],
        body: data.map((row: any) => Object.values(row)),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 20 },
      });
      doc.save(`${reportType}-report.pdf`);
      setSnack({ open: true, message: 'PDF exported successfully.', severity: 'success' });
    }
  };


  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Select value={reportType} onChange={e => setReportType(e.target.value)} sx={{ mr: 2 }}>
          {reportTypes.map(rt => <MenuItem key={rt.value} value={rt.value}>{rt.label}</MenuItem>)}
        </Select>
        <Button variant="contained" onClick={fetchReport} disabled={loading}>
          Generate Report
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {data && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">{reportTypes.find(rt => rt.value === reportType)?.label}</Typography>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Paper>
      )}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FinancialReportManager;
