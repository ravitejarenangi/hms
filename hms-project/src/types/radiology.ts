export interface RadiologyService {
  id: string;
  name: string;
  description: string;
  price: number;
  modalityId: string;
  modality?: Modality;
  bodyPart: string;
  preparationInstructions: string;
  active: boolean;
  estimatedDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Modality {
  id: string;
  type: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RadiologyRequest {
  id: string;
  patientId: string;
  patientName?: string;
  referringDoctorId: string;
  referringDoctorName?: string;
  serviceId: string;
  serviceName?: string;
  modalityType?: string;
  status: RadiologyStatus;
  priority: RequestPriority;
  scheduledDate: Date | null;
  completedDate: Date | null;
  notes: string;
  clinicalInformation: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum RadiologyStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REPORT_READY = 'REPORT_READY'
}

export enum RequestPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY'
}
