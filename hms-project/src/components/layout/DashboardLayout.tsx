"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Toolbar, CssBaseline } from "@mui/material";
import { useSession } from "next-auth/react";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  LocalHospital as DoctorIcon,
  Settings as SettingsIcon,
  MedicalServices as NurseIcon,
  AdminPanelSettings as AdminIcon,
  Medication as PharmacyIcon,
  Science as LabIcon,
  AccountBalance as AccountingIcon,
  Person as PatientIcon,
} from "@mui/icons-material";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const drawerWidth = 240;

  // Get user data from session
  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "",
  };

  // Get user roles
  const userRoles = (session?.user as any)?.roles || [];
  const isDoctor = userRoles.includes("doctor");
  const isNurse = userRoles.includes("nurse");
  const isAdmin = userRoles.includes("admin");
  const isSuperAdmin = userRoles.includes("superadmin");
  const isPharmacist = userRoles.includes("pharmacist");
  const isLabTechnician = userRoles.includes("pathologist") || userRoles.includes("radiologist");
  const isAccountant = userRoles.includes("accountant");
  const isPatient = userRoles.includes("patient");

  // Base sidebar items that everyone can see
  const baseSidebarItems = [
    {
      title: "Main Dashboard",
      path: "/dashboard",
      icon: <DashboardIcon />,
    },
  ];

  // Role-specific dashboard items
  const roleDashboardItems = [];

  if (isDoctor) {
    roleDashboardItems.push({
      title: "Doctor Dashboard",
      path: "/doctor/dashboard",
      icon: <DoctorIcon />,
    });
  }

  if (isNurse) {
    roleDashboardItems.push({
      title: "Nurse Dashboard",
      path: "/nurse/dashboard",
      icon: <NurseIcon />,
    });
  }

  if (isAdmin || isSuperAdmin) {
    roleDashboardItems.push({
      title: "Admin Dashboard",
      path: "/admin/dashboard",
      icon: <AdminIcon />,
    });
  }

  if (isPharmacist) {
    roleDashboardItems.push({
      title: "Pharmacy Dashboard",
      path: "/pharmacy/dashboard",
      icon: <PharmacyIcon />,
    });
  }

  if (isLabTechnician) {
    roleDashboardItems.push({
      title: "Lab Dashboard",
      path: "/lab/dashboard",
      icon: <LabIcon />,
    });
  }

  if (isAccountant) {
    roleDashboardItems.push({
      title: "Finance Dashboard",
      path: "/finance/dashboard",
      icon: <AccountingIcon />,
    });
  }

  if (isPatient) {
    roleDashboardItems.push({
      title: "Patient Portal",
      path: "/patient/dashboard",
      icon: <PatientIcon />,
    });
  }

  // Common functionality items
  const functionalItems = [
    {
      title: "Patients",
      path: "/patients",
      icon: <PeopleIcon />,
      children: [
        {
          title: "All Patients",
          path: "/patients",
        },
        {
          title: "Register Patient",
          path: "/patients/register",
        },
      ],
    },
    {
      title: "Appointments",
      path: "/appointments",
      icon: <CalendarIcon />,
    },
    {
      title: "Doctors",
      path: "/doctors",
      icon: <DoctorIcon />,
    },
  ];

  // Admin-only items
  const adminItems = isAdmin || isSuperAdmin ? [
    {
      title: "User Management",
      path: "/users",
      icon: <PeopleIcon />,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <SettingsIcon />,
    },
  ] : [];

  // Combine all sidebar items
  const sidebarItems = [
    ...baseSidebarItems,
    ...(roleDashboardItems.length > 0 ? roleDashboardItems : []),
    ...functionalItems,
    ...adminItems
  ];

  const handleLogout = () => {
    // Use the signOut function from next-auth
    router.push("/login");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Header user={user} onLogout={handleLogout} />
      <Sidebar items={sidebarItems} width={drawerWidth} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Toolbar /> {/* This creates space below the app bar */}
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
