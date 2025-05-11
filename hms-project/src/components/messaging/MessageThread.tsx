'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Divider,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Reply as ReplyIcon,
  DeleteOutline as DeleteIcon,
  ForwardOutlined as ForwardIcon,
  MoreVert as MoreIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckCircle as ReadIcon,
  RadioButtonUnchecked as UnreadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../app/api/messaging/firebase-config';
import { useSession } from 'next-auth/react';

// Message interface
interface Message {
  id: string;
  threadId: string;
  parentId?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  attachmentUrl?: string;
  read: boolean;
  starred: boolean;
  deleted: boolean;
  children?: Message[];
}

// Thread interface
interface Thread {
  id: string;
  subject?: string;
  participants: string[];
  lastMessageId: string;
  lastMessageTimestamp: Date;
}

interface MessageThreadProps {
  threadId: string;
  onReply?: (message: Message) => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({ threadId, onReply }) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch thread data and messages
  useEffect(() => {
    if (!threadId || !session?.user?.id) return;

    const fetchThreadAndMessages = async () => {
      setLoading(true);
      try {
        // Fetch thread data
        const threadDocRef = doc(firestore, 'threads', threadId);
        const threadDoc = await getDocs(query(collection(firestore, 'threads'), where('__name__', '==', threadId)));
        
        if (threadDoc.empty) {
          setError('Thread not found');
          setLoading(false);
          return;
        }

        const threadData = threadDoc.docs[0].data() as Thread;
        setThread({ ...threadData, id: threadDoc.docs[0].id });

        // Fetch messages
        const messagesQuery = query(
          collection(firestore, 'messages'),
          where('threadId', '==', threadId),
          orderBy('timestamp', 'asc')
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        
        const messagesData: Message[] = messagesSnapshot.docs
          .filter(doc => !doc.data().deleted)
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              threadId: data.threadId,
              parentId: data.parentId,
              text: data.text,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              timestamp: data.timestamp?.toDate() || new Date(),
              attachmentUrl: data.attachmentUrl,
              read: data.read || false,
              starred: data.starred || false,
              deleted: data.deleted || false,
            };
          });

        // Build message tree
        const messageMap = new Map<string, Message>();
        const rootMessages: Message[] = [];

        // First pass: Create a map of all messages
        messagesData.forEach(message => {
          messageMap.set(message.id, { ...message, children: [] });
        });

        // Second pass: Build the tree structure
        messagesData.forEach(message => {
          const messageWithChildren = messageMap.get(message.id)!;
          
          if (message.parentId && messageMap.has(message.parentId)) {
            // This is a reply, add it to its parent's children
            const parent = messageMap.get(message.parentId)!;
            parent.children = [...(parent.children || []), messageWithChildren];
          } else {
            // This is a root message
            rootMessages.push(messageWithChildren);
          }
        });

        setMessages(rootMessages);
      } catch (error) {
        console.error('Error fetching thread data:', error);
        setError('Failed to load messages');
      }
      setLoading(false);
    };

    fetchThreadAndMessages();
  }, [threadId, session]);

  // Mark messages as read when viewed
  useEffect(() => {
    if (!session?.user?.id || !threadId || messages.length === 0) return;

    const markAsRead = async () => {
      // Get all unread messages not sent by current user
      const unreadMessages = messages.flatMap(message => 
        flattenMessages(message)
          .filter(msg => msg.senderId !== session.user?.id && !msg.read)
      );
      
      if (unreadMessages.length === 0) return;

      // Update messages in Firestore
      const batch = firestore.batch();
      
      unreadMessages.forEach(message => {
        const messageRef = doc(firestore, 'messages', message.id);
        batch.update(messageRef, { read: true });
      });
      
      await batch.commit();
      
      // Update local state
      setMessages(prevMessages => updateReadStatus(prevMessages, session.user!.id));
    };

    markAsRead();
  }, [messages, session, threadId]);

  // Utility to flatten nested messages
  const flattenMessages = (message: Message): Message[] => {
    if (!message.children || message.children.length === 0) {
      return [message];
    }
    
    return [message, ...message.children.flatMap(flattenMessages)];
  };

  // Update read status in the message tree
  const updateReadStatus = (messages: Message[], currentUserId: string): Message[] => {
    return messages.map(message => {
      const updatedMessage = { 
        ...message, 
        read: message.senderId === currentUserId ? message.read : true 
      };
      
      if (updatedMessage.children && updatedMessage.children.length > 0) {
        updatedMessage.children = updateReadStatus(updatedMessage.children, currentUserId);
      }
      
      return updatedMessage;
    });
  };

  // Handle message actions menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, message: Message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Toggle starred status
  const handleToggleStar = async () => {
    if (!selectedMessage) return;
    
    handleMenuClose();
    
    try {
      const messageRef = doc(firestore, 'messages', selectedMessage.id);
      const newStarred = !selectedMessage.starred;
      
      await updateDoc(messageRef, {
        starred: newStarred
      });
      
      // Update local state
      setMessages(prevMessages => 
        updateMessageInTree(prevMessages, selectedMessage.id, { starred: newStarred })
      );
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  // Toggle read status
  const handleToggleRead = async () => {
    if (!selectedMessage) return;
    
    handleMenuClose();
    
    try {
      const messageRef = doc(firestore, 'messages', selectedMessage.id);
      const newRead = !selectedMessage.read;
      
      await updateDoc(messageRef, {
        read: newRead
      });
      
      // Update local state
      setMessages(prevMessages => 
        updateMessageInTree(prevMessages, selectedMessage.id, { read: newRead })
      );
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  // Delete message
  const handleDelete = async () => {
    if (!selectedMessage) return;
    
    handleMenuClose();
    
    try {
      const messageRef = doc(firestore, 'messages', selectedMessage.id);
      
      await updateDoc(messageRef, {
        deleted: true,
        text: 'This message has been deleted'
      });
      
      // Update local state
      setMessages(prevMessages => 
        updateMessageInTree(
          prevMessages, 
          selectedMessage.id, 
          { deleted: true, text: 'This message has been deleted' }
        )
      );
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Reply to message
  const handleReply = () => {
    if (!selectedMessage || !onReply) return;
    
    handleMenuClose();
    onReply(selectedMessage);
  };

  // Update a message in the nested tree
  const updateMessageInTree = (messages: Message[], messageId: string, updates: Partial<Message>): Message[] => {
    return messages.map(message => {
      if (message.id === messageId) {
        return { ...message, ...updates };
      }
      
      if (message.children && message.children.length > 0) {
        return {
          ...message,
          children: updateMessageInTree(message.children, messageId, updates)
        };
      }
      
      return message;
    });
  };

  // Render a message with its replies
  const renderMessage = (message: Message, level = 0) => {
    const isCurrentUser = message.senderId === session?.user?.id;
    
    return (
      <Box key={message.id} sx={{ ml: level * 3, mb: 2 }}>
        <Paper 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            borderLeft: level > 0 ? '2px solid #ccc' : 'none',
            bgcolor: message.deleted ? '#f5f5f5' : (isCurrentUser ? '#e3f2fd' : 'white'),
            opacity: message.deleted ? 0.7 : 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar 
              src={message.senderAvatar} 
              alt={message.senderName}
              sx={{ width: 32, height: 32, mr: 1 }}
            >
              {message.senderName.charAt(0)}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2">
                {message.senderName}
                {message.starred && (
                  <StarIcon fontSize="small" color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />
                )}
              </Typography>
              
              <Typography variant="caption" color="textSecondary">
                {format(new Date(message.timestamp), 'MMM d, yyyy h:mm a')}
                {!message.read && message.senderId !== session?.user?.id && (
                  <Typography 
                    component="span" 
                    sx={{ 
                      ml: 1, 
                      px: 1, 
                      py: 0.5, 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      borderRadius: 5,
                      fontSize: '0.7rem'
                    }}
                  >
                    New
                  </Typography>
                )}
              </Typography>
            </Box>
            
            <IconButton 
              size="small"
              onClick={(e) => handleMenuOpen(e, message)}
              disabled={message.deleted}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word', 
              color: message.deleted ? 'text.secondary' : 'text.primary',
              fontStyle: message.deleted ? 'italic' : 'normal'
            }}
          >
            {message.text}
          </Typography>
          
          {message.attachmentUrl && !message.deleted && (
            <Box sx={{ mt: 1 }}>
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
                <Box 
                  component="a" 
                  href={message.attachmentUrl} 
                  target="_blank"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    border: '1px solid #eaeaea',
                    borderRadius: 1,
                    textDecoration: 'none',
                    color: 'primary.main',
                  }}
                >
                  <Box component="span" sx={{ mr: 1 }}>📎</Box>
                  <Typography variant="body2">Attachment</Typography>
                </Box>
              )}
            </Box>
          )}
          
          {!message.deleted && onReply && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Tooltip title="Reply">
                <IconButton 
                  size="small" 
                  onClick={() => onReply(message)}
                  sx={{ color: 'text.secondary' }}
                >
                  <ReplyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Paper>
        
        {message.children && message.children.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {message.children.map(childMessage => renderMessage(childMessage, level + 1))}
          </Box>
        )}
      </Box>
    );
  };

  if (loading && !messages.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {thread?.subject && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">{thread.subject}</Typography>
          <Divider sx={{ mt: 1 }} />
        </Box>
      )}
      
      {messages.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">No messages in this thread</Typography>
        </Box>
      ) : (
        <Box>
          {messages.map(message => renderMessage(message))}
          <div ref={messagesEndRef} />
        </Box>
      )}
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleReply} disabled={!onReply || selectedMessage?.deleted}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleToggleStar} disabled={selectedMessage?.deleted}>
          <ListItemIcon>
            {selectedMessage?.starred ? (
              <StarIcon fontSize="small" color="warning" />
            ) : (
              <StarBorderIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedMessage?.starred ? 'Remove star' : 'Star message'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleToggleRead} disabled={selectedMessage?.deleted}>
          <ListItemIcon>
            {selectedMessage?.read ? (
              <UnreadIcon fontSize="small" />
            ) : (
              <ReadIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedMessage?.read ? 'Mark as unread' : 'Mark as read'}
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleDelete} 
          disabled={selectedMessage?.deleted || selectedMessage?.senderId !== session?.user?.id}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessageThread;
