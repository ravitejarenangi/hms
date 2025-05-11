import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Base directory for storing report PDFs
const REPORTS_BASE_DIR = process.env.REPORTS_STORAGE_PATH || './public/report-storage/radiology';

/**
 * GET handler for fetching radiology reports
 * @param req - The request object
 * @returns A response with the requested radiology report
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Parse query parameters
    const id = url.searchParams.get('id');
    const studyId = url.searchParams.get('studyId');
    const requestId = url.searchParams.get('requestId');
    const generatePdf = url.searchParams.get('generatePdf') === 'true';
    
    let report;
    
    if (id) {
      // Fetch report by ID
      report = await prisma.radiologyReport.findUnique({
        where: { id },
        include: {
          study: {
            include: {
              request: {
                include: {
                  serviceCatalog: true
                }
              }
            }
          }
        }
      });
    } else if (studyId) {
      // Fetch report by study ID
      report = await prisma.radiologyReport.findUnique({
        where: { studyId },
        include: {
          study: {
            include: {
              request: {
                include: {
                  serviceCatalog: true
                }
              }
            }
          }
        }
      });
    } else if (requestId) {
      // Fetch report by request ID
      const study = await prisma.radiologyStudy.findUnique({
        where: { requestId }
      });
      
      if (study) {
        report = await prisma.radiologyReport.findUnique({
          where: { studyId: study.id },
          include: {
            study: {
              include: {
                request: {
                  include: {
                    serviceCatalog: true
                  }
                }
              }
            }
          }
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Report ID, Study ID, or Request ID is required' },
        { status: 400 }
      );
    }
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // If PDF generation is requested
    if (generatePdf) {
      // Get patient information
      const patient = await prisma.patient.findUnique({
        where: { id: report.study.request.patientId },
        include: {
          user: true
        }
      });
      
      // Get doctor information
      const doctor = await prisma.doctor.findUnique({
        where: { id: report.study.request.doctorId },
        include: {
          user: true
        }
      });
      
      // Get radiologist information
      const radiologist = await prisma.doctor.findUnique({
        where: { id: report.radiologistId },
        include: {
          user: true
        }
      });
      
      if (!patient || !doctor || !radiologist) {
        return NextResponse.json(
          { error: 'Failed to retrieve all required information for PDF generation' },
          { status: 500 }
        );
      }
      
      // Generate PDF
      const pdfPath = await generateReportPdf(
        report,
        patient,
        doctor,
        radiologist,
        report.study.request.serviceCatalog
      );
      
      // Return the PDF file path
      return NextResponse.json({
        report,
        pdfPath: pdfPath.replace(REPORTS_BASE_DIR, '/report-storage/radiology')
      });
    }
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Error fetching radiology report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch radiology report' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new radiology report
 * @param req - The request object
 * @returns A response with the created radiology report
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['studyId', 'findings', 'impression', 'radiologistId'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check if study exists
    const study = await prisma.radiologyStudy.findUnique({
      where: { id: data.studyId },
      include: {
        request: true,
        report: true
      }
    });
    
    if (!study) {
      return NextResponse.json(
        { error: `Study with ID ${data.studyId} not found` },
        { status: 404 }
      );
    }
    
    // Check if report already exists for this study
    if (study.report) {
      return NextResponse.json(
        { error: `Report already exists for study ${data.studyId}` },
        { status: 409 }
      );
    }
    
    // Check if radiologist exists
    const radiologist = await prisma.doctor.findUnique({
      where: { id: data.radiologistId }
    });
    
    if (!radiologist) {
      return NextResponse.json(
        { error: `Radiologist with ID ${data.radiologistId} not found` },
        { status: 404 }
      );
    }
    
    // Create new report
    const newReport = await prisma.radiologyReport.create({
      data: {
        studyId: data.studyId,
        findings: data.findings,
        impression: data.impression,
        recommendation: data.recommendation,
        diagnosisCode: data.diagnosisCode,
        radiologistId: data.radiologistId,
        reportStatus: data.reportStatus || 'DRAFT',
        templateUsed: data.templateUsed,
        keyImages: data.keyImages || [],
        criticalResult: data.criticalResult || false,
        criticalResultCommunicatedTo: data.criticalResultCommunicatedTo,
        criticalResultCommunicatedAt: data.criticalResultCommunicatedAt ? new Date(data.criticalResultCommunicatedAt) : null,
        signatureImage: data.signatureImage
      }
    });
    
    // Update study and request status
    await prisma.radiologyStudy.update({
      where: { id: data.studyId },
      data: { status: 'REPORTED' }
    });
    
    await prisma.radiologyRequest.update({
      where: { id: study.requestId },
      data: { status: 'REPORTED' }
    });
    
    return NextResponse.json(newReport, { status: 201 });
    
  } catch (error) {
    console.error('Error creating radiology report:', error);
    return NextResponse.json(
      { error: 'Failed to create radiology report' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating an existing radiology report
 * @param req - The request object
 * @returns A response with the updated radiology report
 */
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }
    
    // Check if report exists
    const existingReport = await prisma.radiologyReport.findUnique({
      where: { id: data.id },
      include: {
        study: true
      }
    });
    
    if (!existingReport) {
      return NextResponse.json(
        { error: `Report with ID ${data.id} not found` },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Only allow updating specific fields
    if (data.findings !== undefined) updateData.findings = data.findings;
    if (data.impression !== undefined) updateData.impression = data.impression;
    if (data.recommendation !== undefined) updateData.recommendation = data.recommendation;
    if (data.diagnosisCode !== undefined) updateData.diagnosisCode = data.diagnosisCode;
    if (data.reportStatus) updateData.reportStatus = data.reportStatus;
    if (data.keyImages) updateData.keyImages = data.keyImages;
    if (data.criticalResult !== undefined) updateData.criticalResult = data.criticalResult;
    if (data.criticalResultCommunicatedTo !== undefined) updateData.criticalResultCommunicatedTo = data.criticalResultCommunicatedTo;
    if (data.criticalResultCommunicatedAt) updateData.criticalResultCommunicatedAt = new Date(data.criticalResultCommunicatedAt);
    if (data.signatureImage !== undefined) updateData.signatureImage = data.signatureImage;
    
    // Handle verification
    if (data.reportStatus === 'FINAL' && data.verifiedBy) {
      updateData.verifiedBy = data.verifiedBy;
      updateData.verifiedAt = new Date();
      
      // Update study and request status
      await prisma.radiologyStudy.update({
        where: { id: existingReport.studyId },
        data: { status: 'VERIFIED' }
      });
      
      await prisma.radiologyRequest.update({
        where: { id: existingReport.study.requestId },
        data: { status: 'VERIFIED' }
      });
    }
    
    // Update report
    const updatedReport = await prisma.radiologyReport.update({
      where: { id: data.id },
      data: updateData
    });
    
    return NextResponse.json(updatedReport);
    
  } catch (error) {
    console.error('Error updating radiology report:', error);
    return NextResponse.json(
      { error: 'Failed to update radiology report' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate a PDF report
 * @param report - The radiology report data
 * @param patient - The patient data
 * @param doctor - The requesting doctor data
 * @param radiologist - The radiologist data
 * @param service - The radiology service data
 * @returns The path to the generated PDF file
 */
async function generateReportPdf(
  report: any,
  patient: any,
  doctor: any,
  radiologist: any,
  service: any
): Promise<string> {
  // Create directory if it doesn't exist
  if (!fs.existsSync(REPORTS_BASE_DIR)) {
    fs.mkdirSync(REPORTS_BASE_DIR, { recursive: true });
  }
  
  // Generate unique filename
  const filename = `report_${report.id}_${Date.now()}.pdf`;
  const filePath = path.join(REPORTS_BASE_DIR, filename);
  
  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    
    doc.pipe(writeStream);
    
    // Add header with logo
    doc
      .fontSize(20)
      .text('HMS Healthcare', { align: 'center' })
      .fontSize(16)
      .text('Radiology Report', { align: 'center' })
      .moveDown();
    
    // Add report information
    doc
      .fontSize(12)
      .text(`Report Date: ${new Date(report.reportedAt).toLocaleDateString()}`)
      .text(`Accession Number: ${report.study.accessionNumber}`)
      .text(`Study Date: ${new Date(report.study.studyDate).toLocaleDateString()}`)
      .moveDown();
    
    // Add patient information
    doc
      .fontSize(14)
      .text('Patient Information', { underline: true })
      .fontSize(12)
      .text(`Name: ${patient.user.name}`)
      .text(`Patient ID: ${patient.patientId}`)
      .text(`DOB: ${patient.user.dateOfBirth ? new Date(patient.user.dateOfBirth).toLocaleDateString() : 'N/A'}`)
      .moveDown();
    
    // Add examination information
    doc
      .fontSize(14)
      .text('Examination', { underline: true })
      .fontSize(12)
      .text(`Procedure: ${service.name}`)
      .text(`Modality: ${service.modalityType}`)
      .text(`Body Part: ${service.bodyPart}`)
      .text(`Referring Physician: ${doctor.user.name}`)
      .moveDown();
    
    // Add clinical information
    if (report.study.request.clinicalInfo) {
      doc
        .fontSize(14)
        .text('Clinical Information', { underline: true })
        .fontSize(12)
        .text(report.study.request.clinicalInfo)
        .moveDown();
    }
    
    // Add findings
    doc
      .fontSize(14)
      .text('Findings', { underline: true })
      .fontSize(12)
      .text(report.findings)
      .moveDown();
    
    // Add impression
    doc
      .fontSize(14)
      .text('Impression', { underline: true })
      .fontSize(12)
      .text(report.impression)
      .moveDown();
    
    // Add recommendation if available
    if (report.recommendation) {
      doc
        .fontSize(14)
        .text('Recommendation', { underline: true })
        .fontSize(12)
        .text(report.recommendation)
        .moveDown();
    }
    
    // Add radiologist information and signature
    doc
      .fontSize(14)
      .text('Radiologist', { underline: true })
      .fontSize(12)
      .text(`${radiologist.user.name}, ${radiologist.qualification}`)
      .moveDown();
    
    // Add signature image if available
    if (report.signatureImage) {
      try {
        doc.image(report.signatureImage, {
          width: 200,
          align: 'left'
        });
      } catch (err) {
        console.error('Error adding signature image:', err);
      }
    }
    
    // Add footer
    doc
      .fontSize(10)
      .text('This report is electronically signed and verified.', 50, doc.page.height - 100)
      .text(`Report Status: ${report.reportStatus}`, 50, doc.page.height - 80)
      .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 60);
    
    doc.end();
    
    writeStream.on('finish', () => {
      resolve(filePath);
    });
    
    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}
