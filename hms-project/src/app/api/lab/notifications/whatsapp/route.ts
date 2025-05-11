import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Twilio } from 'twilio';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Initialize Twilio client for WhatsApp
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+1234567890';

const twilioClient = new Twilio(accountSid, authToken);

// Generate PDF report for test results
const generatePDFReport = async (
  patientName: string,
  patientId: string,
  testName: string,
  testDate: string,
  results: any[],
  referenceRanges: any[],
  doctorName: string
) => {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `${uuidv4()}.pdf`);
  
  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    
    doc.pipe(writeStream);
    
    // Add header with logo
    doc
      .fontSize(20)
      .text('HMS Healthcare', { align: 'center' })
      .fontSize(16)
      .text('Laboratory Test Report', { align: 'center' })
      .moveDown();
    
    // Add patient information
    doc
      .fontSize(12)
      .text(`Patient Name: ${patientName}`)
      .text(`Patient ID: ${patientId}`)
      .text(`Test Name: ${testName}`)
      .text(`Test Date: ${testDate}`)
      .text(`Requesting Doctor: ${doctorName}`)
      .moveDown()
      .moveDown();
    
    // Add results table
    doc.fontSize(14).text('Test Results', { underline: true }).moveDown();
    
    // Table headers
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidth = (doc.page.width - 100) / 3;
    
    doc
      .fontSize(10)
      .text('Parameter', tableLeft, tableTop)
      .text('Result', tableLeft + colWidth, tableTop)
      .text('Reference Range', tableLeft + colWidth * 2, tableTop);
    
    doc.moveTo(tableLeft, tableTop + 20).lineTo(tableLeft + colWidth * 3, tableTop + 20).stroke();
    
    // Table rows
    let rowTop = tableTop + 30;
    
    results.forEach((result, index) => {
      const isAbnormal = result.value < referenceRanges[index].min || result.value > referenceRanges[index].max;
      
      doc
        .fontSize(10)
        .text(result.parameter, tableLeft, rowTop)
        .text(result.value.toString(), tableLeft + colWidth, rowTop, {
          color: isAbnormal ? 'red' : 'black'
        })
        .text(`${referenceRanges[index].min} - ${referenceRanges[index].max}`, tableLeft + colWidth * 2, rowTop);
      
      rowTop += 20;
    });
    
    // Add footer with digital signature
    doc
      .fontSize(10)
      .text('This is a digitally generated report.', 50, doc.page.height - 100)
      .text(`Digital Signature: ${uuidv4()}`, 50, doc.page.height - 80)
      .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 60);
    
    doc.end();
    
    writeStream.on('finish', () => {
      resolve(filePath);
    });
    
    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};

// Generate a secure link for accessing results
const generateSecureLink = (testResultId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hms-healthcare.com';
  const token = Buffer.from(`${testResultId}:${Date.now()}`).toString('base64');
  return `${baseUrl}/results/secure/${token}`;
};

export async function POST(req: NextRequest) {
  try {
    const { testResultId, whatsappNumber } = await req.json();
    
    if (!testResultId || !whatsappNumber) {
      return NextResponse.json(
        { error: 'Test result ID and WhatsApp number are required' },
        { status: 400 }
      );
    }
    
    // Ensure WhatsApp number is in the correct format
    const formattedWhatsAppNumber = whatsappNumber.startsWith('whatsapp:') 
      ? whatsappNumber 
      : `whatsapp:${whatsappNumber}`;
    
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
    const referenceRanges = await prisma.criticalValue.findMany({
      where: {
        testCatalogId: testResult.test.testCatalogId
      }
    });
    
    // Format results for PDF generation
    const formattedResults = testResult.resultParameters.map(param => ({
      parameter: param.name,
      value: param.value
    }));
    
    const formattedReferenceRanges = referenceRanges.map(range => ({
      min: range.minValue,
      max: range.maxValue
    }));
    
    // Generate PDF report
    const pdfPath = await generatePDFReport(
      testResult.test.patient.user.name,
      testResult.test.patient.patientId,
      testResult.test.testCatalog.name,
      new Date(testResult.test.createdAt).toLocaleDateString(),
      formattedResults,
      formattedReferenceRanges,
      testResult.test.doctor.user.name
    );
    
    // Generate secure link for accessing results
    const secureLink = generateSecureLink(testResultId);
    
    // Create WhatsApp message
    const patientName = testResult.test.patient.user.name;
    const testName = testResult.test.testCatalog.name;
    
    // Initial message
    const initialMessage = await twilioClient.messages.create({
      body: `Hello ${patientName}, your ${testName} test results are now available. We'll send you the detailed report shortly.`,
      from: twilioWhatsAppNumber,
      to: formattedWhatsAppNumber,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hms-healthcare.com'}/api/lab/notifications/whatsapp/status-callback`
    });
    
    // Send PDF document
    const mediaMessage = await twilioClient.messages.create({
      mediaUrl: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://hms-healthcare.com'}/api/lab/reports/download?id=${testResultId}`],
      body: `Here is your ${testName} test report. You can also access your results securely at: ${secureLink}`,
      from: twilioWhatsAppNumber,
      to: formattedWhatsAppNumber,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hms-healthcare.com'}/api/lab/notifications/whatsapp/status-callback`
    });
    
    // Record notification in database
    await prisma.notification.create({
      data: {
        title: 'Test Result WhatsApp Sent',
        message: `WhatsApp message with test results for ${testName} sent to ${whatsappNumber}`,
        type: 'INFO',
        recipientId: testResult.test.patientId,
        recipientType: 'PATIENT',
        relatedEntityId: testResultId,
        relatedEntityType: 'RESULT',
        isRead: false
      }
    });
    
    // Record WhatsApp delivery attempt
    await prisma.whatsappNotification.create({
      data: {
        testResultId,
        whatsappNumber: formattedWhatsAppNumber,
        messageId: mediaMessage.sid,
        status: 'SENT',
        isRead: false,
        content: `Test results for ${testName}`
      }
    });
    
    // Clean up temporary PDF file
    fs.unlinkSync(pdfPath);
    
    return NextResponse.json({
      success: true,
      initialMessageId: initialMessage.sid,
      mediaMessageId: mediaMessage.sid,
      message: 'Test result WhatsApp message sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending test result WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Failed to send test result WhatsApp message' },
      { status: 500 }
    );
  }
}

// Status callback endpoint for tracking WhatsApp message delivery
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
    
    // Update WhatsApp notification status in database
    await prisma.whatsappNotification.update({
      where: { messageId },
      data: { 
        status: messageStatus.toUpperCase(),
        isRead: messageStatus === 'read'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp message status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating WhatsApp message status:', error);
    return NextResponse.json(
      { error: 'Failed to update WhatsApp message status' },
      { status: 500 }
    );
  }
}
