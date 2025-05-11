'use client';

import React, { useState, useEffect } from 'react';
import {
  Badge,
  Box,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  Tooltip,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as ReadIcon,
  DeleteOutline as ClearIcon,
  Settings as SettingsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { firestore } from '../../app/api/messaging/firebase-config';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

// Notification types
type NotificationType = 'MESSAGE' | 'MENTION' | 'INVITE' | 'SYSTEM';

// Notification interface
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  threadId?: string;
  actionUrl?: string;
}

// Notification settings interface
interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  showPreview: boolean;
  doNotDisturb: boolean;
}

interface NotificationCenterProps {
  maxNotifications?: number;
  showSettings?: boolean;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxNotifications = 20,
  showSettings = true,
  onNotificationClick
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    enableSound: true,
    enableDesktop: true,
    showPreview: true,
    doNotDisturb: false
  });
  const [sound] = useState(() => typeof Audio !== 'undefined' ? new Audio('/notification-sound.mp3') : null);

  // Request notification permission
  useEffect(() => {
    if (settings.enableDesktop && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [settings.enableDesktop]);

  // Fetch notifications when component mounts
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      setLoading(true);
      
      try {
        // Get notification settings first
        const settingsRef = collection(firestore, 'notificationSettings');
        const settingsQuery = query(settingsRef, where('userId', '==', session.user.id));
        const settingsSnapshot = await getDocs(settingsQuery);
        
        if (!settingsSnapshot.empty) {
          const settingsData = settingsSnapshot.docs[0].data();
          setSettings({
            enableSound: settingsData.enableSound ?? true,
            enableDesktop: settingsData.enableDesktop ?? true,
            showPreview: settingsData.showPreview ?? true,
            doNotDisturb: settingsData.doNotDisturb ?? false
          });
        }
        
        // Set up real-time listener for notifications
        const notificationsRef = collection(firestore, 'notifications');
        const notificationsQuery = query(
          notificationsRef,
          where('userId', '==', session.user.id),
          orderBy('timestamp', 'desc'),
          limit(maxNotifications)
        );
        
        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          const notificationsData: Notification[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              type: data.type as NotificationType,
              title: data.title || '',
              message: data.message || '',
              timestamp: data.timestamp?.toDate() || new Date(),
              read: data.read || false,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              threadId: data.threadId,
              actionUrl: data.actionUrl
            };
          });
          
          // Handle new notifications
          const newNotifications = snapshot.docChanges().filter(change => change.type === 'added');
          
          if (newNotifications.length > 0 && !settings.doNotDisturb) {
            // Play sound for new notifications
            if (settings.enableSound && sound) {
              sound.play().catch(err => console.error('Error playing notification sound:', err));
            }
            
            // Show desktop notification for new messages
            if (settings.enableDesktop && 'Notification' in window && Notification.permission === 'granted') {
              newNotifications.forEach(change => {
                const data = change.doc.data();
                const notification = new Notification(data.title || 'New notification', {
                  body: settings.showPreview ? data.message : 'You have a new notification',
                  icon: data.senderAvatar || '/logo.png'
                });
                
                notification.onclick = () => {
                  window.focus();
                  if (data.actionUrl) {
                    router.push(data.actionUrl);
                  }
                };
              });
            }
          }
          
          setNotifications(notificationsData);
          setUnreadCount(notificationsData.filter(n => !n.read).length);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching notifications:', error);
          setError('Failed to load notifications');
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up notification listener:', error);
        setError('Failed to connect to notification service');
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [session, maxNotifications, sound, router]);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read in Firestore
    markAsRead(notification.id);
    
    // Close the menu
    setAnchorEl(null);
    
    // Navigate or call handler
    if (onNotificationClick) {
      onNotificationClick(notification);
    } else if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.threadId) {
      router.push(`/messaging/thread/${notification.threadId}`);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) return;
      
      // Update in Firestore
      const batch = firestore.batch();
      
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(firestore, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });
      
      await batch.commit();
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      // This is typically handled by a server function or API endpoint
      // to avoid deleting too many documents at once from the client
      await fetch('/api/messaging/notifications/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      setAnchorEl(null);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Update notification settings
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Update in Firestore
      const settingsRef = collection(firestore, 'notificationSettings');
      const settingsQuery = query(settingsRef, where('userId', '==', session?.user?.id));
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (settingsSnapshot.empty) {
        // Create new settings document
        await addDoc(collection(firestore, 'notificationSettings'), {
          userId: session?.user?.id,
          ...updatedSettings,
          createdAt: new Date()
        });
      } else {
        // Update existing settings
        const docRef = doc(firestore, 'notificationSettings', settingsSnapshot.docs[0].id);
        await updateDoc(docRef, {
          ...updatedSettings,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  if (loading && !notifications.length) {
    return (
      <IconButton disabled>
        <CircularProgress size={24} />
      </IconButton>
    );
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            maxWidth: 360,
            width: '100%',
            maxHeight: 500
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          
          <Box>
            {showSettings && (
              <Tooltip title="Notification settings">
                <IconButton size="small" onClick={(e) => setSettingsAnchorEl(e.currentTarget)}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={markAllAsRead} disabled={unreadCount === 0}>
                <ReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Clear all">
              <IconButton size="small" onClick={clearAllNotifications} disabled={notifications.length === 0}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">No notifications</Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderLeft: notification.read ? 'none' : '4px solid #1976d2',
                  backgroundColor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.08)'
                }}
              >
                <ListItemAvatar>
                  <Avatar src={notification.senderAvatar}>
                    {notification.senderName ? notification.senderName.charAt(0) : ''}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Typography variant="body1" noWrap fontWeight={notification.read ? 'normal' : 'bold'}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
                
                {!notification.read && (
                  <Tooltip title="Mark as read">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <ReadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </MenuItem>
            ))}
          </Box>
        )}
        
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
              <Button size="small" onClick={() => router.push('/messaging/notifications')}>
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
      
      {/* Notification Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
        PaperProps={{
          sx: { width: 250 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Settings
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={() => updateSettings({ enableSound: !settings.enableSound })}>
          <ListItemText
            primary="Notification Sound"
            secondary={settings.enableSound ? 'Enabled' : 'Disabled'}
          />
          <Switch
            edge="end"
            checked={settings.enableSound}
            onChange={() => updateSettings({ enableSound: !settings.enableSound })}
          />
        </MenuItem>
        
        <MenuItem onClick={() => updateSettings({ enableDesktop: !settings.enableDesktop })}>
          <ListItemText
            primary="Desktop Notifications"
            secondary={settings.enableDesktop ? 'Enabled' : 'Disabled'}
          />
          <Switch
            edge="end"
            checked={settings.enableDesktop}
            onChange={() => updateSettings({ enableDesktop: !settings.enableDesktop })}
          />
        </MenuItem>
        
        <MenuItem onClick={() => updateSettings({ showPreview: !settings.showPreview })}>
          <ListItemText
            primary="Show Message Preview"
            secondary={settings.showPreview ? 'Enabled' : 'Disabled'}
          />
          <Switch
            edge="end"
            checked={settings.showPreview}
            onChange={() => updateSettings({ showPreview: !settings.showPreview })}
          />
        </MenuItem>
        
        <MenuItem onClick={() => updateSettings({ doNotDisturb: !settings.doNotDisturb })}>
          <ListItemText
            primary="Do Not Disturb"
            secondary={settings.doNotDisturb ? 'Enabled' : 'Disabled'}
          />
          <Switch
            edge="end"
            checked={settings.doNotDisturb}
            onChange={() => updateSettings({ doNotDisturb: !settings.doNotDisturb })}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationCenter;
