import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Twilio } from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

const twilioClient = new Twilio(accountSid, authToken);

// Generate a short URL for accessing results
const generateSecureLink = (testResultId: string) => {
  // In a real implementation, this would generate a signed URL with expiration
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hms-healthcare.com';
  const token = Buffer.from(`${testResultId}:${Date.now()}`).toString('base64');
  return `${baseUrl}/results/secure/${token}`;
};

export async function POST(req: NextRequest) {
  try {
    const { testResultId, phoneNumber } = await req.json();
    
    if (!testResultId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Test result ID and phone number are required' },
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
            }
          }
        }
      }
    });
    
    if (!testResult) {
      return NextResponse.json(
        { error: 'Test result not found' },
        { status: 404 }
      );
    }
    
    // Generate secure link for accessing results
    const secureLink = generateSecureLink(testResultId);
    
    // Create SMS message
    const patientName = testResult.test.patient.user.name;
    const testName = testResult.test.testCatalog.name;
    const message = `HMS Healthcare: Your ${testName} test results are now available. Access them securely at: ${secureLink}`;
    
    // Send SMS via Twilio
    const smsResponse = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hms-healthcare.com'}/api/lab/notifications/sms/status-callback`
    });
    
    // Record notification in database
    await prisma.notification.create({
      data: {
        title: 'Test Result SMS Sent',
        message: `SMS with test results for ${testName} sent to ${phoneNumber}`,
        type: 'INFO',
        recipientId: testResult.test.patientId,
        recipientType: 'PATIENT',
        relatedEntityId: testResultId,
        relatedEntityType: 'RESULT',
        isRead: false
      }
    });
    
    // Record SMS delivery attempt
    await prisma.smsNotification.create({
      data: {
        testResultId,
        phoneNumber,
        messageId: smsResponse.sid,
        status: 'SENT',
        content: message
      }
    });
    
    return NextResponse.json({
      success: true,
      messageId: smsResponse.sid,
      message: 'Test result SMS sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending test result SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send test result SMS' },
      { status: 500 }
    );
  }
}

// Status callback endpoint for tracking SMS delivery
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const messageId = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    // Update SMS notification status in database
    await prisma.smsNotification.update({
      where: { messageId },
      data: { status: messageStatus.toUpperCase() }
    });
    
    return NextResponse.json({
      success: true,
      message: 'SMS status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating SMS status:', error);
    return NextResponse.json(
      { error: 'Failed to update SMS status' },
      { status: 500 }
    );
  }
}
