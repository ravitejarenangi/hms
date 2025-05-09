"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  SelectChangeEvent,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Medication as MedicationIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Alarm as AlarmIcon,
  CalendarToday as CalendarIcon,
  Today as TodayIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
} from "@mui/icons-material";
import { format, isAfter, isBefore, isToday } from "date-fns";

interface Medication {
  id: string;
  medicationId: string;
  medication: {
    id: string;
    name: string;
    genericName: string;
    brandName: string | null;
    dosageForm: string;
    strength: string;
    prescriptionRequired: boolean;
  };
  dosage: string;
  frequency: string;
  duration: string | null;
  route: string;
  instructions: string | null;
  quantity: number;
  prescriptionId: string;
  prescribedDate: string;
  doctorName: string;
}

interface Schedule {
  id: string;
  prescriptionId: string;
  startDate: string;
  endDate: string | null;
  timeOfDay: string[];
  daysOfWeek: number[];
  instructions: string | null;
  reminders: Reminder[];
}

interface Reminder {
  id: string;
  scheduleId: string;
  scheduledTime: string;
  sentTime: string | null;
  status: string;
  channel: string;
  content: string | null;
  confirmationTime: string | null;
  confirmationStatus: string;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  doctorId: string;
  prescribedDate: string;
  startDate: string;
  endDate: string | null;
  status: string;
  instructions: string | null;
  diagnosis: string | null;
  doctor: {
    user: {
      name: string;
      email: string;
    };
  };
  medications: {
    id: string;
    medicationId: string;
    medication: {
      id: string;
      name: string;
      genericName: string;
      brandName: string | null;
      dosageForm: string;
      strength: string;
    };
    dosage: string;
    frequency: string;
    duration: string | null;
    route: string;
    instructions: string | null;
    quantity: number;
  }[];
  schedules: Schedule[];
  dispensations: {
    id: string;
    dispensedBy: string;
    dispensedAt: string;
    notes: string | null;
  }[];
}

interface MedicationManagementProps {
  patientId: string;
}

export default function MedicationManagement({ patientId }: MedicationManagementProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMedications, setActiveMedications] = useState<Medication[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  // Schedule form state
  const [formData, setFormData] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    timeOfDay: ["08:00", "12:00", "18:00"],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days of week by default
    instructions: "",
    reminderChannel: "SMS",
  });

  useEffect(() => {
    fetchMedications();
  }, [patientId]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patients/${patientId}/medications`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch medications");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setActiveMedications(data.data.activeMedications);
        setPrescriptions(data.data.prescriptions);
      } else {
        throw new Error(data.error || "Failed to fetch medications");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching medications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleScheduleDialogOpen = (medication: Medication, prescription: Prescription) => {
    setSelectedMedication(medication);
    setSelectedPrescription(prescription);
    setScheduleDialogOpen(true);
  };

  const handleScheduleDialogClose = () => {
    setScheduleDialogOpen(false);
    setSelectedMedication(null);
    setSelectedPrescription(null);
    setFormData({
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      timeOfDay: ["08:00", "12:00", "18:00"],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      instructions: "",
      reminderChannel: "SMS",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.timeOfDay];
    newTimes[index] = value;
    setFormData({ ...formData, timeOfDay: newTimes });
  };

  const addTimeSlot = () => {
    setFormData({ ...formData, timeOfDay: [...formData.timeOfDay, "08:00"] });
  };

  const removeTimeSlot = (index: number) => {
    const newTimes = [...formData.timeOfDay];
    newTimes.splice(index, 1);
    setFormData({ ...formData, timeOfDay: newTimes });
  };

  const handleDayToggle = (day: number) => {
    const newDays = [...formData.daysOfWeek];
    if (newDays.includes(day)) {
      // Remove day
      const index = newDays.indexOf(day);
      newDays.splice(index, 1);
    } else {
      // Add day
      newDays.push(day);
    }
    setFormData({ ...formData, daysOfWeek: newDays });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPrescription) return;
    
    try {
      const response = await fetch(`/api/patients/${patientId}/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prescriptionId: selectedPrescription.id,
          ...formData,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create medication schedule");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        fetchMedications();
        handleScheduleDialogClose();
      } else {
        throw new Error(data.error || "Failed to create medication schedule");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating medication schedule:", err);
    }
  };

  const getDayName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };

  const getUpcomingReminders = () => {
    const now = new Date();
    const allReminders: { medication: string; time: Date; status: string }[] = [];
    
    prescriptions.forEach(prescription => {
      prescription.schedules.forEach(schedule => {
        schedule.reminders.forEach(reminder => {
          const reminderTime = new Date(reminder.scheduledTime);
          if (isAfter(reminderTime, now) && isBefore(reminderTime, new Date(now.getTime() + 24 * 60 * 60 * 1000))) {
            // Find medication name
            const medication = prescription.medications.find(med => 
              prescription.id === med.prescriptionId
            );
            
            if (medication) {
              allReminders.push({
                medication: medication.medication.name,
                time: reminderTime,
                status: reminder.status
              });
            }
          }
        });
      });
    });
    
    return allReminders.sort((a, b) => a.time.getTime() - b.time.getTime());
  };

  const getTodaysMedications = () => {
    const today = new Date();
    const todayDay = today.getDay(); // 0-6 for Sunday-Saturday
    
    return activeMedications.filter(medication => {
      // Find the schedule for this medication
      const prescription = prescriptions.find(p => p.id === medication.prescriptionId);
      if (!prescription) return false;
      
      // Check if any schedule includes today
      return prescription.schedules.some(schedule => 
        schedule.daysOfWeek.includes(todayDay) &&
        isAfter(today, new Date(schedule.startDate)) &&
        (!schedule.endDate || isBefore(today, new Date(schedule.endDate)))
      );
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const upcomingReminders = getUpcomingReminders();
  const todaysMedications = getTodaysMedications();

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Active Medications" />
        <Tab label="Medication Schedule" />
        <Tab label="Prescription History" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Active Medications Tab */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" component="h2">
              Active Medications
            </Typography>
          </Box>

          {activeMedications.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="textSecondary">
                No active medications found for this patient.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Medication</TableCell>
                    <TableCell>Dosage & Route</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Prescribed By</TableCell>
                    <TableCell>Prescribed Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeMedications.map((medication) => {
                    const prescription = prescriptions.find(p => p.id === medication.prescriptionId);
                    const hasSchedule = prescription?.schedules.length ? true : false;
                    
                    return (
                      <TableRow key={medication.id}>
                        <TableCell>
                          <Typography variant="body1">
                            {medication.medication.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {medication.medication.genericName} {medication.medication.strength}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {medication.dosage} via {medication.route}
                        </TableCell>
                        <TableCell>{medication.frequency}</TableCell>
                        <TableCell>{medication.doctorName}</TableCell>
                        <TableCell>
                          {format(new Date(medication.prescribedDate), "PPP")}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={hasSchedule ? "View Schedule" : "Create Schedule"}>
                            <IconButton
                              size="small"
                              color={hasSchedule ? "primary" : "default"}
                              onClick={() => prescription && handleScheduleDialogOpen(medication, prescription)}
                            >
                              <ScheduleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Medication Schedule Tab */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Today's Medications
                </Typography>
                {todaysMedications.length === 0 ? (
                  <Typography color="textSecondary">
                    No medications scheduled for today.
                  </Typography>
                ) : (
                  <List>
                    {todaysMedications.map((medication) => {
                      const prescription = prescriptions.find(p => p.id === medication.prescriptionId);
                      const times = prescription?.schedules.flatMap(s => s.timeOfDay) || [];
                      
                      return (
                        <Box key={medication.id}>
                          <ListItem>
                            <ListItemIcon>
                              <MedicationIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={medication.medication.name}
                              secondary={
                                <>
                                  {medication.dosage} - {medication.frequency}
                                  <br />
                                  Times: {times.join(", ")}
                                </>
                              }
                            />
                            <Chip
                              size="small"
                              label={medication.medication.dosageForm}
                              color="primary"
                              variant="outlined"
                            />
                          </ListItem>
                          <Divider />
                        </Box>
                      );
                    })}
                  </List>
                )}
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Upcoming Reminders
                </Typography>
                {upcomingReminders.length === 0 ? (
                  <Typography color="textSecondary">
                    No upcoming reminders for the next 24 hours.
                  </Typography>
                ) : (
                  <List>
                    {upcomingReminders.map((reminder, index) => (
                      <Box key={index}>
                        <ListItem>
                          <ListItemIcon>
                            <AlarmIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={reminder.medication}
                            secondary={format(reminder.time, "PPp")}
                          />
                          <Chip
                            size="small"
                            label={reminder.status}
                            color={reminder.status === "PENDING" ? "warning" : "success"}
                          />
                        </ListItem>
                        <Divider />
                      </Box>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Medication Schedules
                </Typography>
                {prescriptions.filter(p => p.schedules.length > 0).length === 0 ? (
                  <Typography color="textSecondary">
                    No medication schedules found.
                  </Typography>
                ) : (
                  prescriptions
                    .filter(p => p.schedules.length > 0)
                    .map((prescription) => (
                      <Accordion key={prescription.id}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>
                            {prescription.medications.map(m => m.medication.name).join(", ")}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="subtitle2" gutterBottom>
                            Prescribed by: {prescription.doctor.user.name} on{" "}
                            {format(new Date(prescription.prescribedDate), "PPP")}
                          </Typography>
                          
                          {prescription.schedules.map((schedule) => (
                            <Box key={schedule.id} sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="subtitle2">
                                    <CalendarIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                                    Start: {format(new Date(schedule.startDate), "PPP")}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="subtitle2">
                                    {schedule.endDate ? (
                                      <>
                                        <EventAvailableIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                                        End: {format(new Date(schedule.endDate), "PPP")}
                                      </>
                                    ) : (
                                      <>
                                        <EventBusyIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                                        No end date
                                      </>
                                    )}
                                  </Typography>
                                </Grid>
                              </Grid>
                              
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Times:</strong> {schedule.timeOfDay.join(", ")}
                              </Typography>
                              
                              <Typography variant="body2">
                                <strong>Days:</strong> {schedule.daysOfWeek.map(day => getDayName(day)).join(", ")}
                              </Typography>
                              
                              {schedule.instructions && (
                                <Typography variant="body2">
                                  <strong>Instructions:</strong> {schedule.instructions}
                                </Typography>
                              )}
                              
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Reminders:</strong> {schedule.reminders.length} scheduled
                              </Typography>
                            </Box>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    ))
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Prescription History Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Prescription History
          </Typography>

          {prescriptions.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="textSecondary">
                No prescription history found for this patient.
              </Typography>
            </Paper>
          ) : (
            prescriptions.map((prescription) => (
              <Accordion key={prescription.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography>
                        Prescription #{prescription.prescriptionNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="textSecondary">
                        {format(new Date(prescription.prescribedDate), "PPP")}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Chip
                        size="small"
                        label={prescription.status}
                        color={
                          prescription.status === "ACTIVE"
                            ? "success"
                            : prescription.status === "COMPLETED"
                            ? "primary"
                            : "default"
                        }
                      />
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2" gutterBottom>
                    Prescribed by: {prescription.doctor.user.name}
                  </Typography>
                  
                  {prescription.diagnosis && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Diagnosis:</strong> {prescription.diagnosis}
                    </Typography>
                  )}
                  
                  {prescription.instructions && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Instructions:</strong> {prescription.instructions}
                    </Typography>
                  )}
                  
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Medications:
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Medication</TableCell>
                          <TableCell>Dosage</TableCell>
                          <TableCell>Frequency</TableCell>
                          <TableCell>Route</TableCell>
                          <TableCell>Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {prescription.medications.map((medication) => (
                          <TableRow key={medication.id}>
                            <TableCell>
                              {medication.medication.name}
                              <br />
                              <Typography variant="caption" color="textSecondary">
                                {medication.medication.genericName} {medication.medication.strength}
                              </Typography>
                            </TableCell>
                            <TableCell>{medication.dosage}</TableCell>
                            <TableCell>{medication.frequency}</TableCell>
                            <TableCell>{medication.route}</TableCell>
                            <TableCell>{medication.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {prescription.dispensations.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Dispensations:
                      </Typography>
                      <List dense>
                        {prescription.dispensations.map((dispensation) => (
                          <ListItem key={dispensation.id}>
                            <ListItemIcon>
                              <CheckCircleIcon color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`Dispensed on ${format(new Date(dispensation.dispensedAt), "PPP")}`}
                              secondary={dispensation.notes}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  
                  {prescription.status === "ACTIVE" && (
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant="outlined"
                        startIcon={<ScheduleIcon />}
                        onClick={() => handleScheduleDialogOpen(prescription.medications[0], prescription)}
                      >
                        {prescription.schedules.length > 0 ? "Update Schedule" : "Create Schedule"}
                      </Button>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      )}

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={handleScheduleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPrescription?.schedules.length ? "Update Medication Schedule" : "Create Medication Schedule"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {selectedMedication && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">
                  {selectedMedication.medication.name} {selectedMedication.medication.strength}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedMedication.dosage} - {selectedMedication.frequency} - via {selectedMedication.route}
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="End Date (Optional)"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Times of Day
                </Typography>
                {formData.timeOfDay.map((time, index) => (
                  <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <TextField
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      sx={{ mr: 1 }}
                    />
                    {formData.timeOfDay.length > 1 && (
                      <IconButton size="small" onClick={() => removeTimeSlot(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addTimeSlot}
                >
                  Add Time
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Days of Week
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <Chip
                      key={day}
                      label={getDayName(day)}
                      onClick={() => handleDayToggle(day)}
                      color={formData.daysOfWeek.includes(day) ? "primary" : "default"}
                      variant={formData.daysOfWeek.includes(day) ? "filled" : "outlined"}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="reminder-channel-label">Reminder Channel</InputLabel>
                  <Select
                    labelId="reminder-channel-label"
                    id="reminderChannel"
                    name="reminderChannel"
                    value={formData.reminderChannel}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="SMS">SMS</MenuItem>
                    <MenuItem value="EMAIL">Email</MenuItem>
                    <MenuItem value="PUSH">Push Notification</MenuItem>
                    <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleScheduleDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedPrescription?.schedules.length ? "Update Schedule" : "Create Schedule"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
