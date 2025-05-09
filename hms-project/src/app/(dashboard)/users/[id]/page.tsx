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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  profile: any;
  doctor: any;
  nurse: any;
  patient: any;
  staff: any;
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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has admin permissions or is viewing their own profile
      const userRoles = (session?.user as any)?.roles || [];
      const isAdmin = userRoles.includes("admin") || userRoles.includes("superadmin");
      const isOwnProfile = (session?.user as any)?.id === userId;
      
      setHasPermission(isAdmin || isOwnProfile);
      
      if (!isAdmin && !isOwnProfile) {
        setError("You don't have permission to view this profile");
        setLoading(false);
      } else {
        fetchUser();
      }
    }
  }, [status, router, session, userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditUser = () => {
    router.push(`/users/${userId}/edit`);
  };

  const handleBack = () => {
    router.push("/users");
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "error";
      case "admin":
        return "warning";
      case "doctor":
        return "primary";
      case "nurse":
        return "info";
      case "patient":
        return "success";
      default:
        return "default";
    }
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

  if (!user) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
        <Alert severity="error">User not found</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/users")}
          sx={{ mt: 2 }}
        >
          Back to Users
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
          User Profile
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
            onClick={handleEditUser}
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
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.name}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 0.5, mb: 2 }}>
                {user.roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    size="small"
                    color={getRoleColor(role)}
                  />
                ))}
              </Box>
              <Chip
                label={user.status}
                color={getStatusColor(user.status)}
                sx={{ mb: 2 }}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <List dense>
              <ListItem>
                <EmailIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Email"
                  secondary={user.email}
                />
              </ListItem>
              <ListItem>
                <PhoneIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Phone"
                  secondary={user.phone || "Not provided"}
                />
              </ListItem>
              <ListItem>
                <CalendarIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Joined"
                  secondary={formatDate(user.createdAt)}
                />
              </ListItem>
              <ListItem>
                <CalendarIcon sx={{ mr: 2, color: "text.secondary" }} />
                <ListItemText
                  primary="Last Updated"
                  secondary={formatDate(user.updatedAt)}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Profile" />
              <Tab label="Role Details" />
              {user.doctor && <Tab label="Doctor Info" />}
              {user.nurse && <Tab label="Nurse Info" />}
              {user.patient && <Tab label="Patient Info" />}
              {user.staff && <Tab label="Staff Info" />}
            </Tabs>
            
            <TabPanel value={activeTab} index={0}>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              
              {user.profile ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1">
                          {user.profile.address || "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          City
                        </Typography>
                        <Typography variant="body1">
                          {user.profile.city || "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          State/Province
                        </Typography>
                        <Typography variant="body1">
                          {user.profile.state || "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Country
                        </Typography>
                        <Typography variant="body1">
                          {user.profile.country || "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Postal Code
                        </Typography>
                        <Typography variant="body1">
                          {user.profile.postalCode || "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Bio
                        </Typography>
                        <Typography variant="body1">
                          {user.profile.bio || "No bio provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No profile information available
                </Typography>
              )}
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <Typography variant="h6" gutterBottom>
                User Roles
              </Typography>
              
              <Grid container spacing={2}>
                {user.roles.map((role) => (
                  <Grid item xs={12} key={role}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <PersonIcon sx={{ mr: 1, color: getRoleColor(role) + ".main" }} />
                          <Typography variant="h6" color={getRoleColor(role) + ".main"}>
                            {role}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {getRoleDescription(role)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>
            
            {user.doctor && (
              <TabPanel value={activeTab} index={2}>
                <Typography variant="h6" gutterBottom>
                  Doctor Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Specialization
                        </Typography>
                        <Typography variant="body1">
                          {user.doctor.specialization || "Not specified"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          License Number
                        </Typography>
                        <Typography variant="body1">
                          {user.doctor.licenseNumber || "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
            
            {user.nurse && (
              <TabPanel value={activeTab} index={user.doctor ? 3 : 2}>
                <Typography variant="h6" gutterBottom>
                  Nurse Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body1">
                          {user.nurse.department || "Not specified"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          License Number
                        </Typography>
                        <Typography variant="body1">
                          {user.nurse.licenseNumber || "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
            
            {user.patient && (
              <TabPanel value={activeTab} index={getTabIndex(user, "patient")}>
                <Typography variant="h6" gutterBottom>
                  Patient Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Blood Type
                        </Typography>
                        <Typography variant="body1">
                          {user.patient.bloodType || "Not specified"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date of Birth
                        </Typography>
                        <Typography variant="body1">
                          {user.patient.dateOfBirth ? new Date(user.patient.dateOfBirth).toLocaleDateString() : "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
            
            {user.staff && (
              <TabPanel value={activeTab} index={getTabIndex(user, "staff")}>
                <Typography variant="h6" gutterBottom>
                  Staff Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Staff Type
                        </Typography>
                        <Typography variant="body1">
                          {user.staff.staffType || "Not specified"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body1">
                          {user.staff.department || "Not specified"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Employee ID
                        </Typography>
                        <Typography variant="body1">
                          {user.staff.employeeId || "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Joining Date
                        </Typography>
                        <Typography variant="body1">
                          {user.staff.joiningDate ? new Date(user.staff.joiningDate).toLocaleDateString() : "Not provided"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Helper function to get role description
function getRoleDescription(role: string): string {
  switch (role) {
    case "superadmin":
      return "Has full access to all system features and can manage all aspects of the hospital management system.";
    case "admin":
      return "Can manage users, departments, and system settings but with some restrictions compared to superadmin.";
    case "doctor":
      return "Can access patient records, create prescriptions, schedule appointments, and manage treatments.";
    case "nurse":
      return "Can update patient vitals, administer medications, and assist doctors with patient care.";
    case "patient":
      return "Can view their own medical records, appointments, and prescriptions.";
    case "pharmacist":
      return "Can manage medications, fill prescriptions, and maintain inventory of pharmaceuticals.";
    case "accountant":
      return "Can manage billing, payments, insurance claims, and financial reports.";
    case "receptionist":
      return "Can schedule appointments, register patients, and manage front desk operations.";
    case "pathologist":
      return "Can manage laboratory tests, record results, and maintain lab equipment.";
    case "radiologist":
      return "Can perform imaging procedures, interpret results, and maintain imaging equipment.";
    default:
      return "User with system access based on assigned permissions.";
  }
}

// Helper function to get tab index based on user roles
function getTabIndex(user: User, role: string): number {
  let index = 2; // Start after Profile and Role Details tabs
  
  if (user.doctor) {
    if (role === "doctor") return index;
    index++;
  }
  
  if (user.nurse) {
    if (role === "nurse") return index;
    index++;
  }
  
  if (user.patient) {
    if (role === "patient") return index;
    index++;
  }
  
  if (user.staff) {
    if (role === "staff") return index;
  }
  
  return 0; // Default to first tab if not found
}
