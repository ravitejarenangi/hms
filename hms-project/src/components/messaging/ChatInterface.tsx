'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider, 
  CircularProgress,
  Badge,
  Grid
} from '@mui/material';
import { 
  Send as SendIcon, 
  AttachFile as AttachFileIcon,
  InsertEmoticon as EmojiIcon,
  MoreVert as MoreIcon,
  ArrowBack as BackIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../app/api/messaging/firebase-config';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

// Define message interface
interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  attachmentUrl?: string;
  read: boolean;
}

// Define thread interface
interface Thread {
  id: string;
  recipientId: string;
  recipientName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  recipientAvatar?: string;
}

const ChatInterface: React.FC = () => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Fetch conversation threads for current user
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const threadsRef = collection(firestore, 'threads');
        const userThreadsQuery = query(
          threadsRef,
          orderBy('lastMessageTime', 'desc'),
          limit(20)
        );
        
        // Listen for real-time updates
        const unsubscribe = onSnapshot(userThreadsQuery, (snapshot) => {
          const threadsData: Thread[] = snapshot.docs
            .filter(doc => {
              const data = doc.data();
              return data.participants.includes(session.user?.id);
            })
            .map(doc => {
              const data = doc.data();
              const otherParticipant = data.participants.find(
                (id: string) => id !== session.user?.id
              );
              
              return {
                id: doc.id,
                recipientId: otherParticipant,
                recipientName: data.participantNames[otherParticipant] || 'Unknown User',
                lastMessage: data.lastMessage || '',
                lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
                unreadCount: data.unreadCounts?.[session.user?.id] || 0,
                recipientAvatar: data.participantAvatars?.[otherParticipant] || '',
              };
            });
          
          setThreads(threadsData);
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error fetching threads:', error);
        setLoading(false);
      }
    };
    
    fetchThreads();
  }, [session]);
  
  // Fetch messages when active thread changes
  useEffect(() => {
    if (!activeThread || !session?.user?.id) return;
    
    const messagesRef = collection(firestore, `threads/${activeThread.id}/messages`);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || '',
          senderId: data.senderId,
          senderName: data.senderName || 'Unknown',
          timestamp: data.timestamp?.toDate() || new Date(),
          attachmentUrl: data.attachmentUrl || undefined,
          read: data.read || false,
        };
      });
      
      setMessages(messagesData);
      // Mark messages as read
      markMessagesAsRead();
    });
    
    return unsubscribe;
  }, [activeThread, session]);
  
  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAttachmentFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Upload attachment to Firebase storage
  const uploadAttachment = async (): Promise<string | null> => {
    if (!attachmentFile || !session?.user?.id) return null;
    
    const storageRef = ref(storage, `attachments/${session.user.id}/${Date.now()}_${attachmentFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, attachmentFile);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };
  
  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!activeThread || !session?.user?.id) return;
    
    // Update thread unread count in Firestore
    // This would be implemented with a server function or API endpoint
    // to update the thread document and mark messages as read
  };
  
  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !attachmentFile) || !activeThread || !session?.user?.id) return;
    
    try {
      setLoading(true);
      
      // Upload attachment if present
      let attachmentUrl = null;
      if (attachmentFile) {
        attachmentUrl = await uploadAttachment();
      }
      
      // Add message to Firestore
      const messagesRef = collection(firestore, `threads/${activeThread.id}/messages`);
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: session.user.id,
        senderName: session.user.name,
        timestamp: serverTimestamp(),
        attachmentUrl,
        read: false,
      });
      
      // Update thread with last message info
      // This would typically be handled by a Firestore trigger function
      
      // Clear message input and attachment
      setNewMessage('');
      setAttachmentFile(null);
      setAttachmentPreview(null);
      setUploadProgress(0);
      setLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };
  
  // Handle thread selection
  const selectThread = (thread: Thread) => {
    setActiveThread(thread);
  };
  
  // Filter threads based on search query
  const filteredThreads = threads.filter(thread => 
    thread.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', borderRadius: 1, overflow: 'hidden', boxShadow: 3 }}>
      {/* Threads List */}
      <Paper 
        sx={{ 
          width: 320, 
          display: { xs: activeThread ? 'none' : 'flex', md: 'flex' }, 
          flexDirection: 'column',
          borderRadius: 0
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #eaeaea' }}>
          <Typography variant="h6" fontWeight="bold">Messages</Typography>
          <TextField
            fullWidth
            placeholder="Search conversations..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
        </Box>
        
        {loading && !threads.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ overflow: 'auto', flexGrow: 1 }}>
            {filteredThreads.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary">No conversations found</Typography>
              </Box>
            ) : (
              filteredThreads.map((thread) => (
                <React.Fragment key={thread.id}>
                  <ListItem 
                    button 
                    alignItems="flex-start"
                    onClick={() => selectThread(thread)}
                    selected={activeThread?.id === thread.id}
                    sx={{ 
                      '&.Mui-selected': { 
                        backgroundColor: '#f0f7ff',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="primary"
                        badgeContent={thread.unreadCount}
                        invisible={thread.unreadCount === 0}
                      >
                        <Avatar 
                          src={thread.recipientAvatar} 
                          alt={thread.recipientName}
                          sx={{ bgcolor: thread.unreadCount > 0 ? 'primary.main' : 'grey.300' }}
                        >
                          {thread.recipientName.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={thread.recipientName}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="textPrimary"
                            sx={{ 
                              display: 'inline',
                              fontWeight: thread.unreadCount > 0 ? 'bold' : 'normal',
                              fontSize: '0.875rem',
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                            }}
                          >
                            {thread.lastMessage}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="textSecondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {format(new Date(thread.lastMessageTime), 'MMM d, h:mm a')}
                          </Typography>
                        </React.Fragment>
                      }
                      primaryTypographyProps={{
                        fontWeight: thread.unreadCount > 0 ? 'bold' : 'normal',
                      }}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </Paper>
      
      {/* Chat Area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: '#f5f5f5',
          display: { xs: !activeThread ? 'none' : 'flex', md: 'flex' }, 
        }}
      >
        {!activeThread ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">Select a conversation to start messaging</Typography>
          </Box>
        ) : (
          <>
            {/* Chat Header */}
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              borderBottom: '1px solid #eaeaea',
              backgroundColor: '#fff',
            }}>
              <IconButton 
                sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }}
                onClick={() => setActiveThread(null)}
              >
                <BackIcon />
              </IconButton>
              <Avatar src={activeThread.recipientAvatar} alt={activeThread.recipientName}>
                {activeThread.recipientName.charAt(0)}
              </Avatar>
              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {activeThread.recipientName}
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton>
                <SearchIcon />
              </IconButton>
              <IconButton>
                <MoreIcon />
              </IconButton>
            </Box>
            
            {/* Messages Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="textSecondary">No messages yet. Start a conversation!</Typography>
                </Box>
              ) : (
                messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.senderId === session?.user?.id ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        bgcolor: message.senderId === session?.user?.id ? 'primary.main' : 'background.paper',
                        color: message.senderId === session?.user?.id ? 'white' : 'text.primary',
                        borderRadius: 2,
                        p: 2,
                        boxShadow: 1,
                      }}
                    >
                      {message.text && (
                        <Typography variant="body1">{message.text}</Typography>
                      )}
                      
                      {message.attachmentUrl && (
                        <Box sx={{ mt: message.text ? 1 : 0 }}>
                          {message.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <Box
                              component="img"
                              src={message.attachmentUrl}
                              alt="Attachment"
                              sx={{
                                maxWidth: '100%',
                                maxHeight: 200,
                                borderRadius: 1,
                                cursor: 'pointer',
                              }}
                              onClick={() => window.open(message.attachmentUrl, '_blank')}
                            />
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<AttachFileIcon />}
                              onClick={() => window.open(message.attachmentUrl, '_blank')}
                              sx={{
                                color: message.senderId === session?.user?.id ? 'white' : 'primary',
                                borderColor: message.senderId === session?.user?.id ? 'white' : 'primary.main',
                              }}
                            >
                              View Attachment
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                    
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ mt: 0.5 }}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </Typography>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>
            
            {/* Attachment Preview */}
            {attachmentPreview && (
              <Box
                sx={{
                  p: 2,
                  borderTop: '1px solid #eaeaea',
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ position: 'relative', mr: 2 }}>
                  {attachmentFile?.type.startsWith('image/') ? (
                    <Box
                      component="img"
                      src={attachmentPreview}
                      alt="Attachment preview"
                      sx={{ height: 60, maxWidth: 100, borderRadius: 1 }}
                    />
                  ) : (
                    <Paper sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                      <AttachFileIcon sx={{ mr: 1 }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {attachmentFile?.name}
                      </Typography>
                    </Paper>
                  )}
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                    onClick={() => {
                      setAttachmentFile(null);
                      setAttachmentPreview(null);
                    }}
                  >
                    <Box sx={{ fontSize: 18, fontWeight: 'bold' }}>×</Box>
                  </IconButton>
                </Box>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <CircularProgress
                    variant="determinate"
                    value={uploadProgress}
                    size={24}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            )}
            
            {/* Message Input */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #eaeaea',
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              />
              <IconButton onClick={() => fileInputRef.current?.click()}>
                <AttachFileIcon />
              </IconButton>
              <IconButton>
                <EmojiIcon />
              </IconButton>
              <TextField
                fullWidth
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                sx={{ mx: 2 }}
                multiline
                maxRows={4}
              />
              <IconButton 
                color="primary" 
                onClick={sendMessage}
                disabled={(!newMessage.trim() && !attachmentFile) || loading}
              >
                {loading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ChatInterface;
