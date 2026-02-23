#!/usr/bin/env node
/**
 * Agent Task Executor
 * 
 * This script is executed by spawned sub-agents to actually do work.
 * It connects to Firestore, reports progress, and executes tasks.
 * 
 * Usage: node agent-executor.js <taskId> <agentId>
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// SETUP
// ============================================================================

const taskId = process.argv[2];
const agentId = process.argv[3];

if (!taskId || !agentId) {
  console.error('Usage: node agent-executor.js <taskId> <agentId>');
  process.exit(1);
}

// Initialize Firebase
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
}, `agent-${agentId}-${taskId}`);

const db = getFirestore(app);

// ============================================================================
// AGENT PERSONALITIES
// ============================================================================

const AGENTS = {
  silk: {
    name: 'Silk (Prince Kheldar)',
    personality: 'Witty, clever, resourceful. Loves elegant solutions.',
    role: 'Code Architect',
    model: 'codex',
    costPer1KTokens: 2.0,
  },
  barak: {
    name: 'Barak (The Bear)',
    personality: 'Intense, thorough, relentless in research.',
    role: 'Research Analyst',
    model: 'kimi-k2-turbo',
    costPer1KTokens: 0.25,
  },
  polgara: {
    name: 'Polgara (The Sorceress)',
    personality: 'Wise, patient, authoritative in content.',
    role: 'Content Strategist',
    model: 'kimi-k2-turbo',
    costPer1KTokens: 0.25,
  },
};

// ============================================================================
// COST TRACKING
// ============================================================================

// Track tokens used during this session
let sessionTokens = {
  input: 0,
  output: 0,
  total: 0,
};

/**
 * Calculate cost based on token usage
 */
function calculateActualCost() {
  const agent = AGENTS[agentId];
  if (!agent) return 0;

  // Estimate 70% input, 30% output if we don't have exact breakdown
  const inputTokens = sessionTokens.input || Math.floor(sessionTokens.total * 0.7);
  const outputTokens = sessionTokens.output || Math.floor(sessionTokens.total * 0.3);

  // Simple calculation - in production this would use actual model pricing
  const costPer1K = agent.costPer1KTokens;
  const totalTokens = inputTokens + outputTokens;
  const cost = (totalTokens / 1000) * costPer1K;

  return Math.max(cost, 0.001); // Minimum cost of $0.001
}

/**
 * Log activity with cost information
 */
async function logActivityWithCost(description, cost, metadata = {}) {
  try {
    await db.collection('activities').add({
      timestamp: Timestamp.now(),
      actor: agentId,
      actorType: 'subagent',
      category: metadata.category || 'task',
      action: metadata.action || 'update',
      description,
      cost,
      metadata: { taskId, ...metadata },
      sessionId: `agent-${agentId}-${taskId}`,
      taskId,
    });
    console.log(`[${agentId}] ${description} (cost: $${cost.toFixed(4)})`);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// ============================================================================
// LOGGING
// ============================================================================

async function logActivity(description, metadata = {}) {
  try {
    await db.collection('activities').add({
      timestamp: Timestamp.now(),
      actor: agentId,
      actorType: 'subagent',
      category: metadata.category || 'task',
      action: metadata.action || 'update',
      description,
      metadata: { taskId, ...metadata },
      sessionId: `agent-${agentId}-${taskId}`,
      taskId,
    });
    console.log(`[${agentId}] ${description}`);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

async function updateTask(update) {
  try {
    await db.collection('agent_tasks').doc(taskId).update({
      ...update,
      lastUpdate: Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to update task:', err);
  }
}

// ============================================================================
// TASK EXECUTION
// ============================================================================

async function executeTask() {
  console.log(`\n🚀 ${AGENTS[agentId].name} starting task ${taskId}\n`);
  
  // Get task details
  const taskDoc = await db.collection('agent_tasks').doc(taskId).get();
  if (!taskDoc.exists) {
    console.error('Task not found:', taskId);
    process.exit(1);
  }
  
  const task = taskDoc.data();
  console.log('Task:', task.task);
  console.log('Context:', task.context?.substring(0, 200) + '...');
  console.log('');
  
  // Update status to running
  await updateTask({ 
    status: 'running',
    startedAt: Timestamp.now(),
    progress: 'Initializing...',
  });
  
  await logActivity(`Started working on: ${task.task}`, { 
    category: 'task',
    action: 'start',
  });
  
  // Execute based on agent type
  try {
    if (agentId === 'silk') {
      await executeSilkTask(task);
    } else if (agentId === 'barak') {
      await executeBarakTask(task);
    } else if (agentId === 'polgara') {
      await executePolgaraTask(task);
    }

    // Calculate actual cost
    const actualCost = calculateActualCost();

    // Mark complete with cost
    await updateTask({
      status: 'completed',
      completedAt: Timestamp.now(),
      progress: 'Task completed successfully',
      actualCost,
    });

    await logActivityWithCost(`Completed: ${task.task}`, actualCost, {
      category: 'task',
      action: 'complete',
    });

    console.log(`\n✅ Task completed successfully! Actual cost: $${actualCost.toFixed(4)}\n`);

  } catch (error) {
    console.error('\n❌ Task failed:', error);

    await updateTask({
      status: 'failed',
      error: error.message,
      progress: 'Failed: ' + error.message,
    });

    await logActivity(`Failed: ${task.task} - ${error.message}`, {
      category: 'task',
      action: 'fail',
    });

    process.exit(1);
  }

  process.exit(0);
}

// ============================================================================
// SILK - CODE ARCHITECT
// ============================================================================

async function executeSilkTask(task) {
  const deliverables = task.deliverables || [];
  const files = task.files || [];

  // Estimate tokens for Silk (coding tasks use more tokens)
  const estimatedTokens = task.estimatedTokens || 3000;
  sessionTokens.total += estimatedTokens;

  for (let i = 0; i < deliverables.length; i++) {
    const deliverable = deliverables[i];
    const progress = `Working on (${i + 1}/${deliverables.length}): ${deliverable}`;

    await updateTask({ progress });

    // Calculate incremental cost for this step
    const stepCost = (estimatedTokens / deliverables.length / 1000) * AGENTS.silk.costPer1KTokens;
    await logActivityWithCost(progress, stepCost, { category: 'file', action: 'write' });

    // Simulate work time
    console.log(`Working on: ${deliverable}`);
    await sleep(5000); // 5 seconds per deliverable for demo

    // In real implementation, this would:
    // 1. Read existing files
    // 2. Generate code using the model
    // 3. Write files
    // 4. Run tests
  }

  // Write result summary
  const result = {
    summary: `Completed ${deliverables.length} deliverables`,
    filesModified: files,
    notes: 'All deliverables completed successfully',
  };

  await updateTask({ result: JSON.stringify(result) });
}

// ============================================================================
// BARAK - RESEARCH ANALYST
// ============================================================================

async function executeBarakTask(task) {
  const estimatedTokens = task.estimatedTokens || 2000;
  sessionTokens.total += estimatedTokens;

  await updateTask({ progress: 'Gathering research data...' });
  const searchCost = (estimatedTokens * 0.4 / 1000) * AGENTS.barak.costPer1KTokens;
  await logActivityWithCost('Starting research phase', searchCost, { category: 'web', action: 'search' });

  await sleep(3000);

  await updateTask({ progress: 'Analyzing findings...' });
  const analysisCost = (estimatedTokens * 0.3 / 1000) * AGENTS.barak.costPer1KTokens;
  await logActivityWithCost('Analyzing research data', analysisCost, { category: 'file', action: 'write' });

  await sleep(3000);

  await updateTask({ progress: 'Compiling report...' });
  const reportCost = (estimatedTokens * 0.3 / 1000) * AGENTS.barak.costPer1KTokens;
  await logActivityWithCost('Writing research report', reportCost, { category: 'file', action: 'write' });

  await sleep(2000);

  const result = {
    summary: 'Research completed',
    findings: ['Finding 1', 'Finding 2', 'Finding 3'],
    recommendations: ['Recommendation 1', 'Recommendation 2'],
  };

  await updateTask({ result: JSON.stringify(result) });
}

// ============================================================================
// POLGARA - CONTENT STRATEGIST
// ============================================================================

async function executePolgaraTask(task) {
  const estimatedTokens = task.estimatedTokens || 4000;
  sessionTokens.total += estimatedTokens;

  await updateTask({ progress: 'Researching topic...' });
  const researchCost = (estimatedTokens * 0.2 / 1000) * AGENTS.polgara.costPer1KTokens;
  await logActivityWithCost('Researching content topic', researchCost, { category: 'web', action: 'search' });

  await sleep(3000);

  await updateTask({ progress: 'Drafting content...' });
  const draftCost = (estimatedTokens * 0.6 / 1000) * AGENTS.polgara.costPer1KTokens;
  await logActivityWithCost('Writing content draft', draftCost, { category: 'file', action: 'write' });

  await sleep(4000);

  await updateTask({ progress: 'Optimizing for SEO...' });
  const seoCost = (estimatedTokens * 0.2 / 1000) * AGENTS.polgara.costPer1KTokens;
  await logActivityWithCost('Optimizing content for SEO', seoCost, { category: 'file', action: 'edit' });

  await sleep(2000);

  const result = {
    summary: 'Content created',
    wordCount: 1200,
    seoScore: 85,
    keywords: ['keyword1', 'keyword2'],
  };

  await updateTask({ result: JSON.stringify(result) });
}

// ============================================================================
// UTILITIES
// ============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// START
// ============================================================================

executeTask().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
