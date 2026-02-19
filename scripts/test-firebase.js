#!/usr/bin/env node
/**
 * Firebase Connection Test Script
 * Tests Admin SDK connectivity and lists Firestore collections
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!privateKey) {
  console.error('❌ FIREBASE_ADMIN_PRIVATE_KEY is missing from .env.local');
  process.exit(1);
}

// Handle formatting
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
if (privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

console.log('🔑 Private key length:', privateKey.length);
console.log('📧 Client email:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
console.log('📁 Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
console.log('');

try {
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  }, 'test-app');
  
  const db = getFirestore(app);
  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log('');
  
  // List collections
  db.listCollections().then(async collections => {
    console.log('📁 Collections found:', collections.length);
    if (collections.length === 0) {
      console.log('   (none - Firestore database may be empty or not initialized)');
    } else {
      collections.forEach(col => console.log('   -', col.id));
      
      // Check for mission control collections
      const expected = ['agents', 'tasks', 'activities', 'clients', 'admin_users'];
      const found = collections.map(c => c.id);
      const missing = expected.filter(e => !found.includes(e));
      
      if (missing.length > 0) {
        console.log('');
        console.log('⚠️  Missing Mission Control collections:');
        missing.forEach(m => console.log('   -', m));
      }
    }
    
    // Try to read a document to verify permissions
    console.log('');
    console.log('🧪 Testing read permissions...');
    try {
      const testDoc = await db.collection('_test_').doc('ping').get();
      console.log('✅ Read permissions OK');
    } catch (permErr) {
      console.log('⚠️  Read test failed:', permErr.message);
    }
    
    process.exit(0);
  }).catch(err => {
    console.error('❌ Error listing collections:', err.message);
    if (err.message.includes('database does not exist')) {
      console.log('');
      console.log('🔧 FIRESTORE NOT INITIALIZED');
      console.log('   Go to: https://console.firebase.google.com/project/awe2m8-sales/firestore');
      console.log('   Click "Create database" and choose "Start in production mode"');
    }
    process.exit(1);
  });
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin:', err.message);
  process.exit(1);
}
