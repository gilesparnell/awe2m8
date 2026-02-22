/**
 * Hook for monitoring agent tasks in real-time
 */

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { AgentId } from '@/lib/agents/config';

export interface AgentTask {
  id: string;
  agentId: AgentId;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'escalated';
  task: string;
  context?: string;
  deliverables?: string[];
  files?: string[];
  result?: string;
  estimatedCost?: number;
  actualCost?: number;
  progress?: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  escalationReason?: string;
}

export function useAgentTasks() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, 'agent_tasks'),
      orderBy('startedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksData: AgentTask[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasksData.push({
            id: doc.id,
            agentId: data.agentId,
            status: data.status,
            task: data.task,
            context: data.context,
            deliverables: data.deliverables,
            files: data.files,
            result: data.result,
            estimatedCost: data.estimatedCost,
            actualCost: data.actualCost,
            progress: data.progress,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            escalationReason: data.escalationReason,
          });
        });
        setTasks(tasksData);
        setLoading(false);
      },
      (error) => {
        console.error('[useAgentTasks] Error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tasks, loading };
}

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
            files: data.files,
            result: data.result,
            estimatedCost: data.estimatedCost,
            actualCost: data.actualCost,
            progress: data.progress,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            escalationReason: data.escalationReason,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('[useAgentTask] Error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  return { task, loading };
}
