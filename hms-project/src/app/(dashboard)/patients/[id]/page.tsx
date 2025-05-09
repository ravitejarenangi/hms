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
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Bloodtype as BloodtypeIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Flag as FlagIcon,
  MedicalServices as MedicalIcon,
  Assignment as DocumentIcon,
  Favorite as HeartIcon,
  Warning as WarningIcon,
  ContactPhone as ContactPhoneIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";

interface Patient {
  id: string;
  userId: string;
  patientId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  profile: any;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodGroup: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  nationality: string | null;
  emergencyContact: string | null;
  emergencyName: string | null;
  emergencyRelation: string | null;
  medicalHistory: any;
  allergies: any[];
  documents: any[];
  vitalSigns: any[];
  createdAt: string;
  updatedAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has permissions to view patients
      const userRoles = (session?.user as any)?.roles || [];
      const canViewPatients = userRoles.some(role =>
        ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist'].includes(role)
      );
      const isOwnRecord = (session?.user as any)?.id === patient?.userId;

      setHasPermission(canViewPatients || isOwnRecord);

      if (!canViewPatients && !isOwnRecord) {
        setError("You don't have permission to view this patient");
      }

      fetchPatient();
    }
  }, [status, router, session, patientId]);

  const fetchPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch patient");
      }

      const data = await response.json();

      if (data.success) {
        setPatient(data.data);

        // Check if user is viewing their own record
        const isOwnRecord = (session?.user as any)?.id === data.data.userId;
        const userRoles = (session?.user as any)?.roles || [];
        const canViewPatients = userRoles.some(role =>
          ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist'].includes(role)
        );

        setHasPermission(canViewPatients || isOwnRecord);
      } else {
        throw new Error(data.error || "Failed to fetch patient");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching patient:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditPatient = () => {
    router.push(`/patients/${patientId}/edit`);
  };

  const handleBack = () => {
    router.push("/patients");
  };

  const handleViewMedicalHistory = () => {
    router.push(`/patients/${patientId}/medical-history`);
  };

  const handleViewDocuments = () => {
    router.push(`/patients/${patientId}/documents`);
  };

  const handleViewAllergies = () => {
    router.push(`/patients/${patientId}/allergies`);
  };

  const handleViewVitals = () => {
    router.push(`/patients/${patientId}/vitals`);
  };

  const handleViewBilling = () => {
    router.push(`/patients/${patientId}/billing`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (!patient) {
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
          Patient Profile
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEditPatient}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar
                sx={{ width: 100, height: 100, mb: 2, bgcolor: "primary.main", fontSize: "2.5rem" }}
              >
                {patient.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {patient.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {patient.patientId}
              </Typography>
              <Chip
                label={patient.status}
                color={getStatusColor(patient.status)}
                sx={{ mb: 2 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <List dense>
              <ListItem>
                <EmailIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Email"
                  secondary={patient.email}
                />
              </ListItem>
              <ListItem>
                <PhoneIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Phone"
                  secondary={patient.phone || "Not provided"}
                />
              </ListItem>
              <ListItem>
                <CalendarIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Date of Birth"
                  secondary={`${formatDate(patient.dateOfBirth)} (${patient.age} years)`}
                />
              </ListItem>
              <ListItem>
                <PersonIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Gender"
                  secondary={getGenderLabel(patient.gender)}
                />
              </ListItem>
              <ListItem>
                <BloodtypeIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Blood Group"
                  secondary={patient.bloodGroup || "Unknown"}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<MedicalIcon />}
                onClick={handleViewMedicalHistory}
                fullWidth
              >
                Medical History
              </Button>
              <Button
                variant="outlined"
                startIcon={<DocumentIcon />}
                onClick={handleViewDocuments}
                fullWidth
              >
                Documents
              </Button>
              <Button
                variant="outlined"
                startIcon={<WarningIcon />}
                onClick={handleViewAllergies}
                fullWidth
                color={patient.allergies.length > 0 ? "warning" : "primary"}
              >
                Allergies {patient.allergies.length > 0 && `(${patient.allergies.length})`}
              </Button>
              <Button
                variant="outlined"
                startIcon={<HeartIcon />}
                onClick={handleViewVitals}
                fullWidth
              >
                Vital Signs
              </Button>
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={handleViewBilling}
                fullWidth
              >
                Billing History
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Personal Details" />
              <Tab label="Contact Information" />
              <Tab label="Medical Summary" />
              <Tab label="Recent Vitals" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Marital Status
                      </Typography>
                      <Typography variant="body1">
                        {patient.maritalStatus ?
                          patient.maritalStatus.charAt(0).toUpperCase() + patient.maritalStatus.slice(1) :
                          "Not specified"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        <WorkIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Occupation
                      </Typography>
                      <Typography variant="body1">
                        {patient.occupation || "Not specified"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        <FlagIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Nationality
                      </Typography>
                      <Typography variant="body1">
                        {patient.nationality || "Not specified"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        <ContactPhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Emergency Contact
                      </Typography>
                      {patient.emergencyName || patient.emergencyContact ? (
                        <>
                          <Typography variant="body1">
                            {patient.emergencyName || "Not specified"}
                            {patient.emergencyRelation && ` (${patient.emergencyRelation})`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {patient.emergencyContact || "No contact number provided"}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body1">No emergency contact provided</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Registration Information
                      </Typography>
                      <Typography variant="body2">
                        Registered on: {formatDate(patient.createdAt)}
                      </Typography>
                      <Typography variant="body2">
                        Last Updated: {formatDate(patient.updatedAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {patient.profile?.address || "Not provided"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[
                          patient.profile?.city,
                          patient.profile?.state,
                          patient.profile?.postalCode,
                          patient.profile?.country
                        ].filter(Boolean).join(", ") || "No additional address details"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {patient.medicalHistory ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Chronic Conditions
                        </Typography>
                        {patient.medicalHistory.chronicConditions.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {patient.medicalHistory.chronicConditions.map((condition: string, index: number) => (
                              <Chip key={index} label={condition} size="small" />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">None reported</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Current Medications
                        </Typography>
                        {patient.medicalHistory.currentMedications.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {patient.medicalHistory.currentMedications.map((medication: string, index: number) => (
                              <Chip key={index} label={medication} size="small" color="primary" />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">None reported</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Allergies
                        </Typography>
                        {patient.allergies.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {patient.allergies.map((allergy: any) => (
                              <Chip
                                key={allergy.id}
                                label={`${allergy.allergen} (${allergy.severity})`}
                                size="small"
                                color="warning"
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">No known allergies</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No medical history recorded
                </Typography>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              {patient.vitalSigns && patient.vitalSigns.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Temp (°C)</TableCell>
                        <TableCell>BP (mmHg)</TableCell>
                        <TableCell>Pulse (bpm)</TableCell>
                        <TableCell>Resp (/min)</TableCell>
                        <TableCell>SpO2 (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patient.vitalSigns.map((vital: any) => (
                        <TableRow key={vital.id}>
                          <TableCell>{formatDate(vital.recordedAt)}</TableCell>
                          <TableCell>{vital.temperature || '-'}</TableCell>
                          <TableCell>
                            {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                              ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
                              : '-'}
                          </TableCell>
                          <TableCell>{vital.heartRate || '-'}</TableCell>
                          <TableCell>{vital.respiratoryRate || '-'}</TableCell>
                          <TableCell>{vital.oxygenSaturation || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No vital signs recorded
                </Typography>
              )}
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  onClick={handleViewVitals}
                >
                  View All Vital Signs
                </Button>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
