import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  TableRow,
  TextField,
  Tooltip,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListIcon from '@mui/icons-material/List';
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  parentAccountId: string | null;
  description: string | null;
  isActive: boolean;
  departmentId: string | null;
  openingBalance: number;
  currentBalance: number;
  parentAccount?: {
    id: string;
    accountCode: string;
    accountName: string;
  } | null;
  childAccounts?: Account[];
  department?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    childAccounts: number;
  };
}

interface Department {
  id: string;
  name: string;
}

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [filterAccountType, setFilterAccountType] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: 'ASSET',
    parentAccountId: '',
    description: '',
    departmentId: '',
    openingBalance: 0,
    isActive: true,
  });

  // Mock data for development
  const mockAccounts: Account[] = [
    {
      id: '1',
      accountCode: '1000',
      accountName: 'Assets',
      accountType: 'ASSET',
      parentAccountId: null,
      description: 'Asset accounts',
      isActive: true,
      departmentId: null,
      openingBalance: 0,
      currentBalance: 1250000,
      childAccounts: [
        {
          id: '11',
          accountCode: '1100',
          accountName: 'Current Assets',
          accountType: 'ASSET',
          parentAccountId: '1',
          description: 'Current asset accounts',
          isActive: true,
          departmentId: null,
          openingBalance: 0,
          currentBalance: 750000,
          childAccounts: [
            {
              id: '111',
              accountCode: '1110',
              accountName: 'Cash and Cash Equivalents',
              accountType: 'ASSET',
              parentAccountId: '11',
              description: 'Cash accounts',
              isActive: true,
              departmentId: null,
              openingBalance: 500000,
              currentBalance: 650000,
              childAccounts: [],
            },
            {
              id: '112',
              accountCode: '1120',
              accountName: 'Accounts Receivable',
              accountType: 'ASSET',
              parentAccountId: '11',
              description: 'Amounts owed by patients and insurance companies',
              isActive: true,
              departmentId: null,
              openingBalance: 100000,
              currentBalance: 100000,
              childAccounts: [],
            },
          ],
        },
        {
          id: '12',
          accountCode: '1200',
          accountName: 'Fixed Assets',
          accountType: 'ASSET',
          parentAccountId: '1',
          description: 'Fixed asset accounts',
          isActive: true,
          departmentId: null,
          openingBalance: 500000,
          currentBalance: 500000,
          childAccounts: [],
        },
      ],
    },
    {
      id: '2',
      accountCode: '2000',
      accountName: 'Liabilities',
      accountType: 'LIABILITY',
      parentAccountId: null,
      description: 'Liability accounts',
      isActive: true,
      departmentId: null,
      openingBalance: 0,
      currentBalance: 500000,
      childAccounts: [],
    },
    {
      id: '3',
      accountCode: '3000',
      accountName: 'Equity',
      accountType: 'EQUITY',
      parentAccountId: null,
      description: 'Equity accounts',
      isActive: true,
      departmentId: null,
      openingBalance: 0,
      currentBalance: 750000,
      childAccounts: [],
    },
    {
      id: '4',
      accountCode: '4000',
      accountName: 'Revenue',
      accountType: 'REVENUE',
      parentAccountId: null,
      description: 'Revenue accounts',
      isActive: true,
      departmentId: null,
      openingBalance: 0,
      currentBalance: 1200000,
      childAccounts: [
        {
          id: '41',
          accountCode: '4100',
          accountName: 'Consultation Revenue',
          accountType: 'REVENUE',
          parentAccountId: '4',
          description: 'Revenue from consultations',
          isActive: true,
          departmentId: 'D001',
          openingBalance: 0,
          currentBalance: 500000,
          childAccounts: [],
        },
        {
          id: '42',
          accountCode: '4200',
          accountName: 'Laboratory Revenue',
          accountType: 'REVENUE',
          parentAccountId: '4',
          description: 'Revenue from laboratory services',
          isActive: true,
          departmentId: 'D002',
          openingBalance: 0,
          currentBalance: 300000,
          childAccounts: [],
        },
        {
          id: '43',
          accountCode: '4300',
          accountName: 'Radiology Revenue',
          accountType: 'REVENUE',
          parentAccountId: '4',
          description: 'Revenue from radiology services',
          isActive: true,
          departmentId: 'D003',
          openingBalance: 0,
          currentBalance: 400000,
          childAccounts: [],
        },
      ],
    },
    {
      id: '5',
      accountCode: '5000',
      accountName: 'Expenses',
      accountType: 'EXPENSE',
      parentAccountId: null,
      description: 'Expense accounts',
      isActive: true,
      departmentId: null,
      openingBalance: 0,
      currentBalance: 800000,
      childAccounts: [],
    },
  ];

  const mockDepartments: Department[] = [
    { id: 'D001', name: 'General Medicine' },
    { id: 'D002', name: 'Laboratory' },
    { id: 'D003', name: 'Radiology' },
    { id: 'D004', name: 'Pharmacy' },
    { id: 'D005', name: 'Physiotherapy' },
  ];

  useEffect(() => {
    // In a real application, fetch accounts and departments from API
    // For now, use mock data
    setTimeout(() => {
      setAccounts(mockAccounts);
      setDepartments(mockDepartments);
      setLoading(false);
    }, 1000);
  }, []);

  const handleViewModeChange = (mode: 'list' | 'tree') => {
    setViewMode(mode);
  };

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setSelectedAccount(account);
      setFormData({
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        parentAccountId: account.parentAccountId || '',
        description: account.description || '',
        departmentId: account.departmentId || '',
        openingBalance: account.openingBalance,
        isActive: account.isActive,
      });
    } else {
      setSelectedAccount(null);
      setFormData({
        accountCode: '',
        accountName: '',
        accountType: 'ASSET',
        parentAccountId: '',
        description: '',
        departmentId: '',
        openingBalance: 0,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAccount(null);
  };

  const handleFilterAccountTypeChange = (event: SelectChangeEvent) => {
    setFilterAccountType(event.target.value);
  };

  const handleFilterActiveChange = (event: SelectChangeEvent) => {
    setFilterActive(event.target.value);
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: name === 'openingBalance' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = () => {
    // In a real application, this would submit the form to the API
    console.log('Form data submitted:', formData);
    handleCloseDialog();
  };

  const handleDeleteAccount = (account: Account) => {
    // In a real application, this would call the API to delete the account
    console.log('Delete account:', account);
  };

  const filteredAccounts = accounts.filter((account) => {
    // Apply account type filter
    if (filterAccountType && account.accountType !== filterAccountType) {
      return false;
    }

    // Apply active filter
    if (filterActive === 'active' && !account.isActive) {
      return false;
    }
    if (filterActive === 'inactive' && account.isActive) {
      return false;
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        account.accountCode.toLowerCase().includes(query) ||
        account.accountName.toLowerCase().includes(query) ||
        (account.description && account.description.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const renderTree = (nodes: Account[]) => {
    return nodes.map((node) => (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
            <Box>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                {node.accountCode}
              </Typography>
              <Typography variant="body2" component="span">
                {node.accountName}
              </Typography>
            </Box>
            <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
              ₹{node.currentBalance.toLocaleString('en-IN')}
            </Typography>
          </Box>
        }
      >
        {Array.isArray(node.childAccounts) && node.childAccounts.length > 0
          ? renderTree(node.childAccounts)
          : null}
      </TreeItem>
    ));
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'ASSET':
        return 'Asset';
      case 'LIABILITY':
        return 'Liability';
      case 'EQUITY':
        return 'Equity';
      case 'REVENUE':
        return 'Revenue';
      case 'EXPENSE':
        return 'Expense';
      default:
        return type;
    }
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
              <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Chart of Accounts
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              startIcon={<ListIcon />}
              onClick={() => handleViewModeChange('list')}
              sx={{ mr: 1 }}
              color={viewMode === 'list' ? 'primary' : 'inherit'}
            >
              List View
            </Button>
            <Button
              variant="outlined"
              startIcon={<AccountTreeIcon />}
              onClick={() => handleViewModeChange('tree')}
              color={viewMode === 'tree' ? 'primary' : 'inherit'}
              sx={{ mr: 1 }}
            >
              Tree View
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Account
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
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Account Type</InputLabel>
              <Select
                value={filterAccountType}
                label="Account Type"
                onChange={handleFilterAccountTypeChange}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="ASSET">Asset</MenuItem>
                <MenuItem value="LIABILITY">Liability</MenuItem>
                <MenuItem value="EQUITY">Equity</MenuItem>
                <MenuItem value="REVENUE">Revenue</MenuItem>
                <MenuItem value="EXPENSE">Expense</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterActive}
                label="Status"
                onChange={handleFilterActiveChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {viewMode === 'list' ? (
        <Paper elevation={3}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="chart of accounts table">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Parent Account</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Opening Balance (₹)</TableCell>
                  <TableCell align="right">Current Balance (₹)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.accountCode}</TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>{getAccountTypeLabel(account.accountType)}</TableCell>
                    <TableCell>{account.parentAccount?.accountName || '-'}</TableCell>
                    <TableCell>{account.department?.name || '-'}</TableCell>
                    <TableCell align="right">
                      {account.openingBalance.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell align="right">
                      {account.currentBalance.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{account.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Ledger">
                        <IconButton size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(account)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAccount(account)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No accounts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 2 }}>
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            sx={{ flexGrow: 1, maxHeight: 600, overflowY: 'auto' }}
          >
            {renderTree(accounts.filter(account => !account.parentAccountId))}
          </TreeView>
        </Paper>
      )}

      {/* Account Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAccount ? 'Edit Account' : 'Add New Account'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Code"
                name="accountCode"
                value={formData.accountCode}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Name"
                name="accountName"
                value={formData.accountName}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Account Type</InputLabel>
                <Select
                  name="accountType"
                  value={formData.accountType}
                  label="Account Type"
                  onChange={handleFormChange}
                  required
                >
                  <MenuItem value="ASSET">Asset</MenuItem>
                  <MenuItem value="LIABILITY">Liability</MenuItem>
                  <MenuItem value="EQUITY">Equity</MenuItem>
                  <MenuItem value="REVENUE">Revenue</MenuItem>
                  <MenuItem value="EXPENSE">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Parent Account</InputLabel>
                <Select
                  name="parentAccountId"
                  value={formData.parentAccountId}
                  label="Parent Account"
                  onChange={handleFormChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {accounts
                    .filter(account => account.accountType === formData.accountType && account.id !== selectedAccount?.id)
                    .map(account => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.accountCode} - {account.accountName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  name="departmentId"
                  value={formData.departmentId}
                  label="Department"
                  onChange={handleFormChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {departments.map(department => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Opening Balance"
                name="openingBalance"
                type="number"
                value={formData.openingBalance}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="isActive"
                  value={formData.isActive.toString()}
                  label="Status"
                  onChange={(e) => setFormData({
                    ...formData,
                    isActive: e.target.value === 'true',
                  })}
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {selectedAccount ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChartOfAccounts;
