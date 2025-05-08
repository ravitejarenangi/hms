import { PrismaClient } from "../src/generated/prisma";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const superadminRole = await prisma.role.upsert({
    where: { name: "superadmin" },
    update: {},
    create: {
      name: "superadmin",
      description: "Super Administrator with full access",
      permissions: JSON.stringify([
        "user:read", "user:create", "user:update", "user:delete",
        "role:read", "role:create", "role:update", "role:delete",
        "patient:read", "patient:create", "patient:update", "patient:delete",
        "doctor:read", "doctor:create", "doctor:update", "doctor:delete",
        "appointment:read", "appointment:create", "appointment:update", "appointment:delete",
        "billing:read", "billing:create", "billing:update", "billing:delete",
        "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
        "report:read", "report:create", "report:update", "report:delete",
        "settings:read", "settings:update",
      ]),
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Administrator with limited access",
      permissions: JSON.stringify([
        "user:read", "user:create", "user:update",
        "role:read",
        "patient:read", "patient:create", "patient:update",
        "doctor:read", "doctor:create", "doctor:update",
        "appointment:read", "appointment:create", "appointment:update",
        "billing:read", "billing:create", "billing:update",
        "inventory:read", "inventory:create", "inventory:update",
        "report:read", "report:create",
        "settings:read",
      ]),
    },
  });

  const doctorRole = await prisma.role.upsert({
    where: { name: "doctor" },
    update: {},
    create: {
      name: "doctor",
      description: "Medical doctor",
      permissions: JSON.stringify([
        "patient:read", "patient:create", "patient:update",
        "appointment:read", "appointment:create", "appointment:update",
        "prescription:read", "prescription:create", "prescription:update",
        "report:read", "report:create",
      ]),
    },
  });

  const nurseRole = await prisma.role.upsert({
    where: { name: "nurse" },
    update: {},
    create: {
      name: "nurse",
      description: "Nurse",
      permissions: JSON.stringify([
        "patient:read", "patient:update",
        "appointment:read",
        "prescription:read",
        "vitals:read", "vitals:create", "vitals:update",
      ]),
    },
  });

  const pharmacistRole = await prisma.role.upsert({
    where: { name: "pharmacist" },
    update: {},
    create: {
      name: "pharmacist",
      description: "Pharmacist",
      permissions: JSON.stringify([
        "prescription:read", "prescription:update",
        "inventory:read", "inventory:update",
      ]),
    },
  });

  const accountantRole = await prisma.role.upsert({
    where: { name: "accountant" },
    update: {},
    create: {
      name: "accountant",
      description: "Accountant",
      permissions: JSON.stringify([
        "billing:read", "billing:create", "billing:update",
        "report:read",
      ]),
    },
  });

  const receptionistRole = await prisma.role.upsert({
    where: { name: "receptionist" },
    update: {},
    create: {
      name: "receptionist",
      description: "Receptionist",
      permissions: JSON.stringify([
        "patient:read", "patient:create", "patient:update",
        "appointment:read", "appointment:create", "appointment:update",
        "billing:read", "billing:create",
      ]),
    },
  });

  const pathologistRole = await prisma.role.upsert({
    where: { name: "pathologist" },
    update: {},
    create: {
      name: "pathologist",
      description: "Pathologist",
      permissions: JSON.stringify([
        "patient:read",
        "labtest:read", "labtest:create", "labtest:update",
        "report:read", "report:create", "report:update",
      ]),
    },
  });

  const radiologistRole = await prisma.role.upsert({
    where: { name: "radiologist" },
    update: {},
    create: {
      name: "radiologist",
      description: "Radiologist",
      permissions: JSON.stringify([
        "patient:read",
        "imaging:read", "imaging:create", "imaging:update",
        "report:read", "report:create", "report:update",
      ]),
    },
  });

  const patientRole = await prisma.role.upsert({
    where: { name: "patient" },
    update: {},
    create: {
      name: "patient",
      description: "Patient",
      permissions: JSON.stringify([
        "appointment:read", "appointment:create",
        "prescription:read",
        "billing:read",
        "profile:read", "profile:update",
      ]),
    },
  });

  // Create superadmin user
  const hashedPassword = await bcrypt.hash("superadmin123", 10);
  const superadminUser = await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@example.com",
      password: hashedPassword,
      status: "active",
      roles: {
        create: {
          roleId: superadminRole.id,
        },
      },
      profile: {
        create: {
          address: "123 Admin St",
          city: "Admin City",
          state: "Admin State",
          country: "India",
          postalCode: "123456",
        },
      },
    },
  });

  console.log({
    superadminRole,
    adminRole,
    doctorRole,
    nurseRole,
    pharmacistRole,
    accountantRole,
    receptionistRole,
    pathologistRole,
    radiologistRole,
    patientRole,
    superadminUser,
  });
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
