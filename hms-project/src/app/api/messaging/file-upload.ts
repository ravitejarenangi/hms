import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Allowed file types
const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // Documents
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv'
];

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data with file
    const formData = await req.formData();
    const file = formData.get('file');
    const messageId = formData.get('messageId');
    const userId = session.user.id;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const newFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `messages/${userId}/${newFileName}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    const snapshot = await uploadBytes(storageRef, bytes, {
      contentType: file.type,
      metadata: {
        originalName: file.name
      }
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Save metadata to database
    const attachment = await prisma.fileAttachment.create({
      data: {
        id: uuidv4(),
        messageMetadataId: messageId,
        userId: userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        firebaseStorageUrl: downloadURL,
      }
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        downloadUrl: downloadURL
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get all attachments for a specific message
    const attachments = await prisma.fileAttachment.findMany({
      where: {
        messageMetadataId: messageId
      }
    });

    return NextResponse.json({
      attachments: attachments.map(attachment => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        downloadUrl: attachment.firebaseStorageUrl,
        uploadedAt: attachment.uploadedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}
