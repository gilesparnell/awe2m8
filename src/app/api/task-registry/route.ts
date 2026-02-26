import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { getLiveOpenClawTasks, MissionControlTask } from '@/lib/openclaw-bridge';

/**
 * Task Registry API Route (Enhanced with Live OpenClaw Sessions)
 * 
 * Reads the active-tasks.json file from the main project directory
 * AND live OpenClaw sessions from ~/.openclaw/subagents/runs.json
 * 
 * Merges both data sources to provide a complete view of:
 * - Legacy Elvis-style git worktree tasks
 * - Live OpenClaw agent sessions (Barak, Beldin, etc.)
 */

const TASK_REGISTRY_PATH = '/Users/gilesparnell/Documents/VSStudio/awe2m8-local/.clawbot/active-tasks.json';

export async function GET(request: NextRequest) {
  try {
    // Fetch both data sources in parallel
    const [legacyRegistry, liveTasks] = await Promise.all([
      readLegacyRegistry(),
      getLiveOpenClawTasks(),
    ]);

    // Merge tasks: live OpenClaw sessions take precedence over legacy
    const mergedTasks = mergeTasks(legacyRegistry.tasks, liveTasks);

    // Build merged registry
    const mergedRegistry = {
      _meta: {
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        description: 'Elvis-style agent swarm + Live OpenClaw sessions',
        sources: ['.clawbot/active-tasks.json', '~/.openclaw/subagents/runs.json'],
      },
      tasks: mergedTasks,
      _stats: {
        total: Object.keys(mergedTasks).length,
        legacy: Object.keys(legacyRegistry.tasks).length,
        live: liveTasks.length,
        running: liveTasks.filter(t => t.status === 'running').length,
      },
    };

    // Add CORS headers for development
    const response = NextResponse.json(mergedRegistry);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error reading task registry:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to read task registry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Read legacy task registry from active-tasks.json
 */
async function readLegacyRegistry(): Promise<{ tasks: Record<string, MissionControlTask> }> {
  try {
    if (!existsSync(TASK_REGISTRY_PATH)) {
      return { tasks: {} };
    }

    const content = await readFile(TASK_REGISTRY_PATH, 'utf-8');
    const data = JSON.parse(content);
    return { tasks: data.tasks || {} };
  } catch (error) {
    console.error('[TaskRegistry] Error reading legacy registry:', error);
    return { tasks: {} };
  }
}

/**
 * Merge legacy tasks with live OpenClaw sessions
 * Live sessions take precedence for the same agent
 */
function mergeTasks(
  legacyTasks: Record<string, MissionControlTask>,
  liveTasks: MissionControlTask[]
): Record<string, MissionControlTask> {
  const merged: Record<string, MissionControlTask> = { ...legacyTasks };

  // Add live tasks and remove conflicting legacy tasks
  for (const liveTask of liveTasks) {
    // Use live task ID, prefixed to avoid collisions
    const taskId = liveTask.id;
    
    // Remove any legacy task for the same agent to avoid conflicts
    // Live OpenClaw data is always more accurate than legacy Firebase data
    const existingLegacyKeys = Object.keys(merged).filter(key => {
      const legacy = merged[key];
      return legacy.agent === liveTask.agent;
    });

    // Remove ALL legacy tasks for this agent
    existingLegacyKeys.forEach(key => {
      delete merged[key];
    });

    // Add the live task (always takes precedence)
    merged[taskId] = liveTask;
  }

  return merged;
}