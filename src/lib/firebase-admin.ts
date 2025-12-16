import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID ||
      !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
      !privateKey) {
    throw new Error('Missing Firebase Admin SDK credentials');
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

export function getAdminDb(): Firestore {
  if (!adminApp) {
    adminApp = initializeFirebaseAdmin();
  }
  if (!adminDb) {
    adminDb = getFirestore(adminApp);
  }
  return adminDb;
}

export interface AdminUser {
  email: string;
  name?: string;
  role: string;
  createdAt?: number;
  lastLogin?: number;
}

// Check if email is in admin whitelist
export async function isAdminEmail(email: string): Promise<boolean> {
  const db = getAdminDb();
  const adminDoc = await db.collection('admin_users').doc(email.toLowerCase()).get();
  return adminDoc.exists;
}

// Get admin user data
export async function getAdminUser(email: string): Promise<AdminUser | null> {
  const db = getAdminDb();
  const adminDoc = await db.collection('admin_users').doc(email.toLowerCase()).get();
  if (!adminDoc.exists) return null;
  return { email: adminDoc.id, ...adminDoc.data() } as AdminUser;
}

// Update last login timestamp
export async function updateLastLogin(email: string): Promise<void> {
  const db = getAdminDb();
  await db.collection('admin_users').doc(email.toLowerCase()).update({
    lastLogin: Date.now(),
  });
}
