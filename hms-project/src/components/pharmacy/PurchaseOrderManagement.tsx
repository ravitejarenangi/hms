import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSession } from 'next-auth/react';
import CreatePurchaseOrderDialog from './purchase-orders/CreatePurchaseOrderDialog';
import ViewPurchaseOrderDialog from './purchase-orders/ViewPurchaseOrderDialog';

export default function PurchaseOrderManagement() {
  const { data: session } = useSession();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilterStatus(event.target.value as string);
    setPage(0);
  };

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleOpenViewDialog = (purchaseOrder: any) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedPurchaseOrder(null);
  };

  const handlePurchaseOrderCreated = () => {
    fetchPurchaseOrders();
    handleCloseCreateDialog();
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/pharmacy/purchase-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update purchase order status');
      }

      // Refresh purchase orders data
      fetchPurchaseOrders();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pharmacy/purchase-orders?status=${filterStatus}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders');
      }
      const data = await response.json();
      setPurchaseOrders(data.purchaseOrders);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPurchaseOrders();
    }
  }, [session, filterStatus]);

  // Filter purchase orders based on search term
  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const orderNumber = po.orderNumber || '';
    const supplierName = po.supplier?.name || '';
    
    return (
      orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'info';
      case 'ORDERED':
        return 'primary';
      case 'RECEIVED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Purchase Order Management</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Purchase Order
          </Button>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Search Purchase Orders"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 250 }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={filterStatus}
              onChange={handleFilterChange}
              label="Status"
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="ORDERED">Ordered</MenuItem>
              <MenuItem value="RECEIVED">Received</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
              <MenuItem value="ALL">All</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPurchaseOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {po.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{po.supplier?.name || 'N/A'}</TableCell>
                    <TableCell>{formatDate(po.orderDate)}</TableCell>
                    <TableCell align="right">{formatCurrency(po.totalAmount)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={po.status} 
                        color={getStatusColor(po.status) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleOpenViewDialog(po)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {po.status === 'PENDING' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleUpdateStatus(po.id, 'APPROVED')}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Cancel">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleUpdateStatus(po.id, 'CANCELLED')}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {po.status === 'APPROVED' && (
                        <Tooltip title="Mark as Ordered">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleUpdateStatus(po.id, 'ORDERED')}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {po.status === 'ORDERED' && (
                        <Tooltip title="Mark as Received">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {filteredPurchaseOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No purchase orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPurchaseOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create Purchase Order Dialog */}
      <CreatePurchaseOrderDialog
        open={openCreateDialog}
        onClose={handleCloseCreateDialog}
        onPurchaseOrderCreated={handlePurchaseOrderCreated}
      />

      {/* View Purchase Order Dialog */}
      {selectedPurchaseOrder && (
        <ViewPurchaseOrderDialog
          open={openViewDialog}
          onClose={handleCloseViewDialog}
          purchaseOrder={selectedPurchaseOrder}
          onStatusUpdate={fetchPurchaseOrders}
        />
      )}
    </Box>
  );
}
