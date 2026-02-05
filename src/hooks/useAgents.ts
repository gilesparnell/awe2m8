'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  Timestamp,
  where
} from 'firebase/firestore';

// ============================================================================
// TYPES - Enhanced Schema
// ============================================================================

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
  lastHeartbeat?: Timestamp;
  isOnline?: boolean;
  workload?: number; // Number of active tasks
}

export interface Task {
  id: string;
  title: string;
  agentId: string;
  status: 'inbox' | 'in_progress' | 'review' | 'done';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  createdAt: string;
  updatedAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  description?: string;
  clientId?: string;
  clientName?: string;
  estimatedHours?: number;
  elapsedMinutes?: number;
  progressPercent?: number;
  currentPhase?: 'research' | 'design' | 'implementation' | 'testing' | 'review';
  blockers?: Blocker[];
  nextActions?: string[];
}

export interface TaskLog {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  timestamp: Timestamp;
  type: 'research_update' | 'design_update' | 'content_update' | 'milestone' | 'blocker' | 'completion';
  message: string;
  details?: Record<string, any>;
}

export interface InvestigationArea {
  id: string;
  taskId: string;
  agentId: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  order: number;
}

export interface Consideration {
  id: string;
  taskId: string;
  type: 'revenue_impact' | 'risk_assessment' | 'opportunity' | 'integration_note' | 'strategic';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: Timestamp;
}

export interface Deliverable {
  id: string;
  taskId: string;
  agentId: string;
  title: string;
  type: 'report' | 'document' | 'script' | 'workflow' | 'analysis' | 'code';
  format: 'markdown' | 'pdf' | 'audio' | 'mermaid' | 'json';
  status: 'draft' | 'review' | 'approved';
  version: string;
  content?: string;
  downloadUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Blocker {
  id: string;
  description: string;
  severity: 'blocking' | 'risk';
  status: 'open' | 'resolved';
  resolvedAt?: Timestamp;
}

export interface ActivityItem {
  id: string;
  type: 'task_started' | 'task_completed' | 'message' | 'file_created' | 'agent_online' | 'agent_offline';
  agentName: string;
  message: string;
  timestamp: string;
  createdAt?: Timestamp;
}

export interface ClientContext {
  id: string;
  name: string;
  industry: string;
  location: string;
  currentMonthlyLeads: number;
  targetLeads: number;
  decisionMaker: string;
  notes?: string;
}

// ============================================================================
// HOOK - Enhanced useAgents
// ============================================================================

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
          const lastHeartbeat = data.lastHeartbeat?.toDate();
          const isOnline = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) < 60000 : false;
          
          agentsData.push({
            id: doc.id,
            name: data.name || doc.id,
            role: data.role || 'Agent',
            status: data.status || 'idle',
            currentTask: data.currentTask || 'No active task',
            lastActivity: data.lastActivity ? formatTimeAgo(data.lastActivity.toDate()) : 'Never',
            color: data.color || 'green',
            icon: data.icon || 'Bot',
            updatedAt: data.updatedAt,
            lastHeartbeat: data.lastHeartbeat,
            isOnline,
            workload: data.workload || 0
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
            priority: data.priority || 'P2',
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            description: data.description || '',
            clientId: data.clientId,
            clientName: data.clientName,
            estimatedHours: data.estimatedHours,
            elapsedMinutes: data.elapsedMinutes,
            progressPercent: data.progressPercent || 0,
            currentPhase: data.currentPhase || 'research',
            blockers: data.blockers || [],
            nextActions: data.nextActions || []
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

// ============================================================================
// HOOK - useTaskDetail (for modal data)
// ============================================================================

export function useTaskDetail(taskId: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationArea[]>([]);
  const [considerations, setConsiderations] = useState<Consideration[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [clientContext, setClientContext] = useState<ClientContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setLogs([]);
      setInvestigations([]);
      setConsiderations([]);
      setDeliverables([]);
      setClientContext(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get task document
    const taskUnsub = onSnapshot(
      doc(db, 'tasks', taskId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setTask({
            id: doc.id,
            title: data.title || 'Untitled Task',
            agentId: data.agentId || '',
            status: data.status || 'inbox',
            priority: data.priority || 'P2',
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            description: data.description || '',
            clientId: data.clientId,
            clientName: data.clientName,
            estimatedHours: data.estimatedHours,
            elapsedMinutes: data.elapsedMinutes,
            progressPercent: data.progressPercent || 0,
            currentPhase: data.currentPhase || 'research',
            blockers: data.blockers || [],
            nextActions: data.nextActions || []
          });

          // Fetch client context if clientId exists
          if (data.clientId) {
            onSnapshot(
              doc(db, 'clients', data.clientId),
              (clientDoc) => {
                if (clientDoc.exists()) {
                  const cdata = clientDoc.data();
                  setClientContext({
                    id: clientDoc.id,
                    name: cdata.name,
                    industry: cdata.industry,
                    location: cdata.location,
                    currentMonthlyLeads: cdata.currentMonthlyLeads,
                    targetLeads: cdata.targetLeads,
                    decisionMaker: cdata.decisionMaker,
                    notes: cdata.notes
                  });
                }
              }
            );
          }
        }
        setLoading(false);
      }
    );

    // Get task logs
    const logsQuery = query(
      collection(db, 'tasks', taskId, 'logs'),
      orderBy('timestamp', 'desc')
    );
    const logsUnsub = onSnapshot(logsQuery, (snapshot) => {
      const logsData: TaskLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          taskId,
          agentId: data.agentId,
          agentName: data.agentName,
          timestamp: data.timestamp,
          type: data.type,
          message: data.message,
          details: data.details
        });
      });
      setLogs(logsData);
    });

    // Get investigation areas
    const investigationsQuery = query(
      collection(db, 'tasks', taskId, 'investigations'),
      orderBy('order', 'asc')
    );
    const investigationsUnsub = onSnapshot(investigationsQuery, (snapshot) => {
      const investigationsData: InvestigationArea[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        investigationsData.push({
          id: doc.id,
          taskId,
          agentId: data.agentId,
          label: data.label,
          status: data.status,
          order: data.order
        });
      });
      setInvestigations(investigationsData);
    });

    // Get considerations
    const considerationsQuery = query(
      collection(db, 'tasks', taskId, 'considerations'),
      orderBy('createdAt', 'desc')
    );
    const considerationsUnsub = onSnapshot(considerationsQuery, (snapshot) => {
      const considerationsData: Consideration[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        considerationsData.push({
          id: doc.id,
          taskId,
          type: data.type,
          title: data.title,
          description: data.description,
          severity: data.severity,
          createdAt: data.createdAt
        });
      });
      setConsiderations(considerationsData);
    });

    // Get deliverables
    const deliverablesQuery = query(
      collection(db, 'tasks', taskId, 'deliverables'),
      orderBy('createdAt', 'desc')
    );
    const deliverablesUnsub = onSnapshot(deliverablesQuery, (snapshot) => {
      const deliverablesData: Deliverable[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        deliverablesData.push({
          id: doc.id,
          taskId,
          agentId: data.agentId,
          title: data.title,
          type: data.type,
          format: data.format,
          status: data.status,
          version: data.version,
          content: data.content,
          downloadUrl: data.downloadUrl,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      setDeliverables(deliverablesData);
    });

    return () => {
      taskUnsub();
      logsUnsub();
      investigationsUnsub();
      considerationsUnsub();
      deliverablesUnsub();
    };
  }, [taskId]);

  return { task, logs, investigations, considerations, deliverables, clientContext, loading };
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

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// ============================================================================
// FALLBACK DATA
// ============================================================================

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'fury',
    name: 'Fury',
    role: 'Lead Qualification Analyst',
    status: 'active',
    currentTask: 'Researching AI receptionist competitors',
    lastActivity: '2 mins ago',
    color: 'green',
    icon: 'Target',
    isOnline: true,
    workload: 2
  },
  {
    id: 'friday',
    name: 'Friday',
    role: 'Voice/SMS Workflow Architect',
    status: 'active',
    currentTask: 'Designing tradie workflow',
    lastActivity: '5 mins ago',
    color: 'blue',
    icon: 'Bot',
    isOnline: true,
    workload: 1
  },
  {
    id: 'loki',
    name: 'Loki',
    role: 'Content & SEO Strategist',
    status: 'active',
    currentTask: 'Writing blog post',
    lastActivity: '3 mins ago',
    color: 'amber',
    icon: 'FileText',
    isOnline: true,
    workload: 3
  }
];

export const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'Competitive Analysis: AI Receptionist Market',
    agentId: 'fury',
    status: 'in_progress',
    priority: 'P1',
    createdAt: new Date().toISOString(),
    description: 'Research Dialpad, Smith.ai, Ruby Receptionists',
    progressPercent: 65,
    currentPhase: 'research',
    estimatedHours: 4,
    elapsedMinutes: 156,
    clientName: 'Sunset Plumbing',
    nextActions: ['Complete pricing comparison matrix', 'Document feature gaps']
  },
  {
    id: '2',
    title: 'Go High Level Workflow for Tradies',
    agentId: 'friday',
    status: 'in_progress',
    priority: 'P0',
    createdAt: new Date().toISOString(),
    description: 'Voice scripts, SMS sequences, lead capture',
    progressPercent: 40,
    currentPhase: 'design',
    estimatedHours: 6,
    elapsedMinutes: 89,
    clientName: 'Dr. Drain',
    nextActions: ['Map current client workflow', 'Design IVR decision tree']
  },
  {
    id: '3',
    title: 'Blog Post: Tradies Missed Calls',
    agentId: 'loki',
    status: 'review',
    priority: 'P2',
    createdAt: new Date().toISOString(),
    description: 'SEO-optimized content with CTA',
    progressPercent: 90,
    currentPhase: 'review',
    estimatedHours: 3,
    elapsedMinutes: 180,
    clientName: 'Internal - Marketing',
    nextActions: ['Final proofread', 'Publish and distribute']
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
    type: 'file_created',
    agentName: 'Loki',
    message: 'Published blog post: "Why Tradies Lose $50K/Year to Missed Calls"',
    timestamp: '10 mins ago'
  }
];

export const DEFAULT_INVESTIGATIONS: InvestigationArea[] = [
  { id: '1', taskId: '1', agentId: 'fury', label: 'Competitor pricing analysis', status: 'completed', order: 1 },
  { id: '2', taskId: '1', agentId: 'fury', label: 'ICP definition & firmographics', status: 'in_progress', order: 2 },
  { id: '3', taskId: '1', agentId: 'fury', label: 'Lead source performance benchmarking', status: 'pending', order: 3 },
  { id: '4', taskId: '1', agentId: 'fury', label: 'Market size & TAM calculation', status: 'pending', order: 4 }
];

export const DEFAULT_CONSIDERATIONS: Consideration[] = [
  {
    id: '1',
    taskId: '1',
    type: 'revenue_impact',
    title: 'Adding SMS follow-up could increase conversions by 15-20%',
    description: 'Based on industry benchmarks, tradies with SMS confirmation see higher show rates.',
    severity: 'info',
    createdAt: Timestamp.fromDate(new Date())
  },
  {
    id: '2',
    taskId: '1',
    type: 'risk_assessment',
    title: 'Competitor X just launched AI booking - speed to market is critical',
    description: 'Ruby Receptionists announced AI features yesterday. We need to accelerate timeline.',
    severity: 'warning',
    createdAt: Timestamp.fromDate(new Date())
  }
];

export const DEFAULT_DELIVERABLES: Deliverable[] = [
  {
    id: '1',
    taskId: '1',
    agentId: 'fury',
    title: 'Competitive Analysis Matrix',
    type: 'analysis',
    format: 'markdown',
    status: 'draft',
    version: 'v0.8',
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  }
];
