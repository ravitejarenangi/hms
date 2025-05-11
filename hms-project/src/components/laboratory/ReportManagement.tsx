import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  CardActions,
  FormGroup
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Search as SearchIcon
} from '@mui/icons-material';

interface Test {
  id: string;
  testCatalogId: string;
  testCatalog: {
    name: string;
    code: string;
    category: string;
  };
  patientId: string;
  requestedBy: string;
  requestedAt: string;
  scheduledAt?: string;
  status: string;
  priority: string;
  samples: any[];
  results: any[];
}

interface Patient {
  id: string;
  patientId: string;
  user: {
    name: string;
    email?: string;
    phone?: string;
  };
}

const ReportManagement: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [patientFilter, setPatientFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('COMPLETED,REPORTED,VERIFIED');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>('');
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationOptions, setNotificationOptions] = useState({
    email: true,
    sms: false,
    whatsapp: false,
    includeDoctor: true,
    includePatient: true
  });

  // Fetch tests on component mount and when filters change
  useEffect(() => {
    fetchTests();
  }, [page, rowsPerPage, patientFilter, statusFilter, searchQuery]);

  // Fetch patients for the filter
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/lab/requests?page=${page + 1}&limit=${rowsPerPage}`;
      
      if (patientFilter) {
        url += `&patientId=${encodeURIComponent(patientFilter)}`;
      }
      
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tests');
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

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await fetch('/api/patients?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      setPatients(data.patients);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePatientFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPatientFilter(event.target.value as string);
    setPage(0);
  };

  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as string);
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  const handleOpenPdfDialog = async (test: Test) => {
    setSelectedTest(test);
    setPdfDialogOpen(true);
    setPdfLoading(true);
    setPdfData(null);
    
    try {
      const response = await fetch('/api/lab/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: test.id,
          includeHospitalLogo: true,
          includeDigitalSignature: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF report');
      }
      
      const data = await response.json();
      setPdfData(data.pdf);
      setPdfFilename(data.filename);
      
      // Update test status if needed
      if (test.status === 'COMPLETED') {
        fetchTests(); // Refresh tests list to get updated status
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleClosePdfDialog = () => {
    setPdfDialogOpen(false);
    setSelectedTest(null);
    setPdfData(null);
  };

  const handleDownloadPdf = () => {
    if (!pdfData || !pdfFilename) return;
    
    const linkSource = `data:application/pdf;base64,${pdfData}`;
    const downloadLink = document.createElement('a');
    downloadLink.href = linkSource;
    downloadLink.download = pdfFilename;
    downloadLink.click();
  };

  const handlePrintPdf = () => {
    if (!pdfData) return;
    
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.write(`
        <html>
          <head>
            <title>Print PDF</title>
          </head>
          <body style="margin:0">
            <embed width="100%" height="100%" src="data:application/pdf;base64,${pdfData}" type="application/pdf">
          </body>
        </html>
      `);
      pdfWindow.document.close();
      pdfWindow.onload = () => {
        pdfWindow.focus();
        pdfWindow.print();
      };
    }
  };

  const handleOpenNotificationDialog = (test: Test) => {
    setSelectedTest(test);
    setNotificationDialogOpen(true);
  };

  const handleCloseNotificationDialog = () => {
    setNotificationDialogOpen(false);
    setSelectedTest(null);
  };

  const handleNotificationOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationOptions({
      ...notificationOptions,
      [event.target.name]: event.target.checked,
    });
  };

  const handleSendNotifications = async () => {
    if (!selectedTest) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Generate PDF first if not already generated
      let pdfBase64 = pdfData;
      if (!pdfBase64) {
        const pdfResponse = await fetch('/api/lab/reports/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testId: selectedTest.id,
            includeHospitalLogo: true,
            includeDigitalSignature: true,
          }),
        });
        
        if (!pdfResponse.ok) {
          throw new Error('Failed to generate PDF report');
        }
        
        const pdfData = await pdfResponse.json();
        pdfBase64 = pdfData.pdf;
      }
      
      // Send notifications
      const channels = [];
      if (notificationOptions.email) channels.push('EMAIL');
      if (notificationOptions.sms) channels.push('SMS');
      if (notificationOptions.whatsapp) channels.push('WHATSAPP');
      
      const notifications = [];
      
      // Patient notification
      if (notificationOptions.includePatient) {
        for (const channel of channels) {
          notifications.push({
            testId: selectedTest.id,
            patientId: selectedTest.patientId,
            notificationType: 'TEST_RESULT',
            channel,
            message: `Your test results for ${selectedTest.testCatalog.name} are ready.`,
            attachmentUrl: channel === 'EMAIL' ? pdfBase64 : undefined,
            priority: 'NORMAL',
          });
        }
      }
      
      // Doctor notification
      if (notificationOptions.includeDoctor) {
        for (const channel of channels) {
          notifications.push({
            testId: selectedTest.id,
            patientId: selectedTest.patientId,
            doctorId: selectedTest.requestedBy,
            notificationType: 'TEST_RESULT',
            channel,
            message: `Test results for ${selectedTest.testCatalog.name} are ready for your patient.`,
            attachmentUrl: channel === 'EMAIL' ? pdfBase64 : undefined,
            priority: 'NORMAL',
          });
        }
      }
      
      // Send all notifications
      const results = await Promise.all(
        notifications.map(notification => 
          fetch('/api/lab/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notification),
          })
        )
      );
      
      const failedNotifications = results.filter(r => !r.ok).length;
      
      if (failedNotifications > 0) {
        setError(`${failedNotifications} notification(s) failed to send`);
      } else {
        setSuccess('Notifications sent successfully');
        handleCloseNotificationDialog();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'primary';
      case 'REPORTED':
        return 'success';
      case 'VERIFIED':
        return 'success';
      case 'DELIVERED':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by test name or code"
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="patient-filter-label">Patient</InputLabel>
              <Select
                labelId="patient-filter-label"
                value={patientFilter}
                onChange={handlePatientFilterChange}
                label="Patient"
              >
                <MenuItem value="">All Patients</MenuItem>
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.user.name} ({patient.patientId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="COMPLETED,REPORTED,VERIFIED,DELIVERED">Ready for Report</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="REPORTED">Reported</MenuItem>
                <MenuItem value="VERIFIED">Verified</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
              </Select>
            </FormControl>
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
            No tests found for reporting. Try adjusting your filters.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test</TableCell>
                <TableCell>Patient ID</TableCell>
                <TableCell>Requested At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Results</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    <Typography variant="body1">{test.testCatalog.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {test.testCatalog.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{test.patientId}</TableCell>
                  <TableCell>{formatDate(test.requestedAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={test.status}
                      color={getStatusChipColor(test.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {test.results.length > 0 ? (
                      <Chip
                        label={`${test.results.length} result(s)`}
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <Chip label="No results" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Generate PDF Report">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenPdfDialog(test)}
                        size="small"
                        disabled={test.results.length === 0}
                      >
                        <PdfIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Notifications">
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenNotificationDialog(test)}
                        size="small"
                        disabled={test.results.length === 0}
                      >
                        <EmailIcon />
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

      {/* PDF Preview Dialog */}
      <Dialog open={pdfDialogOpen} onClose={handleClosePdfDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTest ? `${selectedTest.testCatalog.name} Report` : 'Test Report'}
        </DialogTitle>
        <DialogContent>
          {pdfLoading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : pdfData ? (
            <Box sx={{ height: '70vh', overflow: 'auto' }}>
              <iframe
                src={`data:application/pdf;base64,${pdfData}`}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="PDF Preview"
              />
            </Box>
          ) : (
            <Alert severity="error">Failed to generate PDF report</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePdfDialog}>Close</Button>
          <Button 
            startIcon={<DownloadIcon />} 
            onClick={handleDownloadPdf}
            disabled={!pdfData}
            color="primary"
          >
            Download
          </Button>
          <Button 
            startIcon={<PrintIcon />} 
            onClick={handlePrintPdf}
            disabled={!pdfData}
            color="primary"
          >
            Print
          </Button>
          <Button 
            startIcon={<EmailIcon />} 
            onClick={() => {
              handleClosePdfDialog();
              if (selectedTest) {
                handleOpenNotificationDialog(selectedTest);
              }
            }}
            disabled={!pdfData}
            color="secondary"
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={notificationDialogOpen} onClose={handleCloseNotificationDialog}>
        <DialogTitle>Send Test Result Notifications</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {selectedTest ? `Send ${selectedTest.testCatalog.name} results to:` : 'Send test results to:'}
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationOptions.includePatient}
                  onChange={handleNotificationOptionChange}
                  name="includePatient"
                  color="primary"
                />
              }
              label="Patient"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationOptions.includeDoctor}
                  onChange={handleNotificationOptionChange}
                  name="includeDoctor"
                  color="primary"
                />
              }
              label="Requesting Doctor"
            />
          </FormGroup>
          <Typography variant="body1" sx={{ mt: 2 }} gutterBottom>
            Notification channels:
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationOptions.email}
                  onChange={handleNotificationOptionChange}
                  name="email"
                  color="primary"
                />
              }
              label="Email (with PDF attachment)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationOptions.sms}
                  onChange={handleNotificationOptionChange}
                  name="sms"
                  color="primary"
                />
              }
              label="SMS"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationOptions.whatsapp}
                  onChange={handleNotificationOptionChange}
                  name="whatsapp"
                  color="primary"
                />
              }
              label="WhatsApp"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotificationDialog}>Cancel</Button>
          <Button 
            onClick={handleSendNotifications}
            variant="contained" 
            color="primary"
            disabled={loading || (!notificationOptions.email && !notificationOptions.sms && !notificationOptions.whatsapp) || (!notificationOptions.includePatient && !notificationOptions.includeDoctor)}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Notifications'}
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

export default ReportManagement;
