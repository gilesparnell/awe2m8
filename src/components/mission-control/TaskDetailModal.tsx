'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Circle, 
  Clock, 
  GitBranch, 
  Folder, 
  Terminal, 
  Target, 
  Calendar,
  User,
  Activity,
  CheckSquare,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { TaskRegistryEntry, AGENT_REGISTRY, STATUS_COLORS, STATUS_LABELS } from '@/lib/task-registry';

interface TaskDetailModalProps {
  task: TaskRegistryEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

// Utility to format duration
function formatDuration(startedAt: string, completedAt?: string): string {
  const start = new Date(startedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffMins}m`;
}

function getDurationMinutes(startedAt: string, completedAt?: string): number {
  const start = new Date(startedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  return Math.max(1, Math.floor(diffMs / 60000));
}

// Utility to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calculate progress based on status
function getProgress(status: string): number {
  switch (status) {
    case 'completed': return 100;
    case 'failed': return 100;
    case 'running': return 60;
    case 'paused': return 40;
    case 'spawning': return 10;
    default: return 0;
  }
}

// Get status icon
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    case 'running':
      return <Activity className="w-5 h-5 text-green-400 animate-pulse" />;
    case 'paused':
      return <Clock className="w-5 h-5 text-orange-400" />;
    case 'spawning':
      return <Activity className="w-5 h-5 text-yellow-400" />;
    default:
      return <Circle className="w-5 h-5 text-gray-400" />;
  }
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !task) return null;

  const agent = AGENT_REGISTRY[task.agent];
  const progress = getProgress(task.status);
  const successCriteria = Array.isArray(task.success_criteria) ? task.success_criteria : [];
  const duration = formatDuration(task.startedAt, task.completedAt);
  const durationMinutes = getDurationMinutes(task.startedAt, task.completedAt);

  // Agent color classes
  const agentColorClasses: Record<string, string> = {
    green: 'text-green-400 bg-green-900/30 border-green-700',
    blue: 'text-blue-400 bg-blue-900/30 border-blue-700',
    amber: 'text-amber-400 bg-amber-900/30 border-amber-700',
    purple: 'text-purple-400 bg-purple-900/30 border-purple-700',
    red: 'text-red-400 bg-red-900/30 border-red-700',
    slate: 'text-slate-400 bg-slate-900/30 border-slate-700',
    rose: 'text-rose-400 bg-rose-900/30 border-rose-700',
    indigo: 'text-indigo-400 bg-indigo-900/30 border-indigo-700',
    violet: 'text-violet-400 bg-violet-900/30 border-violet-700',
    cyan: 'text-cyan-400 bg-cyan-900/30 border-cyan-700',
    orange: 'text-orange-400 bg-orange-900/30 border-orange-700',
    gray: 'text-gray-400 bg-gray-900/30 border-gray-700',
  };

  const agentColor = agent?.color || 'gray';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-start gap-4">
            {/* Agent Avatar */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${agentColorClasses[agentColor]}`}>
              <User className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1">
                {task.description}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full border ${agentColorClasses[agentColor]}`}>
                  {agent?.name || task.agent}
                </span>
                <span className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            {/* Cost Display - Top Right */}
            <div className="text-right">
              {task.status === 'running' && task.estimatedCost && task.estimatedCost > 0 && (
                <div className="mb-1">
                  <span className="text-lg font-bold text-amber-400">
                    ${task.estimatedCost.toFixed(3)}
                  </span>
                  <div className="text-xs text-gray-500">(running)</div>
                </div>
              )}
              {(task.status === 'completed' || task.status === 'failed') && typeof task.cost === 'number' && (
                <div className="mb-1">
                  <span className={`text-lg font-bold ${task.cost > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${task.cost.toFixed(3)}
                  </span>
                  <div className="text-xs text-gray-500">
                    {task.cost > 0 ? 'final cost' : 'no cost logged'}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            
            {/* Progress Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Progress
              </h3>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={task.status} />
                    <span className="text-white font-medium">
                      {task.status === 'completed' ? 'Task Completed' : 
                       task.status === 'failed' ? 'Task Failed' :
                       task.status === 'running' ? 'Task In Progress' :
                       task.status === 'paused' ? 'Task Paused' : 'Task Spawning'}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-white">{progress}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'failed' ? 'bg-red-500' :
                      task.status === 'running' ? 'bg-green-500' :
                      task.status === 'paused' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* Duration */}
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Duration: <span className="text-white">{duration}</span></span>
                </div>
              </div>
            </section>

            {/* Objective Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Objective
              </h3>
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <p className="text-gray-300 leading-relaxed">{task.objective}</p>
              </div>
            </section>

            {/* Cost Analysis Section */}
            {(typeof task.cost === 'number' || (task.estimatedCost ?? 0) > 0) && (
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Cost Analysis
                </h3>
                
                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <div className="grid grid-cols-2 gap-4">
                    {task.status === 'running' && task.estimatedCost && (
                      <div className="text-center p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-amber-400 mb-1">
                          ${task.estimatedCost.toFixed(3)}
                        </div>
                        <div className="text-xs text-amber-300">Running Cost</div>
                        <div className="text-xs text-gray-500 mt-1">Live estimate</div>
                      </div>
                    )}
                    
                    {typeof task.cost === 'number' && (
                      <div className="text-center p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                        <div className={`text-2xl font-bold mb-1 ${task.cost > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${task.cost.toFixed(3)}
                        </div>
                        <div className={`text-xs ${task.cost > 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {task.cost > 0 ? 'Final Cost' : 'Missing Cost'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {task.cost > 0 ? 'Total spent' : 'Check activity logger'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Cost breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="text-white">{duration}</span>
                      </div>
                      {typeof task.cost === 'number' && (
                        <div className="flex justify-between">
                          <span>Cost per minute:</span>
                          <span className={task.cost > 0 ? 'text-green-400' : 'text-red-400'}>
                            ${(task.cost / durationMinutes).toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Success Criteria Section */}
            {successCriteria.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Success Criteria
                </h3>
                
                <div className="space-y-2">
                  {successCriteria.map((criteria, index) => (
                    <div 
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        task.status === 'completed' 
                          ? 'bg-green-900/10 border-green-700/30' 
                          : 'bg-gray-800/30 border-gray-700/50'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                            task.status === 'running' && index === 0
                              ? 'border-green-500 text-green-400'
                              : 'border-gray-600 text-gray-500'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${
                          task.status === 'completed' 
                            ? 'text-gray-300 line-through' 
                            : task.status === 'running' && index === 0
                              ? 'text-white'
                              : 'text-gray-400'
                        }`}>
                          {criteria}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {task.status === 'completed' 
                      ? 'All criteria completed'
                      : `${successCriteria.length} criteria total`
                    }
                  </span>
                  {task.status !== 'completed' && (
                    <span className="text-green-400">
                      {task.status === 'running' ? '1 in progress' : '0 completed'}
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* Timeline Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline
              </h3>
              
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 space-y-4">
                {/* Started */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-900/30 border border-green-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Task Started</p>
                    <p className="text-sm text-gray-500">{formatDate(task.startedAt)}</p>
                  </div>
                </div>
                
                {/* Arrow connector */}
                <div className="ml-4 pl-4 border-l-2 border-gray-700">
                  <div className="py-2">
                    {task.completedAt ? (
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          task.status === 'completed' 
                            ? 'bg-green-900/30 border border-green-700' 
                            : 'bg-red-900/30 border border-red-700'
                        }`}>
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {task.status === 'completed' ? 'Task Completed' : 'Task Failed'}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(task.completedAt)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ArrowRight className="w-4 h-4" />
                        <span>In progress...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Technical Details Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Technical Details
              </h3>
              
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 space-y-3">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-400">Branch:</span>
                  <code className="text-sm text-green-400 bg-gray-800 px-2 py-1 rounded truncate">
                    {task.branch}
                  </code>
                </div>
                
                <div className="flex items-center gap-3">
                  <Folder className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-400">Workdir:</span>
                  <code className="text-sm text-blue-400 bg-gray-800 px-2 py-1 rounded truncate">
                    {task.workdir?.split('/').pop() || 'N/A'}
                  </code>
                </div>
                
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-400">Session:</span>
                  <code className="text-sm text-gray-300 bg-gray-800 px-2 py-1 rounded truncate">
                    {task.tmuxSession || 'N/A'}
                  </code>
                </div>
                
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-400">Task ID:</span>
                  <code className="text-sm text-gray-500 bg-gray-800 px-2 py-1 rounded truncate">
                    {task.id}
                  </code>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Task ID: {task.id.slice(0, 8)}...
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;
