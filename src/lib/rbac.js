/**
 * Role-Based Access Control (RBAC) Utility
 * This utility provides functions to manage and check permissions for users
 */

import prisma from './db';

/**
 * Get all permissions for a user by their ID
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} Array of permission names
 */
export async function getUserPermissions(userId) {
  try {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return [];
    }

    // Extract permission names
    return user.role.rolePermissions.map(rp => rp.permission.name);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if a user has a specific permission
 * @param {number} userId - User ID
 * @param {string} permissionName - Permission name to check
 * @returns {Promise<boolean>} Whether the user has the permission
 */
export async function hasPermission(userId, permissionName) {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(permissionName);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions
 * @param {number} userId - User ID
 * @param {string[]} permissionNames - Array of permission names to check
 * @returns {Promise<boolean>} Whether the user has any of the permissions
 */
export async function hasAnyPermission(userId, permissionNames) {
  try {
    const permissions = await getUserPermissions(userId);
    return permissionNames.some(name => permissions.includes(name));
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check if a user has all of the specified permissions
 * @param {number} userId - User ID
 * @param {string[]} permissionNames - Array of permission names to check
 * @returns {Promise<boolean>} Whether the user has all of the permissions
 */
export async function hasAllPermissions(userId, permissionNames) {
  try {
    const permissions = await getUserPermissions(userId);
    return permissionNames.every(name => permissions.includes(name));
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Get all permissions by category
 * @returns {Promise<Object>} Permissions grouped by category
 */
export async function getPermissionsByCategory() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    // Group permissions by category
    return permissions.reduce((acc, permission) => {
      const category = permission.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {});
  } catch (error) {
    console.error('Error getting permissions by category:', error);
    return {};
  }
}

/**
 * Get all roles with their permissions
 * @returns {Promise<Object[]>} Array of roles with permissions
 */
export async function getRolesWithPermissions() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform roles to include permission names
    return roles.map(role => ({
      ...role,
      permissions: role.rolePermissions.map(rp => rp.permission),
    }));
  } catch (error) {
    console.error('Error getting roles with permissions:', error);
    return [];
  }
}

/**
 * Create a new role with permissions
 * @param {string} name - Role name
 * @param {string} description - Role description
 * @param {number[]} permissionIds - Array of permission IDs
 * @returns {Promise<Object>} Created role
 */
export async function createRole(name, description, permissionIds) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Create role
      const role = await tx.role.create({
        data: {
          name,
          description,
          isSystem: false,
        },
      });

      // Create role permissions
      if (permissionIds && permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map(permissionId =>
            tx.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId,
              },
            })
          )
        );
      }

      return role;
    });
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
}

/**
 * Update a role with permissions
 * @param {number} roleId - Role ID
 * @param {string} name - Role name
 * @param {string} description - Role description
 * @param {number[]} permissionIds - Array of permission IDs
 * @returns {Promise<Object>} Updated role
 */
export async function updateRole(roleId, name, description, permissionIds) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Get the role
      const role = await tx.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // Check if it's a system role
      if (role.isSystem && role.name !== name) {
        throw new Error('Cannot change the name of a system role');
      }

      // Update role
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data: {
          name,
          description,
        },
      });

      // Delete existing role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new role permissions
      if (permissionIds && permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map(permissionId =>
            tx.rolePermission.create({
              data: {
                roleId,
                permissionId,
              },
            })
          )
        );
      }

      return updatedRole;
    });
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
}

/**
 * Delete a role
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} Deleted role
 */
export async function deleteRole(roleId) {
  try {
    // Get the role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if it's a system role
    if (role.isSystem) {
      throw new Error('Cannot delete a system role');
    }

    // Check if the role is assigned to any users
    const usersWithRole = await prisma.user.count({
      where: { roleId },
    });

    if (usersWithRole > 0) {
      throw new Error('Cannot delete a role that is assigned to users');
    }

    // Delete role permissions and role
    return await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      return tx.role.delete({
        where: { id: roleId },
      });
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
}

export default {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsByCategory,
  getRolesWithPermissions,
  createRole,
  updateRole,
  deleteRole,
};
