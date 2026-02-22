/**
 * Server Activity Logger
 * 
 * Server-side version of activity logging for API routes
 */

import { db as adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Re-export types from client logger
export type {
  ActivityCategory,
  ActivityAction,
  ActivityData
} from './activity-logger';

/**
 * Log an activity to Firestore (server-side)
 * 
 * @param data Activity data to log
 * @returns Promise that resolves when activity is logged
 */
export async function logActivityServer(data: import('./activity-logger').ActivityData): Promise<string | null> {
  try {
    const activity = {
      timestamp: FieldValue.serverTimestamp(),
      ...data,
      sessionId: data.sessionId || 'unknown',
    };

    const docRef = await adminDb.collection('activities').add(activity);
    
    console.log(`[Activity Server] Logged: ${data.description}${data.cost ? ` (Cost: $${data.cost.toFixed(3)})` : ''}`);
    
    return docRef.id;
  } catch (error) {
    console.error('[Activity Server] Failed to log:', error);
    // Don't throw - logging should never break functionality
    return null;
  }
}

/**
 * Convenience function for logging web searches with cost
 */
export async function logWebSearchServer(
  query: string,
  resultCount: number,
  actor: import('@/types/activity').ActivityActor = 'garion',
  metadata?: Record<string, unknown>,
  cost?: number
): Promise<string | null> {
  return logActivityServer({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'web',
    action: 'search',
    description: `Searched web: "${query}" (${resultCount} results)`,
    metadata: { query, resultCount, ...metadata },
    cost,
  });
}

/**
 * Convenience function for logging agent spawns with cost
 */
export async function logAgentSpawnServer(
  targetAgent: import('@/types/activity').ActivityActor,
  task: string,
  actor: import('@/types/activity').ActivityActor = 'garion',
  metadata?: Record<string, unknown>,
  cost?: number
): Promise<string | null> {
  return logActivityServer({
    actor,
    actorType: 'main',
    category: 'agent',
    action: 'spawn',
    description: `Spawned ${targetAgent} for: ${task}`,
    metadata: { targetAgent, task, ...metadata },
    cost,
  });
}