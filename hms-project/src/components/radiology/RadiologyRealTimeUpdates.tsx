"use client";

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
  Button,
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

  // Track the reader for cleanup
  const readerRef = React.useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  
  // Initialize SSE connection
  useEffect(() => {
    // Create a new abort controller for this connection
    abortControllerRef.current = new AbortController();
    
    // Start the SSE connection
    connectToSSE();

    // Cleanup on unmount
    return () => {
      // Cancel any in-flight fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Close the reader if it exists
      if (readerRef.current) {
        readerRef.current.cancel().catch(err => {
          console.error('Error canceling reader:', err);
        });
      }
      
      // We no longer use eventSource, so clear the connected state
      setConnected(false);
    };
  }, []);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(notification => !notification.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Track reconnection attempts
  const reconnectAttemptsRef = React.useRef<number>(0);
  const maxReconnectAttempts = 5;
  const initialReconnectDelay = 1000; // 1 second

  const connectToSSE = async () => {
    try {
      // Reset error state when attempting to connect
      setError(null);

      // First check authentication status to avoid unnecessary connection attempts
      const authCheckResponse = await fetch('/api/auth/session', {
        credentials: 'include',
      }).catch(err => {
        console.error('Auth check failed:', err);
        throw new Error(`Authentication check failed: ${err.message}`);
      });

      if (!authCheckResponse.ok) {
        throw new Error(`Authentication check failed with status: ${authCheckResponse.status}`);
      }

      const authData = await authCheckResponse.json();
      if (!authData || !authData.user) {
        throw new Error('User not authenticated. Please log in first.');
      }
      
      // Use fetch with credentials to establish the SSE connection
      const response = await fetch('/api/radiology/sse', {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        signal: abortControllerRef.current?.signal,
      }).catch(err => {
        // Handle fetch errors explicitly
        console.error('Fetch error:', err);
        throw new Error(`SSE connection request failed: ${err.message}`);
      });
      
      // Reset reconnect attempts on successful connection
      reconnectAttemptsRef.current = 0;
      
      if (!response.ok) {
        throw new Error(`SSE connection failed with status: ${response.status}`);
      }

      setConnected(true);

      // Handle the stream
      if (!response.body) {
        console.error('No response body available');
        setConnected(false);
        return;
      }
      
      const reader = response.body.getReader();
      readerRef.current = reader;
      
      let decoder = new TextDecoder();
      let buffer = '';

      // Process the data stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('SSE stream complete');
              setConnected(false);
              break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages in the buffer
            // SSE messages are separated by double newlines
            const messages = buffer.split('\n\n');
            buffer = messages.pop() || ''; // Keep the last incomplete chunk in the buffer

            for (const message of messages) {
              if (message.trim() === '') continue;
              
              // Extract event data from SSE format
              // Each line in an SSE message is a field
              const lines = message.split('\n');
              const fields: Record<string, string> = {};
              
              for (const line of lines) {
                if (line.trim() === '') continue;
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                  const fieldName = line.slice(0, colonIndex);
                  // The spec says to remove the first space after the colon if it exists
                  const fieldValue = line.slice(colonIndex + 1).startsWith(' ') 
                    ? line.slice(colonIndex + 2) 
                    : line.slice(colonIndex + 1);
                  fields[fieldName] = fieldValue;
                }
              }
              
              // Check if we have data in the event
              if (fields.data) {
                try {
                  const data = JSON.parse(fields.data);
                  console.log('Received SSE event:', data);
                  handleNewNotification(data);
                } catch (parseError) {
                  console.error('Failed to parse SSE data:', parseError, fields.data);
                }
              }
            }
          }
        } catch (error: any) {
          if (error && error.name === 'AbortError') {
            console.log('SSE connection was aborted');
          } else {
            // Safely handle errors, converting Event objects to strings if needed
            let errorMessage = 'Unknown error';
            if (error instanceof Event) {
              errorMessage = `Event error: ${error.type}`;
            } else if (error?.message) {
              errorMessage = error.message;
            } else if (typeof error === 'object') {
              try {
                errorMessage = JSON.stringify(error);
              } catch (e) {
                errorMessage = 'Unserializable error object';
              }
            }
            
            console.error('Error reading SSE stream:', errorMessage);
            setError(`Failed to process SSE stream: ${errorMessage}`);
            
            // Implement reconnection with exponential backoff
            const attemptReconnect = () => {
              reconnectAttemptsRef.current += 1;
              
              if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
                // Calculate exponential backoff delay
                const delay = initialReconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
                console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current} of ${maxReconnectAttempts})`);
                
                setError(`Connection lost. Reconnecting in ${Math.round(delay/1000)} seconds... (attempt ${reconnectAttemptsRef.current} of ${maxReconnectAttempts})`);
                
                // Set a timeout to attempt reconnection
                setTimeout(() => {
                  // Create a new AbortController for the next connection attempt
                  if (abortControllerRef.current) {
                    abortControllerRef.current = new AbortController();
                  }
                  connectToSSE();
                }, delay);
              } else {
                console.error('Maximum reconnection attempts reached');
                setError('Maximum reconnection attempts reached. Please refresh the page to try again.');
              }
            };
            
            // Start reconnection process
            attemptReconnect();
          }
          setConnected(false);
        }
      };
      
      // Start processing the stream
      processStream();
      
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
