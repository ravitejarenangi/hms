import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, CircularProgress, Snackbar, Alert } from '@mui/material';

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REVERSED';
  lines: Array<{
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

const emptyEntry = { date: '', description: '', lines: [{ accountId: '', accountName: '', debit: 0, credit: 0 }] };

const JournalEntryManager: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyEntry);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    setLoading(true);
    const res = await fetch('/api/accounting/journal-entries');
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch('/api/accounting/journal-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSnack({ open: true, message: 'Journal entry created', severity: 'success' });
      setOpen(false);
      fetchEntries();
      setForm(emptyEntry);
    } else {
      setSnack({ open: true, message: 'Failed to create entry', severity: 'error' });
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/accounting/journal-entries?id=${id}&action=approve`, { method: 'PATCH' });
    if (res.ok) {
      setSnack({ open: true, message: 'Entry approved', severity: 'success' });
      fetchEntries();
    } else {
      setSnack({ open: true, message: 'Failed to approve', severity: 'error' });
    }
    setLoading(false);
  };

  const handleReverse = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/accounting/journal-entries?id=${id}&action=reverse`, { method: 'PATCH' });
    if (res.ok) {
      setSnack({ open: true, message: 'Entry reversed', severity: 'success' });
      fetchEntries();
    } else {
      setSnack({ open: true, message: 'Failed to reverse', severity: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setOpen(true)}>
        New Journal Entry
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Journal Entry</DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            type="date"
            fullWidth
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Description"
            fullWidth
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          {/* For brevity, only one line item. Expand as needed. */}
          <TextField
            label="Account Name"
            fullWidth
            value={form.lines[0].accountName}
            onChange={e => setForm({ ...form, lines: [{ ...form.lines[0], accountName: e.target.value }] })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Debit"
            fullWidth
            type="number"
            value={form.lines[0].debit}
            onChange={e => setForm({ ...form, lines: [{ ...form.lines[0], debit: Number(e.target.value) }] })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Credit"
            fullWidth
            type="number"
            value={form.lines[0].credit}
            onChange={e => setForm({ ...form, lines: [{ ...form.lines[0], credit: Number(e.target.value) }] })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading}>Create</Button>
        </DialogActions>
      </Dialog>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Debit</TableCell>
                <TableCell>Credit</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.status}</TableCell>
                  <TableCell>{entry.lines[0]?.accountName}</TableCell>
                  <TableCell>{entry.lines[0]?.debit}</TableCell>
                  <TableCell>{entry.lines[0]?.credit}</TableCell>
                  <TableCell>
                    {entry.status === 'PENDING' && (
                      <Button size="small" onClick={() => handleApprove(entry.id)}>Approve</Button>
                    )}
                    {entry.status === 'APPROVED' && (
                      <Button size="small" color="warning" onClick={() => handleReverse(entry.id)}>Reverse</Button>
                    )}
                  </TableCell>
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

export default JournalEntryManager;
