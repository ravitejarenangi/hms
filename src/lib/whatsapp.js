/**
 * WhatsApp Business API Integration Utility
 * This utility provides functions to interact with the WhatsApp Business API
 * for sending notifications and managing contacts.
 */

const API_BASE_URL = process.env.WHATSAPP_API_BASE_URL;
const API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Send a text message to a WhatsApp contact
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} message - Message content
 * @param {Object} contactInfo - Optional contact information
 * @returns {Promise<Object>} API response
 */
export async function sendTextMessage(phoneNumber, message, contactInfo = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/contact/send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_phone_number_id: PHONE_NUMBER_ID,
        phone_number: phoneNumber,
        message_body: message,
        contact: contactInfo,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    throw new Error(`Failed to send WhatsApp message: ${error.message}`);
  }
}

/**
 * Send a media message (document, image, video) to a WhatsApp contact
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} mediaType - Type of media (document, image, video)
 * @param {string} mediaUrl - URL to the media file
 * @param {string} caption - Optional caption for image or video
 * @param {string} fileName - Optional file name for document
 * @param {Object} contactInfo - Optional contact information
 * @returns {Promise<Object>} API response
 */
export async function sendMediaMessage(phoneNumber, mediaType, mediaUrl, caption = '', fileName = '', contactInfo = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/contact/send-media-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_phone_number_id: PHONE_NUMBER_ID,
        phone_number: phoneNumber,
        media_type: mediaType,
        media_url: mediaUrl,
        caption: caption,
        file_name: fileName,
        contact: contactInfo,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    throw new Error(`Failed to send WhatsApp media message: ${error.message}`);
  }
}

/**
 * Send a template message with dynamic content to a WhatsApp contact
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} templateName - Name of the approved template
 * @param {string} language - Template language code (e.g., 'en')
 * @param {Object} variables - Variables to replace in the template
 * @param {Object} contactInfo - Optional contact information
 * @returns {Promise<Object>} API response
 */
export async function sendTemplateMessage(phoneNumber, templateName, language = 'en', variables = {}, contactInfo = null) {
  try {
    // Prepare template variables
    const payload = {
      from_phone_number_id: PHONE_NUMBER_ID,
      phone_number: phoneNumber,
      template_name: templateName,
      template_language: language,
      contact: contactInfo,
    };

    // Add all variables to the payload
    Object.keys(variables).forEach(key => {
      payload[key] = variables[key];
    });

    const response = await fetch(`${API_BASE_URL}/contact/send-template-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    throw new Error(`Failed to send WhatsApp template message: ${error.message}`);
  }
}

/**
 * Create or update a WhatsApp contact
 * @param {string} phoneNumber - Contact's phone number
 * @param {string} firstName - Contact's first name
 * @param {string} lastName - Contact's last name
 * @param {string} email - Contact's email
 * @param {Object} customFields - Additional custom fields
 * @returns {Promise<Object>} API response
 */
export async function createContact(phoneNumber, firstName, lastName, email, customFields = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/contact/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName,
        email: email,
        country: 'india',
        language_code: 'en',
        custom_fields: customFields,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    throw new Error(`Failed to create WhatsApp contact: ${error.message}`);
  }
}

/**
 * Update an existing WhatsApp contact
 * @param {string} phoneNumber - Contact's phone number
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} API response
 */
export async function updateContact(phoneNumber, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/contact/update/${phoneNumber}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    return await response.json();
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    throw new Error(`Failed to update WhatsApp contact: ${error.message}`);
  }
}

// Notification helper functions for common use cases
export const notifications = {
  /**
   * Send appointment reminder
   * @param {string} phoneNumber - Patient's phone number
   * @param {Object} appointment - Appointment details
   * @returns {Promise<Object>} API response
   */
  sendAppointmentReminder: async (phoneNumber, appointment) => {
    return sendTemplateMessage(
      phoneNumber,
      'appointment_reminder',
      'en',
      {
        field_1: appointment.patientName,
        field_2: appointment.doctorName,
        field_3: new Date(appointment.date).toLocaleDateString(),
        field_4: appointment.time,
        button_0: 'CONFIRM',
        button_1: 'RESCHEDULE'
      }
    );
  },

  /**
   * Send prescription notification
   * @param {string} phoneNumber - Patient's phone number
   * @param {Object} prescription - Prescription details
   * @param {string} pdfUrl - URL to the prescription PDF
   * @returns {Promise<Object>} API response
   */
  sendPrescriptionNotification: async (phoneNumber, prescription, pdfUrl) => {
    return sendMediaMessage(
      phoneNumber,
      'document',
      pdfUrl,
      'Your prescription is ready',
      `Prescription_${prescription.id}.pdf`
    );
  },

  /**
   * Send lab test result notification
   * @param {string} phoneNumber - Patient's phone number
   * @param {Object} labReport - Lab report details
   * @param {string} pdfUrl - URL to the lab report PDF
   * @returns {Promise<Object>} API response
   */
  sendLabResultNotification: async (phoneNumber, labReport, pdfUrl) => {
    return sendMediaMessage(
      phoneNumber,
      'document',
      pdfUrl,
      'Your lab test results are ready',
      `LabReport_${labReport.id}.pdf`
    );
  },

  /**
   * Send payment receipt
   * @param {string} phoneNumber - Patient's phone number
   * @param {Object} payment - Payment details
   * @param {string} invoiceUrl - URL to the invoice PDF
   * @returns {Promise<Object>} API response
   */
  sendPaymentReceipt: async (phoneNumber, payment, invoiceUrl) => {
    return sendMediaMessage(
      phoneNumber,
      'document',
      invoiceUrl,
      'Your payment receipt',
      `Receipt_${payment.id}.pdf`
    );
  },

  /**
   * Send medication reminder
   * @param {string} phoneNumber - Patient's phone number
   * @param {Object} medication - Medication details
   * @returns {Promise<Object>} API response
   */
  sendMedicationReminder: async (phoneNumber, medication) => {
    return sendTemplateMessage(
      phoneNumber,
      'medication_reminder',
      'en',
      {
        field_1: medication.patientName,
        field_2: medication.medicineName,
        field_3: medication.dosage,
        field_4: medication.frequency,
        field_5: medication.instructions
      }
    );
  },

  /**
   * Send emergency alert to staff
   * @param {string} phoneNumber - Staff phone number
   * @param {Object} emergency - Emergency details
   * @returns {Promise<Object>} API response
   */
  sendEmergencyAlert: async (phoneNumber, emergency) => {
    return sendTemplateMessage(
      phoneNumber,
      'emergency_alert',
      'en',
      {
        field_1: emergency.patientName,
        field_2: emergency.location,
        field_3: emergency.condition,
        field_4: emergency.requiredAction
      }
    );
  }
};

export default {
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
  createContact,
  updateContact,
  notifications
};
