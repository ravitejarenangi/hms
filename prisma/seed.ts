import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: JSON.stringify([
        'user:read', 'user:create', 'user:update', 'user:delete',
        'role:read', 'role:create', 'role:update', 'role:delete',
      ]),
    },
  });

  const doctorRole = await prisma.role.upsert({
    where: { name: 'doctor' },
    update: {},
    create: {
      name: 'doctor',
      description: 'Medical doctor',
      permissions: JSON.stringify([
        'patient:read', 'patient:create', 'patient:update',
        'appointment:read', 'appointment:create', 'appointment:update',
      ]),
    },
  });

  const patientRole = await prisma.role.upsert({
    where: { name: 'patient' },
    update: {},
    create: {
      name: 'patient',
      description: 'Patient user',
      permissions: JSON.stringify([
        'appointment:read', 'appointment:create',
        'profile:read', 'profile:update',
      ]),
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      status: 'active',
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
      profile: {
        create: {
          address: '123 Admin St',
          city: 'Admin City',
          state: 'Admin State',
          country: 'India',
          postalCode: '123456',
        },
      },
    },
  });

  console.log({ adminRole, doctorRole, patientRole, adminUser });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
