'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  IconButton,
  Drawer,
  AppBar,
  Toolbar,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Button,
  useMediaQuery,
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  StarOutline as StarIcon,
  PeopleOutline as GroupsIcon,
  PersonOutline as ContactsIcon,
  SettingsOutlined as SettingsIcon
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatInterface from './ChatInterface';
import MessageThread from './MessageThread';
import NotificationCenter from './NotificationCenter';
import UserStatus from './UserStatus';
import { query, collection, where, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../app/api/messaging/firebase-config';
import { formatDistanceToNow } from 'date-fns';

// Thread interface
interface Thread {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars?: Record<string, string>;
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageSenderId: string;
  unreadCounts: Record<string, number>;
}

// Contact interface
interface Contact {
  id: string;
  name: string;
  avatar?: string;
  status: string;
  department?: string;
  role?: string;
}

// Tab type
type TabType = 'recent' | 'starred' | 'groups' | 'contacts';

const MessagingDashboard: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [starredThreads, setStarredThreads] = useState<Thread[]>([]);
  const [groupThreads, setGroupThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<TabType>('recent');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessageDrawerOpen, setNewMessageDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Fetch threads
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchThreads = async () => {
      setLoading(true);
      
      try {
        const threadsRef = collection(firestore, 'threads');
        const userThreadsQuery = query(
          threadsRef,
          where('participants', 'array-contains', session.user.id),
          orderBy('lastMessageTime', 'desc'),
          limit(50)
        );
        
        const unsubscribe = onSnapshot(userThreadsQuery, (snapshot) => {
          const threadData: Thread[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              participants: data.participants || [],
              participantNames: data.participantNames || {},
              participantAvatars: data.participantAvatars || {},
              lastMessage: data.lastMessage || '',
              lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
              lastMessageSenderId: data.lastMessageSenderId || '',
              unreadCounts: data.unreadCounts || {}
            };
          });
          
          // Filter threads based on current tab
          const allThreads = threadData.filter(thread => {
            // Skip filtering if search query is active
            if (searchQuery) {
              const otherParticipantIds = thread.participants.filter(id => id !== session.user?.id);
              const participantNames = otherParticipantIds.map(id => thread.participantNames[id] || '');
              
              // Search in participant names or last message
              return (
                participantNames.some(name => 
                  name.toLowerCase().includes(searchQuery.toLowerCase())
                ) ||
                thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            
            return true;
          });
          
          // Set all threads
          setThreads(allThreads);
          
          // Set starred threads
          const starred = threadData.filter(thread => {
            // Implementation depends on how starred threads are marked
            // This is a placeholder - you'll need to implement your starring logic
            return thread.id.startsWith('star_'); // Placeholder logic
          });
          setStarredThreads(starred);
          
          // Set group threads (threads with more than 2 participants)
          const groups = threadData.filter(thread => thread.participants.length > 2);
          setGroupThreads(groups);
          
          setLoading(false);
        }, (error) => {
          console.error('Error fetching threads:', error);
          setError('Failed to load conversations');
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up threads listener:', error);
        setError('Failed to connect to messaging service');
        setLoading(false);
      }
    };
    
    fetchThreads();
  }, [session, searchQuery]);

  // Fetch contacts
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchContacts = async () => {
      try {
        const contactsRef = collection(firestore, 'contacts');
        const userContactsQuery = query(
          contactsRef,
          where('userId', '==', session.user.id),
          limit(100)
        );
        
        const unsubscribe = onSnapshot(userContactsQuery, (snapshot) => {
          const contactsData: Contact[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: data.contactId,
              name: data.name || 'Unknown User',
              avatar: data.avatar,
              status: data.status || 'OFFLINE',
              department: data.department,
              role: data.role
            };
          });
          
          // Filter contacts by search query if active
          const filteredContacts = searchQuery 
            ? contactsData.filter(contact => 
                contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.role?.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : contactsData;
          
          setContacts(filteredContacts);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
    
    fetchContacts();
  }, [session, searchQuery]);

  // Handle thread selection
  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  // Handle contact selection for new message
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    
    // Check if thread already exists with this contact
    const existingThread = threads.find(thread => 
      thread.participants.length === 2 && 
      thread.participants.includes(contact.id) &&
      thread.participants.includes(session?.user?.id || '')
    );
    
    if (existingThread) {
      setSelectedThreadId(existingThread.id);
      setNewMessageDrawerOpen(false);
      if (isMobile) {
        setMobileDrawerOpen(false);
      }
    } else {
      // Create new thread will be handled by ChatInterface component
      router.push(`/messaging/new?contactId=${contact.id}`);
      setNewMessageDrawerOpen(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabType) => {
    setCurrentTab(newValue);
  };

  // Filtered list based on current tab
  const getFilteredList = () => {
    switch (currentTab) {
      case 'starred':
        return starredThreads;
      case 'groups':
        return groupThreads;
      case 'contacts':
        return [];  // This will show contacts instead of threads
      default:
        return threads;
    }
  };

  // Render thread list item
  const renderThreadItem = (thread: Thread) => {
    // Find the other participant's info (for 1:1 chats)
    const otherParticipantIds = thread.participants.filter(id => id !== session?.user?.id);
    const isGroup = otherParticipantIds.length > 1;
    
    // For group chats, we'll show a group name or list of participants
    const displayName = isGroup 
      ? thread.participantNames['group'] || `Group (${otherParticipantIds.length + 1} members)`
      : thread.participantNames[otherParticipantIds[0]] || 'Unknown User';
    
    const avatarSrc = isGroup 
      ? undefined  // Could use a group avatar if available
      : thread.participantAvatars?.[otherParticipantIds[0]];
    
    const unreadCount = thread.unreadCounts[session?.user?.id || ''] || 0;
    const isSelected = thread.id === selectedThreadId;
    
    return (
      <ListItem
        button
        selected={isSelected}
        onClick={() => handleThreadSelect(thread.id)}
        sx={{
          borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : 'none',
          bgcolor: isSelected ? 'action.selected' : 'background.paper',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color={unreadCount > 0 ? 'primary' : 'default'}
          >
            <Avatar src={avatarSrc}>
              {displayName.charAt(0)}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Typography 
              variant="subtitle1" 
              noWrap 
              fontWeight={unreadCount > 0 ? 'bold' : 'normal'}
            >
              {displayName}
            </Typography>
          }
          secondary={
            <>
              <Typography 
                variant="body2" 
                noWrap 
                color="textSecondary" 
                component="span"
                fontWeight={unreadCount > 0 ? 'medium' : 'normal'}
              >
                {thread.lastMessageSenderId === session?.user?.id ? 'You: ' : ''}
                {thread.lastMessage}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                {formatDistanceToNow(new Date(thread.lastMessageTime), { addSuffix: true })}
              </Typography>
            </>
          }
        />
        
        {unreadCount > 0 && (
          <Badge 
            badgeContent={unreadCount} 
            color="primary" 
            sx={{ ml: 1 }}
          />
        )}
      </ListItem>
    );
  };

  // Render contact list item
  const renderContactItem = (contact: Contact) => {
    return (
      <ListItem 
        button 
        onClick={() => handleContactSelect(contact)}
      >
        <ListItemAvatar>
          <Avatar src={contact.avatar}>
            {contact.name.charAt(0)}
          </Avatar>
        </ListItemAvatar>
        
        <ListItemText
          primary={contact.name}
          secondary={
            <>
              <Typography variant="body2" noWrap color="textSecondary">
                {contact.role}
                {contact.department && ` • ${contact.department}`}
              </Typography>
            </>
          }
        />
      </ListItem>
    );
  };

  // Sidebar content
  const sidebarContent = (
    <>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Messages</Typography>
          
          <Box>
            <UserStatus size="small" showControls />
            
            <Tooltip title="New message">
              <IconButton 
                color="primary" 
                onClick={() => setNewMessageDrawerOpen(true)}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <TextField
          fullWidth
          placeholder="Search messages"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>
      
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="fullWidth"
        aria-label="message categories"
      >
        <Tab label="Recent" value="recent" />
        <Tab label="Starred" value="starred" />
        <Tab label="Groups" value="groups" />
        <Tab label="Contacts" value="contacts" />
      </Tabs>
      
      <Divider />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            size="small" 
            sx={{ mt: 1 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {currentTab === 'contacts' ? (
            contacts.length > 0 ? (
              contacts.map(contact => (
                <React.Fragment key={contact.id}>
                  {renderContactItem(contact)}
                  <Divider component="li" />
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary">No contacts found</Typography>
              </Box>
            )
          ) : (
            getFilteredList().length > 0 ? (
              getFilteredList().map(thread => (
                <React.Fragment key={thread.id}>
                  {renderThreadItem(thread)}
                  <Divider component="li" />
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  {currentTab === 'recent' && 'No recent messages'}
                  {currentTab === 'starred' && 'No starred messages'}
                  {currentTab === 'groups' && 'No group conversations'}
                </Typography>
              </Box>
            )
          )}
        </List>
      )}
    </>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Mobile app bar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Messaging
            </Typography>
            
            <NotificationCenter />
            <UserStatus size="small" />
          </Toolbar>
        </AppBar>
      )}
      
      {/* Sidebar for desktop or drawer for mobile */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            width: 320,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 320,
              boxSizing: 'border-box',
              height: '100%',
              mt: 'auto'
            }
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Paper
          elevation={1}
          sx={{
            width: 320,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${theme.palette.divider}`
          }}
        >
          {sidebarContent}
        </Paper>
      )}
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...(isMobile && { mt: 8 })
        }}
      >
        {selectedThreadId ? (
          // Show chat interface or thread detail based on your navigation pattern
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <MessageThread 
              threadId={selectedThreadId} 
              onReply={(message) => {
                // Handle reply to specific message
                console.log('Reply to message:', message);
              }}
            />
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column',
              p: 3
            }}
          >
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Select a conversation to start messaging
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setNewMessageDrawerOpen(true)}
            >
              New Message
            </Button>
          </Box>
        )}
      </Box>
      
      {/* New message drawer */}
      <Drawer
        anchor="right"
        open={newMessageDrawerOpen}
        onClose={() => setNewMessageDrawerOpen(false)}
        sx={{
          width: 320,
          '& .MuiDrawer-paper': {
            width: 320,
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">New Message</Typography>
          <IconButton onClick={() => setNewMessageDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search contacts"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        <List sx={{ overflow: 'auto' }}>
          {contacts.map(contact => (
            <React.Fragment key={contact.id}>
              {renderContactItem(contact)}
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default MessagingDashboard;
