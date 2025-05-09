"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

interface Document {
  id: string;
  patientId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  documentType: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
}

interface PatientData {
  id: string;
  patientId: string;
  name: string;
}

export default function PatientDocumentsPage({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [documentToView, setDocumentToView] = useState<Document | null>(null);
  
  // Upload form state
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has permissions to view/manage patient documents
      const userRoles = (session?.user as any)?.roles || [];
      const canViewDocuments = userRoles.some(role => 
        ['admin', 'superadmin', 'doctor', 'nurse', 'receptionist'].includes(role)
      );
      
      setHasPermission(canViewDocuments);
      
      if (!canViewDocuments) {
        setError("You don't have permission to view patient documents");
        setLoading(false);
      } else {
        fetchPatientInfo();
        fetchDocuments();
      }
    }
  }, [status, router, session, patientId]);

  const fetchPatientInfo = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch patient information");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPatient({
          id: data.data.id,
          patientId: data.data.patientId,
          name: data.data.name
        });
      } else {
        throw new Error(data.error || "Failed to fetch patient information");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching patient information:", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/patients/documents?patientId=${patientId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch documents");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleDocumentTypeChange = (event: SelectChangeEvent) => {
    setDocumentType(event.target.value);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }
    
    if (!documentType) {
      setError("Please select a document type");
      return;
    }
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);
      formData.append('description', description);
      
      const response = await fetch('/api/patients/documents', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess("Document uploaded successfully");
        setSelectedFile(null);
        setDocumentType("");
        setDescription("");
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Refresh documents list
        fetchDocuments();
      } else {
        throw new Error(data.error || "Failed to upload document");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error uploading document:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    
    try {
      const response = await fetch(`/api/patients/documents?id=${documentToDelete.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess("Document deleted successfully");
        
        // Remove the deleted document from the list
        setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
      } else {
        throw new Error(data.error || "Failed to delete document");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error deleting document:", err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleViewClick = (document: Document) => {
    setDocumentToView(document);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setDocumentToView(null);
  };

  const handleDownload = (document: Document) => {
    window.open(document.filePath, '_blank');
  };

  const handleBack = () => {
    router.push(`/patients/${patientId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon />;
    } else if (fileType === 'application/pdf') {
      return <PdfIcon />;
    } else if (fileType.startsWith('text/')) {
      return <DocumentIcon />;
    } else {
      return <FileIcon />;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!hasPermission) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!patient) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
        <Alert severity="error">Patient not found</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/patients")}
          sx={{ mt: 2 }}
        >
          Back to Patients
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: 3, py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Patient Documents
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Patient
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patient Information
          </Typography>
          <Typography variant="body1">
            <strong>Name:</strong> {patient.name}
          </Typography>
          <Typography variant="body1">
            <strong>ID:</strong> {patient.patientId}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleUpload} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload New Document
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  label="Document Type"
                  onChange={handleDocumentTypeChange}
                >
                  <MenuItem value="medical_report">Medical Report</MenuItem>
                  <MenuItem value="lab_result">Lab Result</MenuItem>
                  <MenuItem value="prescription">Prescription</MenuItem>
                  <MenuItem value="consent_form">Consent Form</MenuItem>
                  <MenuItem value="insurance">Insurance Document</MenuItem>
                  <MenuItem value="id_proof">ID Proof</MenuItem>
                  <MenuItem value="discharge_summary">Discharge Summary</MenuItem>
                  <MenuItem value="referral">Referral Letter</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Brief description of the document"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleUploadClick}
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                >
                  Select File
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!selectedFile || uploading}
                  fullWidth
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </Box>
              {selectedFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" gutterBottom>
          Document List
        </Typography>

        {documents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No documents found for this patient
            </Typography>
          </Box>
        ) : (
          <List>
            {documents.map((document) => (
              <ListItem
                key={document.id}
                divider
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:last-child': { mb: 0 }
                }}
              >
                <ListItemIcon>
                  {getFileIcon(document.fileType)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      {document.fileName}
                      <Typography 
                        component="span" 
                        variant="caption" 
                        sx={{ 
                          ml: 1, 
                          p: 0.5, 
                          bgcolor: 'primary.light', 
                          color: 'primary.contrastText',
                          borderRadius: 1
                        }}
                      >
                        {document.documentType.replace('_', ' ')}
                      </Typography>
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {document.description || "No description"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(document.fileSize)} • Uploaded on {formatDate(document.createdAt)}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="View">
                    <IconButton edge="end" onClick={() => handleViewClick(document)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton edge="end" onClick={() => handleDownload(document)}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton edge="end" color="error" onClick={() => handleDeleteClick(document)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the document "{documentToDelete?.fileName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleViewClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {documentToView?.fileName}
          <Typography variant="caption" display="block" color="text.secondary">
            {documentToView?.documentType.replace('_', ' ')} • {documentToView && formatFileSize(documentToView.fileSize)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {documentToView && documentToView.fileType.startsWith('image/') ? (
            <Box sx={{ textAlign: 'center' }}>
              <img 
                src={documentToView.filePath} 
                alt={documentToView.fileName} 
                style={{ maxWidth: '100%', maxHeight: '70vh' }} 
              />
            </Box>
          ) : documentToView && documentToView.fileType === 'application/pdf' ? (
            <Box sx={{ height: '70vh' }}>
              <iframe 
                src={documentToView.filePath} 
                width="100%" 
                height="100%" 
                title={documentToView.fileName}
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" gutterBottom>
                This file type cannot be previewed directly.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                onClick={() => documentToView && handleDownload(documentToView)}
              >
                Download File
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose}>Close</Button>
          {documentToView && (
            <Button 
              onClick={() => handleDownload(documentToView)} 
              startIcon={<DownloadIcon />}
              color="primary"
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
