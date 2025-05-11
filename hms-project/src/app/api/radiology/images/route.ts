import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { notifyImageUploaded } from '@/lib/notifications/radiologyNotifications';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendRadiologyEvent } from '../sse/route';
import { RadiologyStatus } from '@prisma/client';

// DICOM-specific imports (would use actual DICOM libraries in production)
type DicomTag = { tag: string; value: any; vr: string; };
type DicomMetadata = { [key: string]: DicomTag };

// Base directory for storing DICOM files
const STORAGE_BASE_DIR = process.env.DICOM_STORAGE_PATH || './public/dicom-storage';

// DICOM SOP Class UIDs for common modalities
const DICOM_SOP_CLASSES = {
  CT: '1.2.840.10008.5.1.4.1.1.2', // CT Image Storage
  MR: '1.2.840.10008.5.1.4.1.1.4', // MR Image Storage
  US: '1.2.840.10008.5.1.4.1.1.6.1', // Ultrasound Image Storage
  CR: '1.2.840.10008.5.1.4.1.1.1', // Computed Radiography Image Storage
  DX: '1.2.840.10008.5.1.4.1.1.1.1', // Digital X-Ray Image Storage
  MG: '1.2.840.10008.5.1.4.1.1.1.2', // Digital Mammography Image Storage
  NM: '1.2.840.10008.5.1.4.1.1.20', // Nuclear Medicine Image Storage
  PT: '1.2.840.10008.5.1.4.1.1.128', // Positron Emission Tomography Image Storage
  XA: '1.2.840.10008.5.1.4.1.1.12.1', // X-Ray Angiographic Image Storage
  RF: '1.2.840.10008.5.1.4.1.1.12.2', // X-Ray Radiofluoroscopic Image Storage
  RTIMAGE: '1.2.840.10008.5.1.4.1.1.481.1', // RT Image Storage
};

// DICOM Transfer Syntax UIDs
const TRANSFER_SYNTAXES = {
  IMPLICIT_VR_LITTLE_ENDIAN: '1.2.840.10008.1.2', // Default Transfer Syntax
  EXPLICIT_VR_LITTLE_ENDIAN: '1.2.840.10008.1.2.1',
  EXPLICIT_VR_BIG_ENDIAN: '1.2.840.10008.1.2.2',
  JPEG_BASELINE: '1.2.840.10008.1.2.4.50', // JPEG Baseline (Process 1)
  JPEG_LOSSLESS: '1.2.840.10008.1.2.4.70', // JPEG Lossless
  JPEG_2000_LOSSLESS: '1.2.840.10008.1.2.4.90', // JPEG 2000 Lossless
  JPEG_2000_LOSSY: '1.2.840.10008.1.2.4.91', // JPEG 2000 Lossy
};

/**
 * GET handler for fetching radiology images
 * @param req - The request object
 * @returns A response with the list of radiology images
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Parse query parameters
    const studyId = url.searchParams.get('studyId') || '';
    const seriesId = url.searchParams.get('seriesId') || '';
    const instanceId = url.searchParams.get('instanceId') || '';
    
    if (instanceId) {
      // Fetch a specific instance
      const instance = await prisma.radiologyInstance.findUnique({
        where: { id: instanceId },
        include: {
          series: true
        }
      });
      
      // Get the study separately to avoid type errors
      const series = instance ? await prisma.radiologySeries.findUnique({
        where: { id: instance.seriesId },
        include: { study: true }
      }) : null;
      
      if (!instance || !series) {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        );
      }
      
      // Combine the data for the response
      const responseData = {
        ...instance,
        series: series,
        study: series.study
      };
      
      return NextResponse.json(responseData);
    } else if (seriesId) {
      // Fetch all instances in a series
      const instances = await prisma.radiologyInstance.findMany({
        where: { seriesId },
        orderBy: { instanceNumber: 'asc' },
        include: {
          series: true
        }
      });
      
      return NextResponse.json({ instances });
    } else if (studyId) {
      // Fetch all series and instances in a study
      const series = await prisma.radiologySeries.findMany({
        where: { studyId },
        orderBy: { seriesNumber: 'asc' },
        include: {
          instances: {
            orderBy: { instanceNumber: 'asc' }
          }
        }
      });
      
      return NextResponse.json({ series });
    } else {
      return NextResponse.json(
        { error: 'Study ID, Series ID, or Instance ID is required' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error fetching radiology images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch radiology images' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for uploading a new radiology image
 * @param req - The request object
 * @returns A response with the created radiology image
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Get form data
    const studyId = formData.get('studyId') as string;
    const seriesId = formData.get('seriesId') as string;
    const metadata = formData.get('metadata') as string;
    const file = formData.get('file') as File;
    
    // Validate required fields
    if (!studyId || !seriesId || !file || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate DICOM metadata
    try {
      const parsedMetadata = JSON.parse(metadata);
      
      // Check for required DICOM attributes
      const requiredTags = ['PatientID', 'PatientName', 'StudyInstanceUID', 'SeriesInstanceUID', 'SOPInstanceUID', 'Modality'];
      const missingTags = requiredTags.filter(tag => !parsedMetadata[tag]);
      
      if (missingTags.length > 0) {
        return NextResponse.json(
          { error: `Missing required DICOM tags: ${missingTags.join(', ')}` },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid DICOM metadata format' },
        { status: 400 }
      );
    }
    
    // Check if series exists
    const series = await prisma.radiologySeries.findUnique({
      where: { id: seriesId },
      include: {
        study: true
      }
    });
    
    if (!series) {
      return NextResponse.json(
        { error: `Series with ID ${seriesId} not found` },
        { status: 404 }
      );
    }
    
    // Store the file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.type === 'application/dicom' ? 'dcm' : 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Parse DICOM metadata to extract key information
    const parsedMetadata = JSON.parse(metadata);
    const sopInstanceUID = parsedMetadata.SOPInstanceUID?.value || uuidv4();
    const sopClassUID = parsedMetadata.SOPClassUID?.value || getDicomSopClassForModality(parsedMetadata.Modality?.value);
    const transferSyntaxUID = parsedMetadata.TransferSyntaxUID?.value || TRANSFER_SYNTAXES.EXPLICIT_VR_LITTLE_ENDIAN;
    
    // Create directory structure: /studyId/seriesId/
    const studyDir = path.join(STORAGE_BASE_DIR, studyId);
    const seriesDir = path.join(studyDir, seriesId);
    
    if (!existsSync(studyDir)) {
      await mkdir(studyDir, { recursive: true });
    }
    
    if (!existsSync(seriesDir)) {
      await mkdir(seriesDir, { recursive: true });
    }
    
    // Store with SOP Instance UID as filename for better DICOM compliance
    const filePath = path.join(seriesDir, `${sopInstanceUID}.${fileExt}`);
    await writeFile(filePath, fileBuffer);
    
    // Generate a thumbnail for preview
    let thumbnailPath = '';
    if (file.type.startsWith('image/') || file.type === 'application/dicom') {
      const thumbnailFileName = `thumb_${sopInstanceUID}.jpg`;
      thumbnailPath = path.join(seriesDir, thumbnailFileName);
      
      try {
        // For DICOM files, we would extract the pixel data and convert it
        // This is a simplified version that assumes we can directly process the image
        await sharp(fileBuffer)
          .resize(200, 200, { fit: 'inside' })
          .toFile(thumbnailPath);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        // Continue without thumbnail if generation fails
      }
    }
    
    // Get the next instance number for this series
    const instanceNumber = await getNextInstanceNumber(seriesId);
    
    // Create the instance record
    const instance = await prisma.radiologyInstance.create({
      data: {
        seriesId,
        instanceNumber,
        sopInstanceUID: sopInstanceUID,
        sopClassUID: sopClassUID,
        transferSyntaxUID: transferSyntaxUID,
        filePath: filePath.replace(STORAGE_BASE_DIR, '/dicom-storage'),
        thumbnailPath: thumbnailPath ? thumbnailPath.replace(STORAGE_BASE_DIR, '/dicom-storage') : null,
        metadata: parsedMetadata,
        rows: parseInt(formData.get('rows') as string) || null,
        columns: parseInt(formData.get('columns') as string) || null,
        bitsAllocated: parseInt(formData.get('bitsAllocated') as string) || null,
        windowCenter: parseInt(formData.get('windowCenter') as string) || null,
        windowWidth: parseInt(formData.get('windowWidth') as string) || null,
      }
    });
    
    // Get the complete instance with related data
    const completeInstance = await prisma.radiologyInstance.findUnique({
      where: { id: instance.id },
      include: {
        series: true
      }
    });
    
    // Get the study separately
    const study = await prisma.radiologyStudy.findUnique({
      where: { id: studyId }
    });
    
    // Update study status
    await updateStudyStatus(studyId);
    
    // Combine the data for notification and response
    const instanceWithRelations = {
      ...completeInstance,
      series: completeInstance.series,
      study: study
    };
    
    // Notify about the new image
    await notifyImageUploaded(instanceWithRelations);
    
    // Send real-time update via SSE
    await sendRadiologyEvent({
      id: uuidv4(),
      type: 'IMAGE_UPLOADED',
      title: 'New Radiology Image',
      message: `A new image has been uploaded for study ${study.accessionNumber || studyId}`,
      timestamp: new Date().toISOString(),
      priority: 'medium',
      metadata: {
        studyId: studyId,
        seriesId: seriesId,
        instanceId: instance.id,
        patientId: study.patientId,
        patientName: study.patientName
      }
    });
    
    return NextResponse.json(instanceWithRelations);
    
  } catch (error) {
    console.error('Error uploading radiology image:', error);
    return NextResponse.json(
      { error: 'Failed to upload radiology image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a radiology image
 * @param req - The request object
 * @returns A response indicating success or failure
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const instanceId = url.searchParams.get('id');
    
    if (!instanceId) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      );
    }
    
    // Get the instance to delete
    const instance = await prisma.radiologyInstance.findUnique({
      where: { id: instanceId },
      include: {
        series: true
      }
    });
    
    // Get the study separately
    const series = instance ? await prisma.radiologySeries.findUnique({
      where: { id: instance.seriesId },
      include: { study: true }
    }) : null;
    
    if (!instance || !series) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Get the file paths
    const filePath = path.join(STORAGE_BASE_DIR, instance.filePath.replace('/dicom-storage', ''));
    const thumbnailPath = instance.thumbnailPath
      ? path.join(STORAGE_BASE_DIR, instance.thumbnailPath.replace('/dicom-storage', ''))
      : null;
    
    // Delete the instance record
    await prisma.radiologyInstance.delete({
      where: { id: instanceId }
    });
    
    // Update study status
    await updateStudyStatus(series.studyId);
    
    return NextResponse.json({
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting radiology image:', error);
    return NextResponse.json(
      { error: 'Failed to delete radiology image' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get the next instance number for a series
 * @param seriesId - The series ID
 * @returns The next instance number
 */
export async function getNextInstanceNumber(seriesId: string): Promise<number> {
  // Get the highest instance number in the series
  const highestInstance = await prisma.radiologyInstance.findFirst({
    where: { seriesId },
    orderBy: { instanceNumber: 'desc' }
  });
  
  // Return the next number (or 1 if no instances exist)
  return highestInstance ? highestInstance.instanceNumber + 1 : 1;
}

/**
 * Get the appropriate DICOM SOP Class UID based on modality
 * @param modality - The imaging modality (CT, MR, etc.)
 * @returns The corresponding SOP Class UID
 */
function getDicomSopClassForModality(modality: string): string {
  if (!modality) return DICOM_SOP_CLASSES.CT; // Default to CT
  
  const upperModality = modality.toUpperCase();
  return DICOM_SOP_CLASSES[upperModality as keyof typeof DICOM_SOP_CLASSES] || DICOM_SOP_CLASSES.CT;
}

/**
 * Helper function to update study status based on available images
 * @param studyId - The study ID
 */
export async function updateStudyStatus(studyId: string): Promise<void> {
  try {
    // Get the study
    const study = await prisma.radiologyStudy.findUnique({
      where: { id: studyId }
    });
    
    // Get the request separately
    const request = study ? await prisma.radiologyRequest.findUnique({
      where: { id: study.requestId }
    }) : null;
    
    if (!study || !request) {
      console.error(`Study ${studyId} or its request not found`);
      return;
    }
    
    // Count the number of series and instances for the study
    const seriesCount = await prisma.radiologySeries.count({
      where: { studyId }
    });
    
    const instanceCount = await prisma.radiologyInstance.count({
      where: {
        series: {
          studyId
        }
      }
    });
    
    // Get previous study status
    const previousStudy = await prisma.radiologyStudy.findUnique({
      where: { id: studyId },
      include: {
        request: {
          include: {
            doctor: true
          }
        }
      }
    });
    
    const newStatus = instanceCount > 0 ? 'COMPLETED' : 'IN_PROGRESS';
    const statusChanged = previousStudy?.status !== newStatus;
    
    // Update the study status
    await prisma.radiologyStudy.update({
      where: { id: studyId },
      data: {
        status: newStatus
      }
    });

    // Also update the request status
    await prisma.radiologyRequest.update({
      where: { id: study.requestId },
      data: {
        status: newStatus
      
      // Create notification event for status change
      const notificationEvent = {
        id: uuidv4(),
        type: 'REQUEST_STATUS_CHANGE' as const,
        title: 'Radiology Study Completed',
        message: `The ${modalityType} study for patient ${patientName} has been completed. All images are now available.`,
        timestamp: new Date().toISOString(),
        priority: 'medium' as const,
        metadata: {
          studyId,
          patientName
        }
      };
      
      // Send notification to the referring doctor
      await sendRadiologyEvent(notificationEvent, doctorUserId);
      
      // Update the request status if it exists
      if (previousStudy.request?.id) {
        await prisma.radiologyRequest.update({
          where: { id: previousStudy.request.id },
          data: { status: 'COMPLETED' }
        });
      }
    }
  }
}
