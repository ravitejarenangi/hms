import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const testId = url.searchParams.get("testId") || undefined;
    const patientId = url.searchParams.get("patientId") || undefined;
    const doctorId = url.searchParams.get("doctorId") || undefined;
    const type = url.searchParams.get("type") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    if (testId) {
      where.testId = testId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (type) {
      where.notificationType = type;
    }

    if (status) {
      where.status = status;
    }

    const [notifications, total] = await Promise.all([
      prisma.labNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          test: {
            include: {
              testCatalog: true,
            },
          },
        },
      }),
      prisma.labNotification.count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching lab notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      testId,
      patientId,
      doctorId,
      notificationType,
      channel,
      message,
      attachmentUrl,
      priority,
    } = data;

    // Validate required fields
    if (!testId || !patientId || !notificationType || !channel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        testCatalog: true,
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    // Create notification
    const notification = await prisma.labNotification.create({
      data: {
        testId,
        patientId,
        doctorId: doctorId || test.requestedBy,
        notificationType,
        channel,
        message: message || `Your test results for ${test.testCatalog.name} are ready.`,
        attachmentUrl,
        priority: priority || "NORMAL",
        status: "PENDING",
        sentBy: session.user.id,
      },
      include: {
        test: {
          include: {
            testCatalog: true,
          },
        },
      },
    });

    // Send notification based on channel
    let deliveryStatus = "PENDING";
    let deliveryDetails = null;

    try {
      if (channel === "EMAIL") {
        // Implement email sending logic
        // This is a placeholder for actual email sending implementation
        deliveryStatus = "SENT";
        deliveryDetails = "Email queued for delivery";
      } else if (channel === "SMS") {
        // Implement SMS sending logic
        // This is a placeholder for actual SMS sending implementation
        deliveryStatus = "SENT";
        deliveryDetails = "SMS queued for delivery";
      } else if (channel === "WHATSAPP") {
        // Implement WhatsApp sending logic
        // This is a placeholder for actual WhatsApp sending implementation
        deliveryStatus = "SENT";
        deliveryDetails = "WhatsApp message queued for delivery";
      } else if (channel === "APP") {
        // Implement in-app notification logic
        // This is a placeholder for actual in-app notification implementation
        deliveryStatus = "DELIVERED";
        deliveryDetails = "Notification delivered to app";
      }
    } catch (error) {
      console.error(`Error sending ${channel} notification:`, error);
      deliveryStatus = "FAILED";
      deliveryDetails = `Failed to send ${channel} notification: ${error}`;
    }

    // Update notification status
    const updatedNotification = await prisma.labNotification.update({
      where: { id: notification.id },
      data: {
        status: deliveryStatus,
        deliveryDetails,
        sentAt: new Date(),
      },
    });

    return NextResponse.json(updatedNotification, { status: 201 });
  } catch (error) {
    console.error("Error creating lab notification:", error);
    return NextResponse.json(
      { error: "Failed to create lab notification" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      id,
      status,
      readAt,
      deliveryDetails,
    } = data;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Check if notification exists
    const existingNotification = await prisma.labNotification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Update notification
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (readAt) {
      updateData.readAt = new Date(readAt);
    } else if (status === "READ") {
      updateData.readAt = new Date();
    }
    
    if (deliveryDetails) {
      updateData.deliveryDetails = deliveryDetails;
    }

    const updatedNotification = await prisma.labNotification.update({
      where: { id },
      data: updateData,
      include: {
        test: {
          include: {
            testCatalog: true,
          },
        },
      },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error("Error updating lab notification:", error);
    return NextResponse.json(
      { error: "Failed to update lab notification" },
      { status: 500 }
    );
  }
}
