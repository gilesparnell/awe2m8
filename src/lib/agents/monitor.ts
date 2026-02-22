/**
 * Agent Monitor
 * 
 * Monitors spawned agents, tracks their progress, handles escalations.
 * Provides dashboard data for Mission Control.
 */

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { AgentTask } from './spawner';
import { AgentId, getAgentConfig } from './config';

// ============================================================================
// TYPES
// ============================================================================

interface AgentStats {
  completed: number; 
  failed: number; 
  cost: number;
  lastActivity: Timestamp;
  currentTask?: string;
}

export interface AgentStatus {
  agentId: AgentId;
  name: string;
  isOnline: boolean;
  currentTask?: string;
  tasksCompleted: number;
  tasksFailed: number;
  costToday: number;
  budgetRemaining: number;
  lastActivity: Date;
}

export interface SquadStatus {
  agents: AgentStatus[];
  activeTasks: AgentTask[];
  totalCostToday: number;
  totalBudget: number;
}

// ============================================================================
// REACT HOOK: useAgentMonitor
// ============================================================================

export function useAgentMonitor() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Set up real-time listeners for agent tasks
    const tasksQuery = query(
      collection(db, 'agent_tasks'),
      orderBy('startedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasks: AgentTask[] = [];
        const agentStats: Map<AgentId, AgentStats> = new Map();

        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          const task: AgentTask = {
            id: doc.id,
            agentId: data.agentId,
            status: data.status,
            task: data.task,
            context: data.context,
            deliverables: data.deliverables,
            result: data.result,
            cost: data.cost,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            sessionKey: data.sessionKey,
            escalationReason: data.escalationReason,
          };
          tasks.push(task);

          // Aggregate stats per agent
          const stats = agentStats.get(data.agentId) || {
            completed: 0,
            failed: 0,
            cost: 0,
            lastActivity: data.startedAt,
          };

          if (data.status === 'completed') {
            stats.completed++;
          } else if (data.status === 'failed') {
            stats.failed++;
          }

          if (data.cost) {
            stats.cost += data.cost;
          }

          // Track current running task
          if (data.status === 'running') {
            (stats as AgentStats).currentTask = data.task;
          }

          // Update last activity
          if (data.startedAt.seconds > stats.lastActivity.seconds) {
            stats.lastActivity = data.startedAt;
          }

          agentStats.set(data.agentId, stats);
        });

        // Build agent status array
        const agentConfigs = ['silk', 'barak', 'polgara'] as AgentId[];
        const statusArray: AgentStatus[] = agentConfigs.map((agentId) => {
          const config = getAgentConfig(agentId);
          const defaultStats: AgentStats = {
            completed: 0,
            failed: 0,
            cost: 0,
            lastActivity: Timestamp.now(),
          };
          const stats = agentStats.get(agentId) || defaultStats;

          const isOnline = tasks.some(
            (t) => t.agentId === agentId && t.status === 'running'
          );

          return {
            agentId,
            name: config.name,
            isOnline,
            currentTask: (stats as AgentStats).currentTask,
            tasksCompleted: stats.completed,
            tasksFailed: stats.failed,
            costToday: stats.cost,
            budgetRemaining: config.costProfile.dailyBudget - stats.cost,
            lastActivity: stats.lastActivity.toDate(),
          };
        });

        setAgents(statusArray);
        setActiveTasks(tasks.filter((t) => t.status === 'running'));
        setLoading(false);
      },
      (error) => {
        console.error('[AgentMonitor] Error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const totalCostToday = agents.reduce((sum, a) => sum + a.costToday, 0);
  const totalBudget = agents.reduce((sum, a) => sum + a.costToday + a.budgetRemaining, 0);

  return {
    agents,
    activeTasks,
    totalCostToday,
    totalBudget,
    loading,
  };
}

// ============================================================================
// REACT HOOK: useAgentTask
// ============================================================================

export function useAgentTask(taskId: string | null) {
  const [task, setTask] = useState<AgentTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, 'agent_tasks'),
      (snapshot) => {
        const taskDoc = snapshot.docs.find((d) => d.id === taskId);
        if (taskDoc) {
          const data = taskDoc.data();
          setTask({
            id: taskDoc.id,
            agentId: data.agentId,
            status: data.status,
            task: data.task,
            context: data.context,
            deliverables: data.deliverables,
            result: data.result,
            cost: data.cost,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            sessionKey: data.sessionKey,
            escalationReason: data.escalationReason,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('[AgentTask] Error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  return { task, loading };
}

// ============================================================================
// COST ALERTS
// ============================================================================

export interface CostAlert {
  agentId: AgentId;
  severity: 'warning' | 'critical';
  message: string;
  currentCost: number;
  budget: number;
  percentage: number;
}

/**
 * Check for cost alerts
 */
export function checkCostAlerts(agents: AgentStatus[]): CostAlert[] {
  const alerts: CostAlert[] = [];

  for (const agent of agents) {
    const percentage = (agent.costToday / (agent.costToday + agent.budgetRemaining)) * 100;

    if (percentage >= 90) {
      alerts.push({
        agentId: agent.agentId,
        severity: 'critical',
        message: `${agent.name} has exceeded 90% of daily budget`,
        currentCost: agent.costToday,
        budget: agent.costToday + agent.budgetRemaining,
        percentage,
      });
    } else if (percentage >= 75) {
      alerts.push({
        agentId: agent.agentId,
        severity: 'warning',
        message: `${agent.name} has exceeded 75% of daily budget`,
        currentCost: agent.costToday,
        budget: agent.costToday + agent.budgetRemaining,
        percentage,
      });
    }
  }

  return alerts;
}

// ============================================================================
// AGENT HEARTBEAT
// ============================================================================

/**
 * Send a heartbeat from an agent to show it's still alive
 */
export async function sendAgentHeartbeat(
  taskId: string,
  progress: string,
  costSoFar?: number
): Promise<void> {
  try {
    const { updateDoc, doc, Timestamp } = await import('firebase/firestore');
    
    await updateDoc(doc(db, 'agent_tasks', taskId), {
      lastHeartbeat: Timestamp.now(),
      progress,
      ...(costSoFar && { cost: costSoFar }),
    });
  } catch (error) {
    console.error('[Heartbeat] Failed:', error);
  }
}

/**
 * Check if an agent is stale (no heartbeat for >15 minutes)
 */
export function isAgentStale(lastHeartbeat: Timestamp): boolean {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  return lastHeartbeat.toMillis() < fifteenMinutesAgo;
}
