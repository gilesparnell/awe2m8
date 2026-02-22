'use client';

/**
 * Instrumented Tool Wrappers
 *
 * These wrappers add activity logging to common operations.
 * Import these instead of raw tool calls to get automatic activity tracking.
 */

import {
  logFileRead,
  logFileWrite,
  logFileEdit,
  logWebSearch,
  logWebFetch,
  logCommandExecution,
  logAgentSpawn,
} from '@/lib/activity-logger';
import { ActivityActor } from '@/types/activity';

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Read a file and log the activity
 */
export async function instrumentedRead(
  readFn: () => Promise<string>,
  filePath: string,
  actor: ActivityActor = 'garion'
): Promise<string> {
  const content = await readFn();
  await logFileRead(filePath, actor, { size: content.length });
  return content;
}

/**
 * Write a file and log the activity
 */
export async function instrumentedWrite(
  writeFn: () => Promise<void>,
  filePath: string,
  content: string,
  actor: ActivityActor = 'garion'
): Promise<void> {
  await writeFn();
  await logFileWrite(filePath, actor, { size: content.length });
}

/**
 * Edit a file and log the activity
 */
export async function instrumentedEdit(
  editFn: () => Promise<void>,
  filePath: string,
  actor: ActivityActor = 'garion'
): Promise<void> {
  await editFn();
  await logFileEdit(filePath, actor);
}

// ============================================================================
// WEB OPERATIONS
// ============================================================================

/**
 * Search the web and log the activity
 */
export async function instrumentedWebSearch<T>(
  searchFn: () => Promise<T>,
  query: string,
  actor: ActivityActor = 'garion',
  cost?: number
): Promise<T> {
  const results = await searchFn();
  const resultCount = Array.isArray(results) ? results.length : 1;
  await logWebSearch(query, resultCount, actor, {}, cost);
  return results;
}

/**
 * Fetch a URL and log the activity
 */
export async function instrumentedWebFetch<T>(
  fetchFn: () => Promise<T>,
  url: string,
  actor: ActivityActor = 'garion',
  cost?: number
): Promise<T> {
  const result = await fetchFn();
  await logWebFetch(url, actor, {}, cost);
  return result;
}

// ============================================================================
// COMMAND EXECUTION
// ============================================================================

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a command and log the activity
 */
export async function instrumentedExec(
  execFn: () => Promise<CommandResult>,
  command: string,
  actor: ActivityActor = 'garion',
  cost?: number
): Promise<CommandResult> {
  const result = await execFn();
  await logCommandExecution(command, result.exitCode, actor, {
    stdout: result.stdout.substring(0, 200), // Truncate for metadata
    stderr: result.stderr ? result.stderr.substring(0, 200) : undefined,
  }, cost);
  return result;
}

// ============================================================================
// AGENT OPERATIONS
// ============================================================================

/**
 * Spawn an agent and log the activity
 */
export async function instrumentedAgentSpawn<T>(
  spawnFn: () => Promise<T>,
  targetAgent: ActivityActor,
  task: string,
  actor: ActivityActor = 'garion',
  cost?: number
): Promise<T> {
  const result = await spawnFn();
  await logAgentSpawn(targetAgent, task, actor, {}, cost);
  return result;
}

// ============================================================================
// REACT HOOK: useInstrumentedFileOperations
// ============================================================================

import { useCallback } from 'react';

interface UseInstrumentedOperationsOptions {
  actor?: ActivityActor;
  sessionId?: string;
}

export function useInstrumentedOperations(options: UseInstrumentedOperationsOptions = {}) {
  const { actor = 'garion' } = options;

  const readFile = useCallback(async (filePath: string, readFn: () => Promise<string>) => {
    return instrumentedRead(readFn, filePath, actor);
  }, [actor]);

  const writeFile = useCallback(async (filePath: string, content: string, writeFn: () => Promise<void>) => {
    return instrumentedWrite(writeFn, filePath, content, actor);
  }, [actor]);

  const editFile = useCallback(async (filePath: string, editFn: () => Promise<void>) => {
    return instrumentedEdit(editFn, filePath, actor);
  }, [actor]);

  const webSearch = useCallback(async (query: string, searchFn: () => Promise<any>, cost?: number) => {
    return instrumentedWebSearch(searchFn, query, actor, cost);
  }, [actor]);

  const webFetch = useCallback(async (url: string, fetchFn: () => Promise<any>, cost?: number) => {
    return instrumentedWebFetch(fetchFn, url, actor, cost);
  }, [actor]);

  const runCommand = useCallback(async (command: string, execFn: () => Promise<CommandResult>, cost?: number) => {
    return instrumentedExec(execFn, command, actor, cost);
  }, [actor]);

  const spawnAgent = useCallback(async (targetAgent: ActivityActor, task: string, spawnFn: () => Promise<any>, cost?: number) => {
    return instrumentedAgentSpawn(spawnFn, targetAgent, task, actor, cost);
  }, [actor]);

  return {
    readFile,
    writeFile,
    editFile,
    webSearch,
    webFetch,
    runCommand,
    spawnAgent,
  };
}
