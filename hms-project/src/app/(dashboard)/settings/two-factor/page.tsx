"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function TwoFactorSetupPage() {
  const { data: session } = useSession();
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTwoFactorStatus = async () => {
      try {
        const response = await fetch("/api/auth/two-factor/status");
        const data = await response.json();

        if (data.success) {
          setEnabled(data.data.enabled);
        }
      } catch (err) {
        console.error("Error fetching 2FA status:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchTwoFactorStatus();
    }
  }, [session]);

  const handleGenerateQrCode = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/two-factor/setup", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.data.qrCode);
        setSecret(data.data.secret);
        setBackupCodes(data.data.backupCodes);
      } else {
        setError(data.error || "Failed to generate QR code");
      }
    } catch (err) {
      setError("An error occurred while generating the QR code");
      console.error("Error generating QR code:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    try {
      setVerifying(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/auth/two-factor/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setEnabled(true);
        setMessage("Two-factor authentication enabled successfully");
        setQrCode("");
        setSecret("");
        setBackupCodes([]);
        setToken("");
      } else {
        setError(data.error || "Failed to verify token");
      }
    } catch (err) {
      setError("An error occurred while verifying the token");
      console.error("Error verifying token:", err);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/auth/two-factor/disable", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setEnabled(false);
        setMessage("Two-factor authentication disabled successfully");
      } else {
        setError(data.error || "Failed to disable two-factor authentication");
      }
    } catch (err) {
      setError("An error occurred while disabling two-factor authentication");
      console.error("Error disabling 2FA:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Two-Factor Authentication</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {enabled ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-green-600 font-semibold mb-4">
            Two-factor authentication is currently enabled for your account.
          </p>
          <button
            onClick={handleDisableTwoFactor}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Disabling..." : "Disable Two-Factor Authentication"}
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="mb-4">
            Two-factor authentication adds an extra layer of security to your account. When enabled,
            you'll need to enter a verification code from your phone in addition to your password
            when signing in.
          </p>

          {!qrCode ? (
            <button
              onClick={handleGenerateQrCode}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Set Up Two-Factor Authentication"}
            </button>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">1. Scan QR Code</h2>
                <p className="mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).
                </p>
                <div className="bg-gray-100 p-4 rounded-lg inline-block">
                  <img src={qrCode} alt="QR Code" width={200} height={200} />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">2. Manual Setup</h2>
                <p className="mb-2">
                  If you can't scan the QR code, enter this code manually in your app:
                </p>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm mb-4">{secret}</div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">3. Verify Setup</h2>
                <p className="mb-4">
                  Enter the verification code from your authenticator app to complete the setup:
                </p>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleVerifyToken}
                    disabled={verifying || !token}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {verifying ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </div>

              {backupCodes.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">4. Backup Codes</h2>
                  <p className="mb-4">
                    Save these backup codes in a secure place. You can use them to sign in if you
                    lose access to your authenticator app.
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="font-mono text-sm">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
