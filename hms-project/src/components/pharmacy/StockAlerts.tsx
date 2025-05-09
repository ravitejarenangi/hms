import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSession } from 'next-auth/react';

export default function StockAlerts() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [openNotificationsDialog, setOpenNotificationsDialog] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockThreshold: 10,
    expiryWarningDays: 30,
    emailNotifications: true,
    inAppNotifications: true,
    dailyDigest: true
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilterType(event.target.value as string);
    setPage(0);
  };

  const handleFilterStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilterStatus(event.target.value as string);
    setPage(0);
  };

  const handleOpenViewDialog = (alert: any) => {
    setSelectedAlert(alert);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedAlert(null);
  };

  const handleOpenNotificationsDialog = () => {
    setOpenNotificationsDialog(true);
  };

  const handleCloseNotificationsDialog = () => {
    setOpenNotificationsDialog(false);
  };

  const handleNotificationSettingsChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setNotificationSettings({
      ...notificationSettings,
      [name as string]: name === 'emailNotifications' || name === 'inAppNotifications' || name === 'dailyDigest' 
        ? !notificationSettings[name as keyof typeof notificationSettings]
        : value
    });
  };

  const handleSaveNotificationSettings = async () => {
    try {
      const response = await fetch('/api/pharmacy/alerts/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationSettings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save notification settings');
      }

      handleCloseNotificationsDialog();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/pharmacy/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve alert');
      }

      // Refresh alerts data
      fetchAlerts();
      handleCloseViewDialog();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pharmacy/alerts?type=${filterType}&status=${filterStatus}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const data = await response.json();
      setAlerts(data.alerts);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/pharmacy/alerts/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
      }
      const data = await response.json();
      setNotificationSettings(data.settings);
    } catch (error: any) {
      console.error('Error fetching notification settings:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAlerts();
      fetchNotificationSettings();
    }
  }, [session, filterType, filterStatus]);

  // Get alert type icon
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'EXPIRY':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'STOCK_OUT':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  // Get alert type color
  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'warning';
      case 'EXPIRY':
        return 'error';
      case 'STOCK_OUT':
        return 'error';
      default:
        return 'info';
    }
  };

  // Get alert status color
  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'error';
      case 'RESOLVED':
        return 'success';
      case 'DISMISSED':
        return 'default';
      default:
        return 'default';
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
          <Typography variant="h6">Stock Alerts & Notifications</Typography>
          <Box>
            <Tooltip title="Notification Settings">
              <IconButton 
                color="primary" 
                onClick={handleOpenNotificationsDialog}
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={alerts.filter(a => a.status === 'ACTIVE').length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="type-filter-label">Alert Type</InputLabel>
            <Select
              labelId="type-filter-label"
              id="type-filter"
              value={filterType}
              onChange={handleFilterTypeChange}
              label="Alert Type"
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
              <MenuItem value="EXPIRY">Expiring Soon</MenuItem>
              <MenuItem value="STOCK_OUT">Out of Stock</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={filterStatus}
              onChange={handleFilterStatusChange}
              label="Status"
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
              <MenuItem value="DISMISSED">Dismissed</MenuItem>
              <MenuItem value="ALL">All</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Alert Type</TableCell>
                <TableCell>Medicine</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getAlertTypeIcon(alert.type)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {alert.type.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {alert.medicine?.name || 'N/A'}
                      </Typography>
                      {alert.batch && (
                        <Typography variant="caption" color="textSecondary">
                          Batch: {alert.batch.batchNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {alert.message}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(alert.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={alert.status} 
                        color={getAlertStatusColor(alert.status) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleOpenViewDialog(alert)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {alert.status === 'ACTIVE' && (
                        <Tooltip title="Resolve">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {alerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No alerts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={alerts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* View Alert Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Alert Details
          {selectedAlert && (
            <Chip 
              label={selectedAlert.status} 
              color={getAlertStatusColor(selectedAlert.status) as any} 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                {getAlertTypeIcon(selectedAlert.type)}
                <Typography variant="subtitle1" fontWeight="medium" sx={{ ml: 1 }}>
                  {selectedAlert.type.replace('_', ' ')}
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                <strong>Medicine:</strong> {selectedAlert.medicine?.name || 'N/A'}
              </Typography>
              
              {selectedAlert.batch && (
                <Typography variant="body1" gutterBottom>
                  <strong>Batch:</strong> {selectedAlert.batch.batchNumber} (Expires: {formatDate(selectedAlert.batch.expiryDate)})
                </Typography>
              )}
              
              <Typography variant="body1" gutterBottom>
                <strong>Details:</strong> {selectedAlert.message}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Created:</strong> {formatDate(selectedAlert.createdAt)}
              </Typography>
              
              {selectedAlert.resolvedAt && (
                <Typography variant="body1" gutterBottom>
                  <strong>Resolved:</strong> {formatDate(selectedAlert.resolvedAt)}
                </Typography>
              )}
              
              {selectedAlert.resolvedBy && (
                <Typography variant="body1" gutterBottom>
                  <strong>Resolved By:</strong> {selectedAlert.resolvedBy}
                </Typography>
              )}
              
              {selectedAlert.notes && (
                <Typography variant="body1" gutterBottom>
                  <strong>Notes:</strong> {selectedAlert.notes}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          {selectedAlert && selectedAlert.status === 'ACTIVE' && (
            <Button 
              onClick={() => handleResolveAlert(selectedAlert.id)} 
              variant="contained" 
              color="success"
              startIcon={<CheckCircleIcon />}
            >
              Resolve Alert
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog open={openNotificationsDialog} onClose={handleCloseNotificationsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mt: 1 }}>
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="lowStockThreshold"
                label="Low Stock Threshold"
                type="number"
                value={notificationSettings.lowStockThreshold}
                onChange={handleNotificationSettingsChange}
                inputProps={{ min: 1 }}
                helperText="Alert when stock falls below this level"
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                margin="dense"
                name="expiryWarningDays"
                label="Expiry Warning Days"
                type="number"
                value={notificationSettings.expiryWarningDays}
                onChange={handleNotificationSettingsChange}
                inputProps={{ min: 1 }}
                helperText="Alert when medicine expires within these days"
              />
            </Box>
            
            <Box component="div" sx={{ gridColumn: 'span 12' }}>
              <FormControl fullWidth margin="dense">
                <Typography variant="subtitle2" gutterBottom>
                  Notification Preferences
                </Typography>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <Tooltip title="Receive email notifications for alerts">
                    <Button
                      variant={notificationSettings.emailNotifications ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => handleNotificationSettingsChange({
                        target: { name: 'emailNotifications', value: null }
                      } as any)}
                      sx={{ mr: 1 }}
                    >
                      Email Notifications
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Receive in-app notifications for alerts">
                    <Button
                      variant={notificationSettings.inAppNotifications ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => handleNotificationSettingsChange({
                        target: { name: 'inAppNotifications', value: null }
                      } as any)}
                      sx={{ mr: 1 }}
                    >
                      In-App Notifications
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Receive daily digest of all alerts">
                    <Button
                      variant={notificationSettings.dailyDigest ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => handleNotificationSettingsChange({
                        target: { name: 'dailyDigest', value: null }
                      } as any)}
                    >
                      Daily Digest
                    </Button>
                  </Tooltip>
                </Box>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotificationsDialog}>Cancel</Button>
          <Button onClick={handleSaveNotificationSettings} variant="contained" color="primary">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
