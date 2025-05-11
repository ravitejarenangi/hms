import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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

// Priority levels for abnormal results
enum PriorityLevel {
  LOW = 'LOW',       // Slightly abnormal, no immediate action needed
  MEDIUM = 'MEDIUM', // Moderately abnormal, review within 24 hours
  HIGH = 'HIGH'      // Significantly abnormal but not critical, review soon
}

// Function to determine priority level based on how far a value is from the reference range
const determinePriorityLevel = (value: number, minValue: number, maxValue: number): PriorityLevel => {
  // Calculate how far outside the range the value is (as a percentage)
  const rangeSize = maxValue - minValue;
  let percentOutsideRange = 0;
  
  if (value < minValue) {
    percentOutsideRange = ((minValue - value) / rangeSize) * 100;
  } else if (value > maxValue) {
    percentOutsideRange = ((value - maxValue) / rangeSize) * 100;
  }
  
  // Determine priority based on percentage outside range
  if (percentOutsideRange < 10) {
    return PriorityLevel.LOW;
  } else if (percentOutsideRange < 30) {
    return PriorityLevel.MEDIUM;
  } else {
    return PriorityLevel.HIGH;
  }
};

// Email template for abnormal result notifications
const getAbnormalResultEmailTemplate = (
  doctorName: string,
  patientName: string,
  patientId: string,
  testName: string,
  abnormalParameters: any[],
  priority: PriorityLevel
) => {
  const priorityText = priority === PriorityLevel.LOW 
    ? 'Low Priority' 
    : priority === PriorityLevel.MEDIUM 
      ? 'Medium Priority' 
      : 'High Priority';
  
  const priorityColor = priority === PriorityLevel.LOW 
    ? '#4caf50' 
    : priority === PriorityLevel.MEDIUM 
      ? '#ff9800' 
      : '#f44336';
  
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
            background-color: ${priorityColor};
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
          .abnormal {
            color: ${priorityColor};
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${priorityText}: Abnormal Test Results</h2>
          </div>
          <div class="content">
            <p>Dear Dr. ${doctorName},</p>
            <p>This is a notification about abnormal test results for your patient:</p>
            <p><strong>Patient:</strong> ${patientName} (ID: ${patientId})</p>
            <p><strong>Test:</strong> ${testName}</p>
            <p><strong>Abnormal Values:</strong></p>
            <table>
              <tr>
                <th>Parameter</th>
                <th>Result</th>
                <th>Reference Range</th>
                <th>Deviation</th>
              </tr>
              ${abnormalParameters.map(param => {
                const deviation = param.value < param.minValue 
                  ? `${((param.minValue - param.value) / param.minValue * 100).toFixed(1)}% below min` 
                  : `${((param.value - param.maxValue) / param.maxValue * 100).toFixed(1)}% above max`;
                
                return `
                  <tr>
                    <td>${param.name}</td>
                    <td class="abnormal">${param.value} ${param.unit}</td>
                    <td>${param.minValue} - ${param.maxValue} ${param.unit}</td>
                    <td>${deviation}</td>
                  </tr>
                `;
              }).join('')}
            </table>
            <p><strong>Recommended Action:</strong> Please review these results${priority === PriorityLevel.HIGH ? ' as soon as possible' : priority === PriorityLevel.MEDIUM ? ' within 24 hours' : ' at your convenience'}.</p>
            <a href="#" class="button">Acknowledge Receipt</a>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} HMS Healthcare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Main route handler for abnormal result notifications
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
                user: true
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
    
    // Get reference ranges for the test parameters
    const referenceRanges = await prisma.referenceRange.findMany({
      where: {
        testCatalogId: testResult.test.testCatalogId
      }
    });
    
    // Check for critical values first (these should be handled by the critical alert system)
    const criticalValues = await prisma.criticalValue.findMany({
      where: {
        testCatalogId: testResult.test.testCatalogId
      }
    });
    
    // Check if any result parameters have abnormal (but not critical) values
    const abnormalParameters = [];
    let highestPriority = PriorityLevel.LOW;
    
    for (const param of testResult.resultParameters) {
      // Find reference range for this parameter
      const referenceRange = referenceRanges.find(rr => rr.parameterName === param.name);
      
      if (!referenceRange) {
        continue; // Skip if no reference range is defined
      }
      
      // Skip if the value is within the reference range
      if (param.value >= referenceRange.minValue && param.value <= referenceRange.maxValue) {
        continue;
      }
      
      // Check if this is a critical value (should be handled by critical alert system)
      const criticalValue = criticalValues.find(cv => cv.parameterName === param.name);
      if (criticalValue && (param.value < criticalValue.minValue || param.value > criticalValue.maxValue)) {
        continue; // Skip critical values
      }
      
      // Determine priority level for this abnormal value
      const priority = determinePriorityLevel(param.value, referenceRange.minValue, referenceRange.maxValue);
      
      // Update highest priority if needed
      if (priority === PriorityLevel.HIGH || 
         (priority === PriorityLevel.MEDIUM && highestPriority === PriorityLevel.LOW)) {
        highestPriority = priority;
      }
      
      // Add to abnormal parameters list
      abnormalParameters.push({
        name: param.name,
        value: param.value,
        unit: param.unit,
        minValue: referenceRange.minValue,
        maxValue: referenceRange.maxValue,
        priority
      });
    }
    
    if (abnormalParameters.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No abnormal (non-critical) values found in test results'
      });
    }
    
    // Create abnormal result notification in database
    const notification = await prisma.abnormalResultNotification.create({
      data: {
        testResultId,
        doctorId: testResult.test.doctorId,
        patientId: testResult.test.patientId,
        parameters: JSON.stringify(abnormalParameters),
        priority: highestPriority,
        status: 'PENDING',
        followUpDate: new Date(Date.now() + (
          highestPriority === PriorityLevel.HIGH 
            ? 24 * 60 * 60 * 1000 // 24 hours for high priority
            : highestPriority === PriorityLevel.MEDIUM 
              ? 48 * 60 * 60 * 1000 // 48 hours for medium priority
              : 72 * 60 * 60 * 1000 // 72 hours for low priority
        ))
      }
    });
    
    // Send email notification to doctor
    const doctorEmail = testResult.test.doctor.user.email;
    if (doctorEmail) {
      const emailHtml = getAbnormalResultEmailTemplate(
        testResult.test.doctor.user.name,
        testResult.test.patient.user.name,
        testResult.test.patient.patientId,
        testResult.test.testCatalog.name,
        abnormalParameters,
        highestPriority
      );
      
      await transporter.sendMail({
        from: `"HMS Healthcare Lab Results" <${process.env.EMAIL_FROM || 'results@hms.com'}>`,
        to: doctorEmail,
        subject: `${highestPriority} Priority: Abnormal Test Results for Patient ${testResult.test.patient.user.name}`,
        html: emailHtml
      });
    }
    
    // Record notification in the general notifications system
    await prisma.notification.create({
      data: {
        title: `${highestPriority} Priority: Abnormal Test Results`,
        message: `Abnormal values detected in ${testResult.test.testCatalog.name} for patient ${testResult.test.patient.user.name}`,
        type: highestPriority === PriorityLevel.HIGH ? 'WARNING' : 'INFO',
        recipientId: testResult.test.doctorId,
        recipientType: 'DOCTOR',
        relatedEntityId: testResultId,
        relatedEntityType: 'RESULT',
        isRead: false
      }
    });
    
    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      priority: highestPriority,
      abnormalParameters: abnormalParameters.length,
      message: 'Abnormal result notification created and sent successfully'
    });
    
  } catch (error) {
    console.error('Error creating abnormal result notification:', error);
    return NextResponse.json(
      { error: 'Failed to create abnormal result notification' },
      { status: 500 }
    );
  }
}

// Route handler for acknowledging abnormal result notifications
export async function PUT(req: NextRequest) {
  try {
    const { notificationId, acknowledgedBy, followUpNotes } = await req.json();
    
    if (!notificationId || !acknowledgedBy) {
      return NextResponse.json(
        { error: 'Notification ID and acknowledger ID are required' },
        { status: 400 }
      );
    }
    
    // Update notification status in database
    await prisma.abnormalResultNotification.update({
      where: { id: notificationId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy,
        acknowledgedAt: new Date(),
        followUpNotes: followUpNotes || null
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Abnormal result notification acknowledged successfully'
    });
    
  } catch (error) {
    console.error('Error acknowledging abnormal result notification:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge abnormal result notification' },
      { status: 500 }
    );
  }
}

// Background job to check for unacknowledged notifications and send follow-up reminders
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
    
    // Find unacknowledged notifications that need follow-up
    const notificationsToFollowUp = await prisma.abnormalResultNotification.findMany({
      where: {
        status: 'PENDING',
        followUpDate: {
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
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    const followUpResults = [];
    
    for (const notification of notificationsToFollowUp) {
      // Parse abnormal parameters
      const abnormalParameters = JSON.parse(notification.parameters);
      
      // Send follow-up email to doctor
      const doctorEmail = notification.testResult.test.doctor.user.email;
      if (doctorEmail) {
        const emailHtml = getAbnormalResultEmailTemplate(
          notification.testResult.test.doctor.user.name,
          notification.testResult.test.patient.user.name,
          notification.testResult.test.patient.patientId,
          notification.testResult.test.testCatalog.name,
          abnormalParameters,
          notification.priority as PriorityLevel
        );
        
        await transporter.sendMail({
          from: `"HMS Healthcare Lab Results" <${process.env.EMAIL_FROM || 'results@hms.com'}>`,
          to: doctorEmail,
          subject: `REMINDER: ${notification.priority} Priority Abnormal Test Results for Patient ${notification.testResult.test.patient.user.name}`,
          html: emailHtml
        });
      }
      
      // Record follow-up in database
      await prisma.notification.create({
        data: {
          title: `REMINDER: ${notification.priority} Priority Abnormal Test Results`,
          message: `Reminder: Unacknowledged abnormal values in ${notification.testResult.test.testCatalog.name} for patient ${notification.testResult.test.patient.user.name}`,
          type: 'WARNING',
          recipientId: notification.testResult.test.doctorId,
          recipientType: 'DOCTOR',
          relatedEntityId: notification.testResultId,
          relatedEntityType: 'RESULT',
          isRead: false
        }
      });
      
      // Update follow-up date for next reminder (24 hours later)
      await prisma.abnormalResultNotification.update({
        where: { id: notification.id },
        data: {
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
      
      followUpResults.push({
        notificationId: notification.id,
        doctorName: notification.testResult.test.doctor.user.name,
        patientName: notification.testResult.test.patient.user.name,
        testName: notification.testResult.test.testCatalog.name,
        priority: notification.priority
      });
    }
    
    return NextResponse.json({
      success: true,
      followedUpNotifications: followUpResults.length,
      details: followUpResults
    });
    
  } catch (error) {
    console.error('Error processing notification follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to process notification follow-ups' },
      { status: 500 }
    );
  }
}
