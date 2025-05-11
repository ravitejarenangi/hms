import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface TestCatalog {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  price: number;
  duration?: number;
  preparation?: string;
  sampleRequired: boolean;
  sampleType?: string;
  reportTemplate?: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  referenceRanges?: ReferenceRange[];
}

interface ReferenceRange {
  id?: string;
  parameter: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  lowerLimit?: string;
  upperLimit?: string;
  textualRange?: string;
  unit?: string;
}

const TestCatalogManagement: React.FC = () => {
  const [tests, setTests] = useState<TestCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTest, setCurrentTest] = useState<TestCatalog | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  // Fetch tests on component mount and when filters change
  useEffect(() => {
    fetchTests();
  }, [page, rowsPerPage, searchQuery, categoryFilter, activeFilter]);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/lab/catalog?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      
      if (activeFilter !== null) {
        url += `&isActive=${activeFilter}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch test catalog');
      }
      
      const data = await response.json();
      setTests(data.tests);
      setTotalCount(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleCategoryFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setCategoryFilter(event.target.value as string);
    setPage(0);
  };

  const handleActiveFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setActiveFilter(event.target.checked ? true : null);
    setPage(0);
  };

  const handleOpenDialog = (test: TestCatalog | null = null) => {
    setCurrentTest(test);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTest(null);
  };

  const handleDeleteConfirmOpen = (id: string) => {
    setTestToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setTestToDelete(null);
  };

  const handleDelete = async () => {
    if (!testToDelete) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/lab/catalog?id=${testToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete test');
      }
      
      setSuccess('Test deleted successfully');
      fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      handleDeleteConfirmClose();
    }
  };

  const handleSaveTest = async (testData: TestCatalog) => {
    setLoading(true);
    setError(null);
    try {
      const method = testData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/lab/catalog', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${testData.id ? 'update' : 'create'} test`);
      }
      
      setSuccess(`Test ${testData.id ? 'updated' : 'created'} successfully`);
      fetchTests();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  // Render test catalog table
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search Tests"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="HEMATOLOGY">Hematology</MenuItem>
                <MenuItem value="BIOCHEMISTRY">Biochemistry</MenuItem>
                <MenuItem value="MICROBIOLOGY">Microbiology</MenuItem>
                <MenuItem value="IMMUNOLOGY">Immunology</MenuItem>
                <MenuItem value="PATHOLOGY">Pathology</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={activeFilter === true}
                  onChange={handleActiveFilterChange}
                  color="primary"
                />
              }
              label="Active Tests Only"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Test
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && tests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No tests found. Try adjusting your filters or add a new test.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
          >
            Add Test
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Sample Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{test.code}</TableCell>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>{test.category}</TableCell>
                  <TableCell>${test.price.toFixed(2)}</TableCell>
                  <TableCell>{test.sampleType || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={test.isActive ? 'Active' : 'Inactive'}
                      color={test.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(test)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteConfirmOpen(test.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      {/* Test Form Dialog */}
      <TestFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        test={currentTest}
        onSave={handleSaveTest}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteConfirmClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this test? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!success || !!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={success ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Test Form Dialog Component
interface TestFormDialogProps {
  open: boolean;
  onClose: () => void;
  test: TestCatalog | null;
  onSave: (test: TestCatalog) => void;
}

const TestFormDialog: React.FC<TestFormDialogProps> = ({
  open,
  onClose,
  test,
  onSave,
}) => {
  const [formData, setFormData] = useState<TestCatalog>({
    id: '',
    name: '',
    code: '',
    category: '',
    description: '',
    price: 0,
    duration: 0,
    preparation: '',
    sampleRequired: true,
    sampleType: '',
    reportTemplate: '',
    department: 'lab',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    referenceRanges: [],
  });

  useEffect(() => {
    if (test) {
      setFormData({
        ...test,
        referenceRanges: test.referenceRanges || [],
      });
    } else {
      setFormData({
        id: '',
        name: '',
        code: '',
        category: '',
        description: '',
        price: 0,
        duration: 0,
        preparation: '',
        sampleRequired: true,
        sampleType: '',
        reportTemplate: '',
        department: 'lab',
        isActive: true,
        createdAt: '',
        updatedAt: '',
        referenceRanges: [],
      });
    }
  }, [test]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    setFormData({
      ...formData,
      [name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{test ? 'Edit Test' : 'Add New Test'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Test Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Test Code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                  label="Category"
                  required
                >
                  <MenuItem value="HEMATOLOGY">Hematology</MenuItem>
                  <MenuItem value="BIOCHEMISTRY">Biochemistry</MenuItem>
                  <MenuItem value="MICROBIOLOGY">Microbiology</MenuItem>
                  <MenuItem value="IMMUNOLOGY">Immunology</MenuItem>
                  <MenuItem value="PATHOLOGY">Pathology</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                margin="normal"
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                name="duration"
                type="number"
                value={formData.duration || ''}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sampleRequired}
                    onChange={handleInputChange}
                    name="sampleRequired"
                    color="primary"
                  />
                }
                label="Sample Required"
              />
            </Grid>
            {formData.sampleRequired && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sample Type"
                  name="sampleType"
                  value={formData.sampleType || ''}
                  onChange={handleInputChange}
                  margin="normal"
                  placeholder="e.g., Blood, Urine, etc."
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preparation Instructions"
                name="preparation"
                value={formData.preparation || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={2}
                placeholder="Instructions for patient preparation"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Report Template"
                name="reportTemplate"
                value={formData.reportTemplate || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={2}
                placeholder="Template for reporting results"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TestCatalogManagement;
