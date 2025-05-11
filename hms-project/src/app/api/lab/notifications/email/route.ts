import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Email template for test results
const getEmailTemplate = (patientName: string, testName: string, resultSummary: string) => {
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
            background-color: #4a90e2;
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Laboratory Test Results</h2>
          </div>
          <div class="content">
            <p>Dear ${patientName},</p>
            <p>Your laboratory test results are now available. Below is a summary of your test:</p>
            <p><strong>Test Name:</strong> ${testName}</p>
            <p><strong>Result Summary:</strong> ${resultSummary}</p>
            <p>Please find the detailed report attached to this email as a PDF document.</p>
            <p>For any questions or concerns regarding your results, please contact your healthcare provider.</p>
            <a href="#" class="button">View Results Online</a>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} HMS Healthcare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

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

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password'
  }
});

export async function POST(req: NextRequest) {
  try {
    const { testResultId, recipientEmail, deliveryPreferences } = await req.json();
    
    if (!testResultId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Test result ID and recipient email are required' },
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
    
    // Prepare email content
    const resultSummary = testResult.resultParameters.length > 0
      ? `${testResult.resultParameters[0].name}: ${testResult.resultParameters[0].value} ${testResult.resultParameters[0].unit}`
      : 'Results available in the attached PDF';
    
    const emailHtml = getEmailTemplate(
      testResult.test.patient.user.name,
      testResult.test.testCatalog.name,
      resultSummary
    );
    
    // Send email with PDF attachment
    const info = await transporter.sendMail({
      from: `"HMS Healthcare" <${process.env.EMAIL_FROM || 'noreply@hms.com'}>`,
      to: recipientEmail,
      subject: 'Your Laboratory Test Results',
      html: emailHtml,
      attachments: [
        {
          filename: `${testResult.test.testCatalog.name}_Report.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    });
    
    // Record notification in database
    await prisma.notification.create({
      data: {
        title: 'Test Result Email Sent',
        message: `Email with test results for ${testResult.test.testCatalog.name} sent to ${recipientEmail}`,
        type: 'INFO',
        recipientId: testResult.test.patientId,
        recipientType: 'PATIENT',
        relatedEntityId: testResultId,
        relatedEntityType: 'RESULT',
        isRead: false
      }
    });
    
    // Clean up temporary PDF file
    fs.unlinkSync(pdfPath);
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Test result email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending test result email:', error);
    return NextResponse.json(
      { error: 'Failed to send test result email' },
      { status: 500 }
    );
  }
}
