import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Button,
  Switch,
  FormControlLabel
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSession } from 'next-auth/react';
import { createEventSource, subscribeToEvent, closeEventSource } from '@/utils/sse';

export default function RealTimeInventory() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const updatesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      connectToSSE();
    }

    return () => {
      if (eventSourceRef.current) {
        closeEventSource(eventSourceRef.current);
      }
    };
  }, [session]);

  useEffect(() => {
    if (autoScroll && updates.length > 0) {
      scrollToBottom();
    }
  }, [updates, autoScroll]);

  const connectToSSE = () => {
    try {
      setLoading(true);
      
      // Create SSE connection
      const eventSource = createEventSource('pharmacy/inventory/sse');
      eventSourceRef.current = eventSource;
      
      // Connection established
      eventSource.onopen = () => {
        setConnected(true);
        setLoading(false);
      };
      
      // Subscribe to inventory update events
      subscribeToEvent(eventSource, 'inventory-update', handleInventoryUpdate);
      subscribeToEvent(eventSource, 'stock-alert', handleStockAlert);
      subscribeToEvent(eventSource, 'batch-expiry', handleBatchExpiry);
      
    } catch (error: any) {
      setError(error.message || 'Failed to connect to real-time updates');
      setLoading(false);
    }
  };

  const handleInventoryUpdate = (data: any) => {
    addUpdate({
      type: 'INVENTORY',
      timestamp: new Date(),
      data,
      message: `Inventory updated for ${data.medicine.name}: ${data.action} ${data.quantity} units (Current stock: ${data.currentStock})`
    });
  };

  const handleStockAlert = (data: any) => {
    addUpdate({
      type: 'ALERT',
      timestamp: new Date(),
      data,
      message: `Stock Alert: ${data.medicine.name} is ${data.alertType === 'LOW_STOCK' ? 'running low' : 'out of stock'} (Current stock: ${data.currentStock})`
    });
  };

  const handleBatchExpiry = (data: any) => {
    addUpdate({
      type: 'EXPIRY',
      timestamp: new Date(),
      data,
      message: `Batch Expiry Alert: ${data.medicine.name} batch ${data.batch.batchNumber} expires on ${new Date(data.batch.expiryDate).toLocaleDateString()}`
    });
  };

  const addUpdate = (update: any) => {
    setUpdates(prevUpdates => [update, ...prevUpdates].slice(0, 100)); // Keep only the last 100 updates
  };

  const clearUpdates = () => {
    setUpdates([]);
  };

  const scrollToBottom = () => {
    updatesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAutoScrollChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoScroll(event.target.checked);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'INVENTORY':
        return 'primary';
      case 'ALERT':
        return 'error';
      case 'EXPIRY':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Real-Time Inventory Updates</Typography>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={autoScroll}
                  onChange={handleAutoScrollChange}
                  color="primary"
                />
              }
              label="Auto-scroll"
            />
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={clearUpdates}
              sx={{ ml: 2 }}
            >
              Clear
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!connected && !loading && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Not connected to real-time updates. Please refresh the page to reconnect.
          </Alert>
        )}
        
        <Box 
          sx={{ 
            height: '400px', 
            overflowY: 'auto', 
            border: '1px solid #e0e0e0', 
            borderRadius: 1,
            p: 1,
            bgcolor: '#f5f5f5'
          }}
        >
          {updates.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="textSecondary">
                No updates yet. Waiting for inventory changes...
              </Typography>
            </Box>
          ) : (
            <List>
              {updates.map((update, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Chip 
                            label={update.type} 
                            color={getUpdateTypeColor(update.type) as any} 
                            size="small" 
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {formatTimestamp(update.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                        >
                          {update.message}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < updates.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
              <div ref={updatesEndRef} />
            </List>
          )}
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="caption" color="textSecondary">
            {connected ? (
              <Box component="span" sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    mr: 1
                  }}
                />
                Connected to real-time updates
              </Box>
            ) : (
              <Box component="span" sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    mr: 1
                  }}
                />
                Disconnected
              </Box>
            )}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {updates.length} updates received
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
