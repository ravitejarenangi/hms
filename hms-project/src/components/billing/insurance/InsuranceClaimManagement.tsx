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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import InsuranceClaimForm from './InsuranceClaimForm';
import InsuranceClaimDetail from './InsuranceClaimDetail';
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
      id={`insurance-tabpanel-${index}`}
      aria-labelledby={`insurance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `insurance-tab-${index}`,
    'aria-controls': `insurance-tabpanel-${index}`,
  };
}

const InsuranceClaimManagement = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClaims = async (status?: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: pageSize.toString(),
      });
      
      if (status) {
        queryParams.append('status', status);
      }

      const response = await fetch(`/api/billing/insurance?${queryParams.toString()}`);
      const data = await response.json();
      
      setClaims(data.data);
      setTotalCount(data.meta.total);
    } catch (error) {
      console.error('Error fetching insurance claims:', error);
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
        status = 'SUBMITTED';
        break;
      case 2: // In Progress
        status = 'SUBMITTED_TO_TPA';
        break;
      case 3: // Approved
        status = 'APPROVED';
        break;
      case 4: // Rejected
        status = 'REJECTED';
        break;
      default:
        status = '';
    }
    fetchClaims(status);
  }, [tabValue, page, pageSize]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenForm = (claim?: any) => {
    setSelectedClaim(claim || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedClaim(null);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const method = selectedClaim ? 'PUT' : 'POST';
      const url = '/api/billing/insurance';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        fetchClaims();
        handleCloseForm();
      } else {
        const error = await response.json();
        console.error('Error saving insurance claim:', error);
      }
    } catch (error) {
      console.error('Error saving insurance claim:', error);
    }
  };

  const handleOpenDetail = (claim: any) => {
    setSelectedClaim(claim);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedClaim(null);
  };

  const handleDeleteClick = (claim: any) => {
    setSelectedClaim(claim);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/billing/insurance?id=${selectedClaim.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchClaims();
        setOpenDeleteDialog(false);
        setSelectedClaim(null);
      } else {
        const error = await response.json();
        console.error('Error deleting insurance claim:', error);
      }
    } catch (error) {
      console.error('Error deleting insurance claim:', error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 100, hide: true },
    { 
      field: 'claimNumber', 
      headerName: 'Claim #', 
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
      field: 'patient', 
      headerName: 'Patient', 
      width: 200,
      valueGetter: (params) => params.row.patient ? `${params.row.patient.firstName} ${params.row.patient.lastName}` : '',
    },
    { 
      field: 'invoiceNumber', 
      headerName: 'Invoice #', 
      width: 150,
      valueGetter: (params) => params.row.invoice ? params.row.invoice.invoiceNumber : '',
    },
    { 
      field: 'insuranceProvider', 
      headerName: 'Insurance Provider', 
      width: 200,
      valueGetter: (params) => params.row.insuranceProvider ? params.row.insuranceProvider.name : '',
    },
    { 
      field: 'claimAmount', 
      headerName: 'Claim Amount', 
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    { 
      field: 'approvedAmount', 
      headerName: 'Approved Amount', 
      width: 150,
      valueFormatter: (params) => params.value ? formatCurrency(params.value) : '-',
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => {
        let color;
        switch (params.value) {
          case 'SUBMITTED':
            color = theme.palette.info.main;
            break;
          case 'SUBMITTED_TO_TPA':
            color = theme.palette.warning.main;
            break;
          case 'APPROVED':
            color = theme.palette.success.main;
            break;
          case 'REJECTED':
            color = theme.palette.error.main;
            break;
          case 'INFO_REQUESTED':
            color = theme.palette.warning.light;
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
            {params.value.replace('_', ' ')}
          </Box>
        );
      }
    },
    { 
      field: 'submissionDate', 
      headerName: 'Submission Date', 
      width: 150,
      valueFormatter: (params) => formatDate(params.value),
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
          Insurance Claim Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage insurance claims, track status, and process approvals
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="insurance claim tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Claims" {...a11yProps(0)} />
            <Tab label="Pending" {...a11yProps(1)} />
            <Tab label="In Progress" {...a11yProps(2)} />
            <Tab label="Approved" {...a11yProps(3)} />
            <Tab label="Rejected" {...a11yProps(4)} />
          </Tabs>
        </Box>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            New Claim
          </Button>
          <Box>
            <IconButton size="small" onClick={() => fetchClaims()}>
              <RefreshIcon />
            </IconButton>
            <IconButton size="small">
              <FilterIcon />
            </IconButton>
            <IconButton size="small">
              <ExportIcon />
            </IconButton>
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <DataGrid
            rows={claims}
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
            rows={claims}
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
            rows={claims}
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
            rows={claims}
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
        <TabPanel value={tabValue} index={4}>
          <DataGrid
            rows={claims}
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

      {/* Insurance Claim Form Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedClaim ? 'Edit Insurance Claim' : 'New Insurance Claim'}
        </DialogTitle>
        <DialogContent>
          <InsuranceClaimForm 
            initialData={selectedClaim}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Insurance Claim Detail Dialog */}
      <Dialog 
        open={openDetail} 
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Insurance Claim Details
        </DialogTitle>
        <DialogContent>
          {selectedClaim && (
            <InsuranceClaimDetail 
              claim={selectedClaim}
              onEdit={() => {
                handleCloseDetail();
                handleOpenForm(selectedClaim);
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
            Are you sure you want to delete this insurance claim? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InsuranceClaimManagement;
