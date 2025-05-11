'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Badge,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  IconButton,
  Chip,
  Stack,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import { 
  CheckCircle as OnlineIcon, 
  WarningAmber as AwayIcon, 
  DoNotDisturb as BusyIcon, 
  AccessTime as ScheduleIcon,
  OfflineBolt as OfflineIcon,
  Coffee as BreakIcon,
  Videocam as MeetingIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DateRange as CalendarIcon,
  NotificationsOff as MuteIcon,
  WatchLater as TimeIcon,
  Public as MobileIcon,
  Close as CloseIcon,
  AccessTimeFilled as DutyIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, TimePicker, DateTimePicker } from '@mui/x-date-pickers';
import { format, addHours, isBefore, isAfter } from 'date-fns';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../../app/api/messaging/firebase-config';
import { useSession } from 'next-auth/react';

// Status type enum matching our Prisma schema
enum UserStatusType {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  IN_MEETING = 'IN_MEETING',
  ON_BREAK = 'ON_BREAK',
  CUSTOM = 'CUSTOM'
}

// Interface for the status display
interface StatusInfo {
  icon: React.ReactNode;
  label: string;
  color: string;
}

// User status data interface
interface UserStatusData {
  id?: string;
  userId: string;
  status: UserStatusType;
  customMessage?: string;
  lastActive: Date;
  dutyStartTime?: Date | null;
  dutyEndTime?: Date | null;
  doNotDisturbUntil?: Date | null;
  deviceInfo?: string;
  updatedAt: Date;
}

interface UserStatusProps {
  userId?: string; // If not provided, shows current user's status
  size?: 'small' | 'medium' | 'large';
  showControls?: boolean;
  onStatusChange?: (status: UserStatusData) => void;
}

const statusInfo: Record<UserStatusType, StatusInfo> = {
  [UserStatusType.ONLINE]: {
    icon: <OnlineIcon />,
    label: 'Online',
    color: '#44b700'
  },
  [UserStatusType.AWAY]: {
    icon: <AwayIcon />,
    label: 'Away',
    color: '#ff9800'
  },
  [UserStatusType.BUSY]: {
    icon: <BusyIcon />,
    label: 'Do Not Disturb',
    color: '#f44336'
  },
  [UserStatusType.OFFLINE]: {
    icon: <OfflineIcon />,
    label: 'Offline',
    color: '#9e9e9e'
  },
  [UserStatusType.IN_MEETING]: {
    icon: <MeetingIcon />,
    label: 'In a Meeting',
    color: '#673ab7'
  },
  [UserStatusType.ON_BREAK]: {
    icon: <BreakIcon />,
    label: 'On Break',
    color: '#2196f3'
  },
  [UserStatusType.CUSTOM]: {
    icon: <EditIcon />,
    label: 'Custom Status',
    color: '#4caf50'
  }
};

const getStatusBadgeProps = (status: UserStatusType, size: 'small' | 'medium' | 'large' = 'medium') => {
  const { color } = statusInfo[status];
  
  const sizeMap = {
    small: {
      badgeSize: 8,
      overlap: 'circular' as const,
      anchorOrigin: { vertical: 'bottom', horizontal: 'right' } as const
    },
    medium: {
      badgeSize: 12,
      overlap: 'circular' as const,
      anchorOrigin: { vertical: 'bottom', horizontal: 'right' } as const
    },
    large: {
      badgeSize: 16,
      overlap: 'circular' as const,
      anchorOrigin: { vertical: 'bottom', horizontal: 'right' } as const
    }
  };
  
  return {
    overlap: sizeMap[size].overlap,
    anchorOrigin: sizeMap[size].anchorOrigin,
    sx: {
      '& .MuiBadge-badge': {
        backgroundColor: color,
        color,
        boxShadow: `0 0 0 2px white`,
        width: sizeMap[size].badgeSize,
        height: sizeMap[size].badgeSize,
        borderRadius: '50%',
        '&::after': {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          animation: 'ripple 1.2s infinite ease-in-out',
          border: '1px solid currentColor',
          content: '""',
        },
      },
      '@keyframes ripple': {
        '0%': {
          transform: 'scale(.8)',
          opacity: 1,
        },
        '100%': {
          transform: 'scale(2.4)',
          opacity: 0,
        },
      },
    }
  };
};

// Avatar sizes based on component size prop
const avatarSizes = {
  small: 24,
  medium: 40,
  large: 56
};

const UserStatus: React.FC<UserStatusProps> = ({ 
  userId, 
  size = 'medium', 
  showControls = false,
  onStatusChange 
}) => {
  const { data: session } = useSession();
  const [statusData, setStatusData] = useState<UserStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [scheduleAnchorEl, setScheduleAnchorEl] = useState<null | HTMLElement>(null);
  const [customStatusDialog, setCustomStatusDialog] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [dutyStartTime, setDutyStartTime] = useState<Date | null>(null);
  const [dutyEndTime, setDutyEndTime] = useState<Date | null>(null);
  const [doNotDisturbUntil, setDoNotDisturbUntil] = useState<Date | null>(null);
  const [syncWithMobile, setSyncWithMobile] = useState(true);

  // Determine if current user is viewing their own status
  const isSelf = !userId || userId === session?.user?.id;
  const targetUserId = userId || session?.user?.id;

  // Fetch user status
  useEffect(() => {
    if (!targetUserId) return;

    const fetchUserStatus = async () => {
      setLoading(true);
      
      try {
        // Set up real-time listener for user status
        const statusRef = doc(firestore, 'userStatus', targetUserId);
        
        // Subscribe to changes
        const unsubscribe = onSnapshot(statusRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setStatusData({
              id: docSnapshot.id,
              userId: targetUserId,
              status: data.status as UserStatusType,
              customMessage: data.customMessage,
              lastActive: data.lastActive?.toDate() || new Date(),
              dutyStartTime: data.dutyStartTime?.toDate() || null,
              dutyEndTime: data.dutyEndTime?.toDate() || null,
              doNotDisturbUntil: data.doNotDisturbUntil?.toDate() || null,
              deviceInfo: data.deviceInfo,
              updatedAt: data.updatedAt?.toDate() || new Date()
            });
            
            // Update local state for dialogs
            setCustomMessage(data.customMessage || '');
            setDutyStartTime(data.dutyStartTime?.toDate() || null);
            setDutyEndTime(data.dutyEndTime?.toDate() || null);
            setDoNotDisturbUntil(data.doNotDisturbUntil?.toDate() || null);
          } else {
            // Create default status if none exists
            if (isSelf) {
              const defaultStatus: UserStatusData = {
                userId: targetUserId,
                status: UserStatusType.ONLINE,
                lastActive: new Date(),
                updatedAt: new Date()
              };
              
              setStatusData(defaultStatus);
              
              // Create document in Firestore
              setDoc(statusRef, {
                status: defaultStatus.status,
                lastActive: defaultStatus.lastActive,
                updatedAt: defaultStatus.updatedAt
              });
            } else {
              // If viewing someone else's status and it doesn't exist
              setStatusData({
                userId: targetUserId,
                status: UserStatusType.OFFLINE,
                lastActive: new Date(),
                updatedAt: new Date()
              });
            }
          }
          
          setLoading(false);
        }, (error) => {
          console.error('Error fetching user status:', error);
          setError('Failed to load status');
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up status listener:', error);
        setError('Failed to connect to status service');
        setLoading(false);
      }
    };
    
    fetchUserStatus();
    
    // Cleanup function to unsubscribe
    return () => {
      // Unsubscribe will be called by the returned function from onSnapshot
    };
  }, [targetUserId, isSelf, session]);

  // Automatically update status based on activity
  useEffect(() => {
    if (!isSelf || !statusData) return;
    
    // Set up activity listeners for auto-away
    const activityEvents = ['mousedown', 'keydown', 'mousemove', 'wheel'];
    let activityTimeout: NodeJS.Timeout;
    
    const handleActivity = () => {
      // Clear existing timeout
      clearTimeout(activityTimeout);
      
      // Only update if currently AWAY and not manually set
      if (statusData.status === UserStatusType.AWAY) {
        updateStatus(UserStatusType.ONLINE);
      }
      
      // Set timeout for auto-away after 15 minutes of inactivity
      activityTimeout = setTimeout(() => {
        if (statusData.status === UserStatusType.ONLINE) {
          updateStatus(UserStatusType.AWAY);
        }
      }, 15 * 60 * 1000);
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Initial setup
    handleActivity();
    
    // Cleanup
    return () => {
      clearTimeout(activityTimeout);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isSelf, statusData]);

  // Update duty status based on schedule
  useEffect(() => {
    if (!isSelf || !statusData) return;
    
    // Check if within duty hours
    const checkDutyStatus = () => {
      const now = new Date();
      
      if (
        statusData.dutyStartTime && 
        statusData.dutyEndTime && 
        isAfter(now, statusData.dutyStartTime) && 
        isBefore(now, statusData.dutyEndTime)
      ) {
        // Within duty hours, set to ONLINE if currently OFFLINE
        if (statusData.status === UserStatusType.OFFLINE) {
          updateStatus(UserStatusType.ONLINE);
        }
      } else if (
        statusData.dutyEndTime && 
        isAfter(now, statusData.dutyEndTime)
      ) {
        // After duty hours, set to OFFLINE if not manually set
        if (
          statusData.status !== UserStatusType.CUSTOM && 
          statusData.status !== UserStatusType.BUSY
        ) {
          updateStatus(UserStatusType.OFFLINE);
        }
      }
      
      // Check Do Not Disturb schedule
      if (
        statusData.doNotDisturbUntil && 
        isBefore(now, statusData.doNotDisturbUntil)
      ) {
        if (statusData.status !== UserStatusType.BUSY) {
          updateStatus(UserStatusType.BUSY);
        }
      } else if (
        statusData.doNotDisturbUntil && 
        isAfter(now, statusData.doNotDisturbUntil) && 
        statusData.status === UserStatusType.BUSY
      ) {
        updateStatus(UserStatusType.ONLINE);
      }
    };
    
    // Initial check
    checkDutyStatus();
    
    // Check every minute
    const intervalId = setInterval(checkDutyStatus, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isSelf, statusData]);

  // Handle status update
  const updateStatus = async (newStatus: UserStatusType, message?: string) => {
    if (!targetUserId || !isSelf) return;
    
    try {
      const statusRef = doc(firestore, 'userStatus', targetUserId);
      const updateData: any = {
        status: newStatus,
        lastActive: new Date(),
        updatedAt: new Date()
      };
      
      if (message !== undefined) {
        updateData.customMessage = message;
      }
      
      // Add device info for sync
      if (syncWithMobile) {
        updateData.deviceInfo = navigator.userAgent;
      }
      
      await updateDoc(statusRef, updateData);
      
      // Also update via API for persistence
      await fetch('/api/messaging/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          customMessage: message,
          deviceInfo: syncWithMobile ? navigator.userAgent : null
        })
      });
      
      // Notify parent component if callback provided
      if (onStatusChange && statusData) {
        onStatusChange({
          ...statusData,
          status: newStatus,
          customMessage: message,
          lastActive: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    }
  };

  // Update schedule
  const updateSchedule = async () => {
    if (!targetUserId || !isSelf) return;
    
    try {
      const statusRef = doc(firestore, 'userStatus', targetUserId);
      await updateDoc(statusRef, {
        dutyStartTime: dutyStartTime,
        dutyEndTime: dutyEndTime,
        doNotDisturbUntil: doNotDisturbUntil,
        updatedAt: new Date()
      });
      
      // Also update via API for persistence
      await fetch('/api/messaging/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dutyStartTime: dutyStartTime?.toISOString(),
          dutyEndTime: dutyEndTime?.toISOString(),
          doNotDisturbUntil: doNotDisturbUntil?.toISOString()
        })
      });
      
      // Close dialog
      setScheduleDialog(false);
      
      // Notify parent component if callback provided
      if (onStatusChange && statusData) {
        onStatusChange({
          ...statusData,
          dutyStartTime,
          dutyEndTime,
          doNotDisturbUntil,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError('Failed to update schedule');
    }
  };

  // Handle status menu open
  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!isSelf) return;
    setStatusAnchorEl(event.currentTarget);
  };

  // Handle schedule menu open
  const handleScheduleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!isSelf) return;
    setScheduleAnchorEl(event.currentTarget);
  };

  // Handle status selection
  const handleStatusSelect = (status: UserStatusType) => {
    setStatusAnchorEl(null);
    
    if (status === UserStatusType.CUSTOM) {
      setCustomStatusDialog(true);
    } else {
      updateStatus(status);
    }
  };

  // Handle custom status submission
  const handleCustomStatusSubmit = () => {
    updateStatus(UserStatusType.CUSTOM, customMessage);
    setCustomStatusDialog(false);
  };

  // Presets for schedule
  const handleSchedulePreset = (preset: string) => {
    setScheduleAnchorEl(null);
    
    const now = new Date();
    
    switch (preset) {
      case 'standard':
        // Standard 9 AM to 5 PM
        const today = new Date();
        today.setHours(9, 0, 0, 0);
        setDutyStartTime(today);
        
        const endToday = new Date();
        endToday.setHours(17, 0, 0, 0);
        setDutyEndTime(endToday);
        break;
        
      case 'night':
        // Night shift 8 PM to 4 AM
        const night = new Date();
        night.setHours(20, 0, 0, 0);
        setDutyStartTime(night);
        
        const morning = new Date();
        morning.setDate(morning.getDate() + 1);
        morning.setHours(4, 0, 0, 0);
        setDutyEndTime(morning);
        break;
        
      case 'dnd30':
        // Do Not Disturb for 30 minutes
        setDoNotDisturbUntil(addHours(now, 0.5));
        break;
        
      case 'dnd60':
        // Do Not Disturb for 1 hour
        setDoNotDisturbUntil(addHours(now, 1));
        break;
        
      case 'dnd120':
        // Do Not Disturb for 2 hours
        setDoNotDisturbUntil(addHours(now, 2));
        break;
        
      case 'clear':
        // Clear all schedule settings
        setDutyStartTime(null);
        setDutyEndTime(null);
        setDoNotDisturbUntil(null);
        break;
    }
    
    setScheduleDialog(true);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2">Loading status...</Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  // Render main component
  if (!statusData) return null;

  const { status, customMessage } = statusData;
  const { label, icon } = statusInfo[status];
  const badgeProps = getStatusBadgeProps(status, size);
  const avatarSize = avatarSizes[size];

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip
          title={
            <>
              <Typography variant="body2">{label}</Typography>
              {customMessage && (
                <Typography variant="caption">{customMessage}</Typography>
              )}
              {statusData.dutyStartTime && statusData.dutyEndTime && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  On duty: {format(statusData.dutyStartTime, 'h:mm a')} - {format(statusData.dutyEndTime, 'h:mm a')}
                </Typography>
              )}
              {statusData.doNotDisturbUntil && isAfter(statusData.doNotDisturbUntil, new Date()) && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  Do not disturb until {format(statusData.doNotDisturbUntil, 'h:mm a')}
                </Typography>
              )}
            </>
          }
        >
          <Badge {...badgeProps}>
            <Avatar
              sx={{ width: avatarSize, height: avatarSize, cursor: isSelf ? 'pointer' : 'default' }}
              onClick={isSelf ? handleStatusMenuOpen : undefined}
            >
              {session?.user?.name?.charAt(0) || 'U'}
            </Avatar>
          </Badge>
        </Tooltip>
        
        {size === 'large' && (
          <Box sx={{ ml: 2 }}>
            <Typography variant="subtitle1">
              {session?.user?.name || 'User'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                component="span" 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: statusInfo[status].color,
                  display: 'inline-block',
                  mr: 1
                }} 
              />
              <Typography variant="body2" color="textSecondary">
                {customMessage || label}
              </Typography>
            </Box>
          </Box>
        )}
        
        {isSelf && showControls && (
          <Box sx={{ ml: size === 'large' ? 0 : 1, display: 'flex' }}>
            <Tooltip title="Set your status">
              <IconButton size="small" onClick={handleStatusMenuOpen}>
                {icon}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Schedule availability">
              <IconButton size="small" onClick={handleScheduleMenuOpen}>
                <ScheduleIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      
      {/* Status Selection Menu */}
      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={() => setStatusAnchorEl(null)}
      >
        {Object.entries(statusInfo).map(([key, { icon, label, color }]) => (
          <MenuItem 
            key={key} 
            onClick={() => handleStatusSelect(key as UserStatusType)}
            selected={status === key}
          >
            <ListItemIcon sx={{ color }}>
              {icon}
            </ListItemIcon>
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Menu>
      
      {/* Schedule Menu */}
      <Menu
        anchorEl={scheduleAnchorEl}
        open={Boolean(scheduleAnchorEl)}
        onClose={() => setScheduleAnchorEl(null)}
      >
        <MenuItem onClick={() => handleSchedulePreset('standard')}>
          <ListItemIcon>
            <DutyIcon />
          </ListItemIcon>
          <ListItemText primary="Standard Hours (9 AM - 5 PM)" />
        </MenuItem>
        
        <MenuItem onClick={() => handleSchedulePreset('night')}>
          <ListItemIcon>
            <DutyIcon />
          </ListItemIcon>
          <ListItemText primary="Night Shift (8 PM - 4 AM)" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleSchedulePreset('dnd30')}>
          <ListItemIcon>
            <MuteIcon />
          </ListItemIcon>
          <ListItemText primary="Do Not Disturb (30 min)" />
        </MenuItem>
        
        <MenuItem onClick={() => handleSchedulePreset('dnd60')}>
          <ListItemIcon>
            <MuteIcon />
          </ListItemIcon>
          <ListItemText primary="Do Not Disturb (1 hour)" />
        </MenuItem>
        
        <MenuItem onClick={() => handleSchedulePreset('dnd120')}>
          <ListItemIcon>
            <MuteIcon />
          </ListItemIcon>
          <ListItemText primary="Do Not Disturb (2 hours)" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => setScheduleDialog(true)}>
          <ListItemIcon>
            <CalendarIcon />
          </ListItemIcon>
          <ListItemText primary="Custom Schedule..." />
        </MenuItem>
        
        <MenuItem onClick={() => handleSchedulePreset('clear')}>
          <ListItemIcon>
            <CancelIcon />
          </ListItemIcon>
          <ListItemText primary="Clear Schedule" />
        </MenuItem>
      </Menu>
      
      {/* Custom Status Dialog */}
      <Dialog 
        open={customStatusDialog} 
        onClose={() => setCustomStatusDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Set Custom Status</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="What's your status?"
            fullWidth
            variant="outlined"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                  <EditIcon fontSize="small" />
                </Box>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomStatusDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCustomStatusSubmit} 
            variant="contained" 
            disabled={!customMessage.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Schedule Dialog */}
      <Dialog 
        open={scheduleDialog} 
        onClose={() => setScheduleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Availability Schedule</Typography>
            <IconButton 
              edge="end" 
              color="inherit" 
              onClick={() => setScheduleDialog(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Duty Hours
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TimePicker
                        label="Start Time"
                        value={dutyStartTime}
                        onChange={(newValue) => setDutyStartTime(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TimePicker
                        label="End Time"
                        value={dutyEndTime}
                        onChange={(newValue) => setDutyEndTime(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Do Not Disturb
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <DateTimePicker
                    label="Do Not Disturb Until"
                    value={doNotDisturbUntil}
                    onChange={(newValue) => setDoNotDisturbUntil(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Device Synchronization
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={syncWithMobile} 
                        onChange={(e) => setSyncWithMobile(e.target.checked)}
                      />
                    }
                    label="Sync status across devices"
                  />
                  <Typography variant="caption" color="textSecondary">
                    When enabled, your status will be the same on all your devices.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog(false)}>Cancel</Button>
          <Button onClick={updateSchedule} variant="contained" color="primary">
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserStatus;
