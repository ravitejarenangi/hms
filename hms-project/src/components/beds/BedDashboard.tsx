import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  TextField,
  Typography,
  Tooltip,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import FilterListIcon from '@mui/icons-material/FilterList';
import { styled } from '@mui/material/styles';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Bed {
  id: string;
  bedNumber: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  wing: string;
  bedType: string;
  status: string;
  patientName?: string;
  admissionDate?: string;
  expectedDischarge?: string;
}

interface Floor {
  number: number;
  wings: string[];
  beds: Bed[];
}

interface Ward {
  id: string;
  name: string;
  floor: number;
  wing: string;
  beds: Bed[];
}

const BedItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.primary,
  height: '80px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const BedDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    bedType: '',
    status: '',
    floor: '',
    wing: '',
    priceRange: { min: '', max: '' }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all beds with their status
        const bedsResponse = await fetch('/api/beds/dashboard');
        if (bedsResponse.ok) {
          const data = await bedsResponse.json();
          setBeds(data);
          
          // Process floors and wings
          const floorsMap = new Map<number, Floor>();
          
          data.forEach((bed: Bed) => {
            if (!floorsMap.has(bed.floor)) {
              floorsMap.set(bed.floor, {
                number: bed.floor,
                wings: [],
                beds: []
              });
            }
            
            const floor = floorsMap.get(bed.floor)!;
            floor.beds.push(bed);
            
            if (!floor.wings.includes(bed.wing)) {
              floor.wings.push(bed.wing);
            }
          });
          
          setFloors(Array.from(floorsMap.values()).sort((a, b) => a.number - b.number));
          
          // Process wards
          const wardsResponse = await fetch('/api/beds/dashboard/wards');
          if (wardsResponse.ok) {
            const wardsData = await wardsResponse.json();
            
            // Assign beds to wards
            const wardsWithBeds = wardsData.map((ward: Ward) => {
              const wardBeds = data.filter((bed: Bed) => 
                bed.floor === ward.floor && bed.wing === ward.wing
              );
              return { ...ward, beds: wardBeds };
            });
            
            setWards(wardsWithBeds);
          }
        } else {
          throw new Error('Failed to fetch beds');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up SSE for real-time updates
    const eventSource = new EventSource('/api/beds/status-sse');
    
    eventSource.onmessage = (event) => {
      const updatedBed = JSON.parse(event.data);
      setBeds(prevBeds => 
        prevBeds.map(bed => 
          bed.id === updatedBed.id ? updatedBed : bed
        )
      );
    };
    
    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (e: SelectChangeEvent | React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'min' || name === 'max') {
      setFilters({
        ...filters,
        priceRange: {
          ...filters.priceRange,
          [name]: value
        }
      });
    } else {
      setFilters({
        ...filters,
        [name]: value,
      });
    }
  };

  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '#4caf50'; // Green
      case 'OCCUPIED':
        return '#f44336'; // Red
      case 'RESERVED':
        return '#ff9800'; // Orange
      case 'UNDER_MAINTENANCE':
        return '#2196f3'; // Blue
      case 'CLEANING':
        return '#9c27b0'; // Purple
      case 'OUT_OF_SERVICE':
        return '#9e9e9e'; // Grey
      default:
        return '#9e9e9e'; // Grey
    }
  };

  const filteredBeds = beds.filter(bed => {
    // Apply search term
    if (searchTerm && !bed.bedNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !bed.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(bed.patientName && bed.patientName.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    // Apply filters
    if (filters.bedType && bed.bedType !== filters.bedType) return false;
    if (filters.status && bed.status !== filters.status) return false;
    if (filters.floor && bed.floor !== parseInt(filters.floor)) return false;
    if (filters.wing && bed.wing !== filters.wing) return false;
    
    // Filter by price range would be implemented here if pricing data was available
    
    return true;
  });

  return (
    <Box>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Beds"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
              placeholder="Bed number, room, patient..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Bed Type</InputLabel>
                <Select
                  name="bedType"
                  value={filters.bedType}
                  onChange={handleFilterChange}
                  label="Bed Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="ELECTRIC">Electric</MenuItem>
                  <MenuItem value="ICU">ICU</MenuItem>
                  <MenuItem value="PEDIATRIC">Pediatric</MenuItem>
                  <MenuItem value="BARIATRIC">Bariatric</MenuItem>
                  <MenuItem value="LABOR_DELIVERY">Labor & Delivery</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="OCCUPIED">Occupied</MenuItem>
                  <MenuItem value="RESERVED">Reserved</MenuItem>
                  <MenuItem value="UNDER_MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="CLEANING">Cleaning</MenuItem>
                  <MenuItem value="OUT_OF_SERVICE">Out of Service</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Floor</InputLabel>
                <Select
                  name="floor"
                  value={filters.floor}
                  onChange={handleFilterChange}
                  label="Floor"
                >
                  <MenuItem value="">All</MenuItem>
                  {floors.map(floor => (
                    <MenuItem key={floor.number} value={floor.number.toString()}>
                      Floor {floor.number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Wing</InputLabel>
                <Select
                  name="wing"
                  value={filters.wing}
                  onChange={handleFilterChange}
                  label="Wing"
                >
                  <MenuItem value="">All</MenuItem>
                  {Array.from(new Set(beds.map(bed => bed.wing))).map(wing => (
                    <MenuItem key={wing} value={wing}>
                      {wing}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="bed dashboard tabs">
            <Tab label="Floor View" />
            <Tab label="Ward View" />
            <Tab label="Occupancy Timeline" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {floors.map(floor => (
                <Box key={floor.number} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Floor {floor.number}
                  </Typography>
                  
                  {floor.wings.map(wing => {
                    const wingBeds = filteredBeds.filter(
                      bed => bed.floor === floor.number && bed.wing === wing
                    );
                    
                    if (wingBeds.length === 0) return null;
                    
                    return (
                      <Box key={wing} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Wing {wing}
                        </Typography>
                        
                        <Grid container spacing={1}>
                          {wingBeds.map(bed => (
                            <Grid item xs={6} sm={4} md={3} lg={2} key={bed.id}>
                              <Tooltip 
                                title={
                                  <Box>
                                    <Typography variant="body2">
                                      {bed.patientName ? `Patient: ${bed.patientName}` : 'No patient'}
                                    </Typography>
                                    {bed.admissionDate && (
                                      <Typography variant="body2">
                                        Admitted: {new Date(bed.admissionDate).toLocaleDateString()}
                                      </Typography>
                                    )}
                                    {bed.expectedDischarge && (
                                      <Typography variant="body2">
                                        Expected Discharge: {new Date(bed.expectedDischarge).toLocaleDateString()}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              >
                                <BedItem 
                                  onClick={() => handleBedClick(bed)}
                                  sx={{ 
                                    bgcolor: getStatusColor(bed.status),
                                    color: ['AVAILABLE', 'RESERVED'].includes(bed.status) ? 'black' : 'white',
                                    border: selectedBed?.id === bed.id ? '2px solid #000' : 'none'
                                  }}
                                >
                                  <Typography variant="subtitle2">
                                    Bed #{bed.bedNumber}
                                  </Typography>
                                  <Typography variant="caption">
                                    Room {bed.roomNumber}
                                  </Typography>
                                </BedItem>
                              </Tooltip>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {wards.map(ward => {
                const wardBeds = filteredBeds.filter(
                  bed => bed.floor === ward.floor && bed.wing === ward.wing
                );
                
                if (wardBeds.length === 0) return null;
                
                return (
                  <Box key={ward.id} sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      {ward.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Floor {ward.floor}, Wing {ward.wing}
                    </Typography>
                    
                    <Grid container spacing={1}>
                      {wardBeds.map(bed => (
                        <Grid item xs={6} sm={4} md={3} lg={2} key={bed.id}>
                          <Tooltip 
                            title={
                              <Box>
                                <Typography variant="body2">
                                  {bed.patientName ? `Patient: ${bed.patientName}` : 'No patient'}
                                </Typography>
                                {bed.admissionDate && (
                                  <Typography variant="body2">
                                    Admitted: {new Date(bed.admissionDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                {bed.expectedDischarge && (
                                  <Typography variant="body2">
                                    Expected Discharge: {new Date(bed.expectedDischarge).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                            }
                          >
                            <BedItem 
                              onClick={() => handleBedClick(bed)}
                              sx={{ 
                                bgcolor: getStatusColor(bed.status),
                                color: ['AVAILABLE', 'RESERVED'].includes(bed.status) ? 'black' : 'white',
                                border: selectedBed?.id === bed.id ? '2px solid #000' : 'none'
                              }}
                            >
                              <Typography variant="subtitle2">
                                Bed #{bed.bedNumber}
                              </Typography>
                              <Typography variant="caption">
                                Room {bed.roomNumber}
                              </Typography>
                            </BedItem>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <Typography variant="body1" color="text.secondary">
              Occupancy timeline visualization will be implemented here
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {selectedBed && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected Bed Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Bed Number</Typography>
              <Typography variant="body1">{selectedBed.bedNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Room</Typography>
              <Typography variant="body1">{selectedBed.roomNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Floor</Typography>
              <Typography variant="body1">{selectedBed.floor}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Wing</Typography>
              <Typography variant="body1">{selectedBed.wing}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Type</Typography>
              <Typography variant="body1">{selectedBed.bedType.replace(/_/g, ' ')}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Status</Typography>
              <Chip 
                label={selectedBed.status} 
                sx={{ 
                  bgcolor: getStatusColor(selectedBed.status),
                  color: ['AVAILABLE', 'RESERVED'].includes(selectedBed.status) ? 'black' : 'white',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Patient</Typography>
              <Typography variant="body1">{selectedBed.patientName || 'None'}</Typography>
            </Grid>
            {selectedBed.admissionDate && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2">Admission Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedBed.admissionDate).toLocaleDateString()}
                </Typography>
              </Grid>
            )}
            {selectedBed.expectedDischarge && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2">Expected Discharge</Typography>
                <Typography variant="body1">
                  {new Date(selectedBed.expectedDischarge).toLocaleDateString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default BedDashboard;
