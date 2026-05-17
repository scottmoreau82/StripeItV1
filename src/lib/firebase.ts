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

import { initializeFirestore } from 'firebase/firestore';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use initializeFirestore to enable ignoreUndefinedProperties
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');

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
export function mapFirestoreError(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code === 'permission-denied' || 
      message.toLowerCase().includes('permission-denied') || 
      message.toLowerCase().includes('insufficient permissions')) {
    return 'Permission denied. You do not have access to this dealership resource.';
  }
  if (code === 'unavailable' || message.includes('unavailable')) {
    return 'StripeIt service is temporarily unavailable. Please try again soon.';
  }
  if (code === 'failed-precondition' || message.includes('index')) {
    return 'The requested data view is currently being optimized. Please try again in a few minutes.';
  }
  if (code === 'not-found' || message.includes('not-found')) {
    return 'The requested dealership document could not be found.';
  }
  if (code === 'deadline-exceeded' || message.includes('timeout')) {
    return 'The operation timed out. Please check your connection.';
  }
  if (message.includes('offline') || message.includes('network')) {
    return 'Connection issue detected. Please check your internet.';
  }
  
  return 'Unable to process dealership data. Please try again.';
}

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
  
  const friendlyMessage = mapFirestoreError(error);
  console.error(`Firestore Error [${operationType}] at [${path}]:`, JSON.stringify(errInfo));
  
  // Create a new error with the friendly message as the main message, 
  // but keep the detailed JSON string as the secondary identifier for diagnostic tools
  const finalError = new Error(friendlyMessage);
  (finalError as any).details = errInfo;
  (finalError as any).isFirestoreError = true;
  
  // We still throw the JSON string if the system specifically expects it for automated diagnosis,
  // but the prompt says "normalize Firebase/Firestore errors" and "surface operational-safe errors".
  // The system instruction says: The new error's message MUST be a JSON string that conforms to FirestoreErrorInfo.
  // CRITICAL: "The new error's message MUST be a JSON string that conforms to FirestoreErrorInfo defined below."
  // Okay, I must stick to the JSON string message for the "system" to diagnose it.
  
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Utility for UI components to extract user-friendly messages from handled Firestore errors.
 */
export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred.';
  
  const message = error.message || String(error);
  
  try {
    const errInfo = JSON.parse(message);
    if (errInfo && typeof errInfo === 'object' && 'operationType' in errInfo) {
      // It's a FirestoreErrorInfo JSON string
      return mapFirestoreError(errInfo.error);
    }
  } catch (e) {
    // Not a JSON string or not our format
  }
  
  // Fallback to mapping the message directly if it looks like a Firebase error
  return mapFirestoreError(error);
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
