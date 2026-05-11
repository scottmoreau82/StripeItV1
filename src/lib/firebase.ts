import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * StripeItAuthSystem - Firebase Foundation
 * Robust initialization and connection auditing for high-reliability dealership operations.
 */

// Validate configuration before initialization
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error(`CRITICAL: Firebase configuration is missing required fields: ${missingFields.join(', ')}`);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

/**
 * StripeItErrorHandlingSystem - Internal Mapper
 * Maps technical Firebase codes to user-friendly dealership context messages.
 */
export function mapAuthError(error: any): string {
  const code = error?.code || error?.message || '';
  
  if (code.includes('auth/invalid-credential') || code.includes('auth/user-not-found') || code.includes('auth/wrong-password')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'This account already exists.';
  }
  if (code.includes('auth/network-request-failed') || code.includes('offline')) {
    return 'Connection issue detected. Please check your internet.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please try again later.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  
  return 'Unable to connect. Please try again.';
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('offline')) {
      console.error("StripeIt - Connection Audit: Client is reporting as offline.");
    }
  }
}

testConnection();
