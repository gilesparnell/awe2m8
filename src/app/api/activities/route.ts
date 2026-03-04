/**
 * Activities API Route (Enhanced with Live OpenClaw Sessions)
 *
 * GET /api/activities — returns activities from:
 * 1. Firebase activities collection (historical)
 * 2. Live OpenClaw sessions (real-time)
 *
 * Bypasses Firestore security rules via Admin SDK
 */

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLiveOpenClawTasks, MissionControlTask } from '@/lib/openclaw-bridge';

// Activity types matching the frontend expectations
interface Activity {
  id: string;
  type: string;
  agentName: string;
  agentColor: string;
  message: string;
  timestamp: string;
  relativeTime: string;
  cost: number;
  category?: 'agent_work' | 'system_operations' | 'infrastructure' | 'cost_monitoring';
  metadata?: {
    branch?: string;
    workdir?: string;
    sessionKey?: string;
    model?: string;
    runtime?: number;
    estimatedCost?: number;
    systemOperation?: string;
  };
}

// Agent display info mapping
const AGENT_DISPLAY_INFO: Record<string, { name: string; color: string }> = {
  'silk': { name: 'Silk (Prince Kheldar)', color: 'blue' },
  'barak': { name: 'Barak (The Bear)', color: 'green' },
  'beldin': { name: 'Beldin (The Cynic)', color: 'slate' },
  'polgara': { name: 'Polgara (The Sorceress)', color: 'amber' },
  'cenedra': { name: "Ce'Nedra (The Queen)", color: 'rose' },
  'taiba': { name: 'Taiba (The Seer)', color: 'indigo' },
  'durnik': { name: 'Durnik (The Smith)', color: 'purple' },
  'belgarath': { name: 'Belgarath (The Eternal)', color: 'red' },
  'relg': { name: 'Relg (The Zealot)', color: 'orange' },
  'errand': { name: 'Errand (The Child)', color: 'violet' },
  'mandorallen': { name: 'Mandorallen (The Knight)', color: 'silver' },
  'garion': { name: 'Garion (Belgarion)', color: 'purple' },
};

// Cache for cost lookups to avoid repeated queries
const costCache: Map<string, number> = new Map();

export async function GET() {
  try {
    // Fetch both Firebase activities and live OpenClaw tasks in parallel
    const [firebaseActivities, liveTasks] = await Promise.all([
      fetchFirebaseActivities(),
      getLiveOpenClawTasks(),
    ]);

    // Fetch costs for live tasks from Firestore activities
    const taskCosts = await fetchTaskCosts(liveTasks);

    // Convert live tasks to activities with real cost data
    const liveActivities = tasksToActivities(liveTasks, taskCosts);

    // Generate system activities (heartbeat, oversight, backup, cost monitoring)
    const systemActivities = generateSystemActivities();

    // Merge and sort (newest first)
    const allActivities = [...liveActivities, ...firebaseActivities, ...systemActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50); // Keep last 50

    return NextResponse.json({
      success: true,
      activities: allActivities,
      _meta: {
        source: 'firebase+openclaw+system',
        liveCount: liveActivities.length,
        firebaseCount: firebaseActivities.length,
        systemCount: systemActivities.length,
      }
    });
  } catch (error) {
    console.error('[API] Activities error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Fetch activities from Firebase
 */
async function fetchFirebaseActivities(): Promise<Activity[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('activities')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.()
        ? data.timestamp.toDate().toISOString()
        : new Date(data.timestamp).toISOString();

      return {
        id: doc.id,
        type: data.type || 'task_started',
        agentName: data.agentName || 'System',
        agentColor: data.agentColor || 'gray',
        message: data.message || data.description || 'Activity recorded',
        timestamp,
        relativeTime: formatTimeAgo(new Date(timestamp)),
        cost: typeof data.cost === 'number' ? data.cost : 0,
        category: data.category || getActivityCategory(data.type),
        metadata: data.metadata || {},
      };
    });
  } catch (error) {
    console.error('[Activities] Firebase fetch error:', error);
    return [];
  }
}

/**
 * Determine activity category based on type
 */
function getActivityCategory(type: string): Activity['category'] {
  const systemOps = ['heartbeat', 'oversight', 'maintenance', 'oversight_report'];
  const infrastructure = ['backup_complete', 'health_check', 'cleanup'];
  const costMonitoring = ['budget_alert', 'cost_report', 'usage_tracking'];
  
  if (systemOps.includes(type)) return 'system_operations';
  if (infrastructure.includes(type)) return 'infrastructure';
  if (costMonitoring.includes(type)) return 'cost_monitoring';
  return 'agent_work';
}

/**
 * Fetch costs for tasks from Firestore activities collection
 * Looks up spawn and complete activities to get estimated and actual costs
 */
async function fetchTaskCosts(tasks: MissionControlTask[]): Promise<Map<string, { cost: number; estimatedCost: number }>> {
  const costs = new Map<string, { cost: number; estimatedCost: number }>();

  if (tasks.length === 0) return costs;

  try {
    const db = getAdminDb();

    // Get all task IDs from the live tasks
    const taskIds = tasks.map(t => t.id.replace('openclaw-', ''));

    // Query activities for agent spawns and completions in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [spawnSnapshot, completeSnapshot] = await Promise.all([
      db.collection('activities')
        .where('category', '==', 'agent')
        .where('action', '==', 'spawn')
        .where('timestamp', '>=', oneDayAgo)
        .limit(100)
        .get(),
      db.collection('activities')
        .where('category', '==', 'task')
        .where('action', '==', 'complete')
        .where('timestamp', '>=', oneDayAgo)
        .limit(100)
        .get()
    ]);

    // Process spawn activities to get estimated costs
    spawnSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const taskId = data.metadata?.taskId;
      if (taskId && data.metadata?.estimatedCost) {
        const existing = costs.get(taskId) || { cost: 0, estimatedCost: 0 };
        existing.estimatedCost = data.metadata.estimatedCost;
        costs.set(taskId, existing);
      }
    });

    // Process complete activities to get actual costs
    completeSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const taskId = data.taskId || data.metadata?.taskId;
      if (taskId) {
        const existing = costs.get(taskId) || { cost: 0, estimatedCost: 0 };
        // Use actual cost from the activity if available
        if (typeof data.cost === 'number') {
          existing.cost = data.cost;
        }
        // Also check metadata for actualCost
        if (data.metadata?.actualCost) {
          existing.cost = data.metadata.actualCost;
        }
        costs.set(taskId, existing);
      }
    });

    return costs;
  } catch (error) {
    console.error('[Activities] Error fetching task costs:', error);
    return costs;
  }
}

/**
 * Convert live OpenClaw tasks to activities with real cost data
 */
function tasksToActivities(
  tasks: MissionControlTask[],
  taskCosts: Map<string, { cost: number; estimatedCost: number }>
): Activity[] {
  const activities: Activity[] = [];

  for (const task of tasks) {
    const agentInfo = AGENT_DISPLAY_INFO[task.agent] || {
      name: task.agent.charAt(0).toUpperCase() + task.agent.slice(1),
      color: 'green'
    };

    // Get cost data for this task
    const taskId = task.id.replace('openclaw-', '');
    const costData = taskCosts.get(taskId);

    // Use actual cost if available, otherwise use task's cost or estimated cost
    const actualCost = task.cost ?? costData?.cost ?? 0;
    const estimatedCost = task.estimatedCost ?? costData?.estimatedCost ?? 0;

    // Create "started" activity with estimated cost
    activities.push({
      id: `${task.id}-started`,
      type: 'task_started',
      agentName: agentInfo.name,
      agentColor: agentInfo.color,
      message: `Spawned: ${task.description}`,
      timestamp: task.startedAt,
      relativeTime: formatTimeAgo(new Date(task.startedAt)),
      cost: estimatedCost, // Show estimated cost for started tasks
      category: 'agent_work',
      metadata: {
        branch: task.branch,
        workdir: task.workdir,
        sessionKey: task.sessionKey,
        model: task.model,
        estimatedCost,
      },
    });

    // Create "completed" or "failed" activity if applicable
    if (task.status === 'completed' && task.completedAt) {
      activities.push({
        id: `${task.id}-completed`,
        type: 'task_completed',
        agentName: agentInfo.name,
        agentColor: agentInfo.color,
        message: `Completed: ${task.description}`,
        timestamp: task.completedAt,
        relativeTime: formatTimeAgo(new Date(task.completedAt)),
        cost: actualCost, // Show actual cost for completed tasks
        category: 'agent_work',
        metadata: {
          branch: task.branch,
          workdir: task.workdir,
          sessionKey: task.sessionKey,
          model: task.model,
          runtime: task.runtime,
          estimatedCost,
        },
      });
    } else if (task.status === 'failed') {
      activities.push({
        id: `${task.id}-failed`,
        type: 'task_failed',
        agentName: agentInfo.name,
        agentColor: agentInfo.color,
        message: `Failed: ${task.description}`,
        timestamp: task.startedAt, // Use started as fallback
        relativeTime: formatTimeAgo(new Date(task.startedAt)),
        cost: actualCost || estimatedCost, // Show actual or estimated cost for failed tasks
        category: 'agent_work',
        metadata: {
          branch: task.branch,
          workdir: task.workdir,
          sessionKey: task.sessionKey,
          model: task.model,
          runtime: task.runtime,
          estimatedCost,
        },
      });
    }
  }

  return activities;
}

/**
 * Generate system activities for demo/testing
 * In production, these would come from actual system monitoring
 */
function generateSystemActivities(): Activity[] {
  const now = new Date();
  const activities: Activity[] = [];

  // Heartbeat activity (every 30 minutes)
  activities.push({
    id: `heartbeat-${now.getTime()}`,
    type: 'heartbeat',
    agentName: 'Garion (System)',
    agentColor: 'purple',
    message: 'Heartbeat: System health check complete',
    timestamp: new Date(now.getTime() - 3 * 60000).toISOString(),
    relativeTime: '3m ago',
    cost: 0,
    category: 'system_operations',
    metadata: { systemOperation: 'health_check' },
  });

  // Oversight activity
  activities.push({
    id: `oversight-${now.getTime()}`,
    type: 'oversight',
    agentName: 'Beldin (QA)',
    agentColor: 'slate',
    message: 'Oversight: Reviewed active sessions',
    timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
    relativeTime: '15m ago',
    cost: 0,
    category: 'system_operations',
    metadata: { systemOperation: 'oversight' },
  });

  // Backup activity
  activities.push({
    id: `backup-${now.getTime()}`,
    type: 'backup_complete',
    agentName: 'System (Automated)',
    agentColor: 'gray',
    message: 'Backup: Workspace backup completed',
    timestamp: new Date(now.getTime() - 6 * 60 * 60000).toISOString(),
    relativeTime: '6h ago',
    cost: 0,
    category: 'infrastructure',
    metadata: { systemOperation: 'backup' },
  });

  // Cost monitoring activity
  activities.push({
    id: `cost-${now.getTime()}`,
    type: 'cost_report',
    agentName: 'System (Cost)',
    agentColor: 'amber',
    message: 'Budget: Daily spend $12.50 (under $20 limit)',
    timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
    relativeTime: '2m ago',
    cost: 0,
    category: 'cost_monitoring',
    metadata: { systemOperation: 'budget_alert' },
  });

  return activities;
}

/**
 * Format timestamp as relative time
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}