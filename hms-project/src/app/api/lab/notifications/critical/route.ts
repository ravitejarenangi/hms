import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password'
  }
});

// Initialize Twilio client for SMS
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

const twilioClient = new Twilio(accountSid, authToken);

// Critical alert levels
enum AlertLevel {
  LEVEL1 = 'LEVEL1', // Initial notification
  LEVEL2 = 'LEVEL2', // Escalation after no response
  LEVEL3 = 'LEVEL3'  // Final escalation to department head
}

// Function to check if a result value is critical
const isCriticalValue = (value: number, criticalValue: any) => {
  return value < criticalValue.minValue || value > criticalValue.maxValue;
};

// Email template for critical alerts
const getCriticalAlertEmailTemplate = (
  doctorName: string,
  patientName: string,
  patientId: string,
  testName: string,
  criticalParameters: any[],
  alertLevel: AlertLevel
) => {
  const urgencyText = alertLevel === AlertLevel.LEVEL1 
    ? 'Urgent' 
    : alertLevel === AlertLevel.LEVEL2 
      ? 'Very Urgent' 
      : 'EXTREMELY URGENT';
  
  const backgroundColor = alertLevel === AlertLevel.LEVEL1 
    ? '#ff9800' 
    : alertLevel === AlertLevel.LEVEL2 
      ? '#f44336' 
      : '#b71c1c';
  
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .header {
            background-color: ${backgroundColor};
            color: white;
            padding: 10px 20px;
            border-radius: 5px 5px 0 0;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 10px 20px;
            border-radius: 0 0 5px 5px;
            font-size: 12px;
            text-align: center;
          }
          .button {
            display: inline-block;
            background-color: #4a90e2;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
          }
          .critical {
            color: red;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${urgencyText}: Critical Value Alert</h2>
          </div>
          <div class="content">
            <p>Dear Dr. ${doctorName},</p>
            <p>This is a <strong>${urgencyText}</strong> notification about critical test values for your patient:</p>
            <p><strong>Patient:</strong> ${patientName} (ID: ${patientId})</p>
            <p><strong>Test:</strong> ${testName}</p>
            <p><strong>Critical Values:</strong></p>
            <table>
              <tr>
                <th>Parameter</th>
                <th>Result</th>
                <th>Reference Range</th>
              </tr>
              ${criticalParameters.map(param => `
                <tr>
                  <td>${param.name}</td>
                  <td class="critical">${param.value} ${param.unit}</td>
                  <td>${param.minValue} - ${param.maxValue} ${param.unit}</td>
                </tr>
              `).join('')}
            </table>
            <p><strong>Action Required:</strong> Please acknowledge this alert and take appropriate clinical action.</p>
            <a href="#" class="button">Acknowledge Alert</a>
          </div>
          <div class="footer">
            <p>This is an automated critical value alert. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} HMS Healthcare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Function to send critical alert via email
const sendCriticalAlertEmail = async (
  recipientEmail: string,
  doctorName: string,
  patientName: string,
  patientId: string,
  testName: string,
  criticalParameters: any[],
  alertLevel: AlertLevel
) => {
  const urgencyText = alertLevel === AlertLevel.LEVEL1 
    ? 'Urgent' 
    : alertLevel === AlertLevel.LEVEL2 
      ? 'Very Urgent' 
      : 'EXTREMELY URGENT';
  
  const emailHtml = getCriticalAlertEmailTemplate(
    doctorName,
    patientName,
    patientId,
    testName,
    criticalParameters,
    alertLevel
  );
  
  return transporter.sendMail({
    from: `"HMS Healthcare Critical Alerts" <${process.env.EMAIL_FROM || 'alerts@hms.com'}>`,
    to: recipientEmail,
    subject: `${urgencyText}: Critical Value Alert for Patient ${patientName}`,
    html: emailHtml
  });
};

// Function to send critical alert via SMS
const sendCriticalAlertSMS = async (
  phoneNumber: string,
  doctorName: string,
  patientName: string,
  testName: string,
  criticalParameters: any[],
  alertLevel: AlertLevel
) => {
  const urgencyText = alertLevel === AlertLevel.LEVEL1 
    ? 'URGENT' 
    : alertLevel === AlertLevel.LEVEL2 
      ? 'VERY URGENT' 
      : 'EXTREMELY URGENT';
  
  const criticalValuesText = criticalParameters
    .map(param => `${param.name}: ${param.value} ${param.unit} (ref: ${param.minValue}-${param.maxValue})`)
    .join(', ');
  
  const message = `${urgencyText}: HMS Healthcare Critical Alert for Dr. ${doctorName}. Patient ${patientName} has critical values for ${testName}: ${criticalValuesText}. Please respond immediately.`;
  
  return twilioClient.messages.create({
    body: message,
    from: twilioPhoneNumber,
    to: phoneNumber,
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hms-healthcare.com'}/api/lab/notifications/critical/status-callback`
  });
};

// Function to create a critical alert in the database
const createCriticalAlert = async (
  testResultId: string,
  doctorId: string,
  patientId: string,
  criticalParameters: any[],
  alertLevel: AlertLevel
) => {
  return prisma.criticalAlert.create({
    data: {
      testResultId,
      doctorId,
      patientId,
      parameters: JSON.stringify(criticalParameters),
      level: alertLevel,
      status: 'PENDING',
      escalationTime: alertLevel !== AlertLevel.LEVEL1 
        ? new Date() 
        : new Date(Date.now() + 30 * 60 * 1000) // 30 minutes for level 1
    }
  });
};

// Function to get the escalation contact for a department
const getEscalationContact = async (departmentId: string, level: AlertLevel) => {
  if (level === AlertLevel.LEVEL2) {
    // Get department supervisor
    return prisma.staff.findFirst({
      where: {
        departmentId,
        role: 'SUPERVISOR'
      },
      include: {
        user: true
      }
    });
  } else if (level === AlertLevel.LEVEL3) {
    // Get department head
    return prisma.staff.findFirst({
      where: {
        departmentId,
        role: 'HEAD'
      },
      include: {
        user: true
      }
    });
  }
  
  return null;
};

// Main route handler for creating critical alerts
export async function POST(req: NextRequest) {
  try {
    const { testResultId } = await req.json();
    
    if (!testResultId) {
      return NextResponse.json(
        { error: 'Test result ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch test result with related data
    const testResult = await prisma.testResult.findUnique({
      where: { id: testResultId },
      include: {
        test: {
          include: {
            testCatalog: true,
            patient: {
              include: {
                user: true
              }
            },
            doctor: {
              include: {
                user: true,
                department: true
              }
            }
          }
        },
        resultParameters: true
      }
    });
    
    if (!testResult) {
      return NextResponse.json(
        { error: 'Test result not found' },
        { status: 404 }
      );
    }
    
    // Get critical values for the test parameters
    const criticalValues = await prisma.criticalValue.findMany({
      where: {
        testCatalogId: testResult.test.testCatalogId
      }
    });
    
    // Check if any result parameters have critical values
    const criticalParameters = [];
    
    for (const param of testResult.resultParameters) {
      const criticalValue = criticalValues.find(cv => cv.parameterName === param.name);
      
      if (criticalValue && isCriticalValue(param.value, criticalValue)) {
        criticalParameters.push({
          name: param.name,
          value: param.value,
          unit: param.unit,
          minValue: criticalValue.minValue,
          maxValue: criticalValue.maxValue
        });
      }
    }
    
    if (criticalParameters.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No critical values found in test results'
      });
    }
    
    // Create critical alert in database
    const alert = await createCriticalAlert(
      testResultId,
      testResult.test.doctorId,
      testResult.test.patientId,
      criticalParameters,
      AlertLevel.LEVEL1
    );
    
    // Send email alert to doctor
    const doctorEmail = testResult.test.doctor.user.email;
    if (doctorEmail) {
      await sendCriticalAlertEmail(
        doctorEmail,
        testResult.test.doctor.user.name,
        testResult.test.patient.user.name,
        testResult.test.patient.patientId,
        testResult.test.testCatalog.name,
        criticalParameters,
        AlertLevel.LEVEL1
      );
    }
    
    // Send SMS alert to doctor if phone number is available
    const doctorPhone = testResult.test.doctor.user.phone;
    if (doctorPhone) {
      await sendCriticalAlertSMS(
        doctorPhone,
        testResult.test.doctor.user.name,
        testResult.test.patient.user.name,
        testResult.test.testCatalog.name,
        criticalParameters,
        AlertLevel.LEVEL1
      );
    }
    
    // Record notification in database
    await prisma.notification.create({
      data: {
        title: 'Critical Value Alert',
        message: `Critical values detected in ${testResult.test.testCatalog.name} for patient ${testResult.test.patient.user.name}`,
        type: 'ERROR',
        recipientId: testResult.test.doctorId,
        recipientType: 'DOCTOR',
        relatedEntityId: testResultId,
        relatedEntityType: 'RESULT',
        isRead: false
      }
    });
    
    return NextResponse.json({
      success: true,
      alertId: alert.id,
      message: 'Critical alert created and notifications sent successfully'
    });
    
  } catch (error) {
    console.error('Error creating critical alert:', error);
    return NextResponse.json(
      { error: 'Failed to create critical alert' },
      { status: 500 }
    );
  }
}

// Route handler for acknowledging critical alerts
export async function PUT(req: NextRequest) {
  try {
    const { alertId, acknowledgedBy } = await req.json();
    
    if (!alertId || !acknowledgedBy) {
      return NextResponse.json(
        { error: 'Alert ID and acknowledger ID are required' },
        { status: 400 }
      );
    }
    
    // Update alert status in database
    await prisma.criticalAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy,
        acknowledgedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Critical alert acknowledged successfully'
    });
    
  } catch (error) {
    console.error('Error acknowledging critical alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge critical alert' },
      { status: 500 }
    );
  }
}

// Background job to check for unacknowledged alerts and escalate them
export async function GET(req: NextRequest) {
  try {
    // Only allow this endpoint to be called by internal systems
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find unacknowledged alerts that need escalation
    const alertsToEscalate = await prisma.criticalAlert.findMany({
      where: {
        status: 'PENDING',
        escalationTime: {
          lte: new Date()
        }
      },
      include: {
        testResult: {
          include: {
            test: {
              include: {
                testCatalog: true,
                patient: {
                  include: {
                    user: true
                  }
                },
                doctor: {
                  include: {
                    user: true,
                    department: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    const escalationResults = [];
    
    for (const alert of alertsToEscalate) {
      // Determine next escalation level
      const nextLevel = alert.level === AlertLevel.LEVEL1 
        ? AlertLevel.LEVEL2 
        : AlertLevel.LEVEL3;
      
      // Get escalation contact
      const escalationContact = await getEscalationContact(
        alert.testResult.test.doctor.departmentId,
        nextLevel
      );
      
      if (!escalationContact) {
        continue;
      }
      
      // Parse critical parameters
      const criticalParameters = JSON.parse(alert.parameters);
      
      // Create new escalated alert
      const escalatedAlert = await createCriticalAlert(
        alert.testResultId,
        alert.doctorId,
        alert.patientId,
        criticalParameters,
        nextLevel
      );
      
      // Send email alert to escalation contact
      if (escalationContact.user.email) {
        await sendCriticalAlertEmail(
          escalationContact.user.email,
          escalationContact.user.name,
          alert.testResult.test.patient.user.name,
          alert.testResult.test.patient.patientId,
          alert.testResult.test.testCatalog.name,
          criticalParameters,
          nextLevel
        );
      }
      
      // Send SMS alert to escalation contact if phone number is available
      if (escalationContact.user.phone) {
        await sendCriticalAlertSMS(
          escalationContact.user.phone,
          escalationContact.user.name,
          alert.testResult.test.patient.user.name,
          alert.testResult.test.testCatalog.name,
          criticalParameters,
          nextLevel
        );
      }
      
      // Record notification in database
      await prisma.notification.create({
        data: {
          title: `Escalated Critical Value Alert (Level ${nextLevel})`,
          message: `Escalated critical values for ${alert.testResult.test.testCatalog.name}, patient ${alert.testResult.test.patient.user.name}`,
          type: 'ERROR',
          recipientId: escalationContact.id,
          recipientType: 'STAFF',
          relatedEntityId: alert.testResultId,
          relatedEntityType: 'RESULT',
          isRead: false
        }
      });
      
      // Update original alert to indicate escalation
      await prisma.criticalAlert.update({
        where: { id: alert.id },
        data: {
          status: 'ESCALATED',
          escalatedTo: escalationContact.id,
          escalatedAt: new Date()
        }
      });
      
      escalationResults.push({
        originalAlertId: alert.id,
        escalatedAlertId: escalatedAlert.id,
        escalatedTo: escalationContact.user.name,
        level: nextLevel
      });
    }
    
    return NextResponse.json({
      success: true,
      escalatedAlerts: escalationResults.length,
      details: escalationResults
    });
    
  } catch (error) {
    console.error('Error processing alert escalations:', error);
    return NextResponse.json(
      { error: 'Failed to process alert escalations' },
      { status: 500 }
    );
  }
}
