// Firebase Configuration for Internal Messaging System
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import { NextRequest, NextResponse } from 'next/server';

// Firebase configuration type
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// NOTE: These values should be replaced with actual Firebase project credentials
// and stored in environment variables for production
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "FIREBASE_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "hms-messaging.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "hms-messaging",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "hms-messaging.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);
const messaging = getMessaging(firebaseApp);

export { firebaseApp, firestore, auth, storage, messaging };

export async function GET(request: NextRequest) {
  // Only return non-sensitive configuration details
  return NextResponse.json({
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
  });
}
