import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * StripeItErrorHandlingSystem - Internal Mapper
 * Maps technical Firebase codes to user-friendly dealership context messages.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Permission Error Details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
