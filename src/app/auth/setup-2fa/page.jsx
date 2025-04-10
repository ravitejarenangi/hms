'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Setup2FAPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    // Generate 2FA secret when component mounts
    if (status === 'authenticated') {
      generateSecret();
    }
  }, [status, router]);
  
  const generateSecret = async () => {
    try {
      setGenerating(true);
      
      const response = await fetch('/api/auth/generate-2fa', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate 2FA secret');
      }
      
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (error) {
      console.error('2FA generation error:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };
  
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!verificationCode) {
      setError('Verification code is required');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationCode,
          secret,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify 2FA code');
      }
      
      setMessage('Two-factor authentication has been enabled for your account');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('2FA verification error:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Set up two-factor authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enhance your account security with 2FA
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          
          {message && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{message}</h3>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Step 1: Scan QR code</h3>
              <p className="mt-1 text-sm text-gray-500">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              
              <div className="mt-4 flex justify-center">
                {generating ? (
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  qrCode && (
                    <div className="p-4 bg-white border rounded-lg">
                      <Image
                        src={qrCode}
                        alt="2FA QR Code"
                        width={200}
                        height={200}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Step 2: Enter verification code</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter the 6-digit code from your authenticator app
              </p>
              
              <form onSubmit={handleVerify} className="mt-4">
                <div>
                  <label htmlFor="verificationCode" className="sr-only">
                    Verification code
                  </label>
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    autoComplete="one-time-code"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter 6-digit code"
                  />
                </div>
                
                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={loading || !qrCode}
                    className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    {loading ? 'Verifying...' : 'Verify and enable 2FA'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Manual setup</h3>
              <p className="mt-1 text-sm text-gray-500">
                If you can't scan the QR code, you can manually enter this secret key:
              </p>
              <div className="mt-2 bg-gray-100 p-2 rounded-md">
                <code className="text-sm">{secret}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
