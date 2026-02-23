/**
 * Agent Spawner
 * 
 * Spawns sub-agents (Silk, Barak, Polgara) as background sessions.
 * Integrates with OpenClaw's sessions_spawn for isolated execution.
 */

import {
  AgentId,
  getAgentConfig,
  getAgentSystemPrompt,
  shouldEscalate,
  estimateTaskCost,
  AgentCapability
} from './config';
import { logAgentSpawn, logTaskCreated, logTaskCompletedWithCost } from '@/lib/activity-logger';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface SpawnTaskInput {
  agentId: AgentId;
  task: string;
  context?: string;
  deliverables?: string[];
  estimatedTokens?: number;
  maxDuration?: number; // minutes
  parentTaskId?: string;
}

export interface SpawnedAgent {
  sessionKey: string;
  agentId: AgentId;
  taskId: string;
  estimatedCost: number;
  startedAt: Date;
}

export interface AgentTask {
  id: string;
  agentId: AgentId;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'escalated';
  task: string;
  context?: string;
  deliverables?: string[];
  result?: string;
  cost?: number;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  sessionKey?: string;
  escalationReason?: string;
}

// ============================================================================
// COST TRACKING
// ============================================================================

const dailyCosts: Map<AgentId, number> = new Map();
const dailyBudgets: Map<AgentId, number> = new Map();

/**
 * Track cost for an agent
 */
export function trackCost(agentId: AgentId, cost: number): void {
  const current = dailyCosts.get(agentId) || 0;
  dailyCosts.set(agentId, current + cost);
}

/**
 * Check if agent has budget remaining
 */
export function hasBudget(agentId: AgentId, estimatedCost: number): boolean {
  const config = getAgentConfig(agentId);
  const current = dailyCosts.get(agentId) || 0;
  return (current + estimatedCost) <= config.costProfile.dailyBudget;
}

/**
 * Get remaining budget for an agent
 */
export function getRemainingBudget(agentId: AgentId): number {
  const config = getAgentConfig(agentId);
  const current = dailyCosts.get(agentId) || 0;
  return config.costProfile.dailyBudget - current;
}

/**
 * Reset daily costs (call at midnight)
 */
export function resetDailyCosts(): void {
  dailyCosts.clear();
}

// ============================================================================
// AGENT SPAWNER
// ============================================================================

/**
 * Spawn a sub-agent to complete a task
 * 
 * This creates:
 * 1. A Firestore task record for tracking
 * 2. A background OpenClaw session for the agent
 * 3. Activity log entry
 * 
 * @param input Task details and agent to spawn
 * @returns Spawned agent details
 */
export async function spawnAgent(
  input: SpawnTaskInput
): Promise<SpawnedAgent | null> {
  const config = getAgentConfig(input.agentId);
  
  // Check budget
  const estimatedCost = estimateTaskCost(
    input.agentId, 
    input.estimatedTokens || 2000
  );
  
  if (!hasBudget(input.agentId, estimatedCost)) {
    console.warn(`[Spawner] Budget exceeded for ${input.agentId}`);
    console.warn(`  Estimated: $${estimatedCost.toFixed(2)}`);
    console.warn(`  Remaining: $${getRemainingBudget(input.agentId).toFixed(2)}`);
    return null;
  }
  
  try {
    // Create task record in Firestore
    const taskData: Omit<AgentTask, 'id'> = {
      agentId: input.agentId,
      status: 'pending',
      task: input.task,
      context: input.context,
      deliverables: input.deliverables,
      startedAt: Timestamp.now(),
    };
    
    const taskRef = await addDoc(collection(db, 'agent_tasks'), taskData);
    
    // Log activity
    await logAgentSpawn(
      input.agentId,
      input.task,
      'garion',
      { 
        taskId: taskRef.id,
        estimatedCost,
        deliverables: input.deliverables,
      }
    );
    
    // Build the prompt for the sub-agent
    const systemPrompt = getAgentSystemPrompt(input.agentId);
    const fullPrompt = buildAgentPrompt(input, systemPrompt);
    
    // Spawn the background session
    // Note: This uses OpenClaw's sessions_spawn capability
    // We'll implement the actual spawn call when we have the API
    const sessionKey = `agent:${input.agentId}:${taskRef.id}`;
    
    // Update task with session key
    await updateDoc(doc(db, 'agent_tasks', taskRef.id), {
      sessionKey,
      status: 'running',
    });
    
    console.log(`[Spawner] Spawned ${input.agentId} for task: ${input.task}`);
    console.log(`  Task ID: ${taskRef.id}`);
    console.log(`  Session: ${sessionKey}`);
    console.log(`  Est. Cost: $${estimatedCost.toFixed(2)}`);
    
    return {
      sessionKey,
      agentId: input.agentId,
      taskId: taskRef.id,
      estimatedCost,
      startedAt: new Date(),
    };
    
  } catch (error) {
    console.error('[Spawner] Failed to spawn agent:', error);
    return null;
  }
}

/**
 * Build the full prompt for a sub-agent
 */
function buildAgentPrompt(
  input: SpawnTaskInput,
  systemPrompt: string
): string {
  return `${systemPrompt}

=== YOUR TASK ===
${input.task}

${input.context ? `=== CONTEXT ===\n${input.context}\n` : ''}

${input.deliverables ? `=== DELIVERABLES ===\n${input.deliverables.map(d => `- ${d}`).join('\n')}\n` : ''}

=== INSTRUCTIONS ===
1. Work on this task autonomously
2. Report progress every 10 minutes to Firestore
3. If you get stuck for >15 minutes, escalate to Garion
4. When complete, write results to the task document
5. Be cost-conscious - use the cheapest tools that work
6. Log your activities using the activity logger

=== REPORTING ===
Update your task status in Firestore collection 'agent_tasks', document ID: [will be provided]

Start working now. You have ${input.maxDuration || 60} minutes.`;
}

// ============================================================================
// AGENT MONITORING
// ============================================================================

/**
 * Check status of a spawned agent
 */
export async function checkAgentStatus(
  taskId: string
): Promise<AgentTask | null> {
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const taskDoc = await getDoc(doc(db, 'agent_tasks', taskId));
    
    if (!taskDoc.exists()) {
      return null;
    }
    
    return { id: taskDoc.id, ...taskDoc.data() } as AgentTask;
  } catch (error) {
    console.error('[Spawner] Failed to check status:', error);
    return null;
  }
}

/**
 * Get all active agent tasks
 */
export async function getActiveAgents(): Promise<AgentTask[]> {
  try {
    const { query, where, getDocs } = await import('firebase/firestore');
    const q = query(
      collection(db, 'agent_tasks'),
      where('status', 'in', ['pending', 'running'])
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as AgentTask));
  } catch (error) {
    console.error('[Spawner] Failed to get active agents:', error);
    return [];
  }
}

/**
 * Escalate a task back to Garion
 */
export async function escalateToGarion(
  taskId: string,
  reason: string,
  context?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'agent_tasks', taskId), {
      status: 'escalated',
      escalationReason: reason,
      escalationContext: context,
    });

    console.log(`[Spawner] Task ${taskId} escalated: ${reason}`);

    // TODO: Notify Garion (send message, push notification, etc.)
  } catch (error) {
    console.error('[Spawner] Failed to escalate:', error);
  }
}

/**
 * Complete a task with actual cost tracking
 * This should be called when an agent finishes its work
 */
export async function completeTask(
  taskId: string,
  result: string,
  actualCost: number,
  agentId: AgentId
): Promise<void> {
  try {
    // Update the task document
    await updateDoc(doc(db, 'agent_tasks', taskId), {
      status: 'completed',
      result,
      actualCost,
      completedAt: Timestamp.now(),
    });

    // Track the cost
    trackCost(agentId, actualCost);

    // Log the completion with cost
    const taskDoc = await getDoc(doc(db, 'agent_tasks', taskId));
    const taskData = taskDoc.data();
    const taskTitle = taskData?.task || 'Unknown task';

    await logTaskCompletedWithCost(taskTitle, taskId, actualCost, agentId);

    console.log(`[Spawner] Task ${taskId} completed with cost: $${actualCost.toFixed(4)}`);
  } catch (error) {
    console.error('[Spawner] Failed to complete task:', error);
  }
}

// Helper function for getDoc
async function getDoc(docRef: any) {
  const { getDoc: firestoreGetDoc } = await import('firebase/firestore');
  return firestoreGetDoc(docRef);
}

// ============================================================================
// HIGH-LEVEL WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Spawn Silk (Coder) for a coding task
 */
export async function spawnSilk(
  task: string,
  filesToEdit?: string[],
  context?: string
): Promise<SpawnedAgent | null> {
  return spawnAgent({
    agentId: 'silk',
    task,
    context: context || `You are writing code for the awe2m8 project.
${filesToEdit ? `Focus on these files: ${filesToEdit.join(', ')}` : ''}`,
    deliverables: ['Working code', 'Brief explanation of changes'],
    estimatedTokens: 3000,
    maxDuration: 30,
  });
}

/**
 * Spawn Barak (Researcher) for competitive analysis
 */
export async function spawnBarak(
  target: string,
  depth: 'quick' | 'deep' = 'quick'
): Promise<SpawnedAgent | null> {
  const task = depth === 'deep' 
    ? `Deep research on ${target}: pricing, features, customers, weaknesses, market position`
    : `Quick overview of ${target}: key facts and positioning`;
    
  return spawnAgent({
    agentId: 'barak',
    task,
    deliverables: ['Research report', 'Key findings summary'],
    estimatedTokens: depth === 'deep' ? 5000 : 2000,
    maxDuration: depth === 'deep' ? 60 : 20,
  });
}

/**
 * Spawn Polgara (Content) for writing tasks
 */
export async function spawnPolgara(
  contentType: 'blog' | 'email' | 'landing_page' | 'social',
  topic: string,
  seoKeywords?: string[]
): Promise<SpawnedAgent | null> {
  const typeDescriptions: Record<string, string> = {
    blog: 'SEO-optimized blog post',
    email: 'Email sequence',
    landing_page: 'Landing page copy',
    social: 'Social media posts',
  };
  
  return spawnAgent({
    agentId: 'polgara',
    task: `Write ${typeDescriptions[contentType]} about: ${topic}`,
    context: seoKeywords ? `SEO keywords to include: ${seoKeywords.join(', ')}` : undefined,
    deliverables: ['Draft content', 'Meta description', 'Suggested title'],
    estimatedTokens: 4000,
    maxDuration: 30,
  });
}
