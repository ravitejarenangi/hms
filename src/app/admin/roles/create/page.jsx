'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function CreateRolePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    // Fetch permissions
    if (status === 'authenticated') {
      fetchPermissions();
    }
  }, [status, router]);
  
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/permissions');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch permissions');
      }
      
      setPermissionsByCategory(data.permissionsByCategory);
      
      // Initialize expanded categories
      const initialExpandedCategories = {};
      Object.keys(data.permissionsByCategory).forEach(category => {
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
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const handlePermissionChange = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };
  
  const handleSelectAllInCategory = (category, isSelected) => {
    const permissionsInCategory = permissionsByCategory[category];
    
    if (isSelected) {
      // Add all permissions in this category
      setSelectedPermissions(prev => {
        const permissionIdsToAdd = permissionsInCategory
          .map(permission => permission.id)
          .filter(id => !prev.includes(id));
        
        return [...prev, ...permissionIdsToAdd];
      });
    } else {
      // Remove all permissions in this category
      setSelectedPermissions(prev => 
        prev.filter(id => !permissionsInCategory.some(permission => permission.id === id))
      );
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Validate form
      if (!name.trim()) {
        throw new Error('Role name is required');
      }
      
      // Create role
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          permissionIds: selectedPermissions,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create role');
      }
      
      setSuccess('Role created successfully');
      
      // Redirect to roles list after a short delay
      setTimeout(() => {
        router.push('/admin/roles');
      }, 1500);
    } catch (error) {
      console.error('Error creating role:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin/roles"
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Roles
        </Link>
        <h1 className="text-2xl font-bold mt-2">Create New Role</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Role Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-2">Permissions</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-md">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="border-b border-gray-300 last:border-b-0">
                    <div 
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{expandedCategories[category] ? '▼' : '►'}</span>
                        <h3 className="font-medium">{category}</h3>
                      </div>
                      
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const allSelected = permissions.every(permission => 
                              selectedPermissions.includes(permission.id)
                            );
                            handleSelectAllInCategory(category, !allSelected);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 mr-4"
                        >
                          {permissions.every(permission => selectedPermissions.includes(permission.id))
                            ? 'Deselect All'
                            : 'Select All'}
                        </button>
                      </div>
                    </div>
                    
                    {expandedCategories[category] && (
                      <div className="px-4 py-2 divide-y divide-gray-200">
                        {permissions.map(permission => (
                          <div key={permission.id} className="py-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(permission.id)}
                                onChange={() => handlePermissionChange(permission.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm">{permission.name}</span>
                            </label>
                            {permission.description && (
                              <p className="ml-6 text-xs text-gray-500">{permission.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Link
              href="/admin/roles"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
