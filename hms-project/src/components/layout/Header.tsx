"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import RadiologyRealTimeUpdates from "../radiology/RadiologyRealTimeUpdates";
import {
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
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

  return (
    <AppBar position="static" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/dashboard"
          sx={{
            textDecoration: "none",
            color: "primary.main",
            fontWeight: "bold",
            flexGrow: 1,
          }}
        >
          HMS
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Real-time Notifications */}
          <RadiologyRealTimeUpdates />
          
          {/* Profile */}
          {user ? (
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleProfileMenuOpen}
              size="large"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              sx={{ ml: 1 }}
            >
              {user.avatar ? (
                <Avatar src={user.avatar} alt={user.name} sx={{ width: 32, height: 32 }} />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </IconButton>
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
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
              mt: 1.5,
              width: 220,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
        >
          {user && (
            <>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" noWrap>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
              <Divider />
            </>
          )}
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
