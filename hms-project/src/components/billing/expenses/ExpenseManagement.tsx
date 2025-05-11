import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  AttachFile as AttachmentIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ExpenseForm from './ExpenseForm';
import ExpenseDetail from './ExpenseDetail';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`expense-tabpanel-${index}`}
      aria-labelledby={`expense-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `expense-tab-${index}`,
    'aria-controls': `expense-tabpanel-${index}`,
  };
}

const ExpenseManagement = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [openFilter, setOpenFilter] = useState(false);

  const fetchExpenses = async (status?: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: pageSize.toString(),
      });
      
      if (status) {
        queryParams.append('paymentStatus', status);
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (filterStartDate) {
        queryParams.append('startDate', filterStartDate.toISOString());
      }
      
      if (filterEndDate) {
        queryParams.append('endDate', filterEndDate.toISOString());
      }

      const response = await fetch(`/api/billing/expenses?${queryParams.toString()}`);
      const data = await response.json();
      
      setExpenses(data.data);
      setTotalCount(data.meta.total);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let status;
    switch (tabValue) {
      case 0: // All
        status = '';
        break;
      case 1: // Pending
        status = 'PENDING';
        break;
      case 2: // Paid
        status = 'PAID';
        break;
      case 3: // Cancelled
        status = 'CANCELLED';
        break;
      default:
        status = '';
    }
    fetchExpenses(status);
  }, [tabValue, page, pageSize, searchTerm, filterStartDate, filterEndDate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenForm = (expense?: any) => {
    setSelectedExpense(expense || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedExpense(null);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const method = selectedExpense ? 'PUT' : 'POST';
      const url = '/api/billing/expenses';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        fetchExpenses();
        handleCloseForm();
      } else {
        const error = await response.json();
        console.error('Error saving expense:', error);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleOpenDetail = (expense: any) => {
    setSelectedExpense(expense);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedExpense(null);
  };

  const handleDeleteClick = (expense: any) => {
    setSelectedExpense(expense);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/billing/expenses?id=${selectedExpense.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchExpenses();
        setOpenDeleteDialog(false);
        setSelectedExpense(null);
      } else {
        const error = await response.json();
        console.error('Error deleting expense:', error);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterOpen = () => {
    setOpenFilter(true);
  };

  const handleFilterClose = () => {
    setOpenFilter(false);
  };

  const handleFilterApply = () => {
    fetchExpenses();
    setOpenFilter(false);
  };

  const handleFilterReset = () => {
    setFilterStartDate(null);
    setFilterEndDate(null);
    setOpenFilter(false);
    fetchExpenses();
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 100, hide: true },
    { 
      field: 'expenseNumber', 
      headerName: 'Expense #', 
      width: 150,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ 
            cursor: 'pointer',
            color: theme.palette.primary.main,
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={() => handleOpenDetail(params.row)}
        >
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'description', 
      headerName: 'Description', 
      width: 250,
    },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 150,
    },
    { 
      field: 'expenseDate', 
      headerName: 'Date', 
      width: 120,
      valueFormatter: (params) => formatDate(params.value),
    },
    { 
      field: 'department', 
      headerName: 'Department', 
      width: 150,
      valueGetter: (params) => params.row.department ? params.row.department.name : '',
    },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    { 
      field: 'totalAmount', 
      headerName: 'Total Amount', 
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    { 
      field: 'paymentStatus', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => {
        let color;
        switch (params.value) {
          case 'PENDING':
            color = theme.palette.warning.main;
            break;
          case 'PAID':
            color = theme.palette.success.main;
            break;
          case 'CANCELLED':
            color = theme.palette.error.main;
            break;
          default:
            color = theme.palette.text.secondary;
        }
        
        return (
          <Box
            sx={{
              backgroundColor: `${color}20`,
              color: color,
              py: 0.5,
              px: 1.5,
              borderRadius: 1,
              fontWeight: 'medium',
              fontSize: '0.75rem',
            }}
          >
            {params.value}
          </Box>
        );
      }
    },
    { 
      field: 'paymentMethod', 
      headerName: 'Payment Method', 
      width: 150,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleOpenForm(params.row)}
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDeleteClick(params.row)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Expense Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage hospital expenses, categorize spending, and generate reports
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="expense tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Expenses" {...a11yProps(0)} />
            <Tab label="Pending" {...a11yProps(1)} />
            <Tab label="Paid" {...a11yProps(2)} />
            <Tab label="Cancelled" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            New Expense
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mr: 1 }}
            />
            <IconButton size="small" onClick={handleFilterOpen}>
              <FilterIcon />
            </IconButton>
            <IconButton size="small" onClick={() => fetchExpenses()}>
              <RefreshIcon />
            </IconButton>
            <IconButton size="small">
              <ExportIcon />
            </IconButton>
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <DataGrid
            rows={expenses}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={totalCount}
            pageSizeOptions={[5, 10, 25, 50]}
            pagination
            page={page}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            disableRowSelectionOnClick
            autoHeight
            sx={{ minHeight: 400 }}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <DataGrid
            rows={expenses}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={totalCount}
            pageSizeOptions={[5, 10, 25, 50]}
            pagination
            page={page}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            disableRowSelectionOnClick
            autoHeight
            sx={{ minHeight: 400 }}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <DataGrid
            rows={expenses}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={totalCount}
            pageSizeOptions={[5, 10, 25, 50]}
            pagination
            page={page}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            disableRowSelectionOnClick
            autoHeight
            sx={{ minHeight: 400 }}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <DataGrid
            rows={expenses}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={totalCount}
            pageSizeOptions={[5, 10, 25, 50]}
            pagination
            page={page}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            disableRowSelectionOnClick
            autoHeight
            sx={{ minHeight: 400 }}
          />
        </TabPanel>
      </Paper>

      {/* Expense Form Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedExpense ? 'Edit Expense' : 'New Expense'}
        </DialogTitle>
        <DialogContent>
          <ExpenseForm 
            initialData={selectedExpense}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Expense Detail Dialog */}
      <Dialog 
        open={openDetail} 
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Expense Details
        </DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <ExpenseDetail 
              expense={selectedExpense}
              onEdit={() => {
                handleCloseDetail();
                handleOpenForm(selectedExpense);
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this expense? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog
        open={openFilter}
        onClose={handleFilterClose}
      >
        <DialogTitle>Filter Expenses</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <DatePicker
                    label="Start Date"
                    value={filterStartDate}
                    onChange={(newValue) => setFilterStartDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <DatePicker
                    label="End Date"
                    value={filterEndDate}
                    onChange={(newValue) => setFilterEndDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset}>Reset</Button>
          <Button onClick={handleFilterApply} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExpenseManagement;
