import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

interface SharedNote {
  id: string;
  doctorId: string;
  coConsultationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  doctor?: {
    id: string;
    userId: string;
    user: {
      name: string;
    };
  };
}

interface DoctorSharedNotesProps {
  coConsultationId: string;
  doctorId: string;
}

const DoctorSharedNotes: React.FC<DoctorSharedNotesProps> = ({
  coConsultationId,
  doctorId
}) => {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<SharedNote | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch shared notes
  const fetchSharedNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/doctors/shared-notes?coConsultationId=${coConsultationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shared notes');
      }
      
      const data = await response.json();
      setNotes(data.data.sharedNotes);
    } catch (err) {
      setError('Error loading shared notes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coConsultationId) {
      fetchSharedNotes();
    }
  }, [coConsultationId]);

  // Create a new note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    try {
      setSubmitting(true);
      const response = await fetch('/api/doctors/shared-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coConsultationId, content: newNote })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      
      setNewNote('');
      fetchSharedNotes();
    } catch (err) {
      setError('Error creating note. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Update a note
  const handleUpdateNote = async () => {
    if (!editingNote || !editContent.trim()) return;
    
    try {
      setSubmitting(true);
      const response = await fetch('/api/doctors/shared-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: editingNote.id, content: editContent })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      setEditingNote(null);
      fetchSharedNotes();
    } catch (err) {
      setError('Error updating note. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      setSubmitting(true);
      const response = await fetch(`/api/doctors/shared-notes?noteId=${noteToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      fetchSharedNotes();
    } catch (err) {
      setError('Error deleting note. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (note: SharedNote) => {
    setEditingNote(note);
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const handleOpenDeleteDialog = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  if (loading && notes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Shared Consultation Notes
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleCreateNote}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Add a new note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            disabled={submitting}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!newNote.trim() || submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Add Note'}
          </Button>
        </form>
      </Paper>
      
      {notes.length === 0 ? (
        <Typography variant="body1" color="textSecondary" align="center">
          No shared notes yet. Be the first to add a note!
        </Typography>
      ) : (
        <List>
          {notes.map((note) => (
            <Card key={note.id} sx={{ mb: 2 }}>
              <CardContent>
                {editingNote?.id === note.id ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    disabled={submitting}
                  />
                ) : (
                  <>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      {note.doctor?.user?.name || 'Unknown Doctor'} • {formatDistanceToNow(new Date(note.createdAt))} ago
                      {note.updatedAt !== note.createdAt && ' (edited)'}
                    </Typography>
                  </>
                )}
              </CardContent>
              
              {note.doctorId === doctorId && (
                <CardActions>
                  {editingNote?.id === note.id ? (
                    <>
                      <Button
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={handleUpdateNote}
                        disabled={submitting}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEdit}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleStartEdit(note)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteDialog(note.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </CardActions>
              )}
            </Card>
          ))}
        </List>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this note? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteNote} 
            color="error" 
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorSharedNotes;
