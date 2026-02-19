#!/usr/bin/env node
/**
 * Diagnose Activity Feed Issues
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
if (privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
}, 'diagnose-app');

const db = getFirestore(app);

async function diagnose() {
  console.log('🔍 Diagnosing Activity Feed...\n');
  
  try {
    // Test 1: Simple query without filters
    console.log('Test 1: Simple query (orderBy timestamp only)');
    const simpleQuery = await db.collection('activities')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    console.log(`  ✅ Success - ${simpleQuery.size} activities found\n`);
    
    // Test 2: Query with actor filter
    console.log('Test 2: Query with actor filter');
    try {
      const actorQuery = await db.collection('activities')
        .where('actor', '==', 'fury')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      console.log(`  ✅ Success - ${actorQuery.size} activities found\n`);
    } catch (err) {
      console.log(`  ❌ FAILED: ${err.message}\n`);
      if (err.message.includes('index')) {
        console.log('  🔧 FIX NEEDED: Create composite index for actor + timestamp');
        console.log('     Go to: https://console.firebase.google.com/project/awe2m8-sales/firestore/indexes');
      }
    }
    
    // Test 3: Query with category filter
    console.log('Test 3: Query with category filter');
    try {
      const catQuery = await db.collection('activities')
        .where('category', '==', 'task')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      console.log(`  ✅ Success - ${catQuery.size} activities found\n`);
    } catch (err) {
      console.log(`  ❌ FAILED: ${err.message}\n`);
    }
    
    // List all activities
    console.log('All activities in database:');
    const all = await db.collection('activities').get();
    all.forEach(d => {
      const data = d.data();
      console.log(`  - ${data.actor}: ${data.description?.substring(0, 40)}`);
    });
    
  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }
  
  process.exit(0);
}

diagnose();
