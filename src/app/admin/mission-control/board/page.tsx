/**
 * Mission Control Board Page - Real Agent Swarm Data
 * 
 * Kanban-style task board reading from .clawbot/active-tasks.json
 */

'use client';

import { useState } from 'react';
import { useTaskRegistry, getTaskColumn, STATUS_COLORS, STATUS_LABELS, TaskRegistryEntry, AGENT_REGISTRY } from '@/lib/task-registry';
import { Loader2, CheckSquare, GitBranch, Folder, Terminal } from 'lucide-react';
import { TaskDetailModal } from '@/components/mission-control/TaskDetailModal';

const COLUMNS = ['todo', 'in_progress', 'done'] as const;
const COLUMN_NAMES = { 
  todo: 'TODO', 
  in_progress: 'In Flight', 
  done: 'Done',
};

export default function BoardPage() {
  const { tasks, loading, error, lastUpdated, refresh } = useTaskRegistry({ pollInterval: 3000 });
  const [selectedTask, setSelectedTask] = useState<TaskRegistryEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading tasks</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button 
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Group tasks by column
  const tasksByColumn = {
    todo: tasks.filter(t => getTaskColumn(t.status) === 'todo'),
    in_progress: tasks.filter(t => getTaskColumn(t.status) === 'in_progress'),
    done: tasks.filter(t => getTaskColumn(t.status) === 'done'),
  };

  const handleTaskClick = (task: TaskRegistryEntry) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTask(null), 200); // Clear after animation
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-green-400" />
            Task Board
          </h1>
          <p className="text-gray-500 mt-1">
            Live agent work from git worktrees
            <span className="text-xs text-gray-600 ml-2">
              (updated {lastUpdated.toLocaleTimeString()})
            </span>
            <span className="text-xs text-gray-600 ml-2">
              • Click any task card for details
            </span>
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((column) => (
          <div key={column} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
              <h3 className="font-semibold text-white">{COLUMN_NAMES[column]}</h3>
              <span className="text-gray-500 text-sm">
                {tasksByColumn[column].length}
              </span>
            </div>
            <div className="space-y-3">
              {tasksByColumn[column].map((task) => (
                column === 'done' ? (
                  <DoneTaskItem
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                  />
                ) : (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => handleTaskClick(task)}
                  />
                )
              ))}
              {tasksByColumn[column].length === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

// ============================================================================
// TASK CARD COMPONENT
// ============================================================================

interface TaskCardProps {
  task: TaskRegistryEntry;
  onClick: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const agent = AGENT_REGISTRY[task.agent];
  const successCriteria = Array.isArray(task.success_criteria) ? task.success_criteria : [];
  
  const agentColorClass = agent?.color === 'green' ? 'text-green-400 bg-green-900/30' :
                         agent?.color === 'blue' ? 'text-blue-400 bg-blue-900/30' :
                         agent?.color === 'amber' ? 'text-amber-400 bg-amber-900/30' :
                         agent?.color === 'purple' ? 'text-purple-400 bg-purple-900/30' :
                         agent?.color === 'red' ? 'text-red-400 bg-red-900/30' :
                         agent?.color === 'slate' ? 'text-slate-400 bg-slate-900/30' :
                         agent?.color === 'rose' ? 'text-rose-400 bg-rose-900/30' :
                         agent?.color === 'indigo' ? 'text-indigo-400 bg-indigo-900/30' :
                         agent?.color === 'violet' ? 'text-violet-400 bg-violet-900/30' :
                         agent?.color === 'cyan' ? 'text-cyan-400 bg-cyan-900/30' :
                         agent?.color === 'orange' ? 'text-orange-400 bg-orange-900/30' :
                         'text-gray-400 bg-gray-900/30';

  // Calculate duration
  const duration = (() => {
    if (!task.startedAt) return '-';
    const startedMs = new Date(task.startedAt).getTime();
    if (Number.isNaN(startedMs)) return '-';
    const now = new Date();
    const durationMs = Math.max(0, now.getTime() - startedMs);
    const durationHours = Math.floor(durationMs / 3600000);
    const durationMins = Math.floor((durationMs % 3600000) / 60000);
    return durationHours > 0 ? `${durationHours}h ${durationMins}m` : `${durationMins}m`;
  })();

  // Calculate progress for visual indicator
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-orange-500';
      case 'spawning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressWidth = (status: string) => {
    switch (status) {
      case 'completed': return '100%';
      case 'failed': return '100%';
      case 'running': return '60%';
      case 'paused': return '40%';
      case 'spawning': return '10%';
      default: return '0%';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-all cursor-pointer group border border-gray-700/50 hover:border-gray-500 hover:shadow-lg hover:shadow-black/20"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Header: Title + Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white group-hover:text-green-400 transition-colors line-clamp-2">
          {task.description}
        </h4>
        <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLORS[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {/* Objective */}
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {task.objective}
      </p>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full rounded-full transition-all ${getProgressColor(task.status)}`}
          style={{ width: getProgressWidth(task.status) }}
        />
      </div>

      {/* Metadata: Branch, Workdir, Session */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <GitBranch className="w-3 h-3 shrink-0" />
          <code className="truncate font-mono">{task.branch}</code>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Folder className="w-3 h-3 shrink-0" />
          <code className="truncate font-mono text-gray-500">
            {task.workdir?.split('/').pop() || 'No workdir'}
          </code>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Terminal className="w-3 h-3 shrink-0" />
          <span className="truncate">{task.tmuxSession || 'No session'}</span>
        </div>
      </div>

      {/* Footer: Agent + Duration + Cost */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
        <span className={`text-xs px-2 py-1 rounded-full ${agentColorClass}`}>
          {agent?.name || task.agent}
        </span>
        <div className="flex items-center gap-2">
          {/* Running Cost Display */}
          {task.status === 'running' && task.estimatedCost && task.estimatedCost > 0 && (
            <span className="text-xs text-amber-400 font-medium">
              ${task.estimatedCost.toFixed(3)} (running)
            </span>
          )}
          {/* Final Cost Display */}
          {(task.status === 'completed' || task.status === 'failed') && typeof task.cost === 'number' && (
            <span className={`text-xs font-medium ${task.cost > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${task.cost.toFixed(3)}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {duration}
          </span>
        </div>
      </div>

      {/* Success Criteria Preview */}
      {successCriteria.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700/30">
          <p className="text-xs text-gray-500 mb-1">Success criteria:</p>
          <ul className="space-y-0.5">
            {successCriteria.slice(0, 2).map((criteria, i) => (
              <li key={i} className="text-xs text-gray-600 truncate">
                • {criteria}
              </li>
            ))}
            {successCriteria.length > 2 && (
              <li className="text-xs text-green-400">
                +{successCriteria.length - 2} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Click hint */}
      <div className="mt-2 pt-2 border-t border-gray-700/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-center text-green-400">
          Click for details →
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// DONE TASK ITEM COMPONENT - Clean single-line display for completed tasks
// Target layout: [✓] Full readable task description here without truncation [2h ago]
// ============================================================================

interface DoneTaskItemProps {
  task: TaskRegistryEntry;
  onClick: () => void;
}

function DoneTaskItem({ task, onClick }: DoneTaskItemProps) {
  // Format relative time (e.g., "2h ago", "1d ago")
  const completedTime = task.completedAt 
    ? formatTimeAgo(new Date(task.completedAt))
    : null;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/50 hover:bg-gray-700 rounded-lg cursor-pointer group border border-gray-700/30 hover:border-gray-500 hover:shadow-md transition-all"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      title={task.description} // Shows full text on hover
    >
      {/* Completion indicator */}
      <CheckSquare className="w-4 h-4 text-green-500 shrink-0" />
      
      {/* Task description - full text, no truncation */}
      <span className="flex-1 text-sm text-gray-300 group-hover:text-white leading-relaxed">
        {task.description}
      </span>
      
      {/* Final Cost + Completion time */}
      <div className="flex items-center gap-3 shrink-0">
        {typeof task.cost === 'number' && (
          <span className={`text-sm font-semibold ${task.cost > 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${task.cost.toFixed(3)}
          </span>
        )}
        {completedTime && (
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {completedTime}
          </span>
        )}
      </div>
    </div>
  );
}

// Helper function for relative time formatting
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}
