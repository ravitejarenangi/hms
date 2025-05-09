"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  SelectChangeEvent,
} from "@mui/material";
import {
  Person as PersonIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Event as EventIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  Add as AddIcon,
  AssignmentInd as AssignmentIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

interface Doctor {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    profile: {
      avatar: string | null;
      specialization: string | null;
      qualifications: string | null;
      experience: string | null;
    } | null;
  };
  licenseNumber: string;
  specialization: string;
  department: string | null;
  qualification: string;
  experience: number;
  consultationFee: number;
  availableFrom: string | null;
  availableTo: string | null;
  availableDays: number[];
  departments: {
    id: string;
    departmentId: string;
    department: {
      id: string;
      name: string;
    };
    isPrimary: boolean;
  }[];
  specialities: {
    id: string;
    specialityId: string;
    speciality: {
      id: string;
      name: string;
    };
    isPrimary: boolean;
  }[];
  appointmentCount: number;
  lastAppointment: {
    doctorId: string;
    startTime: string;
    status: string;
  } | null;
  isPrimaryDoctor: boolean;
}

interface PatientDoctorRelationshipProps {
  patientId: string;
}

export default function PatientDoctorRelationship({ patientId }: PatientDoctorRelationshipProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    doctorId: "",
    appointmentTypeId: "initial-consultation",
    notes: "",
  });

  useEffect(() => {
    fetchDoctors();
    fetchAllDoctors();
  }, [patientId]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patients/${patientId}/doctors`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch patient's doctors");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDoctors(data.data.doctors);
      } else {
        throw new Error(data.error || "Failed to fetch patient's doctors");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching patient's doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      
      if (!response.ok) {
        throw new Error("Failed to fetch all doctors");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAllDoctors(data.data.doctors);
      } else {
        throw new Error(data.error || "Failed to fetch all doctors");
      }
    } catch (err) {
      console.error("Error fetching all doctors:", err);
      // Don't set error state here to avoid overriding the main error display
    }
  };

  const handleAssignDialogOpen = () => {
    setAssignDialogOpen(true);
  };

  const handleAssignDialogClose = () => {
    setAssignDialogOpen(false);
    setFormData({
      doctorId: "",
      appointmentTypeId: "initial-consultation",
      notes: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/patients/${patientId}/doctors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to assign doctor to patient");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        fetchDoctors();
        handleAssignDialogClose();
      } else {
        throw new Error(data.error || "Failed to assign doctor to patient");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error assigning doctor to patient:", err);
    }
  };

  const getPrimaryDoctors = () => {
    return doctors.filter(doctor => doctor.isPrimaryDoctor);
  };

  const getOtherDoctors = () => {
    return doctors.filter(doctor => !doctor.isPrimaryDoctor);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const primaryDoctors = getPrimaryDoctors();
  const otherDoctors = getOtherDoctors();

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" component="h2">
          Patient-Doctor Relationships
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAssignDialogOpen}
        >
          Assign Doctor
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Primary Doctors Section */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Primary Care Physicians
          </Typography>
          {primaryDoctors.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="textSecondary">
                No primary doctors assigned to this patient.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {primaryDoctors.map((doctor) => (
                <Grid item xs={12} sm={6} md={4} key={doctor.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Avatar
                          src={doctor.user.profile?.avatar || undefined}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        >
                          {doctor.user.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {doctor.user.name}
                            <Tooltip title="Primary Doctor">
                              <StarIcon color="primary" fontSize="small" sx={{ ml: 1, verticalAlign: "middle" }} />
                            </Tooltip>
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {doctor.specialization}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <MedicalIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                          {doctor.departments.map(d => d.department.name).join(", ")}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <EmailIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                          {doctor.user.email}
                        </Typography>
                      </Box>
                      
                      {doctor.user.phone && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <PhoneIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                            {doctor.user.phone}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <HistoryIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                          {doctor.appointmentCount} appointments
                        </Typography>
                      </Box>
                      
                      {doctor.lastAppointment && (
                        <Box>
                          <Typography variant="body2">
                            <EventIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                            Last visit: {format(new Date(doctor.lastAppointment.startTime), "PPP")}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<EventIcon />}>
                        Schedule Appointment
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Other Doctors Section */}
        <Grid item xs={12} sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Other Treating Physicians
          </Typography>
          {otherDoctors.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="textSecondary">
                No other doctors have treated this patient.
              </Typography>
            </Paper>
          ) : (
            <Paper>
              <List>
                {otherDoctors.map((doctor) => (
                  <Box key={doctor.id}>
                    <ListItem
                      secondaryAction={
                        <Button
                          size="small"
                          startIcon={<EventIcon />}
                          variant="outlined"
                        >
                          Schedule
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={doctor.user.profile?.avatar || undefined}
                        >
                          {doctor.user.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {doctor.user.name}
                            <Chip
                              size="small"
                              label={doctor.specialization}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            {doctor.departments.map(d => d.department.name).join(", ")}
                            {doctor.lastAppointment && (
                              <> • Last visit: {format(new Date(doctor.lastAppointment.startTime), "PPP")}</>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </Box>
                ))}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Assign Doctor Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleAssignDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Assign Doctor to Patient</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel id="doctor-label">Doctor</InputLabel>
              <Select
                labelId="doctor-label"
                id="doctorId"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleSelectChange}
                required
              >
                {allDoctors
                  .filter(doctor => !doctors.some(d => d.id === doctor.id))
                  .map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.user.name} - {doctor.specialization}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="appointment-type-label">Appointment Type</InputLabel>
              <Select
                labelId="appointment-type-label"
                id="appointmentTypeId"
                name="appointmentTypeId"
                value={formData.appointmentTypeId}
                onChange={handleSelectChange}
                required
              >
                <MenuItem value="initial-consultation">Initial Consultation</MenuItem>
                <MenuItem value="follow-up">Follow-up</MenuItem>
                <MenuItem value="specialist-referral">Specialist Referral</MenuItem>
                <MenuItem value="second-opinion">Second Opinion</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAssignDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Assign Doctor
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
