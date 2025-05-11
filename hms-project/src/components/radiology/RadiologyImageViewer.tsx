import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Slider,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Contrast,
  Rotate90DegreesCcw,
  Flip,
  GridOn,
  PanTool,
  Save,
  Print,
  Fullscreen,
  Bookmark,
  Share,
  Info
} from '@mui/icons-material';
import { GridItem, GridContainer } from './GridItem';

interface DicomImage {
  id: string;
  studyId: string;
  seriesId: string;
  instanceNumber: number;
  sopInstanceUID: string;
  url: string;
  metadata: Record<string, any>;
  thumbnailUrl?: string;
}

interface DicomSeries {
  id: string;
  studyId: string;
  seriesNumber: number;
  modality: string;
  description: string;
  images: DicomImage[];
}

interface DicomStudy {
  id: string;
  patientId: string;
  patientName: string;
  studyDate: string;
  studyDescription: string;
  accessionNumber: string;
  studyInstanceUID: string;
  series: DicomSeries[];
}

const RadiologyImageViewer: React.FC = () => {
  const [studies, setStudies] = useState<DicomStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<DicomStudy | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<DicomSeries | null>(null);
  const [selectedImage, setSelectedImage] = useState<DicomImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(400);
  const [windowCenter, setWindowCenter] = useState(40);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch studies when component mounts
  useEffect(() => {
    fetchStudies();
  }, []);

  // Render the selected image when it changes or when window/level changes
  useEffect(() => {
    if (selectedImage) {
      renderImage(selectedImage);
    }
  }, [selectedImage, windowWidth, windowCenter, zoom, rotation]);

  const fetchStudies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/radiology/images');
      if (!response.ok) {
        throw new Error('Failed to fetch studies');
      }
      const data = await response.json();
      setStudies(data.studies);
      if (data.studies.length > 0) {
        setSelectedStudy(data.studies[0]);
        if (data.studies[0].series.length > 0) {
          setSelectedSeries(data.studies[0].series[0]);
          if (data.studies[0].series[0].images.length > 0) {
            setSelectedImage(data.studies[0].series[0].images[0]);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // For demo purposes, create mock data if API fails
      createMockData();
    } finally {
      setLoading(false);
    }
  };

  const createMockData = () => {
    // Create mock data for demonstration purposes
    const mockStudy: DicomStudy = {
      id: 'study1',
      patientId: 'patient1',
      patientName: 'John Doe',
      studyDate: '2023-05-10',
      studyDescription: 'Chest X-Ray',
      accessionNumber: 'ACC12345',
      studyInstanceUID: '1.2.3.4.5.6.7.8.9',
      series: [
        {
          id: 'series1',
          studyId: 'study1',
          seriesNumber: 1,
          modality: 'CR',
          description: 'PA and Lateral',
          images: [
            {
              id: 'image1',
              studyId: 'study1',
              seriesId: 'series1',
              instanceNumber: 1,
              sopInstanceUID: '1.2.3.4.5.6.7.8.9.1',
              url: 'https://www.example.com/dicom/image1.dcm',
              metadata: {
                Modality: 'CR',
                PatientPosition: 'PA',
                KVP: '120',
                ExposureTime: '100',
                SliceThickness: '3',
                PixelSpacing: '0.2/0.2'
              },
              thumbnailUrl: 'https://via.placeholder.com/100x100?text=X-Ray+1'
            },
            {
              id: 'image2',
              studyId: 'study1',
              seriesId: 'series1',
              instanceNumber: 2,
              sopInstanceUID: '1.2.3.4.5.6.7.8.9.2',
              url: 'https://www.example.com/dicom/image2.dcm',
              metadata: {
                Modality: 'CR',
                PatientPosition: 'Lateral',
                KVP: '120',
                ExposureTime: '100',
                SliceThickness: '3',
                PixelSpacing: '0.2/0.2'
              },
              thumbnailUrl: 'https://via.placeholder.com/100x100?text=X-Ray+2'
            }
          ]
        }
      ]
    };

    setStudies([mockStudy]);
    setSelectedStudy(mockStudy);
    setSelectedSeries(mockStudy.series[0]);
    setSelectedImage(mockStudy.series[0].images[0]);
  };

  const renderImage = (image: DicomImage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // In a real implementation, this would use a DICOM viewer library like Cornerstone.js
    // For this demo, we'll simulate a DICOM image with a placeholder
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Use the thumbnail URL or a placeholder
    img.src = image.thumbnailUrl || 'https://via.placeholder.com/512x512?text=DICOM+Image';
    
    img.onload = () => {
      // Apply zoom
      const scale = zoom / 100;
      
      // Calculate centered position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Save the current context state
      ctx.save();
      
      // Translate to center point, rotate, and translate back
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(-img.width / 2, -img.height / 2);
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Restore the context state
      ctx.restore();
      
      // Apply window/level adjustments (in a real implementation)
      // This would use pixel data manipulation with windowWidth and windowCenter
      
      // Add annotations or measurements if needed
      // This would include drawing lines, text, or other markers on the canvas
    };
  };

  const handleStudyChange = (studyId: string) => {
    const study = studies.find(s => s.id === studyId) || null;
    setSelectedStudy(study);
    if (study && study.series.length > 0) {
      setSelectedSeries(study.series[0]);
      if (study.series[0].images.length > 0) {
        setSelectedImage(study.series[0].images[0]);
      } else {
        setSelectedImage(null);
      }
    } else {
      setSelectedSeries(null);
      setSelectedImage(null);
    }
  };

  const handleSeriesChange = (seriesId: string) => {
    if (!selectedStudy) return;
    const series = selectedStudy.series.find(s => s.id === seriesId) || null;
    setSelectedSeries(series);
    if (series && series.images.length > 0) {
      setSelectedImage(series.images[0]);
    } else {
      setSelectedImage(null);
    }
  };

  const handleImageChange = (imageId: string) => {
    if (!selectedSeries) return;
    const image = selectedSeries.images.find(i => i.id === imageId) || null;
    setSelectedImage(image);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleWindowWidthChange = (event: Event, newValue: number | number[]) => {
    setWindowWidth(newValue as number);
  };

  const handleWindowCenterChange = (event: Event, newValue: number | number[]) => {
    setWindowCenter(newValue as number);
  };

  const handleInfoClick = () => {
    setInfoDialogOpen(true);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          DICOM Image Viewer
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <GridContainer spacing={2}>
            {/* Study/Series/Image Selection */}
            <GridItem xs={12} md={3}>
              <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>Study Browser</Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* Study Selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Study</InputLabel>
                  <Select
                    value={selectedStudy?.id || ''}
                    label="Study"
                    onChange={(e) => handleStudyChange(e.target.value)}
                  >
                    {studies.map((study) => (
                      <MenuItem key={study.id} value={study.id}>
                        {study.studyDescription} - {study.patientName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Series Selection */}
                {selectedStudy && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Series</InputLabel>
                    <Select
                      value={selectedSeries?.id || ''}
                      label="Series"
                      onChange={(e) => handleSeriesChange(e.target.value)}
                    >
                      {selectedStudy.series.map((series) => (
                        <MenuItem key={series.id} value={series.id}>
                          {series.description} ({series.modality})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {/* Image Thumbnails */}
                {selectedSeries && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Images</Typography>
                    <Grid container spacing={1}>
                      {selectedSeries.images.map((image) => (
                        <Grid item key={image.id} xs={6}>
                          <Paper 
                            elevation={selectedImage?.id === image.id ? 8 : 1}
                            sx={{ 
                              p: 1, 
                              cursor: 'pointer',
                              border: selectedImage?.id === image.id ? '2px solid #1976d2' : 'none'
                            }}
                            onClick={() => handleImageChange(image.id)}
                          >
                            <Box 
                              component="img" 
                              src={image.thumbnailUrl || 'https://via.placeholder.com/100x100?text=Image'}
                              alt={`Instance ${image.instanceNumber}`}
                              sx={{ width: '100%', height: 'auto' }}
                            />
                            <Typography variant="caption" display="block" textAlign="center">
                              #{image.instanceNumber}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Paper>
            </GridItem>
            
            {/* Main Viewer */}
            <GridItem xs={12} md={9}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {selectedStudy?.studyDescription} 
                    {selectedSeries && ` - ${selectedSeries.description}`}
                  </Typography>
                  <Box>
                    <Tooltip title="Image Information">
                      <IconButton onClick={handleInfoClick}>
                        <Info />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Save Image">
                      <IconButton>
                        <Save />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                      <IconButton>
                        <Print />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fullscreen">
                      <IconButton>
                        <Fullscreen />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Box display="flex" height="500px">
                  {/* Image Canvas */}
                  <Box flex={1} display="flex" justifyContent="center" alignItems="center" bgcolor="#000">
                    {selectedImage ? (
                      <canvas 
                        ref={canvasRef} 
                        width={512} 
                        height={512} 
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    ) : (
                      <Typography color="white">No image selected</Typography>
                    )}
                  </Box>
                  
                  {/* Tools Panel */}
                  <Box width="60px" bgcolor="#f5f5f5" p={1}>
                    <Tooltip title="Zoom In">
                      <IconButton onClick={handleZoomIn}>
                        <ZoomIn />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom Out">
                      <IconButton onClick={handleZoomOut}>
                        <ZoomOut />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rotate">
                      <IconButton onClick={handleRotate}>
                        <Rotate90DegreesCcw />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Window/Level">
                      <IconButton>
                        <Contrast />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Flip">
                      <IconButton>
                        <Flip />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Grid">
                      <IconButton>
                        <GridOn />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Pan">
                      <IconButton>
                        <PanTool />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bookmark">
                      <IconButton>
                        <Bookmark />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                {/* Window/Level Controls */}
                <Box mt={2} px={2}>
                  <Typography id="window-width-slider" gutterBottom>
                    Window Width: {windowWidth}
                  </Typography>
                  <Slider
                    value={windowWidth}
                    onChange={handleWindowWidthChange}
                    aria-labelledby="window-width-slider"
                    min={1}
                    max={2000}
                    valueLabelDisplay="auto"
                  />
                  
                  <Typography id="window-center-slider" gutterBottom>
                    Window Center: {windowCenter}
                  </Typography>
                  <Slider
                    value={windowCenter}
                    onChange={handleWindowCenterChange}
                    aria-labelledby="window-center-slider"
                    min={-1000}
                    max={1000}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Paper>
            </GridItem>
          </GridContainer>
        )}
      </Paper>
      
      {/* DICOM Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>DICOM Image Information</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Patient Information</Typography>
                <Typography variant="body2">Name: {selectedStudy?.patientName}</Typography>
                <Typography variant="body2">ID: {selectedStudy?.patientId}</Typography>
                <Typography variant="body2">Study Date: {selectedStudy?.studyDate}</Typography>
                <Typography variant="body2">Accession Number: {selectedStudy?.accessionNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Image Information</Typography>
                <Typography variant="body2">Modality: {selectedSeries?.modality}</Typography>
                <Typography variant="body2">Series Description: {selectedSeries?.description}</Typography>
                <Typography variant="body2">Instance Number: {selectedImage.instanceNumber}</Typography>
                <Typography variant="body2">SOP Instance UID: {selectedImage.sopInstanceUID}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">DICOM Metadata</Typography>
                <Box sx={{ maxHeight: '200px', overflow: 'auto', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  {Object.entries(selectedImage.metadata).map(([key, value]) => (
                    <Typography key={key} variant="body2">
                      <strong>{key}:</strong> {value}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RadiologyImageViewer;
