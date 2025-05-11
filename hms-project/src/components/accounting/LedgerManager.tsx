import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Snackbar, Alert, Tabs, Tab } from '@mui/material';

interface LedgerEntry {
  id: string;
  date: string;
  accountName: string;
  departmentName?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const LedgerManager: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => { fetchEntries(); }, [tab]);

  const fetchEntries = async () => {
    setLoading(true);
    let type = ['general', 'account', 'department'][tab];
    const res = await fetch(`/api/accounting/ledger?type=${type}`);
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="General Ledger" />
        <Tab label="Account-wise Ledger" />
        <Tab label="Department-wise Ledger" />
      </Tabs>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Account</TableCell>
                {tab === 2 && <TableCell>Department</TableCell>}
                <TableCell>Description</TableCell>
                <TableCell>Debit</TableCell>
                <TableCell>Credit</TableCell>
                <TableCell>Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.accountName}</TableCell>
                  {tab === 2 && <TableCell>{entry.departmentName}</TableCell>}
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.debit}</TableCell>
                  <TableCell>{entry.credit}</TableCell>
                  <TableCell>{entry.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LedgerManager;
