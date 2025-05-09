"use client";

import { useState, useEffect } from "react";
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
  Grid,
  SelectChangeEvent,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as DocumentIcon,
  CheckCircle as VerifiedIcon,
  Error as PendingIcon,
} from "@mui/icons-material";
import { formatDistanceToNow, format } from "date-fns";

interface Scheme {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sponsoredBy: string;
  startDate: string;
  endDate: string | null;
  status: string;
  eligibilityCriteria: string | null;
}

interface Beneficiary {
  id: string;
  schemeId: string;
  scheme: Scheme;
  patientId: string;
  beneficiaryId: string;
  enrollmentDate: string;
  verificationStatus: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  expiryDate: string | null;
  status: string;
  notes: string | null;
  documents: any[];
  claims: any[];
}

interface SubsidySchemeListProps {
  patientId: string;
}

export default function SubsidySchemeList({ patientId }: SubsidySchemeListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    schemeId: "",
    beneficiaryId: "",
    verificationStatus: "PENDING",
    expiryDate: "",
    status: "ACTIVE",
    notes: "",
  });

  // Claim form state
  const [claimFormData, setClaimFormData] = useState({
    serviceId: "",
    claimAmount: "",
    diagnosis: "",
    notes: "",
  });

  useEffect(() => {
    fetchBeneficiaries();
    fetchSchemes();
  }, [patientId]);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patients/${patientId}/subsidy-schemes`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch subsidy schemes");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBeneficiaries(data.data.beneficiaries);
      } else {
        throw new Error(data.error || "Failed to fetch subsidy schemes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching subsidy schemes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemes = async () => {
    try {
      const response = await fetch("/api/subsidy-schemes");
      
      if (!response.ok) {
        throw new Error("Failed to fetch schemes");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSchemes(data.data.schemes);
      } else {
        throw new Error(data.error || "Failed to fetch schemes");
      }
    } catch (err) {
      console.error("Error fetching schemes:", err);
      // Don't set error state here to avoid overriding the main error display
    }
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({
      schemeId: "",
      beneficiaryId: "",
      verificationStatus: "PENDING",
      expiryDate: "",
      status: "ACTIVE",
      notes: "",
    });
  };

  const handleClaimDialogOpen = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setClaimDialogOpen(true);
  };

  const handleClaimDialogClose = () => {
    setClaimDialogOpen(false);
    setSelectedBeneficiary(null);
    setClaimFormData({
      serviceId: "",
      claimAmount: "",
      diagnosis: "",
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

  const handleClaimInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClaimFormData({ ...claimFormData, [name]: value });
  };

  const handleClaimSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setClaimFormData({ ...claimFormData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/patients/${patientId}/subsidy-schemes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to enroll in subsidy scheme");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        fetchBeneficiaries();
        handleDialogClose();
      } else {
        throw new Error(data.error || "Failed to enroll in subsidy scheme");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error enrolling in subsidy scheme:", err);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBeneficiary) return;
    
    try {
      const response = await fetch(`/api/patients/${patientId}/subsidy-schemes/${selectedBeneficiary.id}/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(claimFormData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit claim");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        fetchBeneficiaries();
        handleClaimDialogClose();
      } else {
        throw new Error(data.error || "Failed to submit claim");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error submitting claim:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" component="h2">
          Government Subsidy Schemes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
        >
          Enroll in Scheme
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {beneficiaries.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="textSecondary">
            No subsidy schemes found for this patient.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Scheme Name</TableCell>
                <TableCell>Beneficiary ID</TableCell>
                <TableCell>Enrollment Date</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Verification Status</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Claims</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {beneficiaries.map((beneficiary) => (
                <TableRow key={beneficiary.id}>
                  <TableCell>{beneficiary.scheme.name}</TableCell>
                  <TableCell>{beneficiary.beneficiaryId}</TableCell>
                  <TableCell>
                    {format(new Date(beneficiary.enrollmentDate), "PPP")}
                  </TableCell>
                  <TableCell>
                    {beneficiary.expiryDate
                      ? format(new Date(beneficiary.expiryDate), "PPP")
                      : "No expiry"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        beneficiary.verificationStatus === "VERIFIED" ? (
                          <VerifiedIcon fontSize="small" />
                        ) : (
                          <PendingIcon fontSize="small" />
                        )
                      }
                      label={beneficiary.verificationStatus}
                      color={
                        beneficiary.verificationStatus === "VERIFIED"
                          ? "success"
                          : "warning"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={beneficiary.status}
                      color={
                        beneficiary.status === "ACTIVE"
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {beneficiary.claims.length} claims
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Submit Claim">
                      <IconButton
                        size="small"
                        onClick={() => handleClaimDialogOpen(beneficiary)}
                      >
                        <DocumentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Enrollment Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Enroll in Government Subsidy Scheme</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="scheme-label">Scheme</InputLabel>
                  <Select
                    labelId="scheme-label"
                    id="schemeId"
                    name="schemeId"
                    value={formData.schemeId}
                    onChange={handleSelectChange}
                    required
                  >
                    {schemes.map((scheme) => (
                      <MenuItem key={scheme.id} value={scheme.id}>
                        {scheme.name} ({scheme.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Beneficiary ID"
                  name="beneficiaryId"
                  value={formData.beneficiaryId}
                  onChange={handleInputChange}
                  required
                  helperText="Government-assigned beneficiary ID"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="verification-status-label">Verification Status</InputLabel>
                  <Select
                    labelId="verification-status-label"
                    id="verificationStatus"
                    name="verificationStatus"
                    value={formData.verificationStatus}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="VERIFIED">Verified</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Expiry Date"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="EXPIRED">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Enroll
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Claim Dialog */}
      <Dialog open={claimDialogOpen} onClose={handleClaimDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Submit Subsidy Claim</DialogTitle>
        <form onSubmit={handleClaimSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Scheme: {selectedBeneficiary?.scheme.name}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  Beneficiary ID: {selectedBeneficiary?.beneficiaryId}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="service-label">Service</InputLabel>
                  <Select
                    labelId="service-label"
                    id="serviceId"
                    name="serviceId"
                    value={claimFormData.serviceId}
                    onChange={handleClaimSelectChange}
                    required
                  >
                    {selectedBeneficiary?.scheme.services?.map((service: any) => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.serviceName} - {service.coveragePercentage}% coverage
                      </MenuItem>
                    )) || (
                      <MenuItem disabled value="">
                        No services available
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Claim Amount"
                  name="claimAmount"
                  type="number"
                  value={claimFormData.claimAmount}
                  onChange={handleClaimInputChange}
                  required
                  InputProps={{
                    startAdornment: <span>₹</span>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Diagnosis"
                  name="diagnosis"
                  value={claimFormData.diagnosis}
                  onChange={handleClaimInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Notes"
                  name="notes"
                  value={claimFormData.notes}
                  onChange={handleClaimInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClaimDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Submit Claim
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
