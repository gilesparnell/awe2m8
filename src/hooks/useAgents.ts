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
  where,
  addDoc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { logTaskCreated } from '@/lib/activity-logger';

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
  color: 'green' | 'blue' | 'amber' | 'purple';
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

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send heartbeat for current agent
  const sendHeartbeat = async (agentId: string, status?: string) => {
    try {
      const response = await fetch('/api/agents/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, status }),
      });
      return response.ok;
    } catch (err) {
      console.warn('Failed to send heartbeat:', err);
      return false;
    }
  };

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
          const isOnline = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) < ONLINE_THRESHOLD_MS : false;
          
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

  return { agents, tasks, activities, loading, error, sendHeartbeat };
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
      (taskDoc) => {
        if (taskDoc.exists()) {
          const data = taskDoc.data();
          setTask({
            id: taskDoc.id,
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
      },
      (error) => {
        console.error('Error fetching task:', error);
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
// HOOK - useCreateTask
// ============================================================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  agentId: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedHours?: number;
  clientId?: string;
  clientName?: string;
}

export function useCreateTask() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = async (input: CreateTaskInput, agentName: string): Promise<string | null> => {
    setCreating(true);
    setError(null);

    try {
      const now = Timestamp.now();
      
      // Create the task
      const taskData = {
        title: input.title,
        description: input.description || '',
        agentId: input.agentId,
        status: 'inbox',
        priority: input.priority,
        createdAt: now,
        updatedAt: now,
        estimatedHours: input.estimatedHours || 0,
        elapsedMinutes: 0,
        progressPercent: 0,
        currentPhase: 'research',
        clientId: input.clientId || null,
        clientName: input.clientName || 'Internal',
        blockers: [],
        nextActions: []
      };

      const taskRef = await addDoc(collection(db, 'tasks'), taskData);

      // Add initial log entry
      await addDoc(collection(db, 'tasks', taskRef.id, 'logs'), {
        agentId: input.agentId,
        agentName: agentName,
        timestamp: now,
        type: 'milestone',
        message: `Task created: ${input.title}`,
        details: { priority: input.priority }
      });

      // Log activity using logger
      await logTaskCreated(
        input.title,
        taskRef.id,
        input.agentId as any,
        { priority: input.priority, clientName: input.clientName }
      );

      // Update agent workload
      const agentRef = doc(db, 'agents', input.agentId);
      await updateDoc(agentRef, {
        workload: (await getDoc(agentRef)).data()?.workload || 0 + 1,
        updatedAt: now
      });

      setCreating(false);
      return taskRef.id;
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
      setCreating(false);
      return null;
    }
  };

  return { createTask, creating, error };
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
    id: 'barak',
    name: 'Barak (The Bear)',
    role: 'Research Analyst',
    status: 'active',
    currentTask: 'Researching AI receptionist competitors',
    lastActivity: '2 mins ago',
    color: 'green',
    icon: 'Target',
    isOnline: true,
    workload: 2
  },
  {
    id: 'silk',
    name: 'Silk (Prince Kheldar)',
    role: 'Code Architect',
    status: 'active',
    currentTask: 'Designing tradie workflow',
    lastActivity: '5 mins ago',
    color: 'blue',
    icon: 'Bot',
    isOnline: true,
    workload: 1
  },
  {
    id: 'polgara',
    name: 'Polgara (The Sorceress)',
    role: 'Content Strategist',
    status: 'active',
    currentTask: 'Writing blog post',
    lastActivity: '3 mins ago',
    color: 'amber',
    icon: 'FileText',
    isOnline: true,
    workload: 3
  },
  {
    id: 'cenedra',
    name: "Ce'Nedra (The Queen)",
    role: 'UX Strategist',
    status: 'active',
    currentTask: 'Designing user journey maps',
    lastActivity: '1 min ago',
    color: 'purple',
    icon: 'Layout',
    isOnline: true,
    workload: 2
  },
  {
    id: 'taiba',
    name: 'Taiba (The Seer)',
    role: 'Analytics Expert',
    status: 'active',
    currentTask: 'Analyzing conversion funnels',
    lastActivity: '4 mins ago',
    color: 'blue',
    icon: 'TrendingUp',
    isOnline: true,
    workload: 1
  },
  {
    id: 'beldin',
    name: 'Beldin (The Cynic)',
    role: 'QA & Review',
    status: 'active',
    currentTask: 'Reviewing code quality',
    lastActivity: '6 mins ago',
    color: 'amber',
    icon: 'ShieldCheck',
    isOnline: true,
    workload: 4
  },
  {
    id: 'relg',
    name: 'Relg (The Zealot)',
    role: 'Growth Marketer',
    status: 'active',
    currentTask: 'Optimizing lead generation',
    lastActivity: '8 mins ago',
    color: 'green',
    icon: 'Rocket',
    isOnline: true,
    workload: 2
  },
  {
    id: 'durnik',
    name: 'Durnik (The Smith)',
    role: 'DevOps Engineer',
    status: 'active',
    currentTask: 'Deploying infrastructure updates',
    lastActivity: '10 mins ago',
    color: 'blue',
    icon: 'Wrench',
    isOnline: true,
    workload: 1
  },
  {
    id: 'errand',
    name: 'Errand (The Child)',
    role: 'Innovation Scout',
    status: 'active',
    currentTask: 'Exploring new AI capabilities',
    lastActivity: '12 mins ago',
    color: 'purple',
    icon: 'Sparkles',
    isOnline: true,
    workload: 1
  },
  {
    id: 'mandorallen',
    name: 'Mandorallen (The Knight)',
    role: 'Security Specialist',
    status: 'active',
    currentTask: 'Implementing security protocols',
    lastActivity: '7 mins ago',
    color: 'green',
    icon: 'Sword',
    isOnline: true,
    workload: 2
  }
];

export const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'Competitive Analysis: AI Receptionist Market',
    agentId: 'barak',
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
    agentId: 'silk',
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
    agentId: 'polgara',
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
  },
  {
    id: '4',
    title: 'User Experience Journey Mapping',
    agentId: 'cenedra',
    status: 'in_progress',
    priority: 'P1',
    createdAt: new Date().toISOString(),
    description: 'Map customer touchpoints for tradie onboarding',
    progressPercent: 45,
    currentPhase: 'design',
    estimatedHours: 5,
    elapsedMinutes: 120,
    clientName: 'Plumbing Pros',
    nextActions: ['Interview 5 recent customers', 'Create empathy maps']
  },
  {
    id: '5',
    title: 'Conversion Rate Optimization Analysis',
    agentId: 'taiba',
    status: 'in_progress',
    priority: 'P0',
    createdAt: new Date().toISOString(),
    description: 'Analyze funnel performance and identify drop-off points',
    progressPercent: 70,
    currentPhase: 'research',
    estimatedHours: 3,
    elapsedMinutes: 95,
    clientName: 'Roofing Solutions',
    nextActions: ['Create A/B test plan', 'Recommend UI improvements']
  },
  {
    id: '6',
    title: 'Code Quality Review & Testing',
    agentId: 'beldin',
    status: 'in_progress',
    priority: 'P1',
    createdAt: new Date().toISOString(),
    description: 'Review recent commits and implement automated testing',
    progressPercent: 60,
    currentPhase: 'testing',
    estimatedHours: 4,
    elapsedMinutes: 140,
    clientName: 'Internal - Dev Team',
    nextActions: ['Fix identified bugs', 'Update documentation']
  },
  {
    id: '7',
    title: 'Lead Generation Campaign Optimization',
    agentId: 'relg',
    status: 'in_progress',
    priority: 'P1',
    createdAt: new Date().toISOString(),
    description: 'Optimize Google Ads and Facebook campaigns for tradies',
    progressPercent: 55,
    currentPhase: 'implementation',
    estimatedHours: 8,
    elapsedMinutes: 200,
    clientName: 'Electrical Experts',
    nextActions: ['A/B test ad creatives', 'Refine targeting parameters']
  },
  {
    id: '8',
    title: 'Infrastructure Deployment Pipeline',
    agentId: 'durnik',
    status: 'in_progress',
    priority: 'P0',
    createdAt: new Date().toISOString(),
    description: 'Set up CI/CD pipeline for automated deployments',
    progressPercent: 80,
    currentPhase: 'implementation',
    estimatedHours: 6,
    elapsedMinutes: 280,
    clientName: 'Internal - DevOps',
    nextActions: ['Configure monitoring alerts', 'Test rollback procedures']
  },
  {
    id: '9',
    title: 'AI Voice Technology Research',
    agentId: 'errand',
    status: 'in_progress',
    priority: 'P2',
    createdAt: new Date().toISOString(),
    description: 'Explore latest AI voice synthesis and recognition technologies',
    progressPercent: 30,
    currentPhase: 'research',
    estimatedHours: 5,
    elapsedMinutes: 75,
    clientName: 'Internal - R&D',
    nextActions: ['Test new voice APIs', 'Evaluate cost-benefit analysis']
  },
  {
    id: '10',
    title: 'Security Audit & Compliance Review',
    agentId: 'mandorallen',
    status: 'in_progress',
    priority: 'P0',
    createdAt: new Date().toISOString(),
    description: 'Conduct comprehensive security audit and update protocols',
    progressPercent: 75,
    currentPhase: 'review',
    estimatedHours: 7,
    elapsedMinutes: 315,
    clientName: 'Internal - Security',
    nextActions: ['Implement recommended fixes', 'Update security documentation']
  }
];

export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'task_started',
    agentName: 'Barak (The Bear)',
    message: 'Started competitive analysis research',
    timestamp: '2 mins ago'
  },
  {
    id: '2',
    type: 'task_started',
    agentName: 'Silk (Prince Kheldar)',
    message: 'Designing Go High Level workflow',
    timestamp: '5 mins ago'
  },
  {
    id: '3',
    type: 'file_created',
    agentName: 'Polgara (The Sorceress)',
    message: 'Published blog post: "Why Tradies Lose $50K/Year to Missed Calls"',
    timestamp: '10 mins ago'
  },
  {
    id: '4',
    type: 'task_started',
    agentName: "Ce'Nedra (The Queen)",
    message: 'Created user journey map for tradie onboarding',
    timestamp: '1 min ago'
  },
  {
    id: '5',
    type: 'message',
    agentName: 'Taiba (The Seer)',
    message: 'Identified 23% conversion rate improvement opportunity',
    timestamp: '4 mins ago'
  },
  {
    id: '6',
    type: 'task_completed',
    agentName: 'Beldin (The Cynic)',
    message: 'Completed code review with 15 recommendations',
    timestamp: '6 mins ago'
  },
  {
    id: '7',
    type: 'task_started',
    agentName: 'Relg (The Zealot)',
    message: 'Launched new Google Ads campaign for electricians',
    timestamp: '8 mins ago'
  },
  {
    id: '8',
    type: 'file_created',
    agentName: 'Durnik (The Smith)',
    message: 'Deployed automated backup system',
    timestamp: '10 mins ago'
  },
  {
    id: '9',
    type: 'message',
    agentName: 'Errand (The Child)',
    message: 'Discovered new AI voice synthesis breakthrough',
    timestamp: '12 mins ago'
  },
  {
    id: '10',
    type: 'message',
    agentName: 'Mandorallen (The Knight)',
    message: 'Passed security audit with flying colors',
    timestamp: '7 mins ago'
  }
];

export const DEFAULT_INVESTIGATIONS: InvestigationArea[] = [
  { id: '1', taskId: '1', agentId: 'barak', label: 'Competitor pricing analysis', status: 'completed', order: 1 },
  { id: '2', taskId: '1', agentId: 'barak', label: 'ICP definition & firmographics', status: 'in_progress', order: 2 },
  { id: '3', taskId: '1', agentId: 'barak', label: 'Lead source performance benchmarking', status: 'pending', order: 3 },
  { id: '4', taskId: '1', agentId: 'barak', label: 'Market size & TAM calculation', status: 'pending', order: 4 }
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
    agentId: 'barak',
    title: 'Competitive Analysis Matrix',
    type: 'analysis',
    format: 'markdown',
    status: 'draft',
    version: 'v0.8',
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  }
];
