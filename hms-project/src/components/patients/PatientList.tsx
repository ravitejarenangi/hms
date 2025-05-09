"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Grid,
  SelectChangeEvent,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  MedicalServices as MedicalIcon,
  Assignment as DocumentIcon,
  Favorite as HeartIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

interface Patient {
  id: string;
  userId: string;
  patientId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodGroup: string | null;
  hasAllergies: boolean;
  allergiesCount: number;
  hasMedicalHistory: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function PatientList() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");
  const [ageFromFilter, setAgeFromFilter] = useState("");
  const [ageToFilter, setAgeToFilter] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [pagination.page, searchTerm, genderFilter, bloodGroupFilter, ageFromFilter, ageToFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      if (genderFilter) {
        params.append("gender", genderFilter);
      }
      
      if (bloodGroupFilter) {
        params.append("bloodGroup", bloodGroupFilter);
      }
      
      if (ageFromFilter) {
        params.append("ageFrom", ageFromFilter);
      }
      
      if (ageToFilter) {
        params.append("ageTo", ageToFilter);
      }
      
      const response = await fetch(`/api/patients?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data.patients);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || "Failed to fetch patients");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination({ ...pagination, page: value });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page on search
  };

  const handleGenderFilterChange = (event: SelectChangeEvent) => {
    setGenderFilter(event.target.value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page on filter change
  };

  const handleBloodGroupFilterChange = (event: SelectChangeEvent) => {
    setBloodGroupFilter(event.target.value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page on filter change
  };

  const handleAgeFromFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgeFromFilter(event.target.value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page on filter change
  };

  const handleAgeToFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgeToFilter(event.target.value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page on filter change
  };

  const handleViewPatient = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handleEditPatient = (patientId: string) => {
    router.push(`/patients/${patientId}/edit`);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    
    try {
      const response = await fetch(`/api/patients/${patientToDelete.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete patient");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted patient from the list
        setPatients(patients.filter(patient => patient.id !== patientToDelete.id));
        setDeleteDialogOpen(false);
        setPatientToDelete(null);
      } else {
        throw new Error(data.error || "Failed to delete patient");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error deleting patient:", err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const handleViewMedicalHistory = (patientId: string) => {
    router.push(`/patients/${patientId}/medical-history`);
  };

  const handleViewDocuments = (patientId: string) => {
    router.push(`/patients/${patientId}/documents`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "suspended":
        return "error";
      default:
        return "default";
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case "male":
        return "Male";
      case "female":
        return "Female";
      case "other":
        return "Other";
      default:
        return gender;
    }
  };

  if (loading && patients.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && patients.length === 0) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search by name, email, or ID"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Gender</InputLabel>
            <Select
              value={genderFilter}
              label="Gender"
              onChange={handleGenderFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Blood Group</InputLabel>
            <Select
              value={bloodGroupFilter}
              label="Blood Group"
              onChange={handleBloodGroupFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="A+">A+</MenuItem>
              <MenuItem value="A-">A-</MenuItem>
              <MenuItem value="B+">B+</MenuItem>
              <MenuItem value="B-">B-</MenuItem>
              <MenuItem value="AB+">AB+</MenuItem>
              <MenuItem value="AB-">AB-</MenuItem>
              <MenuItem value="O+">O+</MenuItem>
              <MenuItem value="O-">O-</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            label="Age From"
            type="number"
            value={ageFromFilter}
            onChange={handleAgeFromFilterChange}
            size="small"
            inputProps={{ min: 0, max: 120 }}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            label="Age To"
            type="number"
            value={ageToFilter}
            onChange={handleAgeToFilterChange}
            size="small"
            inputProps={{ min: 0, max: 120 }}
          />
        </Grid>
      </Grid>

      {patients.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No patients found
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Patient ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Age/Gender</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Blood Group</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.patientId}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {patient.name}
                        {patient.hasAllergies && (
                          <Tooltip title={`${patient.allergiesCount} Allergies`}>
                            <WarningIcon 
                              color="warning" 
                              fontSize="small" 
                              sx={{ ml: 1 }} 
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {patient.age} / {getGenderLabel(patient.gender)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{patient.email}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient.phone || "No phone"}
                      </Typography>
                    </TableCell>
                    <TableCell>{patient.bloodGroup || "Unknown"}</TableCell>
                    <TableCell>
                      <Chip
                        label={patient.status}
                        size="small"
                        color={getStatusColor(patient.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Tooltip title="View Profile">
                          <IconButton
                            size="small"
                            onClick={() => handleViewPatient(patient.id)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Medical History">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewMedicalHistory(patient.id)}
                          >
                            <MedicalIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Documents">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewDocuments(patient.id)}
                          >
                            <DocumentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditPatient(patient.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(patient)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing {patients.length} of {pagination.total} patients
            </Typography>
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the patient "{patientToDelete?.name}" (ID: {patientToDelete?.patientId})? This action cannot be undone and will delete all associated medical records.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
