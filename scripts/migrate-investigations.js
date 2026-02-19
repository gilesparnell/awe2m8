#!/usr/bin/env node
/**
 * Firestore Migration Script
 * 
 * Sets up collections and sample data for the Investigation system.
 * Run: node scripts/migrate-investigations.js
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
}, 'migration');

const db = getFirestore(app);

async function migrate() {
  console.log('🚀 Starting Firestore Migration\n');
  console.log('=' .repeat(60));
  
  // Create sample Area of Investigation
  console.log('\n📁 Creating sample Area of Investigation...');
  
  const areaRef = await db.collection('areas_of_investigation').add({
    title: 'Research AI Receptionist Competitors',
    description: 'Deep analysis of the AI receptionist market including Dialpad, Smith.ai, Ruby Receptionists, and emerging players. Focus on pricing, features, and market positioning.',
    agentId: 'barak',
    status: 'in_progress',
    priority: 'P1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    startedAt: Timestamp.now(),
    userStoryIds: [],
    progressPercent: 35,
    estimatedHours: 8,
    actualHours: 3,
  });
  
  console.log(`✅ Created Area: ${areaRef.id}`);
  
  // Create User Stories
  console.log('\n📋 Creating User Stories...');
  
  const story1Ref = await db.collection('user_stories').add({
    title: 'Analyze Dialpad pricing and features',
    description: 'Comprehensive review of Dialpad\'s AI receptionist offering including pricing tiers, key features, integration capabilities, and customer reviews.',
    areaId: areaRef.id,
    agentId: 'barak',
    status: 'done',
    priority: 'P1',
    acceptanceCriteria: [
      'Document all pricing tiers',
      'List key features with screenshots',
      'Identify integration partners',
      'Summarize customer sentiment from reviews'
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    startedAt: Timestamp.now(),
    completedAt: Timestamp.now(),
    taskIds: [],
    deliverableUrl: 'vscode://file/Users/gilesparnell/Documents/VSStudio/awe2m8-local/research/dialpad_analysis.md',
    deliverableType: 'markdown',
    estimatedHours: 3,
    actualHours: 2.5,
  });
  
  console.log(`✅ Created Story 1: ${story1Ref.id}`);
  
  const story2Ref = await db.collection('user_stories').add({
    title: 'Analyze Smith.ai positioning',
    description: 'Research Smith.ai\'s unique value proposition, target market, pricing strategy, and competitive advantages in the AI receptionist space.',
    areaId: areaRef.id,
    agentId: 'barak',
    status: 'in_progress',
    priority: 'P1',
    acceptanceCriteria: [
      'Document pricing structure',
      'Identify target customer segments',
      'Analyze unique selling propositions',
      'Compare feature set to Dialpad'
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    startedAt: Timestamp.now(),
    taskIds: [],
    estimatedHours: 3,
    actualHours: 0.5,
  });
  
  console.log(`✅ Created Story 2: ${story2Ref.id}`);
  
  const story3Ref = await db.collection('user_stories').add({
    title: 'Compare feature matrix across competitors',
    description: 'Create comprehensive feature comparison matrix including Dialpad, Smith.ai, Ruby Receptionists, and other key players.',
    areaId: areaRef.id,
    agentId: 'barak',
    status: 'inbox',
    priority: 'P2',
    acceptanceCriteria: [
      'Create comparison spreadsheet',
      'Score each competitor on key features',
      'Identify gaps in the market',
      'Recommend positioning for awe2m8'
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    taskIds: [],
    estimatedHours: 2,
    actualHours: 0,
    blockedBy: [story1Ref.id, story2Ref.id],
  });
  
  console.log(`✅ Created Story 3: ${story3Ref.id}`);
  
  // Create Tasks
  console.log('\n✅ Creating Tasks...');
  
  const task1Ref = await db.collection('tasks').add({
    title: 'Scrape Dialpad pricing page',
    storyId: story1Ref.id,
    agentId: 'barak',
    status: 'completed',
    type: 'research',
    artifactUrl: 'vscode://file/Users/gilesparnell/Documents/VSStudio/awe2m8-local/research/dialpad_pricing.md',
    artifactType: 'file',
    description: 'Extract all pricing information from dialpad.com/pricing',
    result: 'Successfully captured all pricing tiers: Standard ($15), Pro ($25), Enterprise (custom)',
    createdAt: Timestamp.now(),
    startedAt: Timestamp.now(),
    completedAt: Timestamp.now(),
    progress: 'Completed',
    cost: 0.05,
    exitCode: 0,
  });
  
  console.log(`✅ Created Task 1: ${task1Ref.id}`);
  
  const task2Ref = await db.collection('tasks').add({
    title: 'Read Smith.ai about page',
    storyId: story2Ref.id,
    agentId: 'barak',
    status: 'running',
    type: 'research',
    artifactUrl: 'vscode://file/Users/gilesparnell/Documents/VSStudio/awe2m8-local/research/smithai_about.md',
    artifactType: 'file',
    description: 'Extract company positioning and value proposition from smith.ai',
    createdAt: Timestamp.now(),
    startedAt: Timestamp.now(),
    progress: 'Reading about page and company history...',
    cost: 0.02,
  });
  
  console.log(`✅ Created Task 2: ${task2Ref.id}`);
  
  // Update stories with task IDs
  await db.collection('user_stories').doc(story1Ref.id).update({
    taskIds: [task1Ref.id],
  });
  
  await db.collection('user_stories').doc(story2Ref.id).update({
    taskIds: [task2Ref.id],
  });
  
  // Update area with story IDs
  await db.collection('areas_of_investigation').doc(areaRef.id).update({
    userStoryIds: [story1Ref.id, story2Ref.id, story3Ref.id],
  });
  
  // Create Considerations
  console.log('\n💡 Creating Considerations...');
  
  await db.collection('considerations').add({
    areaId: areaRef.id,
    type: 'opportunity',
    title: 'Smith.ai raised $50M Series B',
    description: 'Recent funding indicates market validation. Pricing may become more aggressive.',
    severity: 'warning',
    status: 'active',
    createdBy: 'agent',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  await db.collection('considerations').add({
    areaId: areaRef.id,
    type: 'risk_assessment',
    title: 'Dialpad has enterprise moat',
    description: 'Strong enterprise integrations may make it hard to compete at high end.',
    severity: 'info',
    status: 'active',
    createdBy: 'agent',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  console.log(`✅ Created 2 considerations`);
  
  // Create Activity
  console.log('\n📊 Creating Activity Log...');
  
  await db.collection('activities').add({
    timestamp: Timestamp.now(),
    actor: 'garion',
    actorType: 'main',
    category: 'system',
    action: 'create',
    description: 'Migration: Created sample investigation data for testing',
    metadata: {
      areaId: areaRef.id,
      storiesCreated: 3,
      tasksCreated: 2,
    },
    sessionId: 'migration',
  });
  
  console.log(`✅ Created activity log`);
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Migration Complete!');
  console.log('\nCreated:');
  console.log('  - 1 Area of Investigation');
  console.log('  - 3 User Stories');
  console.log('  - 2 Tasks');
  console.log('  - 2 Considerations');
  console.log('\nOpen Mission Control to see the new structure!');
  console.log('=' .repeat(60));
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
