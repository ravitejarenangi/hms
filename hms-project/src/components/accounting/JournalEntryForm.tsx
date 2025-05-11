import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

interface FinancialYear {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface JournalItem {
  id?: string;
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

interface JournalEntryFormProps {
  journalEntryId?: string; // If provided, we're editing an existing entry
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ journalEntryId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  
  // Form state
  const [entryDate, setEntryDate] = useState<Date | null>(new Date());
  const [financialYearId, setFinancialYearId] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [referenceType, setReferenceType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringInterval, setRecurringInterval] = useState<string>('');
  const [nextRecurringDate, setNextRecurringDate] = useState<Date | null>(null);
  const [journalItems, setJournalItems] = useState<JournalItem[]>([
    { accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
    { accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
  ]);

  // Mock data for development
  const mockAccounts: Account[] = [
    { id: '1', accountCode: '1110', accountName: 'Cash and Cash Equivalents', accountType: 'ASSET' },
    { id: '2', accountCode: '1120', accountName: 'Accounts Receivable', accountType: 'ASSET' },
    { id: '3', accountCode: '2110', accountName: 'Accounts Payable', accountType: 'LIABILITY' },
    { id: '4', accountCode: '3100', accountName: 'Capital', accountType: 'EQUITY' },
    { id: '5', accountCode: '4100', accountName: 'Consultation Revenue', accountType: 'REVENUE' },
    { id: '6', accountCode: '4200', accountName: 'Laboratory Revenue', accountType: 'REVENUE' },
    { id: '7', accountCode: '4300', accountName: 'Radiology Revenue', accountType: 'REVENUE' },
    { id: '8', accountCode: '5100', accountName: 'Salary Expense', accountType: 'EXPENSE' },
    { id: '9', accountCode: '5200', accountName: 'Rent Expense', accountType: 'EXPENSE' },
    { id: '10', accountCode: '5300', accountName: 'Utilities Expense', accountType: 'EXPENSE' },
  ];

  const mockFinancialYears: FinancialYear[] = [
    {
      id: '1',
      yearName: '2023-2024',
      startDate: '2023-04-01',
      endDate: '2024-03-31',
      isCurrent: true,
    },
    {
      id: '2',
      yearName: '2022-2023',
      startDate: '2022-04-01',
      endDate: '2023-03-31',
      isCurrent: false,
    },
  ];

  // Mock journal entry for editing
  const mockJournalEntry = {
    id: '1',
    entryNumber: 'JE-202305-0001',
    entryDate: '2023-05-01',
    financialYearId: '1',
    reference: 'INV-202305-0001',
    referenceType: 'INVOICE',
    description: 'Monthly revenue recognition',
    isRecurring: false,
    recurringInterval: '',
    nextRecurringDate: null,
    status: 'DRAFT',
    journalItems: [
      {
        id: '1',
        accountId: '2',
        description: 'Revenue recognition',
        debitAmount: 50000,
        creditAmount: 0,
      },
      {
        id: '2',
        accountId: '7',
        description: 'Revenue recognition',
        debitAmount: 0,
        creditAmount: 50000,
      },
    ],
  };

  useEffect(() => {
    // In a real application, fetch accounts and financial years from API
    // For now, use mock data
    setTimeout(() => {
      setAccounts(mockAccounts);
      setFinancialYears(mockFinancialYears);
      
      // Set default financial year to current
      const currentYear = mockFinancialYears.find(year => year.isCurrent);
      if (currentYear) {
        setFinancialYearId(currentYear.id);
      }
      
      // If editing, load journal entry data
      if (journalEntryId) {
        // In a real application, fetch journal entry from API
        // For now, use mock data
        setEntryDate(new Date(mockJournalEntry.entryDate));
        setFinancialYearId(mockJournalEntry.financialYearId);
        setReference(mockJournalEntry.reference || '');
        setReferenceType(mockJournalEntry.referenceType || '');
        setDescription(mockJournalEntry.description);
        setIsRecurring(mockJournalEntry.isRecurring);
        setRecurringInterval(mockJournalEntry.recurringInterval || '');
        setNextRecurringDate(mockJournalEntry.nextRecurringDate ? new Date(mockJournalEntry.nextRecurringDate) : null);
        setJournalItems(mockJournalEntry.journalItems);
      }
      
      setLoading(false);
    }, 1000);
  }, [journalEntryId]);

  const handleAddJournalItem = () => {
    setJournalItems([...journalItems, { accountId: '', description: '', debitAmount: 0, creditAmount: 0 }]);
  };

  const handleRemoveJournalItem = (index: number) => {
    const updatedItems = [...journalItems];
    updatedItems.splice(index, 1);
    setJournalItems(updatedItems);
  };

  const handleJournalItemChange = (index: number, field: keyof JournalItem, value: string | number) => {
    const updatedItems = [...journalItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setJournalItems(updatedItems);
  };

  const calculateTotals = () => {
    const totalDebit = journalItems.reduce((sum, item) => sum + (item.debitAmount || 0), 0);
    const totalCredit = journalItems.reduce((sum, item) => sum + (item.creditAmount || 0), 0);
    return { totalDebit, totalCredit };
  };

  const isBalanced = () => {
    const { totalDebit, totalCredit } = calculateTotals();
    return Math.abs(totalDebit - totalCredit) < 0.01; // Allow for small rounding differences
  };

  const isFormValid = () => {
    return (
      entryDate &&
      financialYearId &&
      description &&
      journalItems.length >= 2 &&
      journalItems.every(item => item.accountId && (item.debitAmount > 0 || item.creditAmount > 0)) &&
      isBalanced()
    );
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    
    setSubmitting(true);
    
    // Prepare form data
    const formData = {
      entryDate,
      financialYearId,
      reference,
      referenceType,
      description,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
      nextRecurringDate: isRecurring ? nextRecurringDate : undefined,
      journalItems,
    };
    
    // In a real application, submit form data to API
    console.log('Form data submitted:', formData);
    
    setTimeout(() => {
      setSubmitting(false);
      // Navigate back to journal entries list
      router.push('/accounting/journal-entries');
    }, 1000);
  };

  const handleCancel = () => {
    router.push('/accounting/journal-entries');
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const difference = Math.abs(totalDebit - totalCredit);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <IconButton onClick={handleCancel}>
              <ArrowBackIcon />
            </IconButton>
          </Grid>
          <Grid item xs>
            <Typography variant="h6" component="div">
              {journalEntryId ? 'Edit Journal Entry' : 'Create Journal Entry'}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={!isFormValid() || submitting}
            >
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Journal Entry Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Entry Date *"
                value={entryDate}
                onChange={(date) => setEntryDate(date)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Financial Year</InputLabel>
              <Select
                value={financialYearId}
                label="Financial Year *"
                onChange={(e) => setFinancialYearId(e.target.value)}
              >
                {financialYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.yearName} {year.isCurrent ? '(Current)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Invoice number"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Reference Type</InputLabel>
              <Select
                value={referenceType}
                label="Reference Type"
                onChange={(e) => setReferenceType(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="INVOICE">Invoice</MenuItem>
                <MenuItem value="PAYMENT">Payment</MenuItem>
                <MenuItem value="CREDIT_NOTE">Credit Note</MenuItem>
                <MenuItem value="MANUAL">Manual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              label="Description *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={1}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              }
              label="This is a recurring journal entry"
            />
          </Grid>
          {isRecurring && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Recurring Interval</InputLabel>
                  <Select
                    value={recurringInterval}
                    label="Recurring Interval *"
                    onChange={(e) => setRecurringInterval(e.target.value)}
                  >
                    <MenuItem value="DAILY">Daily</MenuItem>
                    <MenuItem value="WEEKLY">Weekly</MenuItem>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                    <MenuItem value="YEARLY">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Next Recurring Date *"
                    value={nextRecurringDate}
                    onChange={(date) => setNextRecurringDate(date)}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Journal Items
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddJournalItem}
          >
            Add Item
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account *</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit (₹)</TableCell>
                <TableCell align="right">Credit (₹)</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {journalItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <FormControl fullWidth required>
                      <InputLabel>Account</InputLabel>
                      <Select
                        value={item.accountId}
                        label="Account *"
                        onChange={(e) => handleJournalItemChange(index, 'accountId', e.target.value)}
                      >
                        {accounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.accountCode} - {account.accountName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      value={item.description}
                      onChange={(e) => handleJournalItemChange(index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.debitAmount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleJournalItemChange(index, 'debitAmount', value);
                        if (value > 0) {
                          handleJournalItemChange(index, 'creditAmount', 0);
                        }
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.creditAmount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleJournalItemChange(index, 'creditAmount', value);
                        if (value > 0) {
                          handleJournalItemChange(index, 'debitAmount', 0);
                        }
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {journalItems.length > 2 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveJournalItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} align="right">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight="bold">
                    ₹{totalDebit.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight="bold">
                    ₹{totalCredit.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} align="right">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Difference
                  </Typography>
                </TableCell>
                <TableCell colSpan={2} align="center">
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold"
                    color={isBalanced() ? 'success.main' : 'error.main'}
                  >
                    ₹{difference.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    {isBalanced() ? ' (Balanced)' : ' (Unbalanced)'}
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
          >
            {submitting ? 'Saving...' : 'Save Journal Entry'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default JournalEntryForm;
