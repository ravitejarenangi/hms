import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';
import { WhatsApp } from '@/lib/whatsapp';

export async function POST(request) {
  try {
    const { firstName, lastName, email, password, role } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Determine if account needs approval (doctors need approval)
    const needsApproval = role === 'DOCTOR';
    const status = needsApproval ? 'PENDING' : 'ACTIVE';

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        status,
      },
    });

    // If it's a patient, create a patient record
    if (role === 'PATIENT') {
      await prisma.patient.create({
        data: {
          userId: user.id,
          patientId: `P${new Date().getFullYear()}${String(user.id).padStart(6, '0')}`,
          firstName,
          lastName,
          email,
        },
      });

      // Send welcome message via WhatsApp if phone number is provided
      try {
        if (user.phoneNumber) {
          await WhatsApp.notifications.sendWelcomeMessage(
            user.phoneNumber,
            {
              patientName: `${firstName} ${lastName}`,
            }
          );
        }
      } catch (error) {
        console.error('WhatsApp notification error:', error);
        // Don't fail registration if WhatsApp notification fails
      }
    }

    // If it's a doctor, create a doctor record
    if (role === 'DOCTOR') {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          doctorId: `D${new Date().getFullYear()}${String(user.id).padStart(6, '0')}`,
          firstName,
          lastName,
          email,
        },
      });

      // Notify admin about new doctor registration
      try {
        const admins = await prisma.user.findMany({
          where: {
            role: {
              in: ['ADMIN', 'SUPERADMIN'],
            },
          },
        });

        for (const admin of admins) {
          if (admin.phoneNumber) {
            await WhatsApp.notifications.sendAdminAlert(
              admin.phoneNumber,
              {
                alertType: 'New Doctor Registration',
                message: `Dr. ${firstName} ${lastName} has registered and is awaiting approval.`,
                actionRequired: 'Please review and approve or reject this registration.',
              }
            );
          }
        }
      } catch (error) {
        console.error('Admin notification error:', error);
        // Don't fail registration if admin notification fails
      }
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userWithoutPassword,
        needsApproval,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
