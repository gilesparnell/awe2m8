/**
 * Firebase Activity Logger
 * 
 * Simplified utility to log agent activities with cost tracking
 * to Firestore for Mission Control dashboard.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export type ActivityType = 
  | 'task_started' 
  | 'task_completed' 
  | 'message' 
  | 'file_created' 
  | 'agent_online' 
  | 'agent_offline'
  | 'agent_spawned'
  | 'research_complete'
  | 'backup_complete'
  | 'oversight_report'
  | 'status_change';

export interface LogActivityInput {
  type: ActivityType;
  agentName: string;
  message: string;
  cost: number;
  metadata?: Record<string, unknown>;
}

export interface ActivityDoc extends LogActivityInput {
  timestamp: Timestamp;
}

// ============================================================================
// LOGGER FUNCTION
// ============================================================================

/**
 * Log an activity to Firebase Firestore 'activities' collection
 * 
 * @param params Activity data to log
 * @returns Promise that resolves with the document ID when activity is logged
 */
export async function logActivity({
  type,
  agentName,
  message,
  cost,
  metadata = {},
}: LogActivityInput): Promise<string | null> {
  try {
    const activityData = {
      type,
      agentName,
      message,
      cost,
      timestamp: Timestamp.now(),
      metadata,
    };

    const docRef = await addDoc(collection(db, 'activities'), activityData);
    
    console.log(`[Activity] Logged: ${agentName} - ${message} (Cost: $${cost.toFixed(3)})`);
    
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
 * Log an agent spawn activity
 */
export async function logAgentSpawned(
  agentName: string,
  task: string,
  cost: number = 0.02,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    type: 'agent_spawned',
    agentName,
    message: `Spawned for: ${task}`,
    cost,
    metadata: { task, ...metadata },
  });
}

/**
 * Log a task start activity
 */
export async function logTaskStarted(
  agentName: string,
  taskTitle: string,
  cost: number = 0.01,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    type: 'task_started',
    agentName,
    message: `Started task: ${taskTitle}`,
    cost,
    metadata: { taskTitle, ...metadata },
  });
}

/**
 * Log a task completion activity
 */
export async function logTaskCompleted(
  agentName: string,
  taskTitle: string,
  cost: number = 0.01,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    type: 'task_completed',
    agentName,
    message: `Completed task: ${taskTitle}`,
    cost,
    metadata: { taskTitle, ...metadata },
  });
}

/**
 * Log a file creation activity
 */
export async function logFileCreated(
  agentName: string,
  fileName: string,
  cost: number = 0.005,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    type: 'file_created',
    agentName,
    message: `Created file: ${fileName}`,
    cost,
    metadata: { fileName, ...metadata },
  });
}

/**
 * Log a backup completion activity
 */
export async function logBackupComplete(
  agentName: string,
  backupName: string,
  cost: number = 0.005,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    type: 'backup_complete',
    agentName,
    message: `Backup completed: ${backupName}`,
    cost,
    metadata: { backupName, ...metadata },
  });
}

/**
 * Log an oversight report activity
 */
export async function logOversightReport(
  agentName: string,
  reportType: string,
  cost: number = 0.01,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    type: 'oversight_report',
    agentName,
    message: `Oversight report: ${reportType}`,
    cost,
    metadata: { reportType, ...metadata },
  });
}

/**
 * Log a research completion activity
 */
export async function logResearchComplete(
  agentName: string,
  topic: string,
  cost: number = 0.03,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    type: 'research_complete',
    agentName,
    message: `Research completed: ${topic}`,
    cost,
    metadata: { topic, ...metadata },
  });
}
