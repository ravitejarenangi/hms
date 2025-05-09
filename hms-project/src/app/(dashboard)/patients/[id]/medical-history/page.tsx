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
  TextField,
  Chip,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

interface MedicalHistoryVersion {
  id: string;
  chronicConditions: string[];
  pastSurgeries: string[];
  currentMedications: string[];
  familyHistory: string;
  lifestyle: string;
  updatedBy: string;
  notes: string;
  createdAt: string;
}

interface MedicalHistory {
  id: string;
  patientId: string;
  chronicConditions: string[];
  pastSurgeries: string[];
  currentMedications: string[];
  familyHistory: string;
  lifestyle: string;
  createdAt: string;
  updatedAt: string;
  versions: MedicalHistoryVersion[];
}

interface PatientData {
  patientId: string;
  patientName: string;
  medicalHistory: MedicalHistory | null;
}

export default function MedicalHistoryPage({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    chronicConditions: [] as string[],
    pastSurgeries: [] as string[],
    currentMedications: [] as string[],
    familyHistory: "",
    lifestyle: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has permissions to view/edit medical history
      const userRoles = (session?.user as any)?.roles || [];
      const canViewMedicalHistory = userRoles.some(role => 
        ['admin', 'superadmin', 'doctor', 'nurse'].includes(role)
      );
      
      setHasPermission(canViewMedicalHistory);
      
      if (!canViewMedicalHistory) {
        setError("You don't have permission to view medical history");
        setLoading(false);
      } else {
        fetchMedicalHistory();
      }
    }
  }, [status, router, session, patientId]);

  const fetchMedicalHistory = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/medical-history`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch medical history");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPatientData(data.data);
        
        // Initialize form data if medical history exists
        if (data.data.medicalHistory) {
          setFormData({
            chronicConditions: data.data.medicalHistory.chronicConditions,
            pastSurgeries: data.data.medicalHistory.pastSurgeries,
            currentMedications: data.data.medicalHistory.currentMedications,
            familyHistory: data.data.medicalHistory.familyHistory,
            lifestyle: data.data.medicalHistory.lifestyle,
            notes: ""
          });
        }
      } else {
        throw new Error(data.error || "Failed to fetch medical history");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching medical history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value;
    // Split by commas and trim each item
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({ ...formData, [field]: items });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form data to current medical history
    if (patientData?.medicalHistory) {
      setFormData({
        chronicConditions: patientData.medicalHistory.chronicConditions,
        pastSurgeries: patientData.medicalHistory.pastSurgeries,
        currentMedications: patientData.medicalHistory.currentMedications,
        familyHistory: patientData.medicalHistory.familyHistory,
        lifestyle: patientData.medicalHistory.lifestyle,
        notes: ""
      });
    } else {
      setFormData({
        chronicConditions: [],
        pastSurgeries: [],
        currentMedications: [],
        familyHistory: "",
        lifestyle: "",
        notes: ""
      });
    }
    
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/patients/${patientId}/medical-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess("Medical history updated successfully");
        setIsEditing(false);
        
        // Refresh medical history data
        fetchMedicalHistory();
      } else {
        throw new Error(data.error || "Failed to update medical history");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error updating medical history:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHistoryClick = () => {
    setHistoryDialogOpen(true);
  };

  const handleHistoryClose = () => {
    setHistoryDialogOpen(false);
  };

  const handleBack = () => {
    router.push(`/patients/${patientId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
        <Alert severity="error">Patient not found</Alert>
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
    <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Medical History
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Patient
          </Button>
          {patientData.medicalHistory && (
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={handleHistoryClick}
            >
              History
            </Button>
          )}
          {!isEditing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
            >
              Edit
            </Button>
          )}
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

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chronic Conditions (comma separated)"
                  name="chronicConditions"
                  value={formData.chronicConditions.join(', ')}
                  onChange={(e) => handleArrayInputChange(e, 'chronicConditions')}
                  multiline
                  rows={2}
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Past Surgeries (comma separated)"
                  name="pastSurgeries"
                  value={formData.pastSurgeries.join(', ')}
                  onChange={(e) => handleArrayInputChange(e, 'pastSurgeries')}
                  multiline
                  rows={2}
                  placeholder="e.g. Appendectomy (2010), Tonsillectomy (2005)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Medications (comma separated)"
                  name="currentMedications"
                  value={formData.currentMedications.join(', ')}
                  onChange={(e) => handleArrayInputChange(e, 'currentMedications')}
                  multiline
                  rows={2}
                  placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Family Medical History"
                  name="familyHistory"
                  value={formData.familyHistory}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  placeholder="Any significant medical conditions in the family"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lifestyle Information"
                  name="lifestyle"
                  value={formData.lifestyle}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  placeholder="Diet, exercise, smoking, alcohol consumption, etc."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes about this update"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  placeholder="Reason for updating the medical history"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        ) : (
          <Box>
            {patientData.medicalHistory ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Chronic Conditions" />
                    <CardContent>
                      {patientData.medicalHistory.chronicConditions.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patientData.medicalHistory.chronicConditions.map((condition, index) => (
                            <Chip key={index} label={condition} />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No chronic conditions recorded
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Past Surgeries" />
                    <CardContent>
                      {patientData.medicalHistory.pastSurgeries.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patientData.medicalHistory.pastSurgeries.map((surgery, index) => (
                            <Chip key={index} label={surgery} />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No past surgeries recorded
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Current Medications" />
                    <CardContent>
                      {patientData.medicalHistory.currentMedications.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patientData.medicalHistory.currentMedications.map((medication, index) => (
                            <Chip key={index} label={medication} color="primary" />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No current medications recorded
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Family Medical History" />
                    <CardContent>
                      <Typography variant="body1">
                        {patientData.medicalHistory.familyHistory || "No family medical history recorded"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Lifestyle Information" />
                    <CardContent>
                      <Typography variant="body1">
                        {patientData.medicalHistory.lifestyle || "No lifestyle information recorded"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {formatDate(patientData.medicalHistory.updatedAt)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No medical history recorded for this patient
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleEditClick}
                  sx={{ mt: 2 }}
                >
                  Add Medical History
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={handleHistoryClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Medical History Versions</DialogTitle>
        <DialogContent>
          {patientData.medicalHistory?.versions.length ? (
            <List>
              {patientData.medicalHistory.versions.map((version, index) => (
                <React.Fragment key={version.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          Version {patientData.medicalHistory?.versions.length - index}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {formatDate(version.createdAt)}
                          </Typography>
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {version.notes || "No notes provided"}
                          </Typography>
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary">
                                Chronic Conditions:
                              </Typography>
                              <Typography variant="body2">
                                {version.chronicConditions.join(', ') || "None"}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary">
                                Medications:
                              </Typography>
                              <Typography variant="body2">
                                {version.currentMedications.join(', ') || "None"}
                              </Typography>
                            </Grid>
                          </Grid>
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No version history available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHistoryClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
