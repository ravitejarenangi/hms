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
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  profile: any;
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

export default function EditUserPage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    status: "active",
    roles: [] as string[],
  });

  // Profile form state
  const [profileData, setProfileData] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    bio: "",
  });

  // Form validation
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has admin permissions
      const userRoles = (session?.user as any)?.roles || [];
      const isAdmin = userRoles.includes("admin") || userRoles.includes("superadmin");
      const isOwnProfile = (session?.user as any)?.id === userId;
      
      setHasPermission(isAdmin || isOwnProfile);
      
      if (!isAdmin && !isOwnProfile) {
        setError("You don't have permission to access this page");
        setLoading(false);
      } else {
        // Fetch roles and user data
        fetchRoles();
        fetchUser();
      }
    }
  }, [status, router, session, userId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch roles");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching roles:", err);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data);
        
        // Initialize form data
        setFormData({
          name: data.data.name,
          email: data.data.email,
          password: "",
          confirmPassword: "",
          phone: data.data.phone || "",
          status: data.data.status,
          roles: data.data.roles,
        });
        
        // Initialize profile data if exists
        if (data.data.profile) {
          setProfileData({
            address: data.data.profile.address || "",
            city: data.data.profile.city || "",
            state: data.data.profile.state || "",
            country: data.data.profile.country || "",
            postalCode: data.data.profile.postalCode || "",
            bio: data.data.profile.bio || "",
          });
        }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setFormData({ ...formData, status: e.target.value });
  };

  const handleRolesChange = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    setFormData({ 
      ...formData, 
      roles: typeof value === 'string' ? value.split(',') : value 
    });
    
    // Clear error when user selects roles
    if (formErrors.roles) {
      setFormErrors({ ...formErrors, roles: "" });
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { ...formErrors };
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }
    
    // Validate password only if provided (optional on edit)
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
        valid = false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        valid = false;
      }
    }
    
    // Validate roles
    if (formData.roles.length === 0) {
      newErrors.roles = "At least one role is required";
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare data for update
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        status: formData.status,
        roles: formData.roles,
      };
      
      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      // Include profile data if on profile tab
      if (activeTab === 1) {
        updateData.profile = profileData;
      }
      
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess("User updated successfully");
        
        // Update local user data
        if (user) {
          setUser({
            ...user,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            status: formData.status,
            roles: formData.roles,
            profile: activeTab === 1 ? profileData : user.profile,
          });
        }
        
        // Reset password fields
        setFormData({
          ...formData,
          password: "",
          confirmPassword: "",
        });
      } else {
        throw new Error(data.error || "Failed to update user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error updating user:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/users");
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
          Edit User: {user.name}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
        >
          Back to Users
        </Button>
      </Box>

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

      <Paper sx={{ p: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Basic Information" />
          <Tab label="Profile" />
        </Tabs>

        <form onSubmit={handleSubmit}>
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="New Password (leave blank to keep current)"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  disabled={!formData.password}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={handleStatusChange}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.roles}>
                  <InputLabel>Roles</InputLabel>
                  <Select
                    multiple
                    value={formData.roles}
                    onChange={handleRolesChange}
                    input={<OutlinedInput label="Roles" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.name}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.roles && (
                    <Typography variant="caption" color="error">
                      {formErrors.roles}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileInputChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={profileData.city}
                  onChange={handleProfileInputChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State/Province"
                  name="state"
                  value={profileData.state}
                  onChange={handleProfileInputChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={profileData.country}
                  onChange={handleProfileInputChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  name="postalCode"
                  value={profileData.postalCode}
                  onChange={handleProfileInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileInputChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
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
        </form>
      </Paper>
    </Box>
  );
}
