#!/usr/bin/env node
/**
 * Fix Activity Schema
 * Updates existing activities to match the ActivityLog schema
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
if (privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
}, 'fix-activity-app');

const db = getFirestore(app);

async function fixActivities() {
  console.log('🔧 Fixing activity schema...\n');
  
  const activitiesRef = db.collection('activities');
  const snapshot = await activitiesRef.get();
  
  if (snapshot.empty) {
    console.log('No activities to fix');
    process.exit(0);
  }
  
  console.log(`Found ${snapshot.size} activities to process\n`);
  
  const agentMap = {
    'Fury': 'fury',
    'Friday': 'friday',
    'Loki': 'loki',
    'Garion': 'garion',
  };
  
  const typeMap = {
    'task_started': { category: 'task', action: 'start' },
    'task_completed': { category: 'task', action: 'complete' },
    'message': { category: 'communication', action: 'send' },
    'file_created': { category: 'file', action: 'create' },
    'agent_online': { category: 'system', action: 'start' },
    'agent_offline': { category: 'system', action: 'stop' },
  };
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check if already using new schema
    if (data.actor && data.timestamp) {
      console.log(`  ⏭️  Skipping ${doc.id} (already new schema)`);
      continue;
    }
    
    // Convert old schema to new
    const agentName = data.agentName || 'system';
    const actor = agentMap[agentName] || 'system';
    const type = data.type || 'message';
    const mapped = typeMap[type] || { category: 'system', action: 'update' };
    
    const updatedData = {
      timestamp: data.createdAt || Timestamp.now(),
      actor: actor,
      actorType: actor === 'system' ? 'system' : 'subagent',
      category: mapped.category,
      action: mapped.action,
      description: data.message || 'Activity recorded',
      metadata: {
        originalType: data.type,
      },
      sessionId: 'migration',
    };
    
    await doc.ref.update(updatedData);
    console.log(`  ✅ Updated ${doc.id}: ${agentName} - ${data.message?.substring(0, 40)}...`);
  }
  
  console.log('\n✨ Activity schema fix complete!');
  process.exit(0);
}

fixActivities().catch(err => {
  console.error('❌ Fix failed:', err.message);
  process.exit(1);
});
