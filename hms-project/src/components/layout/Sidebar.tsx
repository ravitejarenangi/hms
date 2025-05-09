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
}

const Sidebar: React.FC<SidebarProps> = ({ items, width = 240 }) => {
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
      const isActive = pathname === item.path;
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems[item.title];

      return (
        <React.Fragment key={item.path}>
          {hasChildren ? (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => toggleItem(item.title)}
                  selected={isActive}
                  sx={{
                    pl: 2 + level * 2,
                    py: 1,
                    "&.Mui-selected": {
                      bgcolor: "primary.light",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "primary.light",
                      },
                    },
                  }}
                >
                  {item.icon && <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>}
                  <ListItemText primary={item.title} />
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children && renderSidebarItems(item.children, level + 1)}
                </List>
              </Collapse>
            </>
          ) : (
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href={item.path}
                selected={isActive}
                sx={{
                  pl: 2 + level * 2,
                  py: 1,
                  "&.Mui-selected": {
                    bgcolor: "primary.light",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.light",
                    },
                  },
                }}
              >
                {item.icon && <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>}
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          HMS
        </Typography>
      </Box>
      <Divider />
      <List sx={{ pt: 1 }}>{renderSidebarItems(items)}</List>
    </Drawer>
  );
};

export default Sidebar;
