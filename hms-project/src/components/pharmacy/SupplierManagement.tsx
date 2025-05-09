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
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useSession } from 'next-auth/react';

export default function SupplierManagement() {
  const { data: session } = useSession();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    taxId: '',
    registrationNo: '',
    status: 'ACTIVE',
    notes: ''
  });

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
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      taxId: '',
      registrationNo: '',
      status: 'ACTIVE',
      notes: ''
    });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenEditDialog = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || '',
      postalCode: supplier.postalCode || '',
      taxId: supplier.taxId || '',
      registrationNo: supplier.registrationNo || '',
      status: supplier.status || 'ACTIVE',
      notes: supplier.notes || ''
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedSupplier(null);
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleAddSupplier = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.phone) {
        setError('Name and Phone are required fields');
        return;
      }

      const response = await fetch('/api/pharmacy/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add supplier');
      }

      // Refresh suppliers data
      fetchSuppliers();
      handleCloseAddDialog();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdateSupplier = async () => {
    try {
      if (!selectedSupplier) return;

      // Validate required fields
      if (!formData.name || !formData.phone) {
        setError('Name and Phone are required fields');
        return;
      }

      const response = await fetch(`/api/pharmacy/suppliers/${selectedSupplier.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update supplier');
      }

      // Refresh suppliers data
      fetchSuppliers();
      handleCloseEditDialog();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pharmacy/suppliers?status=${filterStatus}`);
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

  useEffect(() => {
    if (session) {
      fetchSuppliers();
    }
  }, [session, filterStatus]);

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier => {
    return (
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      supplier.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'BLACKLISTED':
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
          <Typography variant="h6">Supplier Management</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Supplier
          </Button>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Search Suppliers"
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
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="BLACKLISTED">Blacklisted</MenuItem>
              <MenuItem value="ALL">All</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {supplier.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{supplier.contactPerson || 'N/A'}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.email || 'N/A'}</TableCell>
                    <TableCell>
                      {supplier.city && supplier.country 
                        ? `${supplier.city}, ${supplier.country}`
                        : supplier.city || supplier.country || 'N/A'
                      }
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={supplier.status} 
                        color={getStatusColor(supplier.status) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenEditDialog(supplier)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="info">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Create Purchase Order">
                        <IconButton size="small" color="success">
                          <LocalShippingIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No suppliers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSuppliers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add Supplier Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent>
          <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mt: 1 }}>
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="name"
                label="Supplier Name *"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="contactPerson"
                label="Contact Person"
                value={formData.contactPerson}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="phone"
                label="Phone *"
                value={formData.phone}
                onChange={handleFormChange}
                required
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                margin="dense"
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="city"
                label="City"
                value={formData.city}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="state"
                label="State/Province"
                value={formData.state}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="country"
                label="Country"
                value={formData.country}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="postalCode"
                label="Postal Code"
                value={formData.postalCode}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="taxId"
                label="Tax ID"
                value={formData.taxId}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="registrationNo"
                label="Registration Number"
                value={formData.registrationNo}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="BLACKLISTED">Blacklisted</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                margin="dense"
                name="notes"
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleFormChange}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddSupplier} variant="contained" color="primary">
            Add Supplier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Supplier</DialogTitle>
        <DialogContent>
          <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mt: 1 }}>
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="name"
                label="Supplier Name *"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="contactPerson"
                label="Contact Person"
                value={formData.contactPerson}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="phone"
                label="Phone *"
                value={formData.phone}
                onChange={handleFormChange}
                required
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                margin="dense"
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="city"
                label="City"
                value={formData.city}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="state"
                label="State/Province"
                value={formData.state}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="country"
                label="Country"
                value={formData.country}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="postalCode"
                label="Postal Code"
                value={formData.postalCode}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="taxId"
                label="Tax ID"
                value={formData.taxId}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="registrationNo"
                label="Registration Number"
                value={formData.registrationNo}
                onChange={handleFormChange}
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="BLACKLISTED">Blacklisted</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                margin="dense"
                name="notes"
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleFormChange}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateSupplier} variant="contained" color="primary">
            Update Supplier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
