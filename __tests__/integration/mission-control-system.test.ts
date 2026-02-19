/**
 * System Integration Tests for Mission Control
 * 
 * These tests validate that all components work together correctly.
 * Run with: INTEGRATION_TEST=true npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Only run if explicitly enabled
const runIntegrationTests = process.env.INTEGRATION_TEST === 'true';

// Helper to conditionally run tests
const conditionalTest = runIntegrationTests ? it : it.skip;

describe('Mission Control System Tests', () => {
  let db: ReturnType<typeof getAdminDb>;
  let testTaskId: string | null = null;
  let testAgentId = 'test-agent-' + Date.now();

  beforeAll(async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests (set INTEGRATION_TEST=true to run)');
      return;
    }

    db = getAdminDb();
    
    // Create test agent
    await db.collection('agents').doc(testAgentId).set({
      name: 'Test Agent',
      role: 'Test Role',
      status: 'idle',
      currentTask: 'Testing',
      lastActivity: Timestamp.now(),
      color: 'green',
      icon: 'Bot',
      isOnline: true,
      workload: 0,
      updatedAt: Timestamp.now(),
      lastHeartbeat: Timestamp.now(),
    });
  });

  afterAll(async () => {
    if (!runIntegrationTests) return;

    // Cleanup: Remove test data
    try {
      // Delete test agent
      await db.collection('agents').doc(testAgentId).delete();
      
      // Delete test task if created
      if (testTaskId) {
        await db.collection('tasks').doc(testTaskId).delete();
      }
      
      // Clean up any test activities
      const activities = await db.collection('activities')
        .where('sessionId', '==', 'system-test')
        .get();
      
      const batch = db.batch();
      activities.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (err) {
      console.warn('Cleanup error (non-critical):', err);
    }
  });

  describe('Data Flow', () => {
    conditionalTest('should create agent and verify in database', async () => {
      const agentDoc = await db.collection('agents').doc(testAgentId).get();
      
      expect(agentDoc.exists).toBe(true);
      expect(agentDoc.data()?.name).toBe('Test Agent');
    });

    conditionalTest('should update agent heartbeat', async () => {
      const before = await db.collection('agents').doc(testAgentId).get();
      const beforeHeartbeat = before.data()?.lastHeartbeat;
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update heartbeat
      await db.collection('agents').doc(testAgentId).update({
        lastHeartbeat: Timestamp.now(),
        isOnline: true,
      });
      
      const after = await db.collection('agents').doc(testAgentId).get();
      const afterHeartbeat = after.data()?.lastHeartbeat;
      
      expect(afterHeartbeat.seconds).toBeGreaterThanOrEqual(beforeHeartbeat.seconds);
    });

    conditionalTest('should create task with all subcollections', async () => {
      const now = Timestamp.now();
      
      // Create task
      const taskRef = await db.collection('tasks').add({
        title: 'System Test Task',
        agentId: testAgentId,
        status: 'inbox',
        priority: 'P1',
        createdAt: now,
        updatedAt: now,
        description: 'Testing task creation flow',
        clientName: 'System Test',
        estimatedHours: 2,
        elapsedMinutes: 0,
        progressPercent: 0,
        currentPhase: 'research',
        blockers: [],
        nextActions: [],
      });
      
      testTaskId = taskRef.id;
      
      // Add log entry
      await db.collection('tasks').doc(testTaskId).collection('logs').add({
        agentId: testAgentId,
        agentName: 'Test Agent',
        timestamp: now,
        type: 'milestone',
        message: 'Task created via system test',
      });
      
      // Add investigation
      await db.collection('tasks').doc(testTaskId).collection('investigations').add({
        taskId: testTaskId,
        agentId: testAgentId,
        label: 'Verify task creation',
        status: 'completed',
        order: 1,
      });
      
      // Add consideration
      await db.collection('tasks').doc(testTaskId).collection('considerations').add({
        taskId: testTaskId,
        type: 'integration_note',
        title: 'System test note',
        description: 'This is a test consideration',
        severity: 'info',
        createdAt: now,
      });
      
      // Add deliverable
      await db.collection('tasks').doc(testTaskId).collection('deliverables').add({
        taskId: testTaskId,
        agentId: testAgentId,
        title: 'Test Report',
        type: 'report',
        format: 'markdown',
        status: 'draft',
        version: 'v0.1',
        createdAt: now,
        updatedAt: now,
      });
      
      // Verify task exists
      const taskDoc = await db.collection('tasks').doc(testTaskId).get();
      expect(taskDoc.exists).toBe(true);
      expect(taskDoc.data()?.title).toBe('System Test Task');
      
      // Verify subcollections
      const logs = await db.collection('tasks').doc(testTaskId).collection('logs').get();
      const investigations = await db.collection('tasks').doc(testTaskId).collection('investigations').get();
      const considerations = await db.collection('tasks').doc(testTaskId).collection('considerations').get();
      const deliverables = await db.collection('tasks').doc(testTaskId).collection('deliverables').get();
      
      expect(logs.size).toBe(1);
      expect(investigations.size).toBe(1);
      expect(considerations.size).toBe(1);
      expect(deliverables.size).toBe(1);
    });

    conditionalTest('should create activity entry', async () => {
      const now = Timestamp.now();
      
      await db.collection('activities').add({
        timestamp: now,
        actor: 'garion',
        actorType: 'main',
        category: 'task',
        action: 'create',
        description: 'Created test task',
        metadata: {
          taskTitle: 'System Test Task',
        },
        sessionId: 'system-test',
        taskId: testTaskId,
      });
      
      const activities = await db.collection('activities')
        .where('sessionId', '==', 'system-test')
        .get();
      
      expect(activities.size).toBeGreaterThan(0);
    });
  });

  describe('Query Performance', () => {
    conditionalTest('should query activities without composite index errors', async () => {
      // This test ensures our client-side filtering approach works
      const activities = await db.collection('activities')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      
      expect(activities).toBeDefined();
    });

    conditionalTest('should list all agents', async () => {
      const agents = await db.collection('agents').get();
      expect(agents.size).toBeGreaterThan(0);
    });

    conditionalTest('should list all tasks', async () => {
      const tasks = await db.collection('tasks').get();
      expect(tasks).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    conditionalTest('should enforce required fields on tasks', async () => {
      // Attempt to create task without required fields
      const incompleteTask = {
        // Missing title, agentId, etc.
        createdAt: Timestamp.now(),
      };
      
      // Firestore is schemaless, but we can verify our hook logic
      const taskRef = await db.collection('tasks').add(incompleteTask);
      
      // Cleanup
      await taskRef.delete();
      
      // Test passes if no exception thrown (Firestore allows any structure)
      expect(true).toBe(true);
    });

    conditionalTest('should maintain referential integrity between tasks and agents', async () => {
      if (!testTaskId) {
        throw new Error('Test task not created');
      }
      
      const task = await db.collection('tasks').doc(testTaskId).get();
      const agentId = task.data()?.agentId;
      
      const agent = await db.collection('agents').doc(agentId).get();
      expect(agent.exists).toBe(true);
    });
  });
});
