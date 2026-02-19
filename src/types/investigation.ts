/**
 * Mission Control - Investigation & User Story Types
 * 
 * Hierarchical task management:
 * Area of Investigation (Epic) → User Stories → Tasks
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentId = 'garion' | 'silk' | 'barak' | 'polgara' | 'cenedra';

export type TaskType = 'code' | 'research' | 'write' | 'review' | 'test' | 'analyze';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

// ============================================================================
// AREA OF INVESTIGATION (EPIC)
// ============================================================================

export interface AreaOfInvestigation {
  id: string;
  title: string;
  description: string;
  agentId: AgentId;
  status: 'planned' | 'in_progress' | 'completed';
  priority: Priority;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  userStoryIds: string[];
  progressPercent: number;
  estimatedHours: number;
  actualHours: number;
}

export interface CreateAreaInput {
  title: string;
  description: string;
  agentId: AgentId;
  priority: Priority;
  estimatedHours: number;
}

// ============================================================================
// USER STORY
// ============================================================================

export interface UserStory {
  id: string;
  title: string;
  description: string;
  areaId: string;
  agentId: AgentId;
  status: 'inbox' | 'in_progress' | 'review' | 'done';
  priority: Priority;
  acceptanceCriteria: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  taskIds: string[];
  deliverableUrl?: string;
  deliverableType?: 'markdown' | 'code' | 'document' | 'spreadsheet';
  estimatedHours: number;
  actualHours: number;
  blockedBy?: string[];
}

export interface CreateStoryInput {
  title: string;
  description: string;
  areaId: string;
  agentId: AgentId;
  priority: Priority;
  acceptanceCriteria: string[];
  estimatedHours: number;
}

// ============================================================================
// TASK (ATOMIC WORK UNIT)
// ============================================================================

export interface Task {
  id: string;
  title: string;
  storyId: string;
  agentId: AgentId;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: TaskType;
  artifactUrl?: string;
  artifactType?: 'file' | 'url' | 'code';
  description: string;
  result?: string;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  progress: string;
  cost: number;
  exitCode?: number;
  metadata?: {
    filePath?: string;
    linesChanged?: number;
    testResults?: boolean;
  };
}

export interface CreateTaskInput {
  title: string;
  storyId: string;
  agentId: AgentId;
  type: TaskType;
  description: string;
}

// ============================================================================
// CONSIDERATION
// ============================================================================

export type ConsiderationType = 
  | 'revenue_impact' 
  | 'risk_assessment' 
  | 'opportunity' 
  | 'integration_note' 
  | 'strategic';

export type ConsiderationSeverity = 'info' | 'warning' | 'critical';

export type ConsiderationStatus = 'active' | 'addressed' | 'dismissed';

export interface Consideration {
  id: string;
  areaId: string;
  type: ConsiderationType;
  title: string;
  description: string;
  severity: ConsiderationSeverity;
  status: ConsiderationStatus;
  createdBy: 'agent' | 'user';
  agentResponse?: string;
  userComment?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateConsiderationInput {
  areaId: string;
  type: ConsiderationType;
  title: string;
  description: string;
  severity: ConsiderationSeverity;
  createdBy: 'agent' | 'user';
}

// ============================================================================
// AGENT ACTIVITY (REAL-TIME)
// ============================================================================

export interface AgentActivity {
  id: string;
  agentId: AgentId;
  areaId?: string;
  storyId?: string;
  taskId?: string;
  type: 'thinking' | 'reading' | 'writing' | 'coding' | 'testing' | 'complete';
  description: string;
  filePath?: string;
  progress?: number;
  timestamp: Timestamp;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface InvestigationStats {
  totalAreas: number;
  activeAreas: number;
  completedAreas: number;
  totalStories: number;
  storiesByStatus: Record<UserStory['status'], number>;
  totalTasks: number;
  tasksByStatus: Record<Task['status'], number>;
  estimatedCost: number;
  actualCost: number;
  totalHours: number;
}
