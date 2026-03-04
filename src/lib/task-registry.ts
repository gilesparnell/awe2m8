/**
 * Task Registry Client
 * 
 * Reads from .clawbot/active-tasks.json for real agent swarm data
 * Replaces Firebase-based task tracking with Elvis-style worktree monitoring
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES - Based on active-tasks.json schema
// ============================================================================

export type TaskStatus = 'todo' | 'spawning' | 'running' | 'paused' | 'completed' | 'failed';

export interface TaskRegistryEntry {
  id: string;
  agent: string;
  description: string;
  workdir: string;
  branch: string;
  tmuxSession: string;
  status: TaskStatus;
  startedAt: string;
  completedAt?: string;
  notifyOnComplete: boolean;
  objective: string;
  success_criteria: string[];
  cost?: number; // Final cost for completed tasks
  estimatedCost?: number; // Running cost estimate for active tasks
}

export interface TaskRegistry {
  _meta: {
    version: string;
    createdAt: string;
    description: string;
  };
  tasks: Record<string, TaskRegistryEntry>;
}

// Agent display info (static mapping)
export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  color: 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'slate' | 'rose' | 'indigo' | 'violet' | 'cyan' | 'orange' | 'gray';
  icon: string;
}

export const AGENT_REGISTRY: Record<string, AgentInfo> = {
  silk: {
    id: 'silk',
    name: 'Silk (Prince Kheldar)',
    role: 'Code Architect',
    color: 'blue',
    icon: 'Bot',
  },
  barak: {
    id: 'barak',
    name: 'Barak (The Bear)',
    role: 'Research Analyst',
    color: 'green',
    icon: 'Target',
  },
  beldin: {
    id: 'beldin',
    name: 'Beldin (The Cynic)',
    role: 'QA Engineer',
    color: 'slate',
    icon: 'Bug',
  },
  polgara: {
    id: 'polgara',
    name: 'Polgara (The Sorceress)',
    role: 'Content Strategist',
    color: 'amber',
    icon: 'FileText',
  },
  cenedra: {
    id: 'cenedra',
    name: "Ce'Nedra (The Queen)",
    role: 'UX Designer',
    color: 'rose',
    icon: 'Palette',
  },
  taiba: {
    id: 'taiba',
    name: 'Taiba (The Seer)',
    role: 'Data Analyst',
    color: 'indigo',
    icon: 'Eye',
  },
  durnik: {
    id: 'durnik',
    name: 'Durnik (The Smith)',
    role: 'Infrastructure Engineer',
    color: 'purple',
    icon: 'Wrench',
  },
  belgarath: {
    id: 'belgarath',
    name: 'Belgarath (The Eternal)',
    role: 'Systems Architect',
    color: 'red',
    icon: 'Zap',
  },
  relg: {
    id: 'relg',
    name: 'Relg (The Zealot)',
    role: 'Security Specialist',
    color: 'orange',
    icon: 'Shield',
  },
  errand: {
    id: 'errand',
    name: 'Errand (The Child)',
    role: 'Assistant',
    color: 'violet',
    icon: 'Sparkles',
  },
  mandorallen: {
    id: 'mandorallen',
    name: 'Mandorallen (The Knight)',
    role: 'DevOps Engineer',
    color: 'cyan',
    icon: 'Server',
  },
  garion: {
    id: 'garion',
    name: 'Garion (Belgarion)',
    role: 'Commander',
    color: 'purple',
    icon: 'Crown',
  },
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const TASK_REGISTRY_PATH = '/api/task-registry';

export async function fetchTaskRegistry(): Promise<TaskRegistry> {
  const response = await fetch(TASK_REGISTRY_PATH);
  if (!response.ok) {
    throw new Error(`Failed to fetch task registry: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// HOOK - useTaskRegistry
// ============================================================================

export interface UseTaskRegistryOptions {
  pollInterval?: number; // ms, default 5000
  enabled?: boolean;
}

export function useTaskRegistry(options: UseTaskRegistryOptions = {}) {
  const { pollInterval = 5000, enabled = true } = options;
  
  const [registry, setRegistry] = useState<TaskRegistry | null>(null);
  const [tasks, setTasks] = useState<TaskRegistryEntry[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      const data = await fetchTaskRegistry();
      setRegistry(data);
      
      // Convert tasks object to array
      const tasksArray = Object.values(data.tasks);
      setTasks(tasksArray);
      
      // Extract unique agents from tasks
      const activeAgentIds = new Set(tasksArray.map(t => t.agent));
      const activeAgents: AgentInfo[] = Array.from(activeAgentIds).map(id => 
        AGENT_REGISTRY[id] || {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          role: 'Agent',
          color: 'green' as const,
          icon: 'Bot',
        }
      );
      setAgents(activeAgents);
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    refresh();

    // Set up polling
    const interval = setInterval(refresh, pollInterval);
    
    return () => clearInterval(interval);
  }, [enabled, pollInterval, refresh]);

  // Computed stats
  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    spawning: tasks.filter(t => t.status === 'spawning').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    activeAgents: new Set(tasks.filter(t => t.status === 'running' || t.status === 'spawning').map(t => t.agent)).size,
  };

  return {
    registry,
    tasks,
    agents,
    loading,
    error,
    lastUpdated,
    stats,
    refresh,
  };
}

// ============================================================================
// HOOK - useAgentStatus
// ============================================================================

export interface AgentStatus {
  agent: AgentInfo;
  currentTask: TaskRegistryEntry | null;
  allTasks: TaskRegistryEntry[];
  isOnline: boolean;
  lastActivity: string;
}

export function useAgentStatus(options: UseTaskRegistryOptions = {}) {
  const { tasks, agents, loading, error, lastUpdated, refresh } = useTaskRegistry(options);

  const agentStatuses: AgentStatus[] = agents.map(agent => {
    const agentTasks = tasks.filter(t => t.agent === agent.id);
    const currentTask = agentTasks.find(t => t.status === 'running') || 
                       agentTasks.find(t => t.status === 'spawning') ||
                       agentTasks[0] || null;
    
    const isOnline = agentTasks.some(t => t.status === 'running' || t.status === 'spawning');
    
    // Calculate last activity
    let lastActivity = 'Never';
    if (currentTask) {
      const started = new Date(currentTask.startedAt);
      const now = new Date();
      const diffMins = Math.floor((now.getTime() - started.getTime()) / 60000);
      
      if (diffMins < 1) lastActivity = 'Just now';
      else if (diffMins < 60) lastActivity = `${diffMins}m ago`;
      else if (diffMins < 1440) lastActivity = `${Math.floor(diffMins / 60)}h ago`;
      else lastActivity = `${Math.floor(diffMins / 1440)}d ago`;
    }

    return {
      agent,
      currentTask,
      allTasks: agentTasks,
      isOnline,
      lastActivity,
    };
  });

  return {
    agentStatuses,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}

// ============================================================================
// HOOK - useActivityFeed
// ============================================================================

export interface ActivityItem {
  id: string;
  type: 'task_started' | 'task_completed' | 'task_failed' | 'agent_online' | 'agent_offline' | 'commit';
  agentName: string;
  agentColor: string;
  message: string;
  timestamp: string;
  relativeTime: string;
  metadata?: {
    branch?: string;
    workdir?: string;
    commit?: string;
    description?: string;
    cost?: number;
    estimatedCost?: number;
  };
}

export function useActivityFeed(options: UseTaskRegistryOptions = {}) {
  const { tasks, agents, loading, error, lastUpdated, refresh } = useTaskRegistry(options);

  // Generate activities from task registry
  const activities: ActivityItem[] = tasks.flatMap(task => {
    const agent = AGENT_REGISTRY[task.agent];
    const items: ActivityItem[] = [];

    // Task started activity
    items.push({
      id: `${task.id}-started`,
      type: 'task_started',
      agentName: agent?.name || task.agent,
      agentColor: agent?.color || 'green',
      message: `Started: ${task.description}`,
      timestamp: task.startedAt,
      relativeTime: formatTimeAgo(new Date(task.startedAt)),
      metadata: {
        branch: task.branch,
        workdir: task.workdir,
        description: task.objective,
        estimatedCost: task.estimatedCost,
      },
    });

    // Task completed activity
    if (task.status === 'completed' && task.completedAt) {
      items.push({
        id: `${task.id}-completed`,
        type: 'task_completed',
        agentName: agent?.name || task.agent,
        agentColor: agent?.color || 'green',
        message: `Completed: ${task.description}`,
        timestamp: task.completedAt,
        relativeTime: formatTimeAgo(new Date(task.completedAt)),
        metadata: {
          branch: task.branch,
          workdir: task.workdir,
          cost: task.cost,
        },
      });
    }

    // Task failed activity
    if (task.status === 'failed') {
      items.push({
        id: `${task.id}-failed`,
        type: 'task_failed',
        agentName: agent?.name || task.agent,
        agentColor: agent?.color || 'green',
        message: `Failed: ${task.description}`,
        timestamp: task.startedAt, // Use started as fallback
        relativeTime: formatTimeAgo(new Date(task.startedAt)),
        metadata: {
          branch: task.branch,
          workdir: task.workdir,
          cost: task.cost,
        },
      });
    }

    return items;
  });

  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    activities,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}

// ============================================================================
// UTILS
// ============================================================================

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

// Map task status to kanban columns
export function getTaskColumn(status: TaskStatus): 'todo' | 'in_progress' | 'done' {
  switch (status) {
    case 'todo':
      return 'todo';
    case 'spawning':
      return 'todo';
    case 'running':
    case 'paused':
      return 'in_progress';
    case 'completed':
    case 'failed':
      return 'done';
    default:
      return 'todo';
  }
}

// Status display helpers
export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  spawning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  running: 'bg-green-500/20 text-green-400 border-green-500/50',
  paused: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  failed: 'bg-red-500/20 text-red-400 border-red-500/50',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'TODO',
  spawning: 'Spawning',
  running: 'In Flight',
  paused: 'Paused',
  completed: 'Done',
  failed: 'Failed',
};
