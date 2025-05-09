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
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import PatientList from "@/components/patients/PatientList";

export default function PatientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has permissions to view patients
      const userRoles = (session?.user as any)?.roles || [];
      const canViewPatients = userRoles.some(role => 
        ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist'].includes(role)
      );
      
      setHasPermission(canViewPatients);
      setLoading(false);
      
      if (!canViewPatients) {
        setError("You don't have permission to access this page");
      }
    }
  }, [status, router, session]);

  const handleRegisterPatient = () => {
    router.push("/patients/register");
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

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Patient Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleRegisterPatient}
        >
          Register Patient
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <PatientList />
      </Paper>
    </Box>
  );
}
