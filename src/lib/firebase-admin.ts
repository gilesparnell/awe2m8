import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!privateKey) {
    console.error('FIREBASE_ADMIN_PRIVATE_KEY is missing');
    throw new Error('Missing Firebase Admin SDK credentials');
  }

  // Handle various formatting issues
  // 1. Remove surrounding quotes if present
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  // 2. Handle escaped newlines (e.g. from .env files or Vercel env vars)
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // 3. Fix missing PEM headers/footers (common Vercel copy-paste error)
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.warn('[Firebase] Private Key is missing PEM headers. Attempting to fix...');
    const body = privateKey.trim();
    privateKey = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
  }

  console.log(`[Firebase] Initializing with Project ID: ${process.env.FIREBASE_ADMIN_PROJECT_ID}`);
  console.log(`[Firebase] Private Key length: ${privateKey.length}`);
  console.log(`[Firebase] Private Key start: ${privateKey.substring(0, 30)}...`);

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
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

// List all admin users
export async function listAdminUsers(): Promise<AdminUser[]> {
  const db = getAdminDb();
  // Remove orderBy to ensure we get users missing the createdAt field (manual entries)
  const snapshot = await db.collection('admin_users').get();

  const users = snapshot.docs.map(doc => ({
    email: doc.id,
    ...doc.data(),
  })) as AdminUser[];

  // Sort in memory (newest first if createdAt exists, otherwise simple fallback)
  return users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Add a new admin user
export async function addAdminUser(email: string, name: string, role: string = 'admin'): Promise<AdminUser> {
  const db = getAdminDb();
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existing = await db.collection('admin_users').doc(normalizedEmail).get();
  if (existing.exists) {
    throw new Error('User already exists');
  }

  const userData = {
    email: normalizedEmail,
    name: name.trim(),
    role,
    createdAt: Date.now(),
  };

  await db.collection('admin_users').doc(normalizedEmail).set(userData);
  return userData;
}

// Delete an admin user
export async function deleteAdminUser(email: string): Promise<void> {
  const db = getAdminDb();
  const normalizedEmail = email.toLowerCase().trim();

  const doc = await db.collection('admin_users').doc(normalizedEmail).get();
  if (!doc.exists) {
    throw new Error('User not found');
  }

  await db.collection('admin_users').doc(normalizedEmail).delete();
}
