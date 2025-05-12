"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  IconButton,
  Tabs, 
  Tab, 
  Chip, 
  Button, 
  TextField, 
  InputAdornment,
  Avatar, 
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme
} from '@mui/material';
import { GridItem, GridContainer } from '@/components/radiology/GridItem';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfDay, isToday, isAfter, isBefore, addDays } from 'date-fns';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  VideoCall as VideoIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MedicalServices as MedicalIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Types defined before usage
type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
type AppointmentType = 'in-person' | 'virtual' | 'phone';

interface Appointment {
  id: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  doctorId: string;
  specialty: string;
  date: Date;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;
  notes: string;
  avatar: string | null;
}

// Mock data for appointments
const mockAppointments: Appointment[] = [
  {
    id: 1,
    patientName: 'Emily Johnson',
    patientId: 'P00123',
    doctorName: 'Dr. Michael Williams',
    doctorId: 'D00045',
    specialty: 'Cardiology',
    date: new Date(2025, 4, 12, 10, 30),
    status: 'scheduled',
    type: 'in-person',
    reason: 'Annual heart checkup',
    notes: 'Patient has a history of high blood pressure',
    avatar: null
  },
  {
    id: 2,
    patientName: 'James Smith',
    patientId: 'P00124',
    doctorName: 'Dr. Sarah Johnson',
    doctorId: 'D00033',
    specialty: 'Dermatology',
    date: new Date(2025, 4, 12, 14, 15),
    status: 'confirmed',
    type: 'in-person',
    reason: 'Skin rash examination',
    notes: '',
    avatar: null
  },
  {
    id: 3,
    patientName: 'Robert Brown',
    patientId: 'P00156',
    doctorName: 'Dr. David Miller',
    doctorId: 'D00027',
    specialty: 'Orthopedics',
    date: new Date(2025, 4, 12, 16, 0),
    status: 'scheduled',
    type: 'virtual',
    reason: 'Follow-up on knee surgery',
    notes: 'Check mobility and recovery progress',
    avatar: null
  },
  {
    id: 4,
    patientName: 'Lisa Davis',
    patientId: 'P00178',
    doctorName: 'Dr. Jessica Lee',
    doctorId: 'D00056',
    specialty: 'Neurology',
    date: new Date(2025, 4, 13, 9, 0),
    status: 'scheduled',
    type: 'in-person',
    reason: 'Recurring headaches',
    notes: 'Possible migraine diagnosis',
    avatar: null
  },
  {
    id: 5,
    patientName: 'Daniel Wilson',
    patientId: 'P00189',
    doctorName: 'Dr. Michael Williams',
    doctorId: 'D00045',
    specialty: 'Cardiology',
    date: new Date(2025, 4, 13, 11, 30),
    status: 'confirmed',
    type: 'in-person',
    reason: 'Chest pain investigation',
    notes: 'ECG requested',
    avatar: null
  },
  {
    id: 6,
    patientName: 'Jennifer Taylor',
    patientId: 'P00201',
    doctorName: 'Dr. Sarah Johnson',
    doctorId: 'D00033',
    specialty: 'Dermatology',
    date: new Date(2025, 4, 14, 13, 45),
    status: 'scheduled',
    type: 'virtual',
    reason: 'Acne treatment follow-up',
    notes: '',
    avatar: null
  }
];

// Type definitions already declared at the top of the file

const AppointmentsPage = () => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(mockAppointments);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Filter appointments based on search query and selected date
  useEffect(() => {
    let filtered = appointments;
    
    if (selectedDate) {
      filtered = filtered.filter(appointment => 
        startOfDay(appointment.date).getTime() === startOfDay(selectedDate).getTime()
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(appointment => 
        appointment.patientName.toLowerCase().includes(query) ||
        appointment.doctorName.toLowerCase().includes(query) ||
        appointment.patientId.toLowerCase().includes(query) ||
        appointment.reason.toLowerCase().includes(query)
      );
    }
    
    // Filter based on tab selection (status)
    if (tabValue === 1) { // Today
      filtered = filtered.filter(appointment => isToday(appointment.date));
    } else if (tabValue === 2) { // Upcoming
      filtered = filtered.filter(appointment => isAfter(appointment.date, new Date()));
    } else if (tabValue === 3) { // Completed
      filtered = filtered.filter(appointment => appointment.status === 'completed');
    } else if (tabValue === 4) { // Cancelled
      filtered = filtered.filter(appointment => appointment.status === 'cancelled');
    }
    
    setFilteredAppointments(filtered);
  }, [appointments, searchQuery, selectedDate, tabValue]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedAppointment(null);
  };

  const getStatusChipColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled':
        return { color: 'primary', label: 'Scheduled' };
      case 'confirmed':
        return { color: 'success', label: 'Confirmed' };
      case 'completed':
        return { color: 'info', label: 'Completed' };
      case 'cancelled':
        return { color: 'error', label: 'Cancelled' };
      case 'no-show':
        return { color: 'warning', label: 'No Show' };
      default:
        return { color: 'default', label: status };
    }
  };

  const getAppointmentTypeIcon = (type: AppointmentType) => {
    switch (type) {
      case 'in-person':
        return <LocationIcon fontSize="small" />;
      case 'virtual':
        return <VideoIcon fontSize="small" />;
      case 'phone':
        return <PhoneIcon fontSize="small" />;
      default:
        return <MedicalIcon fontSize="small" />;
    }
  };

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
            Appointments
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
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
            New Appointment
          </Button>
        </Box>
      </motion.div>

      <GridContainer spacing={3}>
        {/* Calendar and filters section */}
        <GridItem xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 4,
                mb: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden'
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar 
                  value={selectedDate} 
                  onChange={(newDate) => setSelectedDate(newDate)}
                  sx={{
                    '.MuiPickersDay-root': {
                      borderRadius: '12px',
                    },
                    '.MuiPickersDay-root.Mui-selected': {
                      background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
                      boxShadow: '0 4px 10px rgba(63, 81, 181, 0.25)',
                    }
                  }}
                />
              </LocalizationProvider>
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
                Quick Statistics
              </Typography>
              
              <GridContainer spacing={2}>
                <GridItem xs={6}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary">Today</Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {appointments.filter(a => isToday(a.date)).length}
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                <GridItem xs={6}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.info.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary">This Week</Typography>
                      <Typography variant="h5" fontWeight="bold" color="info.main">
                        {appointments.filter(a => 
                          isAfter(a.date, startOfDay(new Date())) && 
                          isBefore(a.date, addDays(new Date(), 7))
                        ).length}
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                <GridItem xs={6}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary">Confirmed</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {appointments.filter(a => a.status === 'confirmed').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
                <GridItem xs={6}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary">Cancelled</Typography>
                      <Typography variant="h5" fontWeight="bold" color="error.main">
                        {appointments.filter(a => a.status === 'cancelled').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
              </GridContainer>
            </Paper>
          </motion.div>
        </GridItem>
        
        {/* Appointments list section */}
        <GridItem xs={12} md={8}>
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
                minHeight: '70vh',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold">
                  {selectedDate ? `Appointments for ${format(selectedDate, 'MMMM d, yyyy')}` : 'All Appointments'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    placeholder="Search appointments..."
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
                    minWidth: 'auto',
                    mx: 1,
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
                <Tab label="All" />
                <Tab label="Today" />
                <Tab label="Upcoming" />
                <Tab label="Completed" />
                <Tab label="Cancelled" />
              </Tabs>
              
              {filteredAppointments.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 8 
                }}>
                  <EventIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No appointments found</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Try changing your search criteria or select a different date
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Create New Appointment
                  </Button>
                </Box>
              ) : (
                <Box component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
                  {filteredAppointments.map((appointment) => (
                    <motion.div key={appointment.id} variants={itemVariants}>
                      <Card
                        sx={{
                          mb: 2,
                          borderRadius: 3,
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
                            transform: 'translateY(-2px)'
                          },
                          position: 'relative',
                          overflow: 'visible',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <GridContainer spacing={2} alignItems="center">
                            <GridItem xs={9} md={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  src={appointment.avatar || undefined}
                                  sx={{ 
                                    width: 48, 
                                    height: 48, 
                                    bgcolor: theme.palette.primary.main,
                                    mr: 2,
                                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                                  }}
                                >
                                  {appointment.patientName.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {appointment.patientName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {appointment.patientId}
                                    </Typography>
                                    <Tooltip title={appointment.type === 'in-person' ? 'In-person visit' : appointment.type === 'virtual' ? 'Video consultation' : 'Phone call'}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        {getAppointmentTypeIcon(appointment.type)}
                                      </Box>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Box>
                            </GridItem>
                            
                            <GridItem xs={12} md={3}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <TimeIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 0.5 }} />
                                  <Typography variant="body2">
                                    {format(appointment.date, 'h:mm a')}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 0.5 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {appointment.doctorName}
                                  </Typography>
                                </Box>
                              </Box>
                            </GridItem>
                            
                            <GridItem xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                              <Chip 
                                label={getStatusChipColor(appointment.status).label}
                                size="small"
                                color={getStatusChipColor(appointment.status).color as any}
                                sx={{ 
                                  borderRadius: 2,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  minWidth: 85
                                }}
                              />
                            </GridItem>
                            
                            <GridItem xs={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleMenuOpen(e, appointment)}
                                sx={{ 
                                  color: theme.palette.text.secondary,
                                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </GridItem>
                          </GridContainer>
                          
                          {appointment.reason && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                <span style={{ fontWeight: 600 }}>Reason:</span> {appointment.reason}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Paper>
          </motion.div>
        </GridItem>
      </GridContainer>
      
      {/* Action menu for appointments */}
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
            width: 200,
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
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <CheckIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Completed</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Details</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5, color: theme.palette.error.main }}>
          <ListItemIcon>
            <CloseIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText>Cancel Appointment</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AppointmentsPage;
