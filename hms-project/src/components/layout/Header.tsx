"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Box,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Tooltip,
  alpha,
} from "@mui/material";
import RadiologyRealTimeUpdates from "../radiology/RadiologyRealTimeUpdates";
import {
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
  toggleDrawer?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onLogout, 
  toggleDrawer, 
  darkMode = false,
  onToggleDarkMode = () => {}
}) => {
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    if (onLogout) onLogout();
  };

  const isProfileMenuOpen = Boolean(profileAnchorEl);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    // Implement global search functionality here
    console.log('Searching for:', searchQuery);
    // You could navigate to a search results page or show results in a dropdown
  };

  return (
    <AppBar 
      position="fixed" 
      color="default" 
      elevation={1} 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: darkMode ? 'grey.900' : 'background.paper',
        color: darkMode ? 'common.white' : 'text.primary',
      }}
    >
      <Toolbar>
        {/* Mobile menu toggle */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleDrawer}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box 
          component={Link} 
          href="/dashboard"
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'white',
              mr: 1.5,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              H
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              textDecoration: "none",
              color: "primary.main",
              fontWeight: "bold",
              letterSpacing: '0.5px',
            }}
          >
            HMS
          </Typography>
        </Box>

        {/* Global Search */}
        <Box 
          component="form" 
          onSubmit={handleSearch}
          sx={{ 
            ml: 2,
            flexGrow: 1,
            maxWidth: { xs: '100%', md: 400 },
            position: 'relative',
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.common.white, darkMode ? 0.15 : 0.05),
            border: (theme) => `1px solid ${alpha(theme.palette.divider, darkMode ? 0.2 : 0.1)}`,
            boxShadow: (theme) => `0px 2px 6px ${alpha(theme.palette.common.black, darkMode ? 0.3 : 0.05)}`,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.common.white, darkMode ? 0.25 : 0.1),
              boxShadow: (theme) => `0px 4px 12px ${alpha(theme.palette.common.black, darkMode ? 0.4 : 0.08)}`,
            },
            transition: 'all 0.2s ease-in-out',
            mr: 2,
          }}
        >
          <TextField
            placeholder="Search..."
            variant="standard"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              disableUnderline: true,
              sx: { px: 1, py: 0.5 }
            }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Dark Mode Toggle */}
          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton
              onClick={onToggleDarkMode}
              size="small"
              sx={{
                ml: 1,
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                width: 36,
                height: 36,
                borderRadius: '12px',
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                },
                transition: 'all 0.2s',
              }}
            >
              {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Real-time Notifications */}
          <RadiologyRealTimeUpdates />
          
          {/* Profile */}
          {user ? (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                ml: 1, 
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                borderRadius: '12px',
                px: 1,
                py: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                },
                transition: 'all 0.2s'
              }}
              onClick={handleProfileMenuOpen}
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
            >
              {user.avatar ? (
                <Avatar 
                  src={user.avatar} 
                  alt={user.name} 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }} 
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: "primary.main",
                    fontWeight: 'bold',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Typography
                variant="body2"
                sx={{ 
                  ml: 1, 
                  fontWeight: 600,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {user.name.split(' ')[0]}
              </Typography>
            </Box>
          ) : (
            <Button
              component={Link}
              href="/login"
              variant="contained"
              color="primary"
              size="small"
              sx={{ ml: 1 }}
            >
              Sign in
            </Button>
          )}
        </Box>

        {/* Profile Menu */}
        <Menu
          id="profile-menu"
          anchorEl={profileAnchorEl}
          open={isProfileMenuOpen}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 4px 20px rgba(0,0,0,0.15))",
              mt: 1.5,
              borderRadius: 3,
              width: 240,
              "& .MuiAvatar-root": {
                width: 36,
                height: 36,
                ml: -0.5,
                mr: 1,
              },
              "& .MuiMenuItem-root": {
                py: 1.5,
                px: 2,
              },
            },
          }}
        >
          {user && (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" noWrap>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          )}
          {user && <Divider />}
          <MenuItem component={Link} href="/profile" onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Your Profile</ListItemText>
          </MenuItem>
          <MenuItem component={Link} href="/settings" onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign out</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
