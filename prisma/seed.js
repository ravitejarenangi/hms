const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Initial permissions by category
const permissionsByCategory = {
  user: [
    { name: 'view_users', description: 'View users' },
    { name: 'create_users', description: 'Create users' },
    { name: 'edit_users', description: 'Edit users' },
    { name: 'delete_users', description: 'Delete users' },
  ],
  role: [
    { name: 'view_roles', description: 'View roles' },
    { name: 'create_roles', description: 'Create roles' },
    { name: 'edit_roles', description: 'Edit roles' },
    { name: 'delete_roles', description: 'Delete roles' },
    { name: 'assign_permissions', description: 'Assign permissions to roles' },
  ],
  patient: [
    { name: 'view_all_patients', description: 'View all patients' },
    { name: 'view_assigned_patients', description: 'View assigned patients' },
    { name: 'create_patients', description: 'Create patients' },
    { name: 'edit_patients', description: 'Edit patients' },
    { name: 'delete_patients', description: 'Delete patients' },
  ],
  doctor: [
    { name: 'view_all_doctors', description: 'View all doctors' },
    { name: 'create_doctors', description: 'Create doctors' },
    { name: 'edit_doctors', description: 'Edit doctors' },
    { name: 'delete_doctors', description: 'Delete doctors' },
    { name: 'approve_doctors', description: 'Approve doctor registrations' },
  ],
  appointment: [
    { name: 'view_all_appointments', description: 'View all appointments' },
    { name: 'view_assigned_appointments', description: 'View assigned appointments' },
    { name: 'create_appointments', description: 'Create appointments' },
    { name: 'edit_appointments', description: 'Edit appointments' },
    { name: 'delete_appointments', description: 'Delete appointments' },
    { name: 'approve_appointments', description: 'Approve appointments' },
  ],
  prescription: [
    { name: 'view_all_prescriptions', description: 'View all prescriptions' },
    { name: 'view_assigned_prescriptions', description: 'View assigned prescriptions' },
    { name: 'create_prescriptions', description: 'Create prescriptions' },
    { name: 'edit_prescriptions', description: 'Edit prescriptions' },
    { name: 'delete_prescriptions', description: 'Delete prescriptions' },
  ],
  laboratory: [
    { name: 'view_all_lab_reports', description: 'View all lab reports' },
    { name: 'view_assigned_lab_reports', description: 'View assigned lab reports' },
    { name: 'create_lab_reports', description: 'Create lab reports' },
    { name: 'edit_lab_reports', description: 'Edit lab reports' },
    { name: 'delete_lab_reports', description: 'Delete lab reports' },
  ],
  radiology: [
    { name: 'view_all_radiology_reports', description: 'View all radiology reports' },
    { name: 'view_assigned_radiology_reports', description: 'View assigned radiology reports' },
    { name: 'create_radiology_reports', description: 'Create radiology reports' },
    { name: 'edit_radiology_reports', description: 'Edit radiology reports' },
    { name: 'delete_radiology_reports', description: 'Delete radiology reports' },
  ],
  billing: [
    { name: 'view_all_invoices', description: 'View all invoices' },
    { name: 'view_assigned_invoices', description: 'View assigned invoices' },
    { name: 'create_invoices', description: 'Create invoices' },
    { name: 'edit_invoices', description: 'Edit invoices' },
    { name: 'delete_invoices', description: 'Delete invoices' },
    { name: 'process_payments', description: 'Process payments' },
  ],
  pharmacy: [
    { name: 'view_medicines', description: 'View medicines' },
    { name: 'create_medicines', description: 'Create medicines' },
    { name: 'edit_medicines', description: 'Edit medicines' },
    { name: 'delete_medicines', description: 'Delete medicines' },
    { name: 'manage_inventory', description: 'Manage inventory' },
  ],
  bed: [
    { name: 'view_beds', description: 'View beds' },
    { name: 'create_beds', description: 'Create beds' },
    { name: 'edit_beds', description: 'Edit beds' },
    { name: 'delete_beds', description: 'Delete beds' },
    { name: 'assign_beds', description: 'Assign beds to patients' },
  ],
  report: [
    { name: 'view_reports', description: 'View reports' },
    { name: 'create_reports', description: 'Create reports' },
    { name: 'export_reports', description: 'Export reports' },
  ],
  settings: [
    { name: 'view_settings', description: 'View settings' },
    { name: 'edit_settings', description: 'Edit settings' },
  ],
  whatsapp: [
    { name: 'view_whatsapp_templates', description: 'View WhatsApp templates' },
    { name: 'create_whatsapp_templates', description: 'Create WhatsApp templates' },
    { name: 'edit_whatsapp_templates', description: 'Edit WhatsApp templates' },
    { name: 'delete_whatsapp_templates', description: 'Delete WhatsApp templates' },
    { name: 'send_whatsapp_messages', description: 'Send WhatsApp messages' },
  ],
};

// Initial roles with their permissions
const roles = [
  {
    name: 'SUPERADMIN',
    description: 'Super Administrator with full access',
    isSystem: true,
    // Superadmin has all permissions
    permissions: Object.values(permissionsByCategory).flat().map(p => p.name),
  },
  {
    name: 'ADMIN',
    description: 'Administrator with limited access',
    isSystem: true,
    permissions: [
      // User management
      'view_users', 'create_users', 'edit_users',
      // Role management (but can't delete system roles)
      'view_roles', 'create_roles', 'edit_roles', 'assign_permissions',
      // Patient management
      'view_all_patients', 'create_patients', 'edit_patients',
      // Doctor management
      'view_all_doctors', 'create_doctors', 'edit_doctors', 'approve_doctors',
      // Appointment management
      'view_all_appointments', 'create_appointments', 'edit_appointments', 'approve_appointments',
      // Prescription management
      'view_all_prescriptions',
      // Lab and Radiology
      'view_all_lab_reports', 'view_all_radiology_reports',
      // Billing
      'view_all_invoices',
      // Other modules
      'view_medicines', 'view_beds', 'view_reports', 'view_settings', 'edit_settings',
      'view_whatsapp_templates', 'send_whatsapp_messages',
    ],
  },
  {
    name: 'DOCTOR',
    description: 'Doctor with patient care access',
    isSystem: true,
    permissions: [
      'view_assigned_patients', 'edit_patients',
      'view_assigned_appointments', 'create_appointments', 'edit_appointments',
      'view_assigned_prescriptions', 'create_prescriptions', 'edit_prescriptions',
      'view_assigned_lab_reports', 'create_lab_reports',
      'view_assigned_radiology_reports', 'create_radiology_reports',
      'view_medicines',
      'view_beds',
      'send_whatsapp_messages',
    ],
  },
  {
    name: 'PHARMACIST',
    description: 'Pharmacist with medicine management access',
    isSystem: true,
    permissions: [
      'view_medicines', 'create_medicines', 'edit_medicines', 'manage_inventory',
      'view_assigned_prescriptions',
    ],
  },
  {
    name: 'ACCOUNTANT',
    description: 'Accountant with billing access',
    isSystem: true,
    permissions: [
      'view_all_invoices', 'create_invoices', 'edit_invoices', 'process_payments',
      'view_reports', 'export_reports',
    ],
  },
  {
    name: 'RECEPTIONIST',
    description: 'Receptionist with front desk access',
    isSystem: true,
    permissions: [
      'view_all_patients', 'create_patients', 'edit_patients',
      'view_all_appointments', 'create_appointments', 'edit_appointments',
      'view_all_invoices', 'create_invoices',
      'view_beds', 'assign_beds',
      'send_whatsapp_messages',
    ],
  },
  {
    name: 'PATHOLOGIST',
    description: 'Pathologist with lab access',
    isSystem: true,
    permissions: [
      'view_all_lab_reports', 'create_lab_reports', 'edit_lab_reports',
    ],
  },
  {
    name: 'RADIOLOGIST',
    description: 'Radiologist with radiology access',
    isSystem: true,
    permissions: [
      'view_all_radiology_reports', 'create_radiology_reports', 'edit_radiology_reports',
    ],
  },
  {
    name: 'NURSE',
    description: 'Nurse with patient care access',
    isSystem: true,
    permissions: [
      'view_assigned_patients', 'edit_patients',
      'view_assigned_appointments',
      'view_assigned_prescriptions',
      'view_assigned_lab_reports',
      'view_assigned_radiology_reports',
      'view_beds', 'assign_beds',
    ],
  },
  {
    name: 'PATIENT',
    description: 'Patient with self-service access',
    isSystem: true,
    permissions: [],
  },
];

async function main() {
  console.log('Seeding database...');

  // Create permissions
  for (const category in permissionsByCategory) {
    for (const permission of permissionsByCategory[category]) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {
          description: permission.description,
          category,
        },
        create: {
          name: permission.name,
          description: permission.description,
          category,
        },
      });
    }
  }

  console.log('Permissions created');

  // Create roles with permissions
  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isSystem: role.isSystem,
      },
      create: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });

    // Get all permissions for this role
    const permissions = await prisma.permission.findMany({
      where: {
        name: {
          in: role.permissions,
        },
      },
    });

    // Delete existing role permissions
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: createdRole.id,
      },
    });

    // Create role permissions
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: createdRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('Roles created');

  // Create a superadmin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  // Get the superadmin role
  const superadminRole = await prisma.role.findUnique({
    where: { name: 'SUPERADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'superadmin@hospital.com' },
    update: {
      firstName: 'Super',
      lastName: 'Admin',
      password: hashedPassword,
      roleId: superadminRole.id,
    },
    create: {
      email: 'superadmin@hospital.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: hashedPassword,
      roleId: superadminRole.id,
      status: 'ACTIVE',
    },
  });

  console.log('Superadmin user created');
  console.log('Database seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
