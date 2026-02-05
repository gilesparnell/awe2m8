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

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'active' | 'completed' | 'blocked';
  currentTask: string;
  lastActivity: string;
  color: 'green' | 'blue' | 'amber';
  icon: string;
  updatedAt?: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  agentId: string;
  status: 'inbox' | 'in_progress' | 'review' | 'done';
  createdAt: string;
  description?: string;
  updatedAt?: Timestamp;
}

export interface ActivityItem {
  id: string;
  type: 'task_started' | 'task_completed' | 'message' | 'file_created';
  agentName: string;
  message: string;
  timestamp: string;
  createdAt?: Timestamp;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up real-time listeners for agents
    const agentsQuery = query(collection(db, 'agents'), orderBy('name'));
    
    const unsubscribeAgents = onSnapshot(
      agentsQuery,
      (snapshot) => {
        const agentsData: Agent[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          agentsData.push({
            id: doc.id,
            name: data.name || doc.id,
            role: data.role || 'Agent',
            status: data.status || 'idle',
            currentTask: data.currentTask || 'No active task',
            lastActivity: data.lastActivity ? formatTimeAgo(data.lastActivity.toDate()) : 'Never',
            color: data.color || 'green',
            icon: data.icon || 'Bot',
            updatedAt: data.updatedAt
          });
        });
        setAgents(agentsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents');
        setLoading(false);
      }
    );

    // Set up real-time listeners for tasks
    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    
    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasksData: Task[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasksData.push({
            id: doc.id,
            title: data.title || 'Untitled Task',
            agentId: data.agentId || '',
            status: data.status || 'inbox',
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            description: data.description || '',
            updatedAt: data.updatedAt
          });
        });
        setTasks(tasksData);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
      }
    );

    // Set up real-time listeners for activities
    const activitiesQuery = query(
      collection(db, 'activities'), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribeActivities = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activitiesData: ActivityItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          activitiesData.push({
            id: doc.id,
            type: data.type || 'message',
            agentName: data.agentName || 'Unknown',
            message: data.message || '',
            timestamp: data.createdAt ? formatTimeAgo(data.createdAt.toDate()) : 'Just now',
            createdAt: data.createdAt
          });
        });
        setActivities(activitiesData);
      },
      (err) => {
        console.error('Error fetching activities:', err);
      }
    );

    return () => {
      unsubscribeAgents();
      unsubscribeTasks();
      unsubscribeActivities();
    };
  }, []);

  return { agents, tasks, activities, loading, error };
}

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

// Fallback data if Firebase is empty
export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'fury',
    name: 'Fury',
    role: 'Lead Qualification Analyst',
    status: 'active',
    currentTask: 'Researching AI receptionist competitors',
    lastActivity: '2 mins ago',
    color: 'green',
    icon: 'Target'
  },
  {
    id: 'friday',
    name: 'Friday',
    role: 'Voice/SMS Workflow Architect',
    status: 'active',
    currentTask: 'Designing tradie workflow',
    lastActivity: '5 mins ago',
    color: 'blue',
    icon: 'Bot'
  },
  {
    id: 'loki',
    name: 'Loki',
    role: 'Content & SEO Strategist',
    status: 'active',
    currentTask: 'Writing blog post',
    lastActivity: '3 mins ago',
    color: 'amber',
    icon: 'FileText'
  }
];

export const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'Competitive Analysis: AI Receptionist Market',
    agentId: 'fury',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    description: 'Research Dialpad, Smith.ai, Ruby Receptionists'
  },
  {
    id: '2',
    title: 'Go High Level Workflow for Tradies',
    agentId: 'friday',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    description: 'Voice scripts, SMS sequences, lead capture'
  },
  {
    id: '3',
    title: 'Blog Post: Tradies Missed Calls',
    agentId: 'loki',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    description: 'SEO-optimized content with CTA'
  }
];

export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'task_started',
    agentName: 'Fury',
    message: 'Started competitive analysis research',
    timestamp: '2 mins ago'
  },
  {
    id: '2',
    type: 'task_started',
    agentName: 'Friday',
    message: 'Designing Go High Level workflow',
    timestamp: '5 mins ago'
  },
  {
    id: '3',
    type: 'task_started',
    agentName: 'Loki',
    message: 'Writing blog post content',
    timestamp: '3 mins ago'
  }
];
