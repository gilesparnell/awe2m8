/**
 * Mission Control Dashboard - Real Agent Swarm Data
 * 
 * Main page using real task registry data from .clawbot/active-tasks.json
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, Target, GitBranch, Users, CheckCircle, Clock } from 'lucide-react';
import { useTaskRegistry, useAgentStatus, useActivityFeed, AGENT_REGISTRY, STATUS_COLORS } from '@/lib/task-registry';
import { useCostTracking } from '@/hooks/useCostTracking';
import { HealthCheckCard } from '@/components/mission-control/HealthCheckCard';

export default function MissionControlPage() {
  const { stats, loading: tasksLoading, lastUpdated, refresh } = useTaskRegistry({ pollInterval: 5000 });
  const { agentStatuses } = useAgentStatus({ pollInterval: 5000 });
  const { activities } = useActivityFeed({ pollInterval: 5000 });
  const {
    todayCost,
    weekCost,
    totalAllTimeSpend,
    loading: costLoading,
  } = useCostTracking();

  // Filter to only show agents actively working (running or spawning)
  const activeAgents = agentStatuses.filter(agentStatus => 
    agentStatus.currentTask?.status === 'running' || 
    agentStatus.currentTask?.status === 'spawning'
  );

  // Calculate derived stats
  const activeTasks = stats.running + stats.spawning;
  const zeroCostCompletions = activities.filter(
    (activity) =>
      (activity.type === 'task_completed' || activity.type === 'task_failed') &&
      (activity.metadata?.cost === undefined || activity.metadata.cost <= 0)
  ).length;

  const refreshData = () => {
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Mission Control</h1>
            <p className="text-gray-500 mt-1">
              Elvis-style Agent Swarm Monitoring
              <span className="text-xs text-gray-600 ml-2">
                (live from git worktrees)
              </span>
            </p>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Agents"
          value={stats.activeAgents}
          color="blue"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Active Tasks"
          value={activeTasks}
          color="green"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Completed"
          value={stats.completed}
          color="purple"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Total Tasks"
          value={stats.total}
          color="amber"
        />
      </div>

      {/* Agent Status Strip - Only Active Agents */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Active Agents
          {activeAgents.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
              {activeAgents.length}
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAgents.map((agentStatus) => (
            <AgentStatusCard key={agentStatus.agent.id} agentStatus={agentStatus} />
          ))}
          {activeAgents.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No active agents</p>
              <p className="text-sm text-gray-600 mt-1">All agents are currently idle</p>
            </div>
          )}
        </div>
      </section>

      {/* Activity Feed */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
              Recent Activity
            </h2>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              {activities.slice(0, 10).map((activity, index) => (
                <ActivityRow 
                  key={activity.id} 
                  activity={activity}
                  isLast={index === activities.slice(0, 10).length - 1}
                />
              ))}
              {activities.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link 
                  href="/admin/mission-control/board"
                  className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-sm text-white">Task Board</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link 
                  href="/admin/mission-control/activity"
                  className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-sm text-white">Full Activity Feed</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link 
                  href="/admin/mission-control/team"
                  className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-sm text-white">Team Status</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Last Updated</span>
                </div>
                <p className="text-xs text-gray-500">{lastUpdated.toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Cost Card */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Cost Today</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-green-400">
                  ${costLoading ? '...' : todayCost.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">USD</span>
              </div>
              
              {/* Total Cost Section */}
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total All-Time</span>
                  <span className="text-lg font-semibold text-white">
                    ${costLoading ? '...' : totalAllTimeSpend.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Combined provider + activity totals
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">This Week</span>
                  <span className="text-lg font-semibold text-white">
                    ${costLoading ? '...' : weekCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Running Tasks Cost Estimate */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Running Tasks Est.</span>
                  <span className="text-sm font-medium text-amber-400">
                    ${(() => {
                      const runningCost = activeAgents.reduce((sum, agentStatus) => 
                        sum + (agentStatus.currentTask?.estimatedCost || 0), 0);
                      return runningCost.toFixed(3);
                    })()}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {activeAgents.length} active agent{activeAgents.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-400 rounded-full"
                  style={{ width: `${Math.min((todayCost / 50) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">of $50 daily budget</p>
            </div>

            <HealthCheckCard
              activeAgents={stats.activeAgents}
              activeTasks={activeTasks}
              completedTasks={stats.completed}
              failedTasks={stats.failed}
              todayCost={todayCost}
              weekCost={weekCost}
              totalAllTimeSpend={totalAllTimeSpend}
              zeroCostCompletions={zeroCostCompletions}
              loading={tasksLoading || costLoading}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Mission Control v3.1 • Elvis Agent Swarm • {new Date().getFullYear()}</p>
        <p className="text-xs text-gray-600 mt-1">
          Reading from .clawbot/active-tasks.json
        </p>
      </footer>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'green' | 'blue' | 'amber' | 'purple' | 'red';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm opacity-80">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

interface AgentStatusCardProps {
  agentStatus: {
    agent: typeof AGENT_REGISTRY.silk;
    currentTask: { id: string; description: string; branch: string; status: string } | null;
    allTasks: { id: string }[];
    isOnline: boolean;
    lastActivity: string;
  };
}

function AgentStatusCard({ agentStatus }: AgentStatusCardProps) {
  const { agent, currentTask, allTasks, isOnline, lastActivity } = agentStatus;

  const colorClasses: Record<string, string> = {
    green: 'border-green-500/30 bg-green-900/10',
    blue: 'border-blue-500/30 bg-blue-900/10',
    amber: 'border-amber-500/30 bg-amber-900/10',
    purple: 'border-purple-500/30 bg-purple-900/10',
    red: 'border-red-500/30 bg-red-900/10',
    slate: 'border-slate-500/30 bg-slate-900/10',
    rose: 'border-rose-500/30 bg-rose-900/10',
    indigo: 'border-indigo-500/30 bg-indigo-900/10',
    violet: 'border-violet-500/30 bg-violet-900/10',
    cyan: 'border-cyan-500/30 bg-cyan-900/10',
    orange: 'border-orange-500/30 bg-orange-900/10',
    gray: 'border-gray-500/30 bg-gray-900/10',
  };

  const textColors: Record<string, string> = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    slate: 'text-slate-400',
    rose: 'text-rose-400',
    indigo: 'text-indigo-400',
    violet: 'text-violet-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    gray: 'text-gray-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[agent.color]} bg-gray-900/50`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`font-semibold ${textColors[agent.color]}`}>{agent.name}</h3>
          <p className="text-xs text-gray-500">{agent.role}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
      </div>
      
      {currentTask ? (
        <div className="space-y-2">
          <p className="text-sm text-white line-clamp-2">{currentTask.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <GitBranch className="w-3 h-3" />
            <code className="truncate">{currentTask.branch}</code>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[currentTask.status as keyof typeof STATUS_COLORS] || 'bg-gray-500/20 text-gray-400'}`}>
              {currentTask.status}
            </span>
            <span className="text-xs text-gray-500">{lastActivity}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No active task</p>
          <p className="text-xs text-gray-600 mt-1">{allTasks.length} total tasks</p>
        </div>
      )}
    </div>
  );
}

interface ActivityRowProps {
  activity: {
    id: string;
    type: string;
    agentName: string;
    agentColor: string;
    message: string;
    relativeTime: string;
    metadata?: { branch?: string; cost?: number; estimatedCost?: number };
  };
  isLast: boolean;
}

function ActivityRow({ activity, isLast }: ActivityRowProps) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    slate: 'text-slate-400',
    rose: 'text-rose-400',
    indigo: 'text-indigo-400',
    violet: 'text-violet-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    gray: 'text-gray-400',
  };

  const typeIcons: Record<string, string> = {
    task_started: '🚀',
    task_completed: '✅',
    task_failed: '❌',
    agent_online: '🟢',
    agent_offline: '🔴',
  };

  return (
    <div className={`flex items-start gap-3 p-4 ${!isLast ? 'border-b border-gray-800' : ''}`}>
      <span className="text-lg shrink-0">{typeIcons[activity.type] || '📝'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          <span className={colorClasses[activity.agentColor] || 'text-gray-400'}>
            {activity.agentName}
          </span>
          {' '}
          {activity.message}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {activity.metadata?.branch && (
            <p className="text-xs text-gray-500">
              <code>{activity.metadata.branch}</code>
            </p>
          )}
          {/* Activity Cost Display */}
          {activity.metadata?.cost && activity.metadata.cost > 0 && (
            <span className="text-xs font-medium text-green-400">
              ${activity.metadata.cost.toFixed(3)}
            </span>
          )}
          {activity.metadata?.estimatedCost && activity.metadata.estimatedCost > 0 && !activity.metadata.cost && (
            <span className="text-xs font-medium text-amber-400">
              ~${activity.metadata.estimatedCost.toFixed(3)}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-500 shrink-0">{activity.relativeTime}</span>
    </div>
  );
}
