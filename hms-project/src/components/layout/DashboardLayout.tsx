"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Toolbar, CssBaseline, useMediaQuery, Theme, createTheme, ThemeProvider } from "@mui/material";
import { useSession, signOut } from "next-auth/react";
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
  BiotechOutlined as RadiologyIcon,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // Create a more modern theme based on dark mode state
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#3f51b5', // Indigo
            light: '#757de8',
            dark: '#002984',
          },
          secondary: {
            main: '#00bcd4', // Cyan
            light: '#62efff',
            dark: '#008ba3',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f7',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
          error: {
            main: '#f44336',
          },
          warning: {
            main: '#ff9800',
          },
          info: {
            main: '#2196f3',
          },
          success: {
            main: '#4caf50',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 600,
          },
          h3: {
            fontWeight: 600,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
          button: {
            fontWeight: 600,
            textTransform: 'none',
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#333333',
                boxShadow: darkMode 
                  ? '0 2px 10px rgba(0, 0, 0, 0.5)' 
                  : '0 2px 10px rgba(0, 0, 0, 0.05)',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                boxShadow: darkMode 
                  ? '2px 0 10px rgba(0, 0, 0, 0.5)' 
                  : '2px 0 10px rgba(0, 0, 0, 0.05)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              rounded: {
                borderRadius: 12,
              },
              elevation1: {
                boxShadow: darkMode 
                  ? '0 2px 10px rgba(0, 0, 0, 0.5)' 
                  : '0 2px 10px rgba(0, 0, 0, 0.05)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: darkMode 
                  ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
              },
            },
          },
        },
      }),
    [darkMode],
  );

  // Toggle drawer for mobile view
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    // You can store this preference in localStorage
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  // Load dark mode preference from localStorage on initial render
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

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
    {
      title: "Billing & Accounting",
      path: "/billing",
      icon: <AccountingIcon />,
      children: [
        {
          title: "Dashboard",
          path: "/billing",
        },
        {
          title: "Invoices",
          path: "/billing/invoices",
        },
        {
          title: "Create Invoice",
          path: "/billing/invoices/create",
        },
        {
          title: "Financial Reports",
          path: "/billing/reports",
        },
      ],
    },
    {
      title: "Radiology",
      path: "/radiology",
      icon: <RadiologyIcon />,
      children: [
        {
          title: "Dashboard",
          path: "/radiology",
        },
        {
          title: "Service Catalog",
          path: "/radiology?tab=0",
        },
        {
          title: "Imaging Requests",
          path: "/radiology?tab=1",
        },
        {
          title: "Image Viewer",
          path: "/radiology?tab=2",
        },
        {
          title: "Reports",
          path: "/radiology?tab=3",
        },
        {
          title: "Analytics",
          path: "/radiology?tab=4",
        },
      ],
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
    signOut({ callbackUrl: '/login' });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <Header 
          user={user} 
          onLogout={handleLogout} 
          toggleDrawer={handleDrawerToggle}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
        <Sidebar 
          items={sidebarItems} 
          width={drawerWidth} 
          mobileOpen={mobileOpen}
          onMobileClose={handleDrawerToggle}
          variant={isMobile ? 'temporary' : 'permanent'}
        />
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
    </ThemeProvider>
  );
};

export default DashboardLayout;
