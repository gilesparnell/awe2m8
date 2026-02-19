/**
 * AI Squad - Agent System
 * 
 * The Belgariad AI Squad - autonomous sub-agents under Garion's control.
 * 
 * Agents:
 * - Garion (Belgarion): Master Controller (Claude 4.5 Sonnet)
 * - Silk (Prince Kheldar): Coder (Codex)
 * - Barak (The Bear): Researcher (Moonshot)
 * - Polgara (The Sorceress): Content (Moonshot)
 * - Ce'Nedra (future): Social Intel (xAI)
 */

// Config
export {
  AGENT_CONFIGS,
  getAgentConfig,
  getActiveAgents,
  getSubAgents,
  agentCan,
  estimateTaskCost,
  shouldEscalate,
  getAgentSystemPrompt,
} from './config';
export type {
  AgentId,
  AgentConfig,
  ModelProvider,
  AgentCapability,
  EscalationTrigger,
} from './config';

// Spawner
export {
  spawnAgent,
  spawnSilk,
  spawnBarak,
  spawnPolgara,
  checkAgentStatus,
  getActiveAgents as getActiveAgentTasks,
  escalateToGarion,
  trackCost,
  hasBudget,
  getRemainingBudget,
  resetDailyCosts,
} from './spawner';
export type {
  SpawnTaskInput,
  SpawnedAgent,
  AgentTask,
} from './spawner';

// Monitor
export {
  useAgentMonitor,
  useAgentTask,
  checkCostAlerts,
  sendAgentHeartbeat,
  isAgentStale,
} from './monitor';
export type {
  AgentStatus,
  SquadStatus,
  CostAlert,
} from './monitor';
