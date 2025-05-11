import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  IconButton,
  Drawer,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface NotificationMessage {
  id: string;
  type: 'REPORT_READY' | 'IMAGE_UPLOADED' | 'REQUEST_STATUS_CHANGE' | 'CRITICAL_RESULT';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    requestId?: string;
    reportId?: string;
    studyId?: string;
    patientId?: string;
    patientName?: string;
  };
}

const RadiologyRealTimeUpdates: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<NotificationMessage | null>(null);

  // Initialize SSE connection
  useEffect(() => {
    connectToSSE();

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(notification => !notification.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const connectToSSE = () => {
    try {
      // Create a new EventSource connection to the SSE endpoint
      const sse = new EventSource('/api/radiology/sse');
      
      // Set up event listeners
      sse.onopen = () => {
        setConnected(true);
        setError(null);
      };
      
      sse.onerror = (err) => {
        console.error('SSE connection error:', err);
        setConnected(false);
        setError('Failed to connect to real-time updates. Will retry automatically...');
        
        // Close the connection and try to reconnect after a delay
        sse.close();
        setTimeout(connectToSSE, 5000);
      };
      
      // Listen for radiology update events
      sse.addEventListener('radiology-update', (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationMessage;
          handleNewNotification(data);
        } catch (err) {
          console.error('Error parsing SSE event data:', err);
        }
      });
      
      // Store the EventSource instance
      setEventSource(sse);
    } catch (err) {
      console.error('Error setting up SSE connection:', err);
      setConnected(false);
      setError('Failed to connect to real-time updates. Will retry automatically...');
      setTimeout(connectToSSE, 5000);
    }
  };

  const handleNewNotification = (notification: NotificationMessage) => {
    // Add the new notification to the list
    setNotifications(prev => [notification, ...prev]);
    
    // Show a snackbar for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'critical') {
      setCurrentNotification(notification);
      setSnackbarOpen(true);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
    
    // Mark all as read when opening the drawer
    if (!drawerOpen) {
      markAllAsRead();
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({
        ...notification,
        read: true
      }))
    );
  };

  const markAsRead = async (id: string) => {
    try {
      // Update on the server
      await fetch(`/api/radiology/notifications/${id}/read`, {
        method: 'PUT'
      });
      
      // Update locally
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Delete on the server
      await fetch(`/api/radiology/notifications/${id}`, {
        method: 'DELETE'
      });
      
      // Remove locally
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleSnackbarAction = () => {
    if (currentNotification) {
      // Mark the notification as read
      markAsRead(currentNotification.id);
      
      // Navigate to the relevant page based on notification type
      if (currentNotification.type === 'REPORT_READY' && currentNotification.metadata.reportId) {
        window.location.href = `/radiology?tab=3&reportId=${currentNotification.metadata.reportId}`;
      } else if (currentNotification.type === 'IMAGE_UPLOADED' && currentNotification.metadata.studyId) {
        window.location.href = `/radiology?tab=2&studyId=${currentNotification.metadata.studyId}`;
      } else if (currentNotification.type === 'REQUEST_STATUS_CHANGE' && currentNotification.metadata.requestId) {
        window.location.href = `/radiology?tab=1&requestId=${currentNotification.metadata.requestId}`;
      } else {
        // Default to opening the notifications drawer
        setDrawerOpen(true);
      }
      
      setSnackbarOpen(false);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'REPORT_READY':
        return <CheckCircleIcon color="success" />;
      case 'CRITICAL_RESULT':
        return <ErrorIcon color="error" />;
      case 'IMAGE_UPLOADED':
        return <InfoIcon color="info" />;
      case 'REQUEST_STATUS_CHANGE':
        return priority === 'high' || priority === 'critical' 
          ? <WarningIcon color="warning" /> 
          : <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  return (
    <Box>
      {/* Notification Button */}
      <Tooltip title={connected ? "Real-time updates active" : "Connecting to real-time updates..."}>
        <IconButton 
          color="inherit" 
          onClick={handleDrawerToggle}
          sx={{ position: 'relative' }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {connected ? (
              unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />
            ) : (
              <CircularProgress size={24} color="inherit" />
            )}
          </Badge>
        </IconButton>
      </Tooltip>
      
      {/* Notifications Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box
          sx={{ width: 320 }}
          role="presentation"
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Radiology Notifications
            </Typography>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider />
          
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}
          
          {!connected && !error && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Connecting to real-time updates...
              </Typography>
            </Box>
          )}
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => deleteNotification(notification.id)}>
                        <CloseIcon />
                      </IconButton>
                    }
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type, notification.priority)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Drawer>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={
          <React.Fragment>
            <Button color="secondary" size="small" onClick={handleSnackbarAction}>
              VIEW
            </Button>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={currentNotification?.priority === 'critical' ? 'error' : 'info'}
          sx={{ width: '100%' }}
        >
          {currentNotification?.title}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RadiologyRealTimeUpdates;
