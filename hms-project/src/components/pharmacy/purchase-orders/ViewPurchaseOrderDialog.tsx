import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { useSession } from 'next-auth/react';

interface ViewPurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder: any;
  onStatusUpdate: () => void;
}

export default function ViewPurchaseOrderDialog({
  open,
  onClose,
  purchaseOrder,
  onStatusUpdate
}: ViewPurchaseOrderDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    notes: ''
  });
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  useEffect(() => {
    if (open && purchaseOrder) {
      fetchPurchaseOrderDetails();
      setStatusUpdateData({
        status: purchaseOrder.status,
        notes: ''
      });
    }
  }, [open, purchaseOrder]);

  const fetchPurchaseOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pharmacy/purchase-orders/${purchaseOrder.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchase order details');
      }
      const data = await response.json();
      setOrderDetails(data.purchaseOrder);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleStatusChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setStatusUpdateData({
      ...statusUpdateData,
      [name as string]: value
    });
  };

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pharmacy/purchase-orders/${purchaseOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusUpdateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update purchase order status');
      }

      setLoading(false);
      setShowStatusUpdate(false);
      onStatusUpdate();
      onClose();
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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

  // Get next possible statuses based on current status
  const getNextPossibleStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return ['PENDING', 'APPROVED', 'CANCELLED'];
      case 'APPROVED':
        return ['APPROVED', 'ORDERED', 'CANCELLED'];
      case 'ORDERED':
        return ['ORDERED', 'RECEIVED', 'CANCELLED'];
      case 'RECEIVED':
        return ['RECEIVED'];
      case 'CANCELLED':
        return ['CANCELLED'];
      default:
        return [];
    }
  };

  if (loading && !orderDetails) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Purchase Order Details
        {orderDetails && (
          <Chip 
            label={orderDetails.status} 
            color={getStatusColor(orderDetails.status) as any} 
            size="small" 
            sx={{ ml: 2 }}
          />
        )}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {orderDetails && (
          <>
            <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mb: 3 }}>
              <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Order Number
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {orderDetails.orderNumber}
                </Typography>
              </Box>
              
              <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Order Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(orderDetails.orderDate)}
                </Typography>
              </Box>
              
              <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Supplier
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {orderDetails.supplier?.name || 'N/A'}
                </Typography>
              </Box>
              
              <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Expected Delivery Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(orderDetails.expectedDeliveryDate)}
                </Typography>
              </Box>
              
              <Box component="div" sx={{ gridColumn: 'span 12' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Notes
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {orderDetails.notes || 'No notes'}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Order Items
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medicine</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Tax</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderDetails.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.medicine?.name || 'Unknown Medicine'}
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">{item.discount}%</TableCell>
                      <TableCell align="right">{item.tax}%</TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          item.quantity * item.unitPrice * 
                          (1 - item.discount / 100) * 
                          (1 + item.tax / 100)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box display="flex" justifyContent="flex-end" mb={3}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Amount: {formatCurrency(orderDetails.totalAmount)}
              </Typography>
            </Box>
            
            {orderDetails.status !== 'RECEIVED' && orderDetails.status !== 'CANCELLED' && (
              <Box mb={3}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                >
                  {showStatusUpdate ? 'Hide Status Update' : 'Update Status'}
                </Button>
              </Box>
            )}
            
            {showStatusUpdate && (
              <Box component={Paper} sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Update Purchase Order Status
                </Typography>
                
                <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                  <Box component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <FormControl fullWidth margin="dense">
                      <InputLabel id="status-update-label">Status</InputLabel>
                      <Select
                        labelId="status-update-label"
                        name="status"
                        value={statusUpdateData.status}
                        onChange={handleStatusChange}
                        label="Status"
                      >
                        {getNextPossibleStatuses(orderDetails.status).map(status => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box component="div" sx={{ gridColumn: 'span 12' }}>
                    <TextField
                      fullWidth
                      margin="dense"
                      name="notes"
                      label="Status Update Notes"
                      multiline
                      rows={2}
                      value={statusUpdateData.notes}
                      onChange={handleStatusChange}
                    />
                  </Box>
                </Box>
                
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleUpdateStatus}
                    disabled={loading || statusUpdateData.status === orderDetails.status}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Update Status'}
                  </Button>
                </Box>
              </Box>
            )}
            
            {orderDetails.statusHistory && orderDetails.statusHistory.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Status History
                </Typography>
                
                <Box component={Paper} variant="outlined" sx={{ p: 2 }}>
                  {orderDetails.statusHistory.map((history: any, index: number) => (
                    <Box key={index} mb={index < orderDetails.statusHistory.length - 1 ? 2 : 0}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" fontWeight="medium">
                          <Chip 
                            label={history.status} 
                            color={getStatusColor(history.status) as any} 
                            size="small" 
                            sx={{ mr: 1 }}
                          />
                          {formatDate(history.timestamp)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {history.updatedBy || 'System'}
                        </Typography>
                      </Box>
                      {history.notes && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                          {history.notes}
                        </Typography>
                      )}
                      {index < orderDetails.statusHistory.length - 1 && <Divider sx={{ mt: 1 }} />}
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
