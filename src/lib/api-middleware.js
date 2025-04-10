import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission, hasAnyPermission } from './auth';

/**
 * Middleware to check if a user is authenticated
 * @param {Function} handler - API route handler
 * @returns {Function} Middleware function
 */
export function withAuth(handler) {
  return async (req, params) => {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Add session to request object
    req.session = session;
    
    // Call the handler
    return handler(req, params);
  };
}

/**
 * Middleware to check if a user has a specific permission
 * @param {string} permissionName - Permission name to check
 * @param {Function} handler - API route handler
 * @returns {Function} Middleware function
 */
export function withPermission(permissionName, handler) {
  return async (req, params) => {
    // First check authentication
    const authMiddleware = withAuth(async (req, params) => {
      // Check permission
      const hasAccess = await hasPermission(req.session.user.id, permissionName);
      
      if (!hasAccess) {
        return NextResponse.json(
          { message: `Forbidden: You do not have the required permission: ${permissionName}` },
          { status: 403 }
        );
      }
      
      // Call the handler
      return handler(req, params);
    });
    
    return authMiddleware(req, params);
  };
}

/**
 * Middleware to check if a user has any of the specified permissions
 * @param {string[]} permissionNames - Permission names to check
 * @param {Function} handler - API route handler
 * @returns {Function} Middleware function
 */
export function withAnyPermission(permissionNames, handler) {
  return async (req, params) => {
    // First check authentication
    const authMiddleware = withAuth(async (req, params) => {
      // Check permissions
      const hasAccess = await hasAnyPermission(req.session.user.id, permissionNames);
      
      if (!hasAccess) {
        return NextResponse.json(
          { message: `Forbidden: You do not have any of the required permissions: ${permissionNames.join(', ')}` },
          { status: 403 }
        );
      }
      
      // Call the handler
      return handler(req, params);
    });
    
    return authMiddleware(req, params);
  };
}

/**
 * Middleware to handle API errors
 * @param {Function} handler - API route handler
 * @returns {Function} Middleware function
 */
export function withErrorHandling(handler) {
  return async (req, params) => {
    try {
      // Call the handler
      return await handler(req, params);
    } catch (error) {
      console.error('API Error:', error);
      
      // Return a generic error response
      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Combine multiple middleware functions
 * @param {Function[]} middlewares - Array of middleware functions
 * @param {Function} handler - API route handler
 * @returns {Function} Combined middleware function
 */
export function withMiddleware(middlewares, handler) {
  return async (req, params) => {
    // Create a function that will call each middleware in sequence
    const executeMiddleware = async (index) => {
      if (index >= middlewares.length) {
        // All middleware passed, call the handler
        return handler(req, params);
      }
      
      // Call the current middleware with a function that will call the next middleware
      return middlewares[index](req, params, () => executeMiddleware(index + 1));
    };
    
    // Start executing middleware chain
    return executeMiddleware(0);
  };
}

/**
 * Create a WhatsApp notification sender middleware
 * This middleware will send WhatsApp notifications after the API handler completes
 * @param {Object} options - Notification options
 * @param {Function} handler - API route handler
 * @returns {Function} Middleware function
 */
export function withWhatsAppNotification(options, handler) {
  return async (req, params) => {
    // Call the handler first
    const response = await handler(req, params);
    
    // If the handler was successful, send a WhatsApp notification
    if (response.status === 200 || response.status === 201) {
      try {
        // Get the response data
        const data = await response.json();
        
        // Prepare notification data
        const notificationData = {
          ...options,
          data: data,
        };
        
        // Send notification asynchronously (don't await)
        fetch('/api/notifications/whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData),
        }).catch(error => {
          console.error('Error sending WhatsApp notification:', error);
        });
      } catch (error) {
        console.error('Error preparing WhatsApp notification:', error);
      }
    }
    
    // Return the original response
    return response;
  };
}
