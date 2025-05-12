"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CardMedia,
  CardActions,
  IconButton, 
  Button, 
  TextField, 
  InputAdornment,
  Avatar, 
  Chip,
  Rating,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  alpha,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  PersonAdd as PersonAddIcon, 
  Phone as PhoneIcon,
  Mail as MailIcon,
  Videocam as VideocamIcon,
  CalendarMonth as CalendarIcon,
  PersonSearch as PersonSearchIcon,
  Today as TodayIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Mock data for doctors
const mockDoctors = [
  {
    id: 1,
    name: 'Dr. Michael Williams',
    specialty: 'Cardiology',
    avatar: null,
    rating: 4.8,
    experience: 15,
    patients: 1245,
    appointmentsToday: 8,
    education: 'MD, Harvard Medical School',
    email: 'michael.williams@hms.com',
    phone: '+1 (555) 123-4567',
    availability: ['Mon', 'Tue', 'Wed', 'Fri'],
    languages: ['English', 'Spanish']
  },
  {
    id: 2,
    name: 'Dr. Sarah Johnson',
    specialty: 'Dermatology',
    avatar: null,
    rating: 4.9,
    experience: 12,
    patients: 987,
    appointmentsToday: 6,
    education: 'MD, Johns Hopkins University',
    email: 'sarah.johnson@hms.com',
    phone: '+1 (555) 234-5678',
    availability: ['Mon', 'Wed', 'Thu', 'Fri'],
    languages: ['English', 'French']
  },
  {
    id: 3,
    name: 'Dr. David Miller',
    specialty: 'Orthopedics',
    avatar: null,
    rating: 4.7,
    experience: 20,
    patients: 1543,
    appointmentsToday: 10,
    education: 'MD, Stanford University',
    email: 'david.miller@hms.com',
    phone: '+1 (555) 345-6789',
    availability: ['Mon', 'Tue', 'Thu', 'Fri'],
    languages: ['English', 'German']
  },
  {
    id: 4,
    name: 'Dr. Jessica Lee',
    specialty: 'Neurology',
    avatar: null,
    rating: 4.9,
    experience: 14,
    patients: 876,
    appointmentsToday: 7,
    education: 'MD, Yale University',
    email: 'jessica.lee@hms.com',
    phone: '+1 (555) 456-7890',
    availability: ['Tue', 'Wed', 'Thu', 'Fri'],
    languages: ['English', 'Chinese']
  },
  {
    id: 5,
    name: 'Dr. Robert Chen',
    specialty: 'Ophthalmology',
    avatar: null,
    rating: 4.6,
    experience: 18,
    patients: 1120,
    appointmentsToday: 9,
    education: 'MD, Columbia University',
    email: 'robert.chen@hms.com',
    phone: '+1 (555) 567-8901',
    availability: ['Mon', 'Tue', 'Wed', 'Fri'],
    languages: ['English', 'Mandarin']
  },
  {
    id: 6,
    name: 'Dr. Emily Wilson',
    specialty: 'Pediatrics',
    avatar: null,
    rating: 5.0,
    experience: 10,
    patients: 932,
    appointmentsToday: 12,
    education: 'MD, University of California',
    email: 'emily.wilson@hms.com',
    phone: '+1 (555) 678-9012',
    availability: ['Mon', 'Tue', 'Thu', 'Fri'],
    languages: ['English', 'Portuguese']
  }
];

// Specialty options
const specialties = [
  'All Specialties',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology'
];

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  avatar: string | null;
  rating: number;
  experience: number;
  patients: number;
  appointmentsToday: number;
  education: string;
  email: string;
  phone: string;
  availability: string[];
  languages: string[];
}

const DoctorsPage = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [tabValue, setTabValue] = useState(0);
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(mockDoctors);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialty(specialty);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doctor: Doctor) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDoctor(doctor);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDoctor(null);
  };

  // Filter doctors based on search query and selected specialty
  useEffect(() => {
    let filtered = doctors;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.education.toLowerCase().includes(query)
      );
    }
    
    if (selectedSpecialty !== 'All Specialties') {
      filtered = filtered.filter(doctor => doctor.specialty === selectedSpecialty);
    }
    
    // Filter based on tab selection
    if (tabValue === 1) { // Available Today
      const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
      filtered = filtered.filter(doctor => doctor.availability.includes(today.substring(0, 3)));
    } else if (tabValue === 2) { // Top Rated
      filtered = filtered.filter(doctor => doctor.rating >= 4.8);
    }
    
    setFilteredDoctors(filtered);
  }, [doctors, searchQuery, selectedSpecialty, tabValue]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05 
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        damping: 20 
      } 
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Doctors
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<PersonAddIcon />}
            sx={{ 
              borderRadius: '12px', 
              px: 3,
              py: 1.2,
              boxShadow: '0 8px 16px rgba(63, 81, 181, 0.15)',
              background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
              '&:hover': {
                boxShadow: '0 12px 20px rgba(63, 81, 181, 0.25)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            Add New Doctor
          </Button>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Filters and stats */}
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                mb: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Filters
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Specialty
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {specialties.map((specialty) => (
                  <Button
                    key={specialty}
                    variant={selectedSpecialty === specialty ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleSpecialtyChange(specialty)}
                    sx={{ 
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      py: 1,
                      px: 2,
                      color: selectedSpecialty === specialty ? 'white' : 'text.primary',
                      borderColor: selectedSpecialty === specialty ? 'primary.main' : alpha(theme.palette.divider, 0.5),
                      backgroundColor: selectedSpecialty === specialty ? 'primary.main' : 'transparent',
                      '&:hover': {
                        backgroundColor: selectedSpecialty === specialty ? 'primary.dark' : alpha(theme.palette.action.hover, 0.1),
                      }
                    }}
                  >
                    {specialty}
                  </Button>
                ))}
              </Box>
            </Paper>

            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Statistics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary">Total Doctors</Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {doctors.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.info.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary">Available Today</Typography>
                      <Typography variant="h5" fontWeight="bold" color="info.main">
                        {doctors.filter(d => {
                          const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                          return d.availability.includes(today.substring(0, 3));
                        }).length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary">Total Patients</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {doctors.reduce((total, doctor) => total + doctor.patients, 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Grid>
        
        {/* Doctors list/grid section */}
        <Grid item xs={12} md={9}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                minHeight: '80vh',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedSpecialty === 'All Specialties' ? 'All Doctors' : selectedSpecialty + ' Specialists'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredDoctors.length} doctors found
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    placeholder="Search doctors..."
                    size="small"
                    value={searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      sx: { 
                        borderRadius: 3,
                        bgcolor: theme.palette.background.default,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.divider, 0.3),
                        }
                      }
                    }}
                    sx={{ width: 250 }}
                  />
                  
                  <Tooltip title="Filter options">
                    <IconButton sx={{ bgcolor: theme.palette.background.default, borderRadius: 2 }}>
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{ 
                  mb: 3,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    minWidth: 100,
                    borderRadius: 2,
                    py: 1,
                    '&.Mui-selected': {
                      fontWeight: 600,
                      color: 'primary.main',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: 3
                  }
                }}
              >
                <Tab label="All Doctors" />
                <Tab label="Available Today" />
                <Tab label="Top Rated" />
              </Tabs>
              
              {filteredDoctors.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 8 
                }}>
                  <PersonSearchIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No doctors found</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Try changing your search criteria or filters
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<PersonAddIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Add New Doctor
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
                  {filteredDoctors.map((doctor) => (
                    <Grid item xs={12} sm={6} md={4} key={doctor.id}>
                      <motion.div variants={itemVariants}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 4,
                            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                              transform: 'translateY(-5px)'
                            },
                            position: 'relative'
                          }}
                        >
                          <Box
                            sx={{
                              height: 80,
                              background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
                              borderRadius: '16px 16px 0 0',
                            }}
                          />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: 10, right: 10 }}>
                            <IconButton 
                              size="small" 
                              sx={{ 
                                bgcolor: alpha(theme.palette.background.paper, 0.8),
                                backdropFilter: 'blur(4px)',
                                '&:hover': { bgcolor: theme.palette.background.paper }
                              }}
                              onClick={(e) => handleMenuOpen(e, doctor)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          
                          <Box sx={{ marginTop: -40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar
                              src={doctor.avatar || undefined}
                              sx={{ 
                                width: 80, 
                                height: 80, 
                                border: '4px solid white',
                                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                                bgcolor: alpha(theme.palette.primary.main, 0.8),
                                fontSize: '2rem'
                              }}
                            >
                              {doctor.name.split(' ')[1]?.[0] || doctor.name[0]}
                            </Avatar>
                          </Box>
                          
                          <CardContent sx={{ pt: 1, pb: 1, flex: '1 0 auto', textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {doctor.name}
                            </Typography>
                            
                            <Chip 
                              label={doctor.specialty} 
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                fontWeight: 600,
                                borderRadius: 2,
                                mb: 1
                              }}
                            />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                              <Rating 
                                value={doctor.rating} 
                                precision={0.1} 
                                size="small" 
                                readOnly 
                                icon={<StarIcon fontSize="inherit" />}
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                ({doctor.rating})
                              </Typography>
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Grid container spacing={1} sx={{ mt: 1 }}>
                              <Grid item xs={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">Experience</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {doctor.experience} years
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">Patients</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {doctor.patients}+
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">Today's Appointments</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TodayIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                                    <Typography variant="body2" fontWeight="bold">
                                      {doctor.appointmentsToday} appointments
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                          
                          <Divider />
                          
                          <CardActions sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button 
                              variant="contained" 
                              startIcon={<CalendarIcon />}
                              size="small"
                              sx={{ 
                                borderRadius: 2,
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)',
                                bgcolor: 'primary.main',
                                flex: 1
                              }}
                            >
                              Schedule
                            </Button>
                            <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                              <PhoneIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                              <VideocamIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                              <MailIcon fontSize="small" />
                            </IconButton>
                          </CardActions>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
      
      {/* Action menu for doctors */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
            borderRadius: 3,
            width: 220,
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <CalendarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Schedule</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <AssignmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <BarChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Performance</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5, color: theme.palette.error.main }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText>Remove</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DoctorsPage;
