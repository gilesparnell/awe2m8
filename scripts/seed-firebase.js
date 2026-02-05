#!/usr/bin/env node
/**
 * Firebase Seed Script
 * 
 * Seeds Firestore with initial demo data so the dashboard shows
 * "Connected to Firebase" with sample agent/client entries.
 * 
 * Usage:
 *   node scripts/seed-firebase.js
 * 
 * Required env vars (from .env.local):
 *   - FIREBASE_ADMIN_PROJECT_ID
 *   - FIREBASE_ADMIN_CLIENT_EMAIL  
 *   - FIREBASE_ADMIN_PRIVATE_KEY
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load env vars from .env.local
require('dotenv').config({ path: '.env.local' });

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ FIREBASE_ADMIN_PRIVATE_KEY is missing');
    console.error('Make sure your .env.local file has the Firebase Admin credentials.');
    process.exit(1);
  }

  // Handle various formatting issues
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    const body = privateKey.trim();
    privateKey = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
  }

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    console.error('❌ Missing Firebase Admin SDK credentials');
    process.exit(1);
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const SAMPLE_AGENTS = [
  {
    id: 'fury',
    name: 'Fury',
    role: 'Lead Qualification Analyst',
    status: 'active',
    currentTask: 'Researching AI receptionist competitors',
    lastActivity: 'Just now',
    color: 'green',
    icon: 'Target',
    updatedAt: new Date()
  },
  {
    id: 'friday',
    name: 'Friday',
    role: 'Voice/SMS Workflow Architect',
    status: 'active',
    currentTask: 'Designing tradie workflow',
    lastActivity: 'Just now',
    color: 'blue',
    icon: 'Bot',
    updatedAt: new Date()
  },
  {
    id: 'loki',
    name: 'Loki',
    role: 'Content & SEO Strategist',
    status: 'active',
    currentTask: 'Writing blog post',
    lastActivity: 'Just now',
    color: 'amber',
    icon: 'FileText',
    updatedAt: new Date()
  }
];

const SAMPLE_TASKS = [
  {
    id: 'task-001',
    title: 'Competitive Analysis: AI Receptionist Market',
    agentId: 'fury',
    status: 'in_progress',
    description: 'Research Dialpad, Smith.ai, Ruby Receptionists',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'task-002',
    title: 'Go High Level Workflow for Tradies',
    agentId: 'friday',
    status: 'in_progress',
    description: 'Voice scripts, SMS sequences, lead capture',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'task-003',
    title: 'Blog Post: Tradies Missed Calls',
    agentId: 'loki',
    status: 'in_progress',
    description: 'SEO-optimized content with CTA',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const SAMPLE_ACTIVITIES = [
  {
    id: 'activity-001',
    type: 'task_started',
    agentName: 'Fury',
    message: 'Started competitive analysis research',
    createdAt: new Date()
  },
  {
    id: 'activity-002',
    type: 'task_started',
    agentName: 'Friday',
    message: 'Designing Go High Level workflow',
    createdAt: new Date(Date.now() - 300000) // 5 mins ago
  },
  {
    id: 'activity-003',
    type: 'task_started',
    agentName: 'Loki',
    message: 'Writing blog post content',
    createdAt: new Date(Date.now() - 180000) // 3 mins ago
  }
];

async function seedCollection(db, collectionName, items) {
  console.log(`🌱 Seeding ${collectionName}...`);
  
  const collection = db.collection(collectionName);
  
  for (const item of items) {
    const { id, ...data } = item;
    const docRef = collection.doc(id);
    
    const existing = await docRef.get();
    if (existing.exists) {
      console.log(`  ⏭️  Skipping "${data.name || data.title || id}" (already exists)`);
      continue;
    }
    
    await docRef.set(data);
    console.log(`  ✅ Created "${data.name || data.title || id}"`);
  }
  console.log('');
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('       Firebase Seed Script');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Initialize Firebase Admin
    console.log('🔌 Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin();
    const db = getFirestore();
    console.log('✅ Firebase Admin connected\n');

    // Seed collections
    await seedCollection(db, 'agents', SAMPLE_AGENTS);
    await seedCollection(db, 'tasks', SAMPLE_TASKS);
    await seedCollection(db, 'activities', SAMPLE_ACTIVITIES);

    console.log('═══════════════════════════════════════════');
    console.log('       🎉 Seeding Complete!');
    console.log('═══════════════════════════════════════════\n');
    
    console.log('Your Mission Control dashboard now has:');
    console.log('  • 3 AI agents (Fury, Friday, Loki)');
    console.log('  • 3 sample tasks across the kanban board');
    console.log('  • Recent activity feed entries\n');
    
    console.log('Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Open: http://localhost:3000/admin/mission-control');
    console.log('  3. You should see "Connected to Firebase"\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  • Ensure .env.local has Firebase Admin credentials');
    console.error('  • Check your Firebase project has Firestore enabled');
    console.error('  • Verify the private key is properly formatted\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
