/**
 * Agent Work Calendar
 * 
 * Shows planned tasks vs actual work being done by agents.
 * Real-time updates from Firestore.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  User,
  ArrowRight
} from 'lucide-react';
import { useAgentTasks } from '@/hooks/useAgentTasks';
import { AgentTask } from '@/lib/agents/spawner';
import { ACTOR_LABELS, ACTOR_COLORS } from '@/types/activity';

// ============================================================================
// TYPES
// ============================================================================

interface WorkCalendarProps {
  className?: string;
}

interface TaskCardProps {
  task: AgentTask;
  isPlanned?: boolean;
}

// ============================================================================
// TASK CARD
// ============================================================================

function TaskCard({ task, isPlanned = false }: TaskCardProps) {
  const color = ACTOR_COLORS[task.agentId] || 'gray';
  const label = ACTOR_LABELS[task.agentId] || task.agentId;
  
  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-gray-400" />,
    running: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    failed: <AlertCircle className="w-4 h-4 text-red-400" />,
    escalated: <ArrowRight className="w-4 h-4 text-amber-400" />,
  };
  
  const statusColors = {
    pending: 'border-gray-700 bg-gray-800/50',
    running: 'border-blue-500/50 bg-blue-900/20',
    completed: 'border-green-500/50 bg-green-900/20',
    failed: 'border-red-500/50 bg-red-900/20',
    escalated: 'border-amber-500/50 bg-amber-900/20',
  };
  
  return (
    <div className={`
      p-3 rounded-lg border ${statusColors[task.status]}
      ${isPlanned ? 'opacity-75' : ''}
      transition-all hover:scale-[1.02]
    `}>
      <div className="flex items-start gap-2">
        {statusIcons[task.status]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded bg-${color}-900/30 text-${color}-400`}>
              {task.agentId}
            </span>
            {isPlanned && (
              <span className="text-xs text-gray-500">(Planned)</span>
            )}
          </div>
          <p className="text-sm text-white mt-1 truncate">
            {task.task}
          </p>
          {task.progress && (
            <p className="text-xs text-gray-400 mt-1">
              {task.progress}
            </p>
          )}
          {task.status === 'running' && (
            <div className="mt-2">
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse w-2/3" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AgentWorkCalendar({ className = '' }: WorkCalendarProps) {
  const [viewMode, setViewMode] = useState<'planned' | 'actual' | 'both'>('both');
  const { tasks, loading } = useAgentTasks();
  
  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const planned = tasks.filter(t => t.status === 'pending');
    const active = tasks.filter(t => t.status === 'running');
    const completed = tasks.filter(t => t.status === 'completed');
    const failed = tasks.filter(t => t.status === 'failed');
    
    return { planned, active, completed, failed };
  }, [tasks]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Agent Work Calendar
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Planned work vs actual execution
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          {(['planned', 'actual', 'both'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">
            {groupedTasks.active.length}
          </div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-400">
            {groupedTasks.planned.length}
          </div>
          <div className="text-sm text-gray-500">Planned</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">
            {groupedTasks.completed.length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-400">
            {groupedTasks.failed.length}
          </div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
      </div>
      
      {/* Task Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planned Work */}
        {(viewMode === 'planned' || viewMode === 'both') && (
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Planned Work
            </h3>
            <div className="space-y-3">
              {groupedTasks.planned.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No planned tasks
                </p>
              ) : (
                groupedTasks.planned.map((task) => (
                  <TaskCard key={task.id} task={task} isPlanned />
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Active Work */}
        {(viewMode === 'actual' || viewMode === 'both') && (
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-400" />
              Currently Executing
            </h3>
            <div className="space-y-3">
              {groupedTasks.active.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active tasks
                </p>
              ) : (
                groupedTasks.active.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Completed Work */}
      {groupedTasks.completed.length > 0 && (
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Recently Completed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupedTasks.completed.slice(0, 6).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
