/**
 * Seed Activities API Route (Server-side with Admin SDK)
 * 
 * GET /api/seed-activities — populates Firebase with test activity data
 * Uses Firebase Admin SDK to bypass Firestore security rules
 */

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

interface SeedActivity {
  type: string;
  agentName: string;
  message: string;
  cost: number;
  metadata?: Record<string, unknown>;
  minutesAgo: number;
}

const seedData: SeedActivity[] = [
  { type: 'agent_spawned', agentName: 'Silk', message: 'Spawned for: Task Board page', cost: 0.02, minutesAgo: 5, metadata: { task: 'Task Board page' } },
  { type: 'task_completed', agentName: 'Silk', message: 'Completed: ActivityTimeline real-time listener', cost: 0.018, minutesAgo: 120, metadata: { taskTitle: 'ActivityTimeline' } },
  { type: 'task_completed', agentName: 'Silk', message: 'Completed: AgentStrip real-time listener', cost: 0.015, minutesAgo: 115, metadata: { taskTitle: 'AgentStrip' } },
  { type: 'task_completed', agentName: 'Silk', message: 'Completed: Firebase activity logger', cost: 0.022, minutesAgo: 30, metadata: { taskTitle: 'Activity Logger' } },
  { type: 'oversight_report', agentName: 'Beldin', message: 'Oversight report: All-agent status review', cost: 0.01, minutesAgo: 90, metadata: { issuesFound: 8 } },
  { type: 'oversight_report', agentName: 'Beldin', message: 'Oversight report: Code quality scan', cost: 0.012, minutesAgo: 15, metadata: { reportType: 'Code quality' } },
  { type: 'backup_complete', agentName: 'Garion', message: 'Backup completed: 157 files synced to GitHub', cost: 0.005, minutesAgo: 45, metadata: { files: 157 } },
  { type: 'backup_complete', agentName: 'Garion', message: 'Backup completed: 155 files synced to GitHub', cost: 0.005, minutesAgo: 240, metadata: { files: 155 } },
  { type: 'research_complete', agentName: 'Barak', message: 'Research completed: Voice AI pricing comparison', cost: 0.03, minutesAgo: 1440, metadata: { topic: 'Voice AI pricing', competitors: 5 } },
  { type: 'task_started', agentName: 'Polgara', message: 'Started task: Landing page copy for AllConvos', cost: 0.015, minutesAgo: 60, metadata: { taskTitle: 'Landing page copy' } },
  { type: 'agent_spawned', agentName: "Ce'Nedra", message: 'Spawned for: UX review of Mission Control', cost: 0.019, minutesAgo: 180, metadata: { task: 'UX review' } },
  { type: 'file_created', agentName: 'Silk', message: 'Created: board/page.tsx (Task Board)', cost: 0.008, minutesAgo: 25, metadata: { fileName: 'board/page.tsx' } },
  { type: 'file_created', agentName: 'Relg', message: 'Created: Google Ads campaign structure', cost: 0.007, minutesAgo: 300, metadata: { fileName: 'campaign-q1.json' } },
  { type: 'status_change', agentName: 'Durnik', message: 'Infrastructure tasks assigned', cost: 0.004, minutesAgo: 360, metadata: { tasks: 3 } },
  { type: 'agent_spawned', agentName: 'Taiba', message: 'Spawned for: Analytics deep dive', cost: 0.018, minutesAgo: 150, metadata: { focus: 'Conversion funnel' } },
  { type: 'message', agentName: 'Taiba', message: 'Identified 23% conversion improvement opportunity', cost: 0.011, minutesAgo: 70, metadata: { impact: 'high' } },
  { type: 'task_completed', agentName: 'Barak', message: 'Completed: Competitor pricing matrix', cost: 0.022, minutesAgo: 1400, metadata: { competitorsAnalyzed: 5 } },
  { type: 'task_started', agentName: 'Mandorallen', message: 'Started: Security audit', cost: 0.014, minutesAgo: 400, metadata: { scope: 'Full infrastructure' } },
  { type: 'agent_spawned', agentName: 'Errand', message: 'Spawned for: AI voice synthesis research', cost: 0.028, minutesAgo: 200, metadata: { providers: ['ElevenLabs', 'PlayHT'] } },
  { type: 'task_completed', agentName: 'Garion', message: 'Fixed Tailwind v4 configuration', cost: 0.01, minutesAgo: 160, metadata: { taskTitle: 'Tailwind fix' } },
];

export async function GET() {
  try {
    const db = getAdminDb();
    const batch = db.batch();
    const activitiesRef = db.collection('activities');

    for (const activity of seedData) {
      const docRef = activitiesRef.doc();
      const timestamp = new Date(Date.now() - activity.minutesAgo * 60 * 1000);
      batch.set(docRef, {
        type: activity.type,
        agentName: activity.agentName,
        message: activity.message,
        cost: activity.cost,
        timestamp,
        metadata: activity.metadata || {},
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, count: seedData.length });
  } catch (error) {
    console.error('[Seed] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', count: 0 },
      { status: 500 }
    );
  }
}
