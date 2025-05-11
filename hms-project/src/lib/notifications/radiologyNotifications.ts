import { v4 as uuidv4 } from 'uuid';

/**
 * Utility functions for sending radiology notifications
 * These functions are used to trigger real-time notifications for radiology events
 */

// Notification types
export type RadiologyNotificationType = 
  | 'REPORT_READY' 
  | 'IMAGE_UPLOADED' 
  | 'REQUEST_STATUS_CHANGE' 
  | 'CRITICAL_RESULT';

// Notification priority levels
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

// Notification metadata
export interface NotificationMetadata {
  requestId?: string;
  reportId?: string;
  studyId?: string;
  patientId?: string;
  patientName?: string;
}

// Notification message structure
export interface RadiologyNotification {
  id: string;
  type: RadiologyNotificationType;
  title: string;
  message: string;
  timestamp: string;
  priority: NotificationPriority;
  metadata: NotificationMetadata;
}

/**
 * Sends a notification for a new radiology report
 */
export async function notifyReportReady(
  userId: string,
  reportId: string,
  patientName: string,
  reportType: string
): Promise<void> {
  const notification: RadiologyNotification = {
    id: uuidv4(),
    type: 'REPORT_READY',
    title: 'Radiology Report Ready',
    message: `The ${reportType} report for patient ${patientName} is now available for review.`,
    timestamp: new Date().toISOString(),
    priority: 'medium',
    metadata: {
      reportId,
      patientName
    }
  };
  
  await sendNotification(userId, notification);
}

/**
 * Sends a notification for a newly uploaded image
 */
export async function notifyImageUploaded(
  userId: string,
  studyId: string,
  patientName: string,
  modalityType: string
): Promise<void> {
  const notification: RadiologyNotification = {
    id: uuidv4(),
    type: 'IMAGE_UPLOADED',
    title: 'New Radiology Images Available',
    message: `New ${modalityType} images for patient ${patientName} have been uploaded.`,
    timestamp: new Date().toISOString(),
    priority: 'low',
    metadata: {
      studyId,
      patientName
    }
  };
  
  await sendNotification(userId, notification);
}

/**
 * Sends a notification for a change in request status
 */
export async function notifyRequestStatusChange(
  userId: string,
  requestId: string,
  patientName: string,
  newStatus: string,
  priority: NotificationPriority = 'low'
): Promise<void> {
  const notification: RadiologyNotification = {
    id: uuidv4(),
    type: 'REQUEST_STATUS_CHANGE',
    title: 'Radiology Request Status Updated',
    message: `The radiology request for patient ${patientName} has been updated to "${newStatus}".`,
    timestamp: new Date().toISOString(),
    priority,
    metadata: {
      requestId,
      patientName
    }
  };
  
  await sendNotification(userId, notification);
}

/**
 * Sends a notification for a critical result that requires immediate attention
 */
export async function notifyCriticalResult(
  userId: string,
  reportId: string,
  patientName: string,
  finding: string
): Promise<void> {
  const notification: RadiologyNotification = {
    id: uuidv4(),
    type: 'CRITICAL_RESULT',
    title: 'CRITICAL FINDING - Immediate Attention Required',
    message: `Critical finding for patient ${patientName}: ${finding}. Please review immediately.`,
    timestamp: new Date().toISOString(),
    priority: 'critical',
    metadata: {
      reportId,
      patientName
    }
  };
  
  await sendNotification(userId, notification);
}

/**
 * Helper function to send a notification via the API
 */
async function sendNotification(userId: string, notification: RadiologyNotification): Promise<void> {
  try {
    // Send the notification to the API endpoint
    const response = await fetch('/api/radiology/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...notification
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
