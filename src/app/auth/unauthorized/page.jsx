'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };
  
  if (!session) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Your current role: <span className="font-semibold">{session.user.role}</span>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              If you believe you should have access to this page, please contact your administrator.
            </p>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <Link
                  href="/"
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                >
                  Go to Dashboard
                </Link>
              </div>
              <div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
