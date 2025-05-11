import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  SelectChangeEvent,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  currentBalance: number;
}

interface FinancialYear {
  id: string;
  yearName: string;
  isCurrent: boolean;
}

interface LedgerEntry {
  id: string;
  date: string;
  journalEntryNumber: string;
  description: string;
  reference: string | null;
  debitAmount: number;
  creditAmount: number;
  balance: number;
}

const LedgerView: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedAccount_data, setSelectedAccount_data] = useState<Account | null>(null);

  // Mock data for development
  const mockAccounts: Account[] = [
    { id: '1', accountCode: '1110', accountName: 'Cash and Cash Equivalents', accountType: 'ASSET', openingBalance: 100000, currentBalance: 125000 },
    { id: '2', accountCode: '1120', accountName: 'Accounts Receivable', accountType: 'ASSET', openingBalance: 50000, currentBalance: 75000 },
    { id: '3', accountCode: '2110', accountName: 'Accounts Payable', accountType: 'LIABILITY', openingBalance: 25000, currentBalance: 35000 },
    { id: '4', accountCode: '3100', accountName: 'Capital', accountType: 'EQUITY', openingBalance: 200000, currentBalance: 200000 },
    { id: '5', accountCode: '4100', accountName: 'Consultation Revenue', accountType: 'REVENUE', openingBalance: 0, currentBalance: 150000 },
    { id: '6', accountCode: '4200', accountName: 'Laboratory Revenue', accountType: 'REVENUE', openingBalance: 0, currentBalance: 75000 },
    { id: '7', accountCode: '4300', accountName: 'Radiology Revenue', accountType: 'REVENUE', openingBalance: 0, currentBalance: 50000 },
    { id: '8', accountCode: '5100', accountName: 'Salary Expense', accountType: 'EXPENSE', openingBalance: 0, currentBalance: 100000 },
    { id: '9', accountCode: '5200', accountName: 'Rent Expense', accountType: 'EXPENSE', openingBalance: 0, currentBalance: 25000 },
    { id: '10', accountCode: '5300', accountName: 'Utilities Expense', accountType: 'EXPENSE', openingBalance: 0, currentBalance: 15000 },
  ];

  const mockFinancialYears: FinancialYear[] = [
    {
      id: '1',
      yearName: '2023-2024',
      isCurrent: true,
    },
    {
      id: '2',
      yearName: '2022-2023',
      isCurrent: false,
    },
  ];

  const mockLedgerEntries: Record<string, LedgerEntry[]> = {
    '1': [
      {
        id: '1',
        date: '2023-04-01',
        journalEntryNumber: 'Opening Balance',
        description: 'Opening Balance for Financial Year 2023-2024',
        reference: null,
        debitAmount: 100000,
        creditAmount: 0,
        balance: 100000,
      },
      {
        id: '2',
        date: '2023-04-15',
        journalEntryNumber: 'JE-202304-0001',
        description: 'Received payment from patient',
        reference: 'INV-202304-0001',
        debitAmount: 15000,
        creditAmount: 0,
        balance: 115000,
      },
      {
        id: '3',
        date: '2023-04-30',
        journalEntryNumber: 'JE-202304-0002',
        description: 'Paid staff salaries',
        reference: null,
        debitAmount: 0,
        creditAmount: 50000,
        balance: 65000,
      },
      {
        id: '4',
        date: '2023-05-10',
        journalEntryNumber: 'JE-202305-0001',
        description: 'Received payment from insurance',
        reference: 'INV-202305-0001',
        debitAmount: 35000,
        creditAmount: 0,
        balance: 100000,
      },
      {
        id: '5',
        date: '2023-05-15',
        journalEntryNumber: 'JE-202305-0002',
        description: 'Paid rent for clinic space',
        reference: null,
        debitAmount: 0,
        creditAmount: 25000,
        balance: 75000,
      },
      {
        id: '6',
        date: '2023-05-31',
        journalEntryNumber: 'JE-202305-0003',
        description: 'Paid staff salaries',
        reference: null,
        debitAmount: 0,
        creditAmount: 50000,
        balance: 25000,
      },
      {
        id: '7',
        date: '2023-06-05',
        journalEntryNumber: 'JE-202306-0001',
        description: 'Received payment from patients',
        reference: 'INV-202306-0001',
        debitAmount: 45000,
        creditAmount: 0,
        balance: 70000,
      },
      {
        id: '8',
        date: '2023-06-15',
        journalEntryNumber: 'JE-202306-0002',
        description: 'Paid utilities bill',
        reference: null,
        debitAmount: 0,
        creditAmount: 15000,
        balance: 55000,
      },
      {
        id: '9',
        date: '2023-06-30',
        journalEntryNumber: 'JE-202306-0003',
        description: 'Received payment from insurance',
        reference: 'INV-202306-0002',
        debitAmount: 70000,
        creditAmount: 0,
        balance: 125000,
      },
    ],
    '5': [
      {
        id: '1',
        date: '2023-04-01',
        journalEntryNumber: 'Opening Balance',
        description: 'Opening Balance for Financial Year 2023-2024',
        reference: null,
        debitAmount: 0,
        creditAmount: 0,
        balance: 0,
      },
      {
        id: '2',
        date: '2023-04-15',
        journalEntryNumber: 'JE-202304-0001',
        description: 'Consultation services',
        reference: 'INV-202304-0001',
        debitAmount: 0,
        creditAmount: 25000,
        balance: 25000,
      },
      {
        id: '3',
        date: '2023-05-10',
        journalEntryNumber: 'JE-202305-0001',
        description: 'Consultation services',
        reference: 'INV-202305-0001',
        debitAmount: 0,
        creditAmount: 35000,
        balance: 60000,
      },
      {
        id: '4',
        date: '2023-06-05',
        journalEntryNumber: 'JE-202306-0001',
        description: 'Consultation services',
        reference: 'INV-202306-0001',
        debitAmount: 0,
        creditAmount: 45000,
        balance: 105000,
      },
      {
        id: '5',
        date: '2023-06-30',
        journalEntryNumber: 'JE-202306-0003',
        description: 'Consultation services',
        reference: 'INV-202306-0002',
        debitAmount: 0,
        creditAmount: 45000,
        balance: 150000,
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
        setSelectedFinancialYear(currentYear.id);
      }
      
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      setLoading(true);
      
      // In a real application, fetch ledger entries for the selected account from API
      // For now, use mock data
      setTimeout(() => {
        const entries = mockLedgerEntries[selectedAccount] || [];
        setLedgerEntries(entries);
        
        // Set selected account data
        const account = accounts.find(acc => acc.id === selectedAccount) || null;
        setSelectedAccount_data(account);
        
        setLoading(false);
      }, 500);
    } else {
      setLedgerEntries([]);
      setSelectedAccount_data(null);
    }
  }, [selectedAccount, accounts]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAccountChange = (event: SelectChangeEvent) => {
    setSelectedAccount(event.target.value);
    setPage(0);
  };

  const handleFinancialYearChange = (event: SelectChangeEvent) => {
    setSelectedFinancialYear(event.target.value);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleViewJournalEntry = (journalEntryNumber: string) => {
    if (journalEntryNumber === 'Opening Balance') return;
    
    // In a real application, navigate to the journal entry details page
    router.push(`/accounting/journal-entries/${journalEntryNumber}`);
  };

  const handlePrintLedger = () => {
    // In a real application, print the ledger
    console.log('Print ledger');
  };

  const handleExportLedger = () => {
    // In a real application, export the ledger to CSV or Excel
    console.log('Export ledger');
  };

  const filteredLedgerEntries = ledgerEntries.filter((entry) => {
    // Apply date range filter
    if (fromDate && new Date(entry.date) < fromDate) {
      return false;
    }
    if (toDate) {
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      if (new Date(entry.date) > toDateEnd) {
        return false;
      }
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading && !selectedAccount) {
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
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="div">
              General Ledger
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleToggleFilters}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrintLedger}
              disabled={!selectedAccount}
              sx={{ mr: 1 }}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportLedger}
              disabled={!selectedAccount}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Account</InputLabel>
              <Select
                value={selectedAccount}
                label="Account"
                onChange={handleAccountChange}
              >
                <MenuItem value="">Select an account</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.accountCode} - {account.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Financial Year</InputLabel>
              <Select
                value={selectedFinancialYear}
                label="Financial Year"
                onChange={handleFinancialYearChange}
              >
                {financialYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.yearName} {year.isCurrent ? '(Current)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {showFilters && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={(date) => setFromDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={toDate}
                    onChange={(date) => setToDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setFromDate(null);
                    setToDate(null);
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {selectedAccount_data && (
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">
                <strong>Account:</strong> {selectedAccount_data.accountCode} - {selectedAccount_data.accountName}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Account Type:</strong> {selectedAccount_data.accountType}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">
                <strong>Opening Balance:</strong> ₹{formatCurrency(selectedAccount_data.openingBalance)}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Current Balance:</strong> ₹{formatCurrency(selectedAccount_data.currentBalance)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading && selectedAccount ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        selectedAccount && (
          <Paper elevation={3}>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="ledger entries table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Journal Entry</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell align="right">Debit (₹)</TableCell>
                    <TableCell align="right">Credit (₹)</TableCell>
                    <TableCell align="right">Balance (₹)</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLedgerEntries
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>{entry.journalEntryNumber}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.reference || '-'}</TableCell>
                        <TableCell align="right">
                          {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(entry.balance)}</TableCell>
                        <TableCell align="center">
                          {entry.journalEntryNumber !== 'Opening Balance' && (
                            <Tooltip title="View Journal Entry">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewJournalEntry(entry.journalEntryNumber)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredLedgerEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No ledger entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredLedgerEntries.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )
      )}

      {!selectedAccount && (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Please select an account to view its ledger
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default LedgerView;
