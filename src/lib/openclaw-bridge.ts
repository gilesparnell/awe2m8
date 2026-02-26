/**
 * OpenClaw Session Bridge
 * 
 * Reads live agent sessions from OpenClaw's subagents/runs.json
 * and transforms them into Mission Control task registry format.
 * 
 * This bridges the gap between OpenClaw session spawning and
 * the Mission Control dashboard.
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// ============================================================================
// TYPES
// ============================================================================

export interface OpenClawRun {
  runId: string;
  childSessionKey: string;
  requesterSessionKey: string;
  requesterOrigin: {
    channel?: string;
  };
  requesterDisplayKey: string;
  task: string;
  cleanup: string;
  expectsCompletionMessage: boolean;
  spawnMode: string;
  label?: string;
  model?: string;
  runTimeoutSeconds: number;
  createdAt: number;
  startedAt: number;
  archiveAtMs: number;
  cleanupHandled?: boolean;
  endedAt?: number;
  outcome?: {
    status: string;
  };
  endedReason?: string;
  endedHookEmittedAt?: number;
  cleanupCompletedAt?: number;
}

export interface OpenClawRunsRegistry {
  version: number;
  runs: Record<string, OpenClawRun>;
}

export interface MissionControlTask {
  id: string;
  agent: string;
  description: string;
  workdir: string;
  branch: string;
  tmuxSession?: string;
  status: 'spawning' | 'running' | 'paused' | 'completed' | 'failed';
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  objective: string;
  success_criteria?: string[];
  notifyOnComplete?: boolean;
  deliverables?: string[];
  failure_reason?: string;
  // Live session metadata
  sessionKey?: string;
  model?: string;
  runtime?: number; // milliseconds
  // Cost tracking
  cost?: number; // Actual cost in USD
  estimatedCost?: number; // Estimated cost in USD
}

// ============================================================================
// CONFIG
// ============================================================================

const OPENCLAW_RUNS_PATH = '/Users/gilesparnell/.openclaw/subagents/runs.json';

// Map agent IDs to standardized names
const AGENT_NAME_MAP: Record<string, string> = {
  'silk': 'silk',
  'barak': 'barak',
  'beldin': 'beldin',
  'polgara': 'polgara',
  'cenedra': 'cenedra',
  'taiba': 'taiba',
  'durnik': 'durnik',
  'belgarath': 'belgarath',
  'relg': 'relg',
  'errand': 'errand',
  'mandorallen': 'mandorallen',
  'main': 'garion',
};

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Read and parse OpenClaw runs.json
 */
export async function readOpenClawRuns(): Promise<OpenClawRunsRegistry | null> {
  try {
    if (!existsSync(OPENCLAW_RUNS_PATH)) {
      console.log('[OpenClawBridge] runs.json not found at', OPENCLAW_RUNS_PATH);
      return null;
    }

    const content = await readFile(OPENCLAW_RUNS_PATH, 'utf-8');
    const data = JSON.parse(content) as OpenClawRunsRegistry;
    return data;
  } catch (error) {
    console.error('[OpenClawBridge] Error reading runs.json:', error);
    return null;
  }
}

/**
 * Extract agent ID from session key
 * Format: "agent:barak:subagent:uuid" -> "barak"
 */
function extractAgentId(sessionKey: string): string {
  const parts = sessionKey.split(':');
  // Format: agent:<agentName>:subagent:<uuid> or agent:<agentName>:main
  if (parts.length >= 2 && parts[0] === 'agent') {
    return AGENT_NAME_MAP[parts[1]] || parts[1];
  }
  return 'unknown';
}

/**
 * Convert OpenClaw run status to Mission Control task status
 */
function mapRunStatus(run: OpenClawRun): MissionControlTask['status'] {
  // Check if task has ended first
  if (run.endedAt && run.endedAt > 0) {
    // Task has ended - check the outcome
    if (run.outcome?.status === 'ok' || run.endedReason === 'subagent-complete') {
      return 'completed';
    }
    // Any other ended state is a failure
    return 'failed';
  }
  
  // Task is still active
  if (run.startedAt && run.startedAt > 0) {
    return 'running';
  }
  
  // Task created but not started
  return 'spawning';
}

/**
 * Model cost estimates per 1K tokens (input + output average)
 * Based on OpenRouter pricing as of Feb 2026
 */
const MODEL_COSTS: Record<string, number> = {
  'openrouter/moonshotai/kimi-k2.5': 0.0005,      // $0.50 per 1M tokens
  'openrouter/anthropic/claude-sonnet-4': 0.003,   // $3 per 1M tokens
  'openrouter/anthropic/claude-opus-4': 0.015,     // $15 per 1M tokens
  'openrouter/openai/gpt-4o': 0.0025,              // $2.50 per 1M tokens
  'openrouter/openai/gpt-4o-mini': 0.00015,        // $0.15 per 1M tokens
  'openrouter/openai/codex': 0.002,                // $2 per 1M tokens
  'openrouter/anthropic/claude-opus-4.6': 0.02,    // $20 per 1M tokens
  'openrouter/x-ai/grok': 0.001,                   // $1 per 1M tokens
  'openrouter/x-ai/grok-2': 0.005,                 // $5 per 1M tokens
};

/**
 * Estimate cost based on model and runtime
 * Assumes ~150 tokens per minute of work (rough estimate)
 */
function estimateCost(model: string | undefined, runtime: number | undefined): number {
  if (!model || !runtime) return 0;
  
  const costPer1K = MODEL_COSTS[model] || 0.001; // Default to cheap model
  const durationMinutes = runtime / 60000;
  
  // Estimate tokens: assume agents use ~150 tokens per minute on average
  // This includes input prompts and output responses
  const estimatedTokens = durationMinutes * 150;
  
  return (estimatedTokens / 1000) * costPer1K;
}

/**
 * Transform OpenClaw run to Mission Control task format
 */
function transformRunToTask(run: OpenClawRun): MissionControlTask {
  const agentId = extractAgentId(run.childSessionKey);
  const status = mapRunStatus(run);

  // Calculate runtime if task has ended
  let runtime: number | undefined;
  if (run.endedAt && run.startedAt) {
    runtime = run.endedAt - run.startedAt;
  } else if (run.startedAt) {
    runtime = Date.now() - run.startedAt;
  }

  // Parse task description - truncate if too long
  const description = run.task.length > 100
    ? run.task.substring(0, 100) + '...'
    : run.task;

  // Estimate cost based on model and runtime
  const estimatedCost = estimateCost(run.model, runtime);

  return {
    id: `openclaw-${run.runId}`,
    agent: agentId,
    description,
    workdir: `/Users/gilesparnell/.openclaw/workspace-${agentId}`,
    branch: 'main',
    tmuxSession: `openclaw-${run.runId.substring(0, 8)}`,
    status,
    priority: 'HIGH',
    startedAt: new Date(run.startedAt).toISOString(),
    completedAt: run.endedAt ? new Date(run.endedAt).toISOString() : undefined,
    objective: run.task,
    sessionKey: run.childSessionKey,
    model: run.model,
    runtime,
    cost: status === 'completed' ? estimatedCost : 0,
    estimatedCost,
  };
}

/**
 * Get all live OpenClaw sessions as Mission Control tasks
 */
export async function getLiveOpenClawTasks(): Promise<MissionControlTask[]> {
  const runs = await readOpenClawRuns();
  
  if (!runs || !runs.runs) {
    return [];
  }

  const tasks = Object.values(runs.runs)
    .filter(run => {
      // Only include runs from the last 6 hours (reduce noise from old completed tasks)
      const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
      const isRecent = run.createdAt > sixHoursAgo;
      const isActive = !run.endedAt || run.endedAt === 0;
      return isRecent || isActive;
    })
    .map(transformRunToTask);

  // Sort by startedAt descending (newest first)
  tasks.sort((a, b) => 
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return tasks;
}

/**
 * Get summary statistics for live sessions
 */
export async function getLiveSessionStats(): Promise<{
  total: number;
  running: number;
  completed: number;
  failed: number;
  activeAgents: number;
}> {
  const tasks = await getLiveOpenClawTasks();
  
  const running = tasks.filter(t => t.status === 'running').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const activeAgents = new Set(tasks.filter(t => t.status === 'running').map(t => t.agent)).size;

  return {
    total: tasks.length,
    running,
    completed,
    failed,
    activeAgents,
  };
}

/**
 * Check if a specific agent has an active session
 */
export async function isAgentActive(agentId: string): Promise<boolean> {
  const tasks = await getLiveOpenClawTasks();
  return tasks.some(t => t.agent === agentId && t.status === 'running');
}

/**
 * Get all active sessions for a specific agent
 */
export async function getAgentSessions(agentId: string): Promise<MissionControlTask[]> {
  const tasks = await getLiveOpenClawTasks();
  return tasks.filter(t => t.agent === agentId);
}