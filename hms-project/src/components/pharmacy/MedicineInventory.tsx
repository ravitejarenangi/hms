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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { useSession } from 'next-auth/react';

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inventory-tab-${index}`,
    'aria-controls': `inventory-tabpanel-${index}`,
  };
}

export default function MedicineInventory() {
  const { data: session } = useSession();
  const [tabValue, setTabValue] = useState(0);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    inventoryId: '',
    transactionType: 'ADJUSTMENT',
    adjustmentType: 'INCREASE',
    quantity: 0,
    notes: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenAdjustDialog = (inventory: any) => {
    setSelectedMedicine(inventory);
    setAdjustmentData({
      inventoryId: inventory.id,
      transactionType: 'ADJUSTMENT',
      adjustmentType: 'INCREASE',
      quantity: 0,
      notes: ''
    });
    setOpenAdjustDialog(true);
  };

  const handleCloseAdjustDialog = () => {
    setOpenAdjustDialog(false);
    setSelectedMedicine(null);
  };

  const handleAdjustmentChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setAdjustmentData({
      ...adjustmentData,
      [name as string]: value
    });
  };

  const handleAdjustInventory = async () => {
    try {
      if (adjustmentData.quantity <= 0) {
        setError('Quantity must be greater than zero');
        return;
      }

      const response = await fetch('/api/pharmacy/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adjustmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to adjust inventory');
      }

      // Refresh inventory data
      fetchInventory();
      handleCloseAdjustDialog();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/pharmacy/medicines');
      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }
      const data = await response.json();
      setMedicines(data.medicines);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/inventory');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const data = await response.json();
      setInventory(data.inventory);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchExpiringBatches = async () => {
    try {
      const response = await fetch('/api/pharmacy/inventory?expiringWithin=90');
      if (!response.ok) {
        throw new Error('Failed to fetch expiring batches');
      }
      const data = await response.json();
      setExpiringBatches(data.expiringBatches || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (session) {
      fetchMedicines();
      fetchInventory();
      fetchExpiringBatches();
    }
  }, [session]);

  // Filter inventory based on search term and status filter
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.medicine.brandName && item.medicine.brandName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === 'all') {
      return matchesSearch;
    } else if (filterStatus === 'low') {
      return matchesSearch && item.currentStock <= item.reorderLevel;
    } else if (filterStatus === 'out') {
      return matchesSearch && item.currentStock === 0;
    }
    return matchesSearch;
  });

  // Get stock status
  const getStockStatus = (item: any) => {
    if (item.currentStock === 0) {
      return { label: 'Out of Stock', color: 'error' };
    } else if (item.currentStock <= item.reorderLevel) {
      return { label: 'Low Stock', color: 'warning' };
    } else {
      return { label: 'In Stock', color: 'success' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <Typography variant="h6">Medicine Inventory</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Medicine
          </Button>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Search Medicines"
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
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="low">Low Stock</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} aria-label="inventory tabs">
          <Tab label="Current Inventory" {...a11yProps(0)} />
          <Tab label="Expiring Medicines" {...a11yProps(1)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Generic Name</TableCell>
                  <TableCell align="center">Current Stock</TableCell>
                  <TableCell align="center">Reorder Level</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Last Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.medicine.name}
                          </Typography>
                          {item.medicine.brandName && (
                            <Typography variant="caption" color="textSecondary">
                              {item.medicine.brandName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{item.medicine.genericName}</TableCell>
                        <TableCell align="center">{item.currentStock}</TableCell>
                        <TableCell align="center">{item.reorderLevel}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={status.label} 
                            color={status.color as any} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          {formatDate(item.lastStockUpdate)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Adjust Stock">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenAdjustDialog(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton size="small" color="info">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {filteredInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredInventory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Batch Number</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Expiry Date</TableCell>
                  <TableCell align="center">Days Left</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiringBatches
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((batch) => {
                    const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                    let statusColor = 'success';
                    if (daysLeft <= 30) statusColor = 'error';
                    else if (daysLeft <= 90) statusColor = 'warning';
                    
                    return (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {batch.medicine.name}
                          </Typography>
                          {batch.medicine.brandName && (
                            <Typography variant="caption" color="textSecondary">
                              {batch.medicine.brandName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{batch.batchNumber}</TableCell>
                        <TableCell align="center">{batch.quantity}</TableCell>
                        <TableCell align="center">{formatDate(batch.expiryDate)}</TableCell>
                        <TableCell align="center">
                          {daysLeft <= 0 ? (
                            <Chip 
                              icon={<ErrorIcon />}
                              label="Expired" 
                              color="error" 
                              size="small" 
                            />
                          ) : (
                            <Typography 
                              variant="body2" 
                              color={daysLeft <= 30 ? 'error' : daysLeft <= 90 ? 'warning.main' : 'inherit'}
                            >
                              {daysLeft} days
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={daysLeft <= 0 ? 'Expired' : daysLeft <= 30 ? 'Critical' : 'Expiring Soon'} 
                            color={daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {expiringBatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No expiring batches found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={expiringBatches.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TabPanel>
      </Paper>

      {/* Adjust Inventory Dialog */}
      <Dialog open={openAdjustDialog} onClose={handleCloseAdjustDialog}>
        <DialogTitle>Adjust Inventory</DialogTitle>
        <DialogContent>
          {selectedMedicine && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedMedicine.medicine.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current Stock: {selectedMedicine.currentStock}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
                <Select
                  labelId="transaction-type-label"
                  id="transactionType"
                  name="transactionType"
                  value={adjustmentData.transactionType}
                  onChange={handleAdjustmentChange}
                  label="Transaction Type"
                >
                  <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
                  <MenuItem value="DAMAGED">Damaged</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </Select>
              </FormControl>
              
              {adjustmentData.transactionType === 'ADJUSTMENT' && (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="adjustment-type-label">Adjustment Type</InputLabel>
                  <Select
                    labelId="adjustment-type-label"
                    id="adjustmentType"
                    name="adjustmentType"
                    value={adjustmentData.adjustmentType}
                    onChange={handleAdjustmentChange}
                    label="Adjustment Type"
                  >
                    <MenuItem value="INCREASE">Increase</MenuItem>
                    <MenuItem value="DECREASE">Decrease</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <TextField
                fullWidth
                margin="normal"
                name="quantity"
                label="Quantity"
                type="number"
                value={adjustmentData.quantity}
                onChange={handleAdjustmentChange}
                inputProps={{ min: 1 }}
              />
              
              <TextField
                fullWidth
                margin="normal"
                name="notes"
                label="Notes"
                multiline
                rows={2}
                value={adjustmentData.notes}
                onChange={handleAdjustmentChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdjustDialog}>Cancel</Button>
          <Button onClick={handleAdjustInventory} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Medicine Dialog would go here */}
    </Box>
  );
}
