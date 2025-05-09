import { Session } from 'next-auth';

// Define role constants
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PATIENT: 'patient',
};

// Check if user has a specific role
export function hasRole(session: Session | null, role: string): boolean {
  if (!session || !session.user || !session.user.roles) {
    return false;
  }
  
  return session.user.roles.includes(role);
}

// Check if user has any of the specified roles
export function hasAnyRole(session: Session | null, roles: string[]): boolean {
  if (!session || !session.user || !session.user.roles) {
    return false;
  }
  
  return roles.some(role => session.user.roles.includes(role));
}

// Check if user can access patient data
export function canAccessPatientData(session: Session | null): boolean {
  return hasAnyRole(session, [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST]);
}

// Check if user can modify patient data
export function canModifyPatientData(session: Session | null): boolean {
  return hasAnyRole(session, [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE]);
}

// Check if user can access medical records
export function canAccessMedicalRecords(session: Session | null): boolean {
  return hasAnyRole(session, [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE]);
}

// Check if user can prescribe medications
export function canPrescribeMedications(session: Session | null): boolean {
  return hasAnyRole(session, [ROLES.ADMIN, ROLES.DOCTOR]);
}

// Check if user has a specific permission
export function hasPermission(session: Session | null, permission: string): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  // Admin has all permissions
  if (session.user.isAdmin) {
    return true;
  }
  
  // Permission check based on roles
  const rolePermissions: Record<string, string[]> = {
    [ROLES.ADMIN]: ['all'],
    [ROLES.DOCTOR]: ['read:patients', 'write:patients', 'read:appointments', 'write:appointments', 'read:prescriptions', 'write:prescriptions', 'read:medical_records', 'write:medical_records'],
    [ROLES.NURSE]: ['read:patients', 'write:patients', 'read:appointments', 'read:prescriptions', 'read:medical_records'],
    [ROLES.RECEPTIONIST]: ['read:patients', 'read:appointments', 'write:appointments'],
    [ROLES.PATIENT]: ['read:own_records', 'read:own_appointments', 'write:own_appointments']
  };
  
  // Check if any of the user's roles have the required permission
  return session.user.roles.some(role => 
    rolePermissions[role]?.includes('all') || 
    rolePermissions[role]?.includes(permission)
  );
}

// Check if user can manage subsidy schemes
export function canManageSubsidySchemes(session: Session | null): boolean {
  return hasAnyRole(session, [ROLES.ADMIN, ROLES.RECEPTIONIST]);
}

// Check if user can manage doctor assignments
export function canManageDoctorAssignments(session: Session | null): boolean {
  return hasAnyRole(session, [ROLES.ADMIN, ROLES.DOCTOR]);
}

// Check if user is the patient or has permission to access patient data
export function canAccessSpecificPatient(session: Session | null, patientId: string): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  // If user is a patient, they can only access their own data
  if (hasRole(session, ROLES.PATIENT)) {
    return session.user.id === patientId;
  }
  
  // Other roles with permission can access any patient data
  return canAccessPatientData(session);
}
