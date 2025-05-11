"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

interface SidebarItem {
  title: string;
  path: string;
  icon?: React.ReactNode;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  width?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  width = 240, 
  mobileOpen = false,
  onMobileClose = () => {},
  variant = 'permanent'
}) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const renderSidebarItems = (items: SidebarItem[], level = 0) => {
    return items.map((item) => {
      const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path));
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems[item.title] || (hasChildren && isActive);

      return (
        <React.Fragment key={item.path}>
          {hasChildren ? (
            <>
              <ListItem 
                disablePadding 
                sx={{ 
                  mb: 0.5,
                  mt: level === 0 ? 0.5 : 0,
                }}
              >
                <ListItemButton
                  onClick={() => toggleItem(item.title)}
                  selected={isActive}
                  sx={{
                    pl: 2 + level * 1.5,
                    py: 1.2,
                    borderRadius: 2,
                    mx: 1,
                    mb: 0.5,
                    transition: 'all 0.2s',
                    "&.Mui-selected": {
                      bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'primary.lighter'),
                      color: 'primary.main',
                      fontWeight: 'bold',
                      "&:hover": {
                        bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'primary.light'),
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '20%',
                        height: '60%',
                        width: 4,
                        borderRadius: '0 4px 4px 0',
                        backgroundColor: 'primary.main',
                      },
                    },
                    '&:hover': {
                      bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                    },
                  }}
                >
                  {item.icon && (
                    <ListItemIcon 
                      sx={{ 
                        minWidth: 36, 
                        color: isActive ? 'primary.main' : 'inherit',
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.25rem'
                        }
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText 
                    primary={item.title} 
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List 
                  component="div" 
                  disablePadding
                  sx={{
                    '& .MuiListItemButton-root': {
                      py: 0.8,
                    }
                  }}
                >
                  {item.children && renderSidebarItems(item.children, level + 1)}
                </List>
              </Collapse>
            </>
          ) : (
            <ListItem 
              disablePadding 
              sx={{ 
                mb: 0.5,
                mt: level === 0 ? 0.5 : 0,
              }}
            >
              <ListItemButton
                component={Link}
                href={item.path}
                selected={isActive}
                sx={{
                  pl: 2 + level * 1.5,
                  py: 1.2,
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  transition: 'all 0.2s',
                  "&.Mui-selected": {
                    bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'primary.lighter'),
                    color: 'primary.main',
                    fontWeight: 'bold',
                    "&:hover": {
                      bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'primary.light'),
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      height: '60%',
                      width: 4,
                      borderRadius: '0 4px 4px 0',
                      backgroundColor: 'primary.main',
                    },
                  },
                  '&:hover': {
                    bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                  },
                }}
              >
                {item.icon && (
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 36, 
                      color: isActive ? 'primary.main' : 'inherit',
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.25rem'
                      } 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                )}
                <ListItemText 
                  primary={item.title} 
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </React.Fragment>
      );
    });
  };

  const handleDrawerClose = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  // Drawer content
  const drawerContent = (
    <>
      <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'white',
              mr: 1.5,
              boxShadow: '0 2px 8px rgba(63, 81, 181, 0.3)'
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              H
            </Typography>
          </Box>
          <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ letterSpacing: '0.5px' }}>
            HMS
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mx: 2, opacity: 0.8 }} />
      <List sx={{ pt: 1 }}>{renderSidebarItems(items)}</List>
    </>
  );

  return variant === 'temporary' ? (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': { 
          width, 
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  ) : (
    <Drawer
      variant={variant}
      sx={{
        width,
        flexShrink: 0,
        display: { xs: 'none', sm: 'block' },
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
