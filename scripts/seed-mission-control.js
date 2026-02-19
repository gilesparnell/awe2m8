#!/usr/bin/env node
/**
 * Seed Mission Control Data
 * Creates agents, tasks, and activities collections
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
}, 'seed-app');

const db = getFirestore(app);

async function seedData() {
  const now = Timestamp.now();
  
  console.log('🌱 Seeding Mission Control data...\n');
  
  // 1. Create Agents
  const agents = [
    {
      id: 'fury',
      name: 'Fury',
      role: 'Lead Qualification Analyst',
      status: 'idle',
      currentTask: 'Waiting for assignment',
      lastActivity: now,
      color: 'green',
      icon: 'Target',
      isOnline: true,
      workload: 0,
      updatedAt: now,
      lastHeartbeat: now,
    },
    {
      id: 'friday',
      name: 'Friday',
      role: 'Voice/SMS Workflow Architect',
      status: 'idle',
      currentTask: 'Waiting for assignment',
      lastActivity: now,
      color: 'blue',
      icon: 'Bot',
      isOnline: true,
      workload: 0,
      updatedAt: now,
      lastHeartbeat: now,
    },
    {
      id: 'loki',
      name: 'Loki',
      role: 'Content & SEO Strategist',
      status: 'idle',
      currentTask: 'Waiting for assignment',
      lastActivity: now,
      color: 'amber',
      icon: 'FileText',
      isOnline: true,
      workload: 0,
      updatedAt: now,
      lastHeartbeat: now,
    }
  ];
  
  console.log('👥 Creating agents...');
  for (const agent of agents) {
    await db.collection('agents').doc(agent.id).set(agent);
    console.log(`   ✅ ${agent.name}`);
  }
  
  // 2. Create a sample task
  const taskId = 'task-welcome-001';
  const task = {
    id: taskId,
    title: 'Welcome to Mission Control',
    agentId: 'fury',
    status: 'in_progress',
    priority: 'P1',
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    description: 'Initial setup task to verify Mission Control is working correctly',
    clientId: null,
    clientName: 'Internal - Setup',
    estimatedHours: 2,
    elapsedMinutes: 0,
    progressPercent: 25,
    currentPhase: 'implementation',
    blockers: [],
    nextActions: ['Verify Firebase connection', 'Test real-time updates', 'Confirm task modal works']
  };
  
  console.log('\n📋 Creating sample task...');
  await db.collection('tasks').doc(taskId).set(task);
  console.log(`   ✅ ${task.title}`);
  
  // 3. Create task subcollections
  // Logs
  await db.collection('tasks').doc(taskId).collection('logs').add({
    agentId: 'fury',
    agentName: 'Fury',
    timestamp: now,
    type: 'milestone',
    message: 'Mission Control initialized and Firebase connection verified',
    details: {}
  });
  
  // Investigations
  const investigations = [
    { label: 'Verify Firebase Admin SDK connectivity', status: 'completed', order: 1 },
    { label: 'Check Firestore collections exist', status: 'completed', order: 2 },
    { label: 'Seed initial agent data', status: 'completed', order: 3 },
    { label: 'Test real-time listener updates', status: 'in_progress', order: 4 },
  ];
  
  for (const inv of investigations) {
    await db.collection('tasks').doc(taskId).collection('investigations').add({
      taskId,
      agentId: 'fury',
      ...inv
    });
  }
  
  // Considerations
  await db.collection('tasks').doc(taskId).collection('considerations').add({
    taskId,
    type: 'integration_note',
    title: 'Twilio, Thinkrr, and Assistable integrations pending',
    description: 'Once Mission Control is verified, next step is integrating external platforms for automated data sync.',
    severity: 'info',
    createdAt: now
  });
  
  // Deliverables
  await db.collection('tasks').doc(taskId).collection('deliverables').add({
    taskId,
    agentId: 'fury',
    title: 'Mission Control Setup Report',
    type: 'report',
    format: 'markdown',
    status: 'draft',
    version: 'v0.1',
    createdAt: now,
    updatedAt: now
  });
  
  console.log('   ✅ Task subcollections (logs, investigations, considerations, deliverables)');
  
  // 4. Create activities
  const activities = [
    {
      type: 'agent_online',
      agentName: 'Fury',
      message: 'came online',
      createdAt: now
    },
    {
      type: 'agent_online',
      agentName: 'Friday',
      message: 'came online',
      createdAt: now
    },
    {
      type: 'agent_online',
      agentName: 'Loki',
      message: 'came online',
      createdAt: now
    },
    {
      type: 'task_started',
      agentName: 'Fury',
      message: 'started task: Welcome to Mission Control',
      createdAt: now
    }
  ];
  
  console.log('\n📊 Creating activities...');
  for (const activity of activities) {
    await db.collection('activities').add(activity);
  }
  console.log(`   ✅ ${activities.length} activities created`);
  
  // 5. Check admin_users
  console.log('\n👤 Checking admin_users...');
  const adminSnapshot = await db.collection('admin_users').get();
  if (adminSnapshot.empty) {
    console.log('   ⚠️  No admin users found!');
    console.log('   Run: npm run create-admin your-email@example.com "Your Name"');
  } else {
    adminSnapshot.forEach(doc => {
      console.log(`   ✅ ${doc.id} (${doc.data().role})`);
    });
  }
  
  console.log('\n✨ Seeding complete!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Open: http://localhost:3005/admin/mission-control');
  console.log('   3. Sign in with Google (must be in admin_users)');
  
  process.exit(0);
}

seedData().catch(err => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
