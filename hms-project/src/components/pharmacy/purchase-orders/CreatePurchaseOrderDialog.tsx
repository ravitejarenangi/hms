import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSession } from 'next-auth/react';

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onPurchaseOrderCreated: () => void;
}

export default function CreatePurchaseOrderDialog({
  open,
  onClose,
  onPurchaseOrderCreated
}: CreatePurchaseOrderDialogProps) {
  const { data: session } = useSession();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: ''
  });
  
  const [items, setItems] = useState<any[]>([{
    medicineId: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    tax: 0,
    total: 0
  }]);

  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (open && session) {
      fetchSuppliers();
      fetchMedicines();
    }
  }, [open, session]);

  useEffect(() => {
    // Calculate total amount whenever items change
    calculateTotalAmount();
  }, [items]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/suppliers?status=ACTIVE');
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      const data = await response.json();
      setSuppliers(data.suppliers);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/medicines');
      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }
      const data = await response.json();
      setMedicines(data.medicines);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Calculate item total
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'tax') {
      const item = updatedItems[index];
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discount = Number(item.discount);
      const tax = Number(item.tax);
      
      const subtotal = quantity * unitPrice;
      const discountAmount = subtotal * (discount / 100);
      const taxAmount = (subtotal - discountAmount) * (tax / 100);
      const total = subtotal - discountAmount + taxAmount;
      
      updatedItems[index].total = parseFloat(total.toFixed(2));
    }
    
    setItems(updatedItems);
  };

  const calculateTotalAmount = () => {
    const total = items.reduce((sum, item) => sum + (item.total || 0), 0);
    setTotalAmount(parseFloat(total.toFixed(2)));
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        medicineId: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 0,
        total: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleCreatePurchaseOrder = async () => {
    try {
      // Validate required fields
      if (!formData.supplierId) {
        setError('Please select a supplier');
        return;
      }

      if (items.length === 0 || items.some(item => !item.medicineId || item.quantity <= 0)) {
        setError('Please add at least one item with valid medicine and quantity');
        return;
      }

      setLoading(true);
      
      const purchaseOrderData = {
        ...formData,
        items: items.map(item => ({
          medicineId: item.medicineId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          tax: Number(item.tax)
        })),
        totalAmount
      };

      const response = await fetch('/api/pharmacy/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchaseOrderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create purchase order');
      }

      setLoading(false);
      onPurchaseOrderCreated();
      resetForm();
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      expectedDeliveryDate: '',
      notes: ''
    });
    setItems([{
      medicineId: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
      total: 0
    }]);
    setTotalAmount(0);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get medicine name by ID
  const getMedicineName = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    return medicine ? medicine.name : '';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Purchase Order</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mt: 1 }}>
          <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="supplier-label">Supplier</InputLabel>
              <Select
                labelId="supplier-label"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleFormChange}
                label="Supplier"
              >
                {suppliers.map(supplier => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              fullWidth
              margin="dense"
              name="expectedDeliveryDate"
              label="Expected Delivery Date"
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={handleFormChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
          
          <Box component="div" sx={{ gridColumn: 'span 12' }}>
            <TextField
              fullWidth
              margin="dense"
              name="notes"
              label="Notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={handleFormChange}
            />
          </Box>
        </Box>
        
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">Order Items</Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={addItem}
              size="small"
            >
              Add Item
            </Button>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Discount (%)</TableCell>
                  <TableCell align="right">Tax (%)</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Autocomplete
                          size="small"
                          options={medicines}
                          getOptionLabel={(option) => option.name}
                          value={medicines.find(m => m.id === item.medicineId) || null}
                          onChange={(event, newValue) => {
                            handleItemChange(index, 'medicineId', newValue?.id || '');
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Select Medicine" />
                          )}
                        />
                      </FormControl>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        inputProps={{ min: 1 }}
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={item.tax}
                        onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${item.total.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Total Amount: ${totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleCreatePurchaseOrder} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Purchase Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
