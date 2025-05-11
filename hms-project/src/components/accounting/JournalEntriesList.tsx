import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
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
  Tooltip,
  Typography,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  reference: string | null;
  referenceType: string | null;
  isRecurring: boolean;
  financialYear: {
    id: string;
    yearName: string;
  };
}

interface FinancialYear {
  id: string;
  yearName: string;
  isCurrent: boolean;
}

const JournalEntriesList: React.FC = () => {
  const router = useRouter();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [filterFinancialYear, setFilterFinancialYear] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Mock data for development
  const mockJournalEntries: JournalEntry[] = [
    {
      id: '1',
      entryNumber: 'JE-202305-0001',
      entryDate: '2023-05-01',
      description: 'Monthly revenue recognition',
      totalDebit: 50000,
      totalCredit: 50000,
      status: 'POSTED',
      reference: 'INV-202305-0001',
      referenceType: 'INVOICE',
      isRecurring: false,
      financialYear: {
        id: '1',
        yearName: '2023-2024',
      },
    },
    {
      id: '2',
      entryNumber: 'JE-202305-0002',
      entryDate: '2023-05-02',
      description: 'Supplier payment',
      totalDebit: 25000,
      totalCredit: 25000,
      status: 'POSTED',
      reference: null,
      referenceType: null,
      isRecurring: false,
      financialYear: {
        id: '1',
        yearName: '2023-2024',
      },
    },
    {
      id: '3',
      entryNumber: 'JE-202305-0003',
      entryDate: '2023-05-03',
      description: 'Salary payment',
      totalDebit: 75000,
      totalCredit: 75000,
      status: 'DRAFT',
      reference: null,
      referenceType: null,
      isRecurring: false,
      financialYear: {
        id: '1',
        yearName: '2023-2024',
      },
    },
    {
      id: '4',
      entryNumber: 'JE-202305-0004',
      entryDate: '2023-05-04',
      description: 'Depreciation expense',
      totalDebit: 10000,
      totalCredit: 10000,
      status: 'POSTED',
      reference: null,
      referenceType: null,
      isRecurring: true,
      financialYear: {
        id: '1',
        yearName: '2023-2024',
      },
    },
    {
      id: '5',
      entryNumber: 'JE-202305-0005',
      entryDate: '2023-05-05',
      description: 'Reversal of JE-202305-0002',
      totalDebit: 25000,
      totalCredit: 25000,
      status: 'POSTED',
      reference: 'JE-202305-0002',
      referenceType: 'REVERSAL',
      isRecurring: false,
      financialYear: {
        id: '1',
        yearName: '2023-2024',
      },
    },
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

  useEffect(() => {
    // In a real application, fetch journal entries and financial years from API
    // For now, use mock data
    setTimeout(() => {
      setJournalEntries(mockJournalEntries);
      setFinancialYears(mockFinancialYears);
      setLoading(false);
    }, 1000);
  }, []);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterFinancialYearChange = (event: SelectChangeEvent) => {
    setFilterFinancialYear(event.target.value);
  };

  const handleFilterStatusChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value);
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleCreateJournalEntry = () => {
    // In a real application, navigate to the journal entry creation page
    router.push('/accounting/journal-entries/create');
  };

  const handleViewJournalEntry = (id: string) => {
    // In a real application, navigate to the journal entry details page
    router.push(`/accounting/journal-entries/${id}`);
  };

  const handleEditJournalEntry = (id: string) => {
    // In a real application, navigate to the journal entry edit page
    router.push(`/accounting/journal-entries/${id}/edit`);
  };

  const handlePostJournalEntry = (id: string) => {
    // In a real application, call the API to post the journal entry
    console.log('Post journal entry:', id);
  };

  const handleReverseJournalEntry = (id: string) => {
    // In a real application, call the API to reverse the journal entry
    console.log('Reverse journal entry:', id);
  };

  const filteredJournalEntries = journalEntries.filter((entry) => {
    // Apply financial year filter
    if (filterFinancialYear && entry.financialYear.id !== filterFinancialYear) {
      return false;
    }

    // Apply status filter
    if (filterStatus && entry.status !== filterStatus) {
      return false;
    }

    // Apply date range filter
    if (filterFromDate && new Date(entry.entryDate) < filterFromDate) {
      return false;
    }
    if (filterToDate) {
      const toDateEnd = new Date(filterToDate);
      toDateEnd.setHours(23, 59, 59, 999);
      if (new Date(entry.entryDate) > toDateEnd) {
        return false;
      }
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        entry.entryNumber.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        (entry.reference && entry.reference.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'POSTED':
        return 'success';
      case 'REVERSED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

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
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="div">
              Journal Entries
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateJournalEntry}
            >
              Create Journal Entry
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchQueryChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleToggleFilters}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Grid>

          {showFilters && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Financial Year</InputLabel>
                  <Select
                    value={filterFinancialYear}
                    label="Financial Year"
                    onChange={handleFilterFinancialYearChange}
                  >
                    <MenuItem value="">All Financial Years</MenuItem>
                    {financialYears.map((year) => (
                      <MenuItem key={year.id} value={year.id}>
                        {year.yearName} {year.isCurrent ? '(Current)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={handleFilterStatusChange}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="POSTED">Posted</MenuItem>
                    <MenuItem value="REVERSED">Reversed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={filterFromDate}
                    onChange={(date) => setFilterFromDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={filterToDate}
                    onChange={(date) => setFilterToDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setFilterFinancialYear('');
                    setFilterStatus('');
                    setFilterFromDate(null);
                    setFilterToDate(null);
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      <Paper elevation={3}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="journal entries table">
            <TableHead>
              <TableRow>
                <TableCell>Entry #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Debit (₹)</TableCell>
                <TableCell align="right">Credit (₹)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Financial Year</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJournalEntries
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.entryNumber}</TableCell>
                    <TableCell>{formatDate(entry.entryDate)}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      {entry.reference ? (
                        <>
                          {entry.reference}
                          {entry.referenceType && (
                            <Typography variant="caption" component="div" color="textSecondary">
                              {entry.referenceType}
                            </Typography>
                          )}
                        </>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {entry.totalDebit.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell align="right">
                      {entry.totalCredit.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        color={getStatusChipColor(entry.status) as any}
                        size="small"
                      />
                      {entry.isRecurring && (
                        <Chip
                          label="Recurring"
                          color="info"
                          size="small"
                          sx={{ ml: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{entry.financialYear.yearName}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewJournalEntry(entry.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {entry.status === 'DRAFT' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditJournalEntry(entry.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Post">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handlePostJournalEntry(entry.id)}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {entry.status === 'POSTED' && (
                        <Tooltip title="Reverse">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReverseJournalEntry(entry.id)}
                          >
                            <UndoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {filteredJournalEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No journal entries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredJournalEntries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default JournalEntriesList;
