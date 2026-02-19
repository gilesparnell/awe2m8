'use client';

/**
 * Activity Logger
 * 
 * Utility to log every action performed by Garion (and sub-agents)
 * to Firestore for visibility in Mission Control.
 * 
 * Usage: Import and call logActivity() from any component/hook
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export type ActivityActor = 'garion' | 'silk' | 'barak' | 'polgara' | 'cenedra' | 'system';

export type ActivityCategory =
  | 'file'      // File operations
  | 'web'       // Web searches, fetches
  | 'tool'      // Tool executions
  | 'agent'     // Agent spawns
  | 'communication' // Messages
  | 'system'    // Heartbeats, cron
  | 'task';     // Task operations

export type ActivityAction =
  | 'read'
  | 'write'
  | 'edit'
  | 'search'
  | 'fetch'
  | 'spawn'
  | 'complete'
  | 'send'
  | 'start'
  | 'stop'
  | 'create'
  | 'update'
  | 'delete'
  | 'run';

export interface ActivityData {
  actor: ActivityActor;
  actorType: 'main' | 'subagent' | 'system';
  category: ActivityCategory;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  taskId?: string;
  project?: string;
}

// ============================================================================
// LOGGER FUNCTION
// ============================================================================

/**
 * Log an activity to Firestore
 * 
 * @param data Activity data to log
 * @returns Promise that resolves when activity is logged
 */
export async function logActivity(data: ActivityData): Promise<string | null> {
  try {
    const activity = {
      timestamp: Timestamp.now(),
      ...data,
      sessionId: data.sessionId || 'unknown',
    };

    const docRef = await addDoc(collection(db, 'activities'), activity);
    
    console.log(`[Activity] Logged: ${data.description}`);
    
    return docRef.id;
  } catch (error) {
    console.error('[Activity] Failed to log:', error);
    // Don't throw - logging should never break functionality
    return null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Log a file read operation
 */
export async function logFileRead(
  filePath: string,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'file',
    action: 'read',
    description: `Read file: ${filePath}`,
    metadata: { filePath, ...metadata },
  });
}

/**
 * Log a file write operation
 */
export async function logFileWrite(
  filePath: string,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'file',
    action: 'write',
    description: `Wrote file: ${filePath}`,
    metadata: { filePath, ...metadata },
  });
}

/**
 * Log a file edit operation
 */
export async function logFileEdit(
  filePath: string,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'file',
    action: 'edit',
    description: `Edited file: ${filePath}`,
    metadata: { filePath, ...metadata },
  });
}

/**
 * Log a web search
 */
export async function logWebSearch(
  query: string,
  resultCount: number,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'web',
    action: 'search',
    description: `Searched web: "${query}" (${resultCount} results)`,
    metadata: { query, resultCount, ...metadata },
  });
}

/**
 * Log a web fetch
 */
export async function logWebFetch(
  url: string,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'web',
    action: 'fetch',
    description: `Fetched URL: ${url}`,
    metadata: { url, ...metadata },
  });
}

/**
 * Log a command execution
 */
export async function logCommandExecution(
  command: string,
  exitCode: number,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'tool',
    action: 'run',
    description: `Executed: ${command.split(' ')[0]}`,
    metadata: { command, exitCode, success: exitCode === 0, ...metadata },
  });
}

/**
 * Log an agent spawn
 */
export async function logAgentSpawn(
  targetAgent: ActivityActor,
  task: string,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: 'main',
    category: 'agent',
    action: 'spawn',
    description: `Spawned ${targetAgent} for: ${task}`,
    metadata: { targetAgent, task, ...metadata },
  });
}

/**
 * Log a message sent
 */
export async function logMessageSent(
  channel: string,
  recipient: string,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'communication',
    action: 'send',
    description: `Sent message to ${recipient} via ${channel}`,
    metadata: { channel, recipient, ...metadata },
  });
}

/**
 * Log task creation
 */
export async function logTaskCreated(
  taskTitle: string,
  taskId: string,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'task',
    action: 'create',
    description: `Created task: ${taskTitle}`,
    taskId,
    metadata: { taskTitle, ...metadata },
  });
}

/**
 * Log task completion
 */
export async function logTaskCompleted(
  taskTitle: string,
  taskId: string,
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'task',
    action: 'complete',
    description: `Completed task: ${taskTitle}`,
    taskId,
    metadata: { taskTitle, ...metadata },
  });
}
