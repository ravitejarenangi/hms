
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  isSystem: 'isSystem',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  roleId: 'roleId',
  permissionId: 'permissionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  firstName: 'firstName',
  lastName: 'lastName',
  roleId: 'roleId',
  status: 'status',
  phoneNumber: 'phoneNumber',
  address: 'address',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  country: 'country',
  profileImage: 'profileImage',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  twoFactorEnabled: 'twoFactorEnabled',
  twoFactorSecret: 'twoFactorSecret',
  provider: 'provider',
  providerId: 'providerId',
  emailVerified: 'emailVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PasswordResetScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DoctorScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  specialization: 'specialization',
  qualification: 'qualification',
  experience: 'experience',
  licenseNumber: 'licenseNumber',
  consultationFee: 'consultationFee',
  availableDays: 'availableDays',
  availableTimeStart: 'availableTimeStart',
  availableTimeEnd: 'availableTimeEnd',
  department: 'department',
  bio: 'bio',
  isVerified: 'isVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PatientScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  patientId: 'patientId',
  bloodGroup: 'bloodGroup',
  height: 'height',
  weight: 'weight',
  allergies: 'allergies',
  chronicDiseases: 'chronicDiseases',
  emergencyContact: 'emergencyContact',
  emergencyName: 'emergencyName',
  emergencyRelation: 'emergencyRelation',
  insuranceProvider: 'insuranceProvider',
  insuranceId: 'insuranceId',
  tpaId: 'tpaId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NurseScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  licenseNumber: 'licenseNumber',
  qualification: 'qualification',
  experience: 'experience',
  department: 'department',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AppointmentScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  doctorId: 'doctorId',
  appointmentDate: 'appointmentDate',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  reason: 'reason',
  notes: 'notes',
  followUp: 'followUp',
  followUpDate: 'followUpDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PrescriptionScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  doctorId: 'doctorId',
  appointmentId: 'appointmentId',
  prescriptionDate: 'prescriptionDate',
  diagnosis: 'diagnosis',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PrescriptionMedicineScalarFieldEnum = {
  id: 'id',
  prescriptionId: 'prescriptionId',
  medicineId: 'medicineId',
  dosage: 'dosage',
  frequency: 'frequency',
  duration: 'duration',
  instructions: 'instructions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MedicineScalarFieldEnum = {
  id: 'id',
  name: 'name',
  genericName: 'genericName',
  category: 'category',
  manufacturer: 'manufacturer',
  description: 'description',
  dosageForm: 'dosageForm',
  strength: 'strength',
  price: 'price',
  stock: 'stock',
  reorderLevel: 'reorderLevel',
  expiryDate: 'expiryDate',
  batchNumber: 'batchNumber',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryLogScalarFieldEnum = {
  id: 'id',
  medicineId: 'medicineId',
  quantity: 'quantity',
  type: 'type',
  reason: 'reason',
  referenceId: 'referenceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LabReportScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  doctorId: 'doctorId',
  appointmentId: 'appointmentId',
  testDate: 'testDate',
  reportDate: 'reportDate',
  testType: 'testType',
  testResult: 'testResult',
  normalRange: 'normalRange',
  notes: 'notes',
  attachmentUrl: 'attachmentUrl',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RadiologyReportScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  doctorId: 'doctorId',
  appointmentId: 'appointmentId',
  testDate: 'testDate',
  reportDate: 'reportDate',
  testType: 'testType',
  findings: 'findings',
  impression: 'impression',
  notes: 'notes',
  attachmentUrl: 'attachmentUrl',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  invoiceNumber: 'invoiceNumber',
  invoiceDate: 'invoiceDate',
  dueDate: 'dueDate',
  totalAmount: 'totalAmount',
  discountAmount: 'discountAmount',
  taxAmount: 'taxAmount',
  netAmount: 'netAmount',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceItemScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  itemType: 'itemType',
  itemId: 'itemId',
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  totalPrice: 'totalPrice',
  labReportId: 'labReportId',
  radiologyReportId: 'radiologyReportId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  patientId: 'patientId',
  paymentDate: 'paymentDate',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  transactionId: 'transactionId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BedScalarFieldEnum = {
  id: 'id',
  bedNumber: 'bedNumber',
  wardId: 'wardId',
  status: 'status',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WardScalarFieldEnum = {
  id: 'id',
  name: 'name',
  wardType: 'wardType',
  floor: 'floor',
  capacity: 'capacity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BedAllocationScalarFieldEnum = {
  id: 'id',
  bedId: 'bedId',
  patientId: 'patientId',
  nurseId: 'nurseId',
  allocatedAt: 'allocatedAt',
  dischargedAt: 'dischargedAt',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VitalSignScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  recordedBy: 'recordedBy',
  temperature: 'temperature',
  bloodPressureSystolic: 'bloodPressureSystolic',
  bloodPressureDiastolic: 'bloodPressureDiastolic',
  heartRate: 'heartRate',
  respiratoryRate: 'respiratoryRate',
  oxygenSaturation: 'oxygenSaturation',
  height: 'height',
  weight: 'weight',
  notes: 'notes',
  recordedAt: 'recordedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OperationTheaterScalarFieldEnum = {
  id: 'id',
  name: 'name',
  location: 'location',
  status: 'status',
  doctorId: 'doctorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SurgeryScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  operationTheaterId: 'operationTheaterId',
  surgeryDate: 'surgeryDate',
  startTime: 'startTime',
  endTime: 'endTime',
  surgeryType: 'surgeryType',
  notes: 'notes',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OperationTheaterEquipmentScalarFieldEnum = {
  id: 'id',
  operationTheaterId: 'operationTheaterId',
  name: 'name',
  serialNumber: 'serialNumber',
  manufacturer: 'manufacturer',
  purchaseDate: 'purchaseDate',
  lastMaintenanceDate: 'lastMaintenanceDate',
  nextMaintenanceDate: 'nextMaintenanceDate',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MedicalGasCylinderScalarFieldEnum = {
  id: 'id',
  cylinderNumber: 'cylinderNumber',
  gasType: 'gasType',
  capacity: 'capacity',
  currentLevel: 'currentLevel',
  location: 'location',
  status: 'status',
  lastRefillDate: 'lastRefillDate',
  nextRefillDate: 'nextRefillDate',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EquipmentMaintenanceScalarFieldEnum = {
  id: 'id',
  equipmentType: 'equipmentType',
  equipmentId: 'equipmentId',
  maintenanceDate: 'maintenanceDate',
  maintenanceType: 'maintenanceType',
  performedBy: 'performedBy',
  cost: 'cost',
  notes: 'notes',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AmbulanceScalarFieldEnum = {
  id: 'id',
  vehicleNumber: 'vehicleNumber',
  model: 'model',
  type: 'type',
  capacity: 'capacity',
  driverName: 'driverName',
  driverContact: 'driverContact',
  status: 'status',
  lastMaintenanceDate: 'lastMaintenanceDate',
  nextMaintenanceDate: 'nextMaintenanceDate',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AmbulanceServiceScalarFieldEnum = {
  id: 'id',
  ambulanceId: 'ambulanceId',
  patientName: 'patientName',
  patientContact: 'patientContact',
  pickupLocation: 'pickupLocation',
  dropLocation: 'dropLocation',
  serviceDate: 'serviceDate',
  status: 'status',
  fare: 'fare',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BiometricDataScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  biometricId: 'biometricId',
  fingerprint: 'fingerprint',
  faceData: 'faceData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  checkInTime: 'checkInTime',
  checkOutTime: 'checkOutTime',
  status: 'status',
  deviceId: 'deviceId',
  verificationMode: 'verificationMode',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DutyRosterScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  startDate: 'startDate',
  endDate: 'endDate',
  shiftStart: 'shiftStart',
  shiftEnd: 'shiftEnd',
  department: 'department',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TPAScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contactPerson: 'contactPerson',
  contactNumber: 'contactNumber',
  email: 'email',
  address: 'address',
  contractStartDate: 'contractStartDate',
  contractEndDate: 'contractEndDate',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  employeeId: 'employeeId',
  department: 'department',
  position: 'position',
  joiningDate: 'joiningDate',
  contractType: 'contractType',
  contractEndDate: 'contractEndDate',
  salary: 'salary',
  bankName: 'bankName',
  accountNumber: 'accountNumber',
  ifscCode: 'ifscCode',
  panNumber: 'panNumber',
  emergencyContact: 'emergencyContact',
  emergencyName: 'emergencyName',
  emergencyRelation: 'emergencyRelation',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  leaveType: 'leaveType',
  startDate: 'startDate',
  endDate: 'endDate',
  totalDays: 'totalDays',
  reason: 'reason',
  status: 'status',
  approvedBy: 'approvedBy',
  approvedAt: 'approvedAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalaryPaymentScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  paymentDate: 'paymentDate',
  salaryMonth: 'salaryMonth',
  basicSalary: 'basicSalary',
  allowances: 'allowances',
  deductions: 'deductions',
  taxDeducted: 'taxDeducted',
  netSalary: 'netSalary',
  paymentMethod: 'paymentMethod',
  transactionId: 'transactionId',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeDocumentScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  documentType: 'documentType',
  documentName: 'documentName',
  documentUrl: 'documentUrl',
  isVerified: 'isVerified',
  verifiedBy: 'verifiedBy',
  verifiedAt: 'verifiedAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PerformanceReviewScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  reviewDate: 'reviewDate',
  reviewPeriodStart: 'reviewPeriodStart',
  reviewPeriodEnd: 'reviewPeriodEnd',
  reviewedBy: 'reviewedBy',
  rating: 'rating',
  strengths: 'strengths',
  areasOfImprovement: 'areasOfImprovement',
  goals: 'goals',
  comments: 'comments',
  employeeComments: 'employeeComments',
  status: 'status',
  acknowledgedAt: 'acknowledgedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubsidySchemeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  description: 'description',
  issuingAuthority: 'issuingAuthority',
  startDate: 'startDate',
  endDate: 'endDate',
  eligibilityCriteria: 'eligibilityCriteria',
  subsidyType: 'subsidyType',
  percentageValue: 'percentageValue',
  fixedAmount: 'fixedAmount',
  maxCoverageAmount: 'maxCoverageAmount',
  maxCoveragePerTreatment: 'maxCoveragePerTreatment',
  applicableServices: 'applicableServices',
  documentationRequired: 'documentationRequired',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PatientSubsidyScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  schemeId: 'schemeId',
  enrollmentDate: 'enrollmentDate',
  enrollmentNumber: 'enrollmentNumber',
  cardNumber: 'cardNumber',
  validFrom: 'validFrom',
  validUntil: 'validUntil',
  remainingBalance: 'remainingBalance',
  status: 'status',
  verificationStatus: 'verificationStatus',
  verifiedBy: 'verifiedBy',
  verifiedAt: 'verifiedAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubsidyClaimScalarFieldEnum = {
  id: 'id',
  patientSubsidyId: 'patientSubsidyId',
  schemeId: 'schemeId',
  invoiceId: 'invoiceId',
  claimDate: 'claimDate',
  claimAmount: 'claimAmount',
  approvedAmount: 'approvedAmount',
  rejectionReason: 'rejectionReason',
  claimStatus: 'claimStatus',
  processedBy: 'processedBy',
  processedAt: 'processedAt',
  reimbursementDate: 'reimbursementDate',
  transactionId: 'transactionId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HousekeepingAreaScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  floor: 'floor',
  buildingSection: 'buildingSection',
  priority: 'priority',
  cleaningFrequency: 'cleaningFrequency',
  specialInstructions: 'specialInstructions',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HousekeepingStaffScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  staffId: 'staffId',
  supervisor: 'supervisor',
  specializedAreas: 'specializedAreas',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CleaningTaskScalarFieldEnum = {
  id: 'id',
  areaId: 'areaId',
  assignedToId: 'assignedToId',
  scheduledDate: 'scheduledDate',
  scheduledTime: 'scheduledTime',
  estimatedDuration: 'estimatedDuration',
  priority: 'priority',
  status: 'status',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CleaningVerificationScalarFieldEnum = {
  id: 'id',
  taskId: 'taskId',
  verifiedById: 'verifiedById',
  verificationDate: 'verificationDate',
  rating: 'rating',
  cleanliness: 'cleanliness',
  comments: 'comments',
  photosUrl: 'photosUrl',
  status: 'status',
  followUpRequired: 'followUpRequired',
  followUpNotes: 'followUpNotes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CleaningSupplyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  unit: 'unit',
  currentStock: 'currentStock',
  reorderLevel: 'reorderLevel',
  location: 'location',
  supplier: 'supplier',
  lastPurchaseDate: 'lastPurchaseDate',
  lastPurchasePrice: 'lastPurchasePrice',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CleaningSupplyRequestScalarFieldEnum = {
  id: 'id',
  requestedById: 'requestedById',
  requestDate: 'requestDate',
  requiredBy: 'requiredBy',
  status: 'status',
  approvedById: 'approvedById',
  approvedAt: 'approvedAt',
  fulfilledAt: 'fulfilledAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CleaningSupplyRequestItemScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  supplyId: 'supplyId',
  quantityRequested: 'quantityRequested',
  quantityApproved: 'quantityApproved',
  quantityFulfilled: 'quantityFulfilled',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Permission: 'Permission',
  Role: 'Role',
  RolePermission: 'RolePermission',
  User: 'User',
  PasswordReset: 'PasswordReset',
  Doctor: 'Doctor',
  Patient: 'Patient',
  Nurse: 'Nurse',
  Appointment: 'Appointment',
  Prescription: 'Prescription',
  PrescriptionMedicine: 'PrescriptionMedicine',
  Medicine: 'Medicine',
  InventoryLog: 'InventoryLog',
  LabReport: 'LabReport',
  RadiologyReport: 'RadiologyReport',
  Invoice: 'Invoice',
  InvoiceItem: 'InvoiceItem',
  Payment: 'Payment',
  Bed: 'Bed',
  Ward: 'Ward',
  BedAllocation: 'BedAllocation',
  VitalSign: 'VitalSign',
  OperationTheater: 'OperationTheater',
  Surgery: 'Surgery',
  OperationTheaterEquipment: 'OperationTheaterEquipment',
  MedicalGasCylinder: 'MedicalGasCylinder',
  EquipmentMaintenance: 'EquipmentMaintenance',
  Ambulance: 'Ambulance',
  AmbulanceService: 'AmbulanceService',
  BiometricData: 'BiometricData',
  AttendanceLog: 'AttendanceLog',
  DutyRoster: 'DutyRoster',
  TPA: 'TPA',
  Employee: 'Employee',
  Leave: 'Leave',
  SalaryPayment: 'SalaryPayment',
  EmployeeDocument: 'EmployeeDocument',
  PerformanceReview: 'PerformanceReview',
  SubsidyScheme: 'SubsidyScheme',
  PatientSubsidy: 'PatientSubsidy',
  SubsidyClaim: 'SubsidyClaim',
  HousekeepingArea: 'HousekeepingArea',
  HousekeepingStaff: 'HousekeepingStaff',
  CleaningTask: 'CleaningTask',
  CleaningVerification: 'CleaningVerification',
  CleaningSupply: 'CleaningSupply',
  CleaningSupplyRequest: 'CleaningSupplyRequest',
  CleaningSupplyRequestItem: 'CleaningSupplyRequestItem'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
