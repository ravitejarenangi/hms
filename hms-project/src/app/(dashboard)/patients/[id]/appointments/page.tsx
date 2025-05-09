"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  MedicalServices as DoctorIcon,
  LocalHospital as HospitalIcon,
  Notes as NotesIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

interface Appointment {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string;
  notes: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  followUp: {
    id: string;
    date: string;
    notes: string;
  } | null;
  createdAt: string;
}

interface PatientData {
  patientId: string;
  patientName: string;
  appointments: Appointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function PatientAppointmentsPage({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedAppointmentId, setExpandedAppointmentId] = useState<string | null>(null);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  
  // New appointment form state
  const [formData, setFormData] = useState({
    doctorId: "",
    departmentId: "",
    appointmentDate: "",
    startTime: "",
    endTime: "",
    type: "consultation",
    reason: "",
    notes: ""
  });
  
  // Mock data for doctors and departments (replace with API calls in production)
  const doctors = [
    { id: "1", name: "Dr. John Smith", departmentId: "1" },
    { id: "2", name: "Dr. Sarah Johnson", departmentId: "2" },
    { id: "3", name: "Dr. Michael Brown", departmentId: "1" },
    { id: "4", name: "Dr. Emily Davis", departmentId: "3" }
  ];
  
  const departments = [
    { id: "1", name: "Cardiology" },
    { id: "2", name: "Neurology" },
    { id: "3", name: "Orthopedics" },
    { id: "4", name: "General Medicine" }
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has permissions to view appointments
      const userRoles = (session?.user as any)?.roles || [];
      const canViewAppointments = userRoles.some(role => 
        ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist'].includes(role)
      );
      
      setHasPermission(canViewAppointments);
      
      if (!canViewAppointments) {
        setError("You don't have permission to view patient appointments");
        setLoading(false);
      } else {
        fetchAppointments();
      }
    }
  }, [status, router, session, patientId, page, rowsPerPage, statusFilter]);

  const fetchAppointments = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", (page + 1).toString());
      params.append("limit", rowsPerPage.toString());
      
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(`/api/patients/${patientId}/appointments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPatientData(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch appointments");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching appointments:", err);
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

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleExpandClick = (appointmentId: string) => {
    setExpandedAppointmentId(expandedAppointmentId === appointmentId ? null : appointmentId);
  };

  const handleBookDialogOpen = () => {
    setBookDialogOpen(true);
  };

  const handleBookDialogClose = () => {
    setBookDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // If department changes, reset doctor
    if (name === 'departmentId') {
      setFormData(prev => ({ ...prev, doctorId: "" }));
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/patients/${patientId}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form and close dialog
        setFormData({
          doctorId: "",
          departmentId: "",
          appointmentDate: "",
          startTime: "",
          endTime: "",
          type: "consultation",
          reason: "",
          notes: ""
        });
        setBookDialogOpen(false);
        
        // Refresh appointments
        fetchAppointments();
      } else {
        throw new Error(data.error || "Failed to book appointment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error booking appointment:", err);
    }
  };

  const handleBack = () => {
    router.push(`/patients/${patientId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    // Assuming timeString is in HH:MM format
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no_show':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!hasPermission) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!patientData) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
        <Alert severity="error">Patient not found or no appointment data available</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/patients")}
          sx={{ mt: 2 }}
        >
          Back to Patients
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: 3, py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Patient Appointments
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Patient
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleBookDialogOpen}
          >
            Book Appointment
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patient Information
          </Typography>
          <Typography variant="body1">
            <strong>Name:</strong> {patientData.patientName}
          </Typography>
          <Typography variant="body1">
            <strong>ID:</strong> {patientData.patientId}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Appointment History
          </Typography>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="no_show">No Show</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {patientData.appointments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No appointments found for this patient
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleBookDialogOpen}
              sx={{ mt: 2 }}
            >
              Book First Appointment
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Appointment #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patientData.appointments.map((appointment) => (
                    <React.Fragment key={appointment.id}>
                      <TableRow
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleExpandClick(appointment.id)}
                      >
                        <TableCell component="th" scope="row">
                          {appointment.appointmentNumber}
                        </TableCell>
                        <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                        <TableCell>{formatTime(appointment.startTime)}</TableCell>
                        <TableCell>{appointment.doctorName}</TableCell>
                        <TableCell>{appointment.departmentName}</TableCell>
                        <TableCell>{getTypeLabel(appointment.type)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={getStatusLabel(appointment.status)} 
                            color={getStatusColor(appointment.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpandClick(appointment.id);
                            }}
                          >
                            {expandedAppointmentId === appointment.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                          <Collapse in={expandedAppointmentId === appointment.id} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Appointment Details
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="subtitle2" color="text.secondary">
                                    Reason for Visit
                                  </Typography>
                                  <Typography variant="body1">
                                    {appointment.reason || "Not specified"}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="subtitle2" color="text.secondary">
                                    Notes
                                  </Typography>
                                  <Typography variant="body1">
                                    {appointment.notes || "No notes"}
                                  </Typography>
                                </Grid>
                                {appointment.followUp && (
                                  <Grid item xs={12}>
                                    <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                      <Typography variant="subtitle2" color="primary">
                                        Follow-up Appointment
                                      </Typography>
                                      <Typography variant="body2">
                                        <CalendarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                        {formatDate(appointment.followUp.date)}
                                      </Typography>
                                      <Typography variant="body2">
                                        {appointment.followUp.notes}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={patientData.pagination.total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Book Appointment Dialog */}
      <Dialog
        open={bookDialogOpen}
        onClose={handleBookDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Book New Appointment</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleBookAppointment} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="departmentId"
                    value={formData.departmentId}
                    label="Department"
                    onChange={handleSelectChange}
                  >
                    {departments.map(dept => (
                      <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Doctor</InputLabel>
                  <Select
                    name="doctorId"
                    value={formData.doctorId}
                    label="Doctor"
                    onChange={handleSelectChange}
                    disabled={!formData.departmentId}
                  >
                    {doctors
                      .filter(doc => !formData.departmentId || doc.departmentId === formData.departmentId)
                      .map(doc => (
                        <MenuItem key={doc.id} value={doc.id}>{doc.name}</MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Appointment Date"
                  name="appointmentDate"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Appointment Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    label="Appointment Type"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="follow_up">Follow-up</MenuItem>
                    <MenuItem value="procedure">Procedure</MenuItem>
                    <MenuItem value="surgery">Surgery</MenuItem>
                    <MenuItem value="emergency">Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reason for Visit"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBookDialogClose}>Cancel</Button>
          <Button onClick={handleBookAppointment} variant="contained" color="primary">
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
