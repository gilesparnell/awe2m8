/**
 * Real Agent Spawner
 * 
 * Spawns sub-agents as actual background processes that report to Firestore.
 */

import { AgentId, getAgentConfig } from './config';
import { logAgentSpawn } from '@/lib/activity-logger';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';

export interface SpawnTaskInput {
  agentId: AgentId;
  task: string;
  context?: string;
  deliverables?: string[];
  files?: string[];
  estimatedTokens?: number;
  maxDuration?: number;
}

export interface SpawnedAgent {
  processId: number;
  agentId: AgentId;
  taskId: string;
  estimatedCost: number;
  startedAt: Date;
}

/**
 * Spawn a real sub-agent process
 * 
 * This creates:
 * 1. A Firestore task record
 * 2. A background Node.js process that executes the task
 * 3. Real-time progress updates in Firestore
 */
export async function spawnRealAgent(
  input: SpawnTaskInput
): Promise<SpawnedAgent | null> {
  const config = getAgentConfig(input.agentId);
  
  // Check budget
  const estimatedCost = (input.estimatedTokens || 2000) / 1000 * config.costProfile.estimatedCostPer1KTokens;
  
  console.log(`[Spawner] Attempting to spawn ${input.agentId}...`);
  console.log(`  Task: ${input.task.substring(0, 50)}...`);
  console.log(`  Est. Cost: $${estimatedCost.toFixed(2)}`);
  
  try {
    // Create task record
    const taskData = {
      agentId: input.agentId,
      status: 'pending',
      task: input.task,
      context: input.context,
      deliverables: input.deliverables,
      files: input.files,
      estimatedCost,
      startedAt: Timestamp.now(),
      progress: 'Initializing...',
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
    
    // Spawn the actual process
    const { spawn } = await import('child_process');
    const projectDir = '/Users/gilesparnell/Documents/VSStudio/awe2m8-local';
    
    const child = spawn('node', [
      `${projectDir}/scripts/agent-executor.js`,
      taskRef.id,
      input.agentId,
    ], {
      detached: true,
      stdio: 'pipe',
      cwd: projectDir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });
    
    // Log process output
    child.stdout.on('data', (data) => {
      console.log(`[${input.agentId}] ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`[${input.agentId}] ERROR: ${data.toString().trim()}`);
    });
    
    child.on('close', async (code) => {
      console.log(`[${input.agentId}] Process exited with code ${code}`);
      
      // Update task status
      const status = code === 0 ? 'completed' : 'failed';
      await updateDoc(doc(db, 'agent_tasks', taskRef.id), {
        status,
        completedAt: code === 0 ? Timestamp.now() : null,
        exitCode: code,
      });
    });
    
    // Unref so parent can exit without waiting
    child.unref();
    
    console.log(`[Spawner] ✅ Spawned ${input.agentId} (PID: ${child.pid})`);
    console.log(`  Task ID: ${taskRef.id}`);
    
    return {
      processId: child.pid || 0,
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
 * Spawn Silk for coding tasks
 */
export async function spawnSilk(
  task: string,
  deliverables: string[],
  files: string[],
  context?: string
): Promise<SpawnedAgent | null> {
  return spawnRealAgent({
    agentId: 'silk',
    task,
    deliverables,
    files,
    context,
    estimatedTokens: 3000,
    maxDuration: 30,
  });
}

/**
 * Spawn Barak for research
 */
export async function spawnBarak(
  target: string,
  depth: 'quick' | 'deep' = 'quick'
): Promise<SpawnedAgent | null> {
  const task = depth === 'deep' 
    ? `Deep research on ${target}`
    : `Quick research on ${target}`;
    
  return spawnRealAgent({
    agentId: 'barak',
    task,
    deliverables: ['Research findings', 'Analysis report'],
    files: [],
    estimatedTokens: depth === 'deep' ? 5000 : 2000,
    maxDuration: depth === 'deep' ? 60 : 20,
  });
}

/**
 * Spawn Polgara for content
 */
export async function spawnPolgara(
  contentType: 'blog' | 'email' | 'landing_page' | 'social',
  topic: string
): Promise<SpawnedAgent | null> {
  return spawnRealAgent({
    agentId: 'polgara',
    task: `Create ${contentType} about: ${topic}`,
    deliverables: ['Draft content', 'SEO optimization', 'Meta description'],
    files: [],
    estimatedTokens: 4000,
    maxDuration: 30,
  });
}
