/**
 * Activity Log Types for Mission Control
 * 
 * Tracks every action performed by Garion (Belgarion) and the Belgariad AI Squad:
 * - Silk (Prince Kheldar) - Code Architect
 * - Barak (The Bear) - Research Analyst  
 * - Polgara (The Sorceress) - Content Strategist
 * - Ce'Nedra (The Queen) - Social Intelligence (future)
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE TYPES
// ============================================================================

/** Who performed the action */
export type ActivityActor = 'garion' | 'silk' | 'barak' | 'polgara' | 'cenedra' | 'system';

/** Type of actor */
export type ActorType = 'main' | 'subagent' | 'system';

/** Category of activity */
export type ActivityCategory = 
  | 'file'      // File operations (read, write, edit)
  | 'web'       // Web searches, fetches
  | 'tool'      // Tool calls (exec, browser, etc.)
  | 'agent'     // Agent spawns, completions
  | 'communication' // Messages, emails
  | 'system'    // Cron jobs, heartbeats
  | 'task';     // Task status changes

/** Specific action performed */
export type ActivityAction =
  | 'read'
  | 'write'
  | 'edit'
  | 'search'
  | 'fetch'
  | 'spawn'
  | 'complete'
  | 'send'
  | 'receive'
  | 'start'
  | 'stop'
  | 'delete'
  | 'create'
  | 'update'
  | 'run';

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * Single activity log entry
 * Stored in Firestore collection: 'activities'
 */
export interface ActivityLog {
  id: string;
  timestamp: Timestamp;
  
  /** Who performed the action */
  actor: ActivityActor;
  
  /** Type of actor (main agent, sub-agent, system) */
  actorType: ActorType;
  
  /** Category for grouping/filtering */
  category: ActivityCategory;
  
  /** Specific action */
  action: ActivityAction;
  
  /** Human-readable description */
  description: string;
  
  /** Additional metadata based on category/action */
  metadata: ActivityMetadata;
  
  /** Session ID for audit trail */
  sessionId: string;
  
  /** Optional: Related task ID */
  taskId?: string;
  
  /** Optional: Related project */
  project?: string;
}

// ============================================================================
// METADATA TYPES
// ============================================================================

export interface ActivityMetadata {
  /** File path for file operations */
  filePath?: string;
  
  /** File size in bytes */
  fileSize?: number;
  
  /** URL for web operations */
  url?: string;
  
  /** Search query */
  searchQuery?: string;
  
  /** Search result count */
  resultCount?: number;
  
  /** Tool name for tool calls */
  toolName?: string;
  
  /** Command executed */
  command?: string;
  
  /** Exit code for exec commands */
  exitCode?: number;
  
  /** Agent spawned or acted upon */
  targetAgent?: ActivityActor;
  
  /** Task title or ID */
  taskTitle?: string;
  
  /** Message recipient */
  recipient?: string;
  
  /** Channel used (whatsapp, email, etc.) */
  channel?: string;
  
  /** Duration in milliseconds */
  duration?: number;
  
  /** Success/failure status */
  success?: boolean;
  
  /** Error message if failed */
  errorMessage?: string;
  
  /** Additional context */
  context?: Record<string, unknown>;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface ActivityFilter {
  actors?: ActivityActor[];
  categories?: ActivityCategory[];
  actions?: ActivityAction[];
  startDate?: Date;
  endDate?: Date;
  project?: string;
  taskId?: string;
  searchQuery?: string;
}

export interface ActivityPagination {
  limit: number;
  cursor?: string;
  hasMore: boolean;
}

// ============================================================================
// DISPLAY TYPES
// ============================================================================

export interface ActivityGroup {
  label: string;           // "Today", "Yesterday", "Feb 10, 2026"
  date: Date;
  activities: ActivityLog[];
}

export type ActivityViewMode = 'feed' | 'compact' | 'table';

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isActivityActor(value: unknown): value is ActivityActor {
  return typeof value === 'string' && 
    ['garion', 'silk', 'barak', 'polgara', 'cenedra', 'system'].includes(value);
}

export function isActivityCategory(value: unknown): value is ActivityCategory {
  return typeof value === 'string' && 
    ['file', 'web', 'tool', 'agent', 'communication', 'system', 'task'].includes(value);
}

export function isActivityAction(value: unknown): value is ActivityAction {
  return typeof value === 'string' && 
    ['read', 'write', 'edit', 'search', 'fetch', 'spawn', 'complete', 
     'send', 'receive', 'start', 'stop', 'delete', 'create', 'update', 'run'].includes(value);
}

export function isActivityLog(value: unknown): value is ActivityLog {
  if (!value || typeof value !== 'object') return false;
  
  const log = value as Partial<ActivityLog>;
  return (
    typeof log.id === 'string' &&
    typeof log.timestamp !== 'undefined' &&
    isActivityActor(log.actor) &&
    typeof log.description === 'string'
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ACTIVITY_ICONS: Record<ActivityCategory, string> = {
  file: '📄',
  web: '🔍',
  tool: '🛠️',
  agent: '🤖',
  communication: '💬',
  system: '⚙️',
  task: '✅',
};

export const ACTOR_COLORS: Record<ActivityActor, string> = {
  garion: 'purple',
  silk: 'blue',
  barak: 'green',
  polgara: 'amber',
  cenedra: 'rose',
  system: 'gray',
};

export const ACTOR_LABELS: Record<ActivityActor, string> = {
  garion: 'Garion (Belgarion)',
  silk: 'Silk (Prince Kheldar)',
  barak: 'Barak (The Bear)',
  polgara: 'Polgara (The Sorceress)',
  cenedra: "Ce'Nedra (The Queen)",
  system: 'System',
};
