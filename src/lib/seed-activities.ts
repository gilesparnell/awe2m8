/**
 * Seed Activities Script
 * 
 * Seeds realistic test data into Firebase for the Mission Control dashboard.
 * Run this to populate the activities collection with sample data.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ActivityType } from '@/lib/firebase-activity-logger';

interface SeedActivity {
  type: ActivityType;
  agentName: string;
  message: string;
  cost: number;
  metadata?: Record<string, unknown>;
  minutesAgo: number;
}

// Sample activities to seed
const seedActivityData: SeedActivity[] = [
  {
    type: 'agent_spawned',
    agentName: 'Silk (Prince Kheldar)',
    message: 'Spawned for: Task Board workflow design',
    cost: 0.02,
    metadata: { task: 'Task Board workflow design', priority: 'P0' },
    minutesAgo: 5,
  },
  {
    type: 'oversight_report',
    agentName: 'Beldin (The Cynic)',
    message: 'Oversight report: Daily agent performance review',
    cost: 0.01,
    metadata: { reportType: 'Daily agent performance review', issuesFound: 0 },
    minutesAgo: 15,
  },
  {
    type: 'backup_complete',
    agentName: 'Durnik (The Smith)',
    message: 'Backup completed: Brain memory snapshot',
    cost: 0.005,
    metadata: { backupName: 'Brain memory snapshot', sizeMB: 12.5 },
    minutesAgo: 30,
  },
  {
    type: 'research_complete',
    agentName: 'Barak (The Bear)',
    message: 'Research completed: AI voice pricing comparison',
    cost: 0.03,
    metadata: { topic: 'AI voice pricing comparison', competitors: ['Dialpad', 'Smith.ai', 'Ruby'] },
    minutesAgo: 45,
  },
  {
    type: 'task_started',
    agentName: 'Polgara (The Sorceress)',
    message: 'Started task: Blog post on missed calls',
    cost: 0.015,
    metadata: { taskTitle: 'Blog post on missed calls', estimatedHours: 3 },
    minutesAgo: 60,
  },
  {
    type: 'task_completed',
    agentName: 'Polgara (The Sorceress)',
    message: 'Completed task: Blog post on missed calls',
    cost: 0.025,
    metadata: { taskTitle: 'Blog post on missed calls', wordCount: 1200 },
    minutesAgo: 180,
  },
  {
    type: 'file_created',
    agentName: 'Silk (Prince Kheldar)',
    message: 'Created file: Go High Level workflow diagram',
    cost: 0.008,
    metadata: { fileName: 'ghl-workflow-v2.mmd', type: 'mermaid' },
    minutesAgo: 120,
  },
  {
    type: 'status_change',
    agentName: "Ce'Nedra (The Queen)",
    message: 'Status changed: Moved to review phase',
    cost: 0.005,
    metadata: { previousStatus: 'in_progress', newStatus: 'review' },
    minutesAgo: 90,
  },
  {
    type: 'task_started',
    agentName: 'Barak (The Bear)',
    message: 'Started task: Competitor analysis',
    cost: 0.012,
    metadata: { taskTitle: 'Competitor analysis', client: 'Sunset Plumbing' },
    minutesAgo: 240,
  },
  {
    type: 'research_complete',
    agentName: 'Errand (The Child)',
    message: 'Research completed: Latest AI voice synthesis tech',
    cost: 0.028,
    metadata: { topic: 'AI voice synthesis', providers: ['ElevenLabs', 'PlayHT', 'Azure'] },
    minutesAgo: 200,
  },
  {
    type: 'agent_spawned',
    agentName: 'Taiba (The Seer)',
    message: 'Spawned for: Analytics deep dive',
    cost: 0.018,
    metadata: { task: 'Analytics deep dive', focus: 'Conversion funnel' },
    minutesAgo: 150,
  },
  {
    type: 'oversight_report',
    agentName: 'Beldin (The Cynic)',
    message: 'Oversight report: Code quality scan',
    cost: 0.012,
    metadata: { reportType: 'Code quality scan', recommendations: 3 },
    minutesAgo: 100,
  },
  {
    type: 'file_created',
    agentName: 'Relg (The Zealot)',
    message: 'Created file: Google Ads campaign structure',
    cost: 0.007,
    metadata: { fileName: 'campaign-structure-q1.json', campaigns: 5 },
    minutesAgo: 80,
  },
  {
    type: 'backup_complete',
    agentName: 'Durnik (The Smith)',
    message: 'Backup completed: Firebase collections export',
    cost: 0.006,
    metadata: { backupName: 'Firebase collections export', collections: ['tasks', 'agents', 'activities'] },
    minutesAgo: 300,
  },
  {
    type: 'task_started',
    agentName: 'Mandorallen (The Knight)',
    message: 'Started task: Security audit',
    cost: 0.014,
    metadata: { taskTitle: 'Security audit', scope: 'Full infrastructure' },
    minutesAgo: 360,
  },
  {
    type: 'status_change',
    agentName: 'Relg (The Zealot)',
    message: 'Status changed: Campaign optimization complete',
    cost: 0.004,
    metadata: { previousStatus: 'active', newStatus: 'monitoring', roi: 2.3 },
    minutesAgo: 45,
  },
  {
    type: 'file_created',
    agentName: 'Silk (Prince Kheldar)',
    message: 'Created file: API integration documentation',
    cost: 0.009,
    metadata: { fileName: 'api-integration.md', endpoints: 12 },
    minutesAgo: 130,
  },
  {
    type: 'message',
    agentName: 'Taiba (The Seer)',
    message: 'Identified 23% conversion improvement opportunity',
    cost: 0.011,
    metadata: { insight: 'Landing page A/B test recommendation', impact: 'high' },
    minutesAgo: 70,
  },
  {
    type: 'task_completed',
    agentName: 'Barak (The Bear)',
    message: 'Completed task: Competitor pricing matrix',
    cost: 0.022,
    metadata: { taskTitle: 'Competitor pricing matrix', competitorsAnalyzed: 5 },
    minutesAgo: 180,
  },
  {
    type: 'agent_spawned',
    agentName: "Ce'Nedra (The Queen)",
    message: 'Spawned for: UX research synthesis',
    cost: 0.019,
    metadata: { task: 'UX research synthesis', participants: 8 },
    minutesAgo: 210,
  },
];

/**
 * Seed activities into Firebase
 * 
 * @returns Object with success status and count of seeded activities
 */
export async function seedActivities(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const activitiesCollection = collection(db, 'activities');
    let seededCount = 0;

    for (const activity of seedActivityData) {
      // Calculate timestamp based on minutesAgo
      const timestamp = Timestamp.fromMillis(
        Date.now() - activity.minutesAgo * 60 * 1000
      );

      const activityData = {
        type: activity.type,
        agentName: activity.agentName,
        message: activity.message,
        cost: activity.cost,
        timestamp,
        metadata: activity.metadata || {},
      };

      await addDoc(activitiesCollection, activityData);
      seededCount++;
    }

    console.log(`[Seed] Successfully seeded ${seededCount} activities`);
    return { success: true, count: seededCount };
  } catch (error) {
    console.error('[Seed] Failed to seed activities:', error);
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
