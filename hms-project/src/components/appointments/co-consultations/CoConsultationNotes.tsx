import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

type Doctor = {
  id: string;
  name: string;
  specialization: string;
};

type NoteSection = {
  id: string;
  title: string;
  content: string;
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
  createdAt: string;
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  };
};

type Note = {
  id: string;
  appointmentId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  sections: NoteSection[];
};

interface CoConsultationNotesProps {
  appointmentId: string;
  doctors: Doctor[];
  isEditable: boolean;
}

const CoConsultationNotes: React.FC<CoConsultationNotesProps> = ({
  appointmentId,
  doctors,
  isEditable
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [notes, setNotes] = useState<Note | null>(null);
  const [mainContent, setMainContent] = useState<string>('');
  const [openAddSection, setOpenAddSection] = useState<boolean>(false);
  const [sectionTitle, setSectionTitle] = useState<string>('');
  const [sectionContent, setSectionContent] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [appointmentId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/co-consultations/notes?appointmentId=${appointmentId}`);
      const data = await response.json();
      
      if (data.success && data.data.notes.length > 0) {
        setNotes(data.data.notes[0]);
        setMainContent(data.data.notes[0].content);
      }
    } catch (error) {
      console.error('Error fetching co-consultation notes:', error);
      setSnackbarMessage('Failed to load notes');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMainContent = async () => {
    try {
      const response = await fetch('/api/appointments/co-consultations/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          content: mainContent
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotes(data.data.note);
        setSnackbarMessage('Notes updated successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage(data.error || 'Failed to update notes');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      setSnackbarMessage('An error occurred while updating notes');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleAddSection = async () => {
    if (!sectionTitle.trim() || !sectionContent.trim()) {
      setSnackbarMessage('Section title and content are required');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await fetch('/api/appointments/co-consultations/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          sectionTitle,
          sectionContent,
          doctorId: selectedDoctor || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotes(data.data.note);
        setSectionTitle('');
        setSectionContent('');
        setSelectedDoctor('');
        setOpenAddSection(false);
        setSnackbarMessage('Section added successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage(data.error || 'Failed to add section');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error adding section:', error);
      setSnackbarMessage('An error occurred while adding section');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleEditSection = (section: NoteSection) => {
    setEditingSectionId(section.id);
    setSectionTitle(section.title);
    setSectionContent(section.content);
    setSelectedDoctor(section.doctor.id);
  };

  const handleUpdateSection = async () => {
    if (!sectionTitle.trim() || !sectionContent.trim() || !editingSectionId) {
      setSnackbarMessage('Section title and content are required');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await fetch('/api/appointments/co-consultations/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          sectionId: editingSectionId,
          sectionTitle,
          sectionContent,
          doctorId: selectedDoctor || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotes(data.data.note);
        setSectionTitle('');
        setSectionContent('');
        setSelectedDoctor('');
        setEditingSectionId(null);
        setSnackbarMessage('Section updated successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage(data.error || 'Failed to update section');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error updating section:', error);
      setSnackbarMessage('An error occurred while updating section');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      const response = await fetch('/api/appointments/co-consultations/notes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId: sectionToDelete
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotes(prev => {
          if (!prev) return null;
          return {
            ...prev,
            sections: prev.sections.filter(section => section.id !== sectionToDelete)
          };
        });
        setSectionToDelete(null);
        setOpenDeleteDialog(false);
        setSnackbarMessage('Section deleted successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage(data.error || 'Failed to delete section');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      setSnackbarMessage('An error occurred while deleting section');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const confirmDeleteSection = (sectionId: string) => {
    setSectionToDelete(sectionId);
    setOpenDeleteDialog(true);
  };

  const cancelEdit = () => {
    setEditingSectionId(null);
    setSectionTitle('');
    setSectionContent('');
    setSelectedDoctor('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Collaborative Notes</Typography>
            {isEditable && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveMainContent}
              >
                Save Notes
              </Button>
            )}
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            placeholder="Enter collaborative notes here..."
            value={mainContent}
            onChange={(e) => setMainContent(e.target.value)}
            disabled={!isEditable}
          />
          
          {notes && notes.createdBy && (
            <Box mt={1} display="flex" justifyContent="flex-end">
              <Typography variant="caption" color="textSecondary">
                Last updated: {format(new Date(notes.updatedAt), 'PPpp')} by {notes.createdBy.name}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Sections</Typography>
        {isEditable && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddSection(true)}
          >
            Add Section
          </Button>
        )}
      </Box>

      {notes && notes.sections.length > 0 ? (
        notes.sections.map((section) => (
          <Paper
            key={section.id}
            elevation={1}
            sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}
          >
            {editingSectionId === section.id ? (
              <Box>
                <TextField
                  fullWidth
                  label="Section Title"
                  variant="outlined"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Doctor</InputLabel>
                  <Select
                    value={selectedDoctor}
                    label="Doctor"
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Content"
                  variant="outlined"
                  value={sectionContent}
                  onChange={(e) => setSectionContent(e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<CancelIcon />}
                    onClick={cancelEdit}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleUpdateSection}
                  >
                    Update
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">{section.title}</Typography>
                  
                  {isEditable && (
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditSection(section)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => confirmDeleteSection(section.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip
                    avatar={<Avatar><PersonIcon /></Avatar>}
                    label={`${section.doctor.name} - ${section.doctor.specialization}`}
                    variant="outlined"
                    size="small"
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                    Last updated: {format(new Date(section.updatedAt), 'PPpp')}
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {section.content}
                </Typography>
              </Box>
            )}
          </Paper>
        ))
      ) : (
        <Typography variant="body2" color="textSecondary" align="center" sx={{ my: 4 }}>
          No sections added yet. Click "Add Section" to create a new section.
        </Typography>
      )}

      {/* Add Section Dialog */}
      <Dialog open={openAddSection} onClose={() => setOpenAddSection(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Section</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Section Title"
              variant="outlined"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={selectedDoctor}
                label="Doctor"
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Content"
              variant="outlined"
              value={sectionContent}
              onChange={(e) => setSectionContent(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddSection(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddSection} color="primary" variant="contained">
            Add Section
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this section? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteSection} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CoConsultationNotes;
