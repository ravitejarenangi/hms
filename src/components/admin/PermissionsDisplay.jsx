'use client';

import { useState, useEffect } from 'react';

/**
 * Component to display user permissions based on their role
 * @param {Object} props - Component props
 * @param {number} props.userId - User ID to display permissions for
 * @param {number} props.roleId - Role ID to display permissions for (alternative to userId)
 * @param {boolean} props.showCategory - Whether to group permissions by category
 * @param {boolean} props.collapsible - Whether to make categories collapsible
 * @param {string} props.className - Additional CSS classes
 */
export default function PermissionsDisplay({
  userId,
  roleId,
  showCategory = true,
  collapsible = true,
  className = '',
}) {
  const [permissions, setPermissions] = useState([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPermissions();
  }, [userId, roleId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      let url;
      
      if (userId) {
        url = `/api/admin/users/${userId}/permissions`;
      } else if (roleId) {
        url = `/api/admin/roles/${roleId}`;
      } else {
        throw new Error('Either userId or roleId must be provided');
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch permissions');
      }
      
      // Handle different response formats
      let fetchedPermissions = [];
      if (userId) {
        fetchedPermissions = data.permissions;
      } else if (roleId) {
        fetchedPermissions = data.role.permissions;
      }
      
      setPermissions(fetchedPermissions);
      
      // Group permissions by category
      const groupedPermissions = fetchedPermissions.reduce((acc, permission) => {
        const category = permission.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      }, {});
      
      setPermissionsByCategory(groupedPermissions);
      
      // Initialize expanded categories
      const initialExpandedCategories = {};
      Object.keys(groupedPermissions).forEach(category => {
        initialExpandedCategories[category] = true;
      });
      setExpandedCategories(initialExpandedCategories);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCategory = (category) => {
    if (collapsible) {
      setExpandedCategories(prev => ({
        ...prev,
        [category]: !prev[category]
      }));
    }
  };
  
  if (loading) {
    return (
      <div className={`flex justify-center items-center h-24 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`text-red-500 ${className}`}>
        <p>Error: {error}</p>
      </div>
    );
  }
  
  if (permissions.length === 0) {
    return (
      <div className={`text-gray-500 ${className}`}>
        <p>No permissions found</p>
      </div>
    );
  }
  
  // Display permissions grouped by category
  if (showCategory) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
          <div key={category} className="border border-gray-200 rounded-md overflow-hidden">
            <div 
              className={`flex items-center justify-between px-4 py-2 bg-gray-50 ${collapsible ? 'cursor-pointer' : ''}`}
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center">
                {collapsible && (
                  <span className="mr-2">{expandedCategories[category] ? '▼' : '►'}</span>
                )}
                <h3 className="font-medium">{category}</h3>
              </div>
              <div className="text-sm text-gray-500">
                {categoryPermissions.length} permission{categoryPermissions.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {(!collapsible || expandedCategories[category]) && (
              <div className="px-4 py-2 divide-y divide-gray-100">
                {categoryPermissions.map(permission => (
                  <div key={permission.id} className="py-1">
                    <div className="text-sm">{permission.name}</div>
                    {permission.description && (
                      <div className="text-xs text-gray-500">{permission.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // Display flat list of permissions
  return (
    <div className={`space-y-2 ${className}`}>
      {permissions.map(permission => (
        <div key={permission.id} className="py-1">
          <div className="text-sm font-medium">{permission.name}</div>
          {permission.description && (
            <div className="text-xs text-gray-500">{permission.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
