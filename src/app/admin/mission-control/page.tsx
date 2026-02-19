'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  MessageSquare,
  ArrowRight,
  Bot,
  Target,
  BarChart3,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Download,
  ExternalLink,
  TrendingUp,
  Shield,
  Wrench,
  MoreHorizontal,
  CheckSquare,
  PlayCircle,
  LayoutDashboard,
  Plus
} from 'lucide-react';
import { 
  useAgents, 
  useTaskDetail,
  useCreateTask,
  CreateTaskInput,
  Agent, 
  Task, 
  ActivityItem,
  formatDuration,
  DEFAULT_AGENTS,
  DEFAULT_TASKS,
  DEFAULT_ACTIVITIES,
  DEFAULT_INVESTIGATIONS,
  DEFAULT_CONSIDERATIONS,
  DEFAULT_DELIVERABLES
} from '@/hooks/useAgents';
import { NavigationTabs } from '@/components/NavigationTabs';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { AgentWorkCalendar } from '@/components/AgentWorkCalendar';
import { InvestigationBoard } from '@/components/InvestigationBoard';

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  Target: <Target className="w-6 h-6" />,
  Bot: <Bot className="w-6 h-6" />,
  FileText: <FileText className="w-6 h-6" />,
  Activity: <Activity className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
  CheckCircle2: <CheckCircle2 className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  MessageSquare: <MessageSquare className="w-6 h-6" />,
};

const activityIcons: Record<string, React.ReactNode> = {
  task_started: <Clock className="w-4 h-4" />,
  task_completed: <CheckCircle2 className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  file_created: <FileText className="w-4 h-4" />,
  agent_online: <Activity className="w-4 h-4 text-green-400" />,
  agent_offline: <AlertCircle className="w-4 h-4 text-red-400" />
};

const priorityColors = {
  P0: 'bg-red-500/20 text-red-400 border-red-500/50',
  P1: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  P2: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  P3: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
};

const phaseLabels = {
  research: 'Research',
  design: 'Design',
  implementation: 'Implementation',
  testing: 'Testing',
  review: 'Review'
};

const considerationIcons = {
  revenue_impact: <TrendingUp className="w-4 h-4 text-green-400" />,
  risk_assessment: <AlertTriangle className="w-4 h-4 text-red-400" />,
  opportunity: <Lightbulb className="w-4 h-4 text-amber-400" />,
  integration_note: <Wrench className="w-4 h-4 text-blue-400" />,
  strategic: <Target className="w-4 h-4 text-purple-400" />
};

const considerationLabels = {
  revenue_impact: 'Revenue Impact',
  risk_assessment: 'Risk',
  opportunity: 'Opportunity',
  integration_note: 'Integration',
  strategic: 'Strategic'
};

// ============================================================================
// TASK DETAIL MODAL COMPONENT
// ============================================================================

function TaskDetailModal({ 
  taskId, 
  onClose, 
  agents 
}: { 
  taskId: string | null; 
  onClose: () => void;
  agents: Agent[];
}) {
  const { 
    task, 
    logs, 
    investigations, 
    considerations, 
    deliverables, 
    clientContext, 
    loading 
  } = useTaskDetail(taskId);

  const agent = agents.find(a => a.id === task?.agentId);

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 text-xs font-bold rounded border ${priorityColors[task?.priority || 'P2']}`}>
                {task?.priority}
              </span>
              <span className="text-gray-500 text-sm">#{taskId?.slice(0, 8)}</span>
              {task?.clientName && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                  {task.clientName}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{task?.title}</h2>
            {task?.description && (
              <p className="text-gray-400 mt-1">{task.description}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress */}
                <section className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Progress</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Phase: {task?.currentPhase && phaseLabels[task.currentPhase]}</span>
                      <span className="text-white font-medium">{task?.progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                        style={{ width: `${task?.progressPercent || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Est: {task?.estimatedHours}h</span>
                      <span>Elapsed: {task?.elapsedMinutes && formatDuration(task.elapsedMinutes)}</span>
                    </div>
                  </div>
                </section>

                {/* Areas of Investigation */}
                <section className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Areas of Investigation
                  </h3>
                  <div className="space-y-2">
                    {(investigations.length > 0 ? investigations : DEFAULT_INVESTIGATIONS).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : item.status === 'in_progress' ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : item.status === 'blocked' ? (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                        )}
                        <span className={`text-sm ${item.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {item.label}
                        </span>
                        {item.status === 'in_progress' && <span className="ml-auto text-xs text-blue-400">In Progress</span>}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Work Log */}
                <section className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Work Log</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                          {log.type === 'research_update' && <Target className="w-4 h-4 text-green-400" />}
                          {log.type === 'design_update' && <Wrench className="w-4 h-4 text-blue-400" />}
                          {log.type === 'content_update' && <FileText className="w-4 h-4 text-amber-400" />}
                          {log.type === 'milestone' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                          {log.type === 'blocker' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                          {log.type === 'completion' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{log.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{log.agentName}</p>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No activity yet</p>}
                  </div>
                </section>

                {/* Areas to Consider */}
                <section className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Areas to Consider</h3>
                  <div className="space-y-3">
                    {(considerations.length > 0 ? considerations : DEFAULT_CONSIDERATIONS).map((item) => (
                      <div key={item.id} className={`p-4 rounded-lg border ${
                        item.severity === 'critical' ? 'bg-red-900/20 border-red-800' :
                        item.severity === 'warning' ? 'bg-amber-900/20 border-amber-800' :
                        'bg-blue-900/20 border-blue-800'
                      }`}>
                        <div className="flex items-start gap-3">
                          {considerationIcons[item.type]}
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-400 uppercase">{considerationLabels[item.type]}</span>
                            <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Assigned Agent */}
                <section className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Assigned To</h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      agent?.color === 'green' ? 'bg-green-900/30 text-green-400' :
                      agent?.color === 'blue' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-amber-900/30 text-amber-400'
                    }`}>
                      {agent && iconMap[agent.icon]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{agent?.name}</p>
                      <p className="text-sm text-gray-400">{agent?.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${agent?.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="text-xs text-gray-500">{agent?.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Deliverables */}
                <section className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Deliverables</h3>
                  <div className="space-y-3">
                    {(deliverables.length > 0 ? deliverables : DEFAULT_DELIVERABLES).map((item) => (
                      <div key={item.id} className="p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-white font-medium">{item.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            item.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            item.status === 'review' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>{item.status}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>v{item.version}</span>
                          <span>{item.format.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Client Context */}
                {clientContext && (
                  <section className="bg-purple-900/20 border border-purple-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">Client Context</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Company</span><span className="text-white">{clientContext.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Industry</span><span className="text-white">{clientContext.industry}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Location</span><span className="text-white">{clientContext.location}</span></div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AGENT CARD
// ============================================================================

function AgentCard({ agent }: { agent: Agent }) {
  const colorStyles = {
    green: { border: 'border-green-500/50', bg: 'bg-green-900/20', text: 'text-green-400', glow: 'bg-green-500/10' },
    blue: { border: 'border-blue-500/50', bg: 'bg-blue-900/20', text: 'text-blue-400', glow: 'bg-blue-500/10' },
    amber: { border: 'border-amber-500/50', bg: 'bg-amber-900/20', text: 'text-amber-400', glow: 'bg-amber-500/10' },
    purple: { border: 'border-purple-500/50', bg: 'bg-purple-900/20', text: 'text-purple-400', glow: 'bg-purple-500/10' }
  };
  const style = colorStyles[agent.color];
  const icon = iconMap[agent.icon] || <Bot className="w-6 h-6" />;

  return (
    <div className={`group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-opacity-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center`}>
            <div className={style.text}>{icon}</div>
          </div>
          {agent.isOnline ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Online
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full">Offline</span>
          )}
        </div>
        <h3 className={`text-xl font-bold text-white mb-2 ${style.text}`}>{agent.name}</h3>
        <p className="text-gray-400 text-sm mb-4">{agent.role}</p>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Current Task:</span>
            <p className="text-gray-300 mt-1">{agent.currentTask}</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={agent.status === 'active' ? 'text-green-400' : 'text-gray-400'}>{agent.status}</span>
            <span className="text-gray-500">{agent.lastActivity}</span>
          </div>
        </div>
      </div>
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${style.glow} rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-all`} />
    </div>
  );
}

// ============================================================================
// TASK BOARD
// ============================================================================

function TaskBoard({ tasks, agents, onTaskClick }: { tasks: Task[]; agents: Agent[]; onTaskClick: (id: string) => void }) {
  const columns = ['inbox', 'in_progress', 'review', 'done'] as const;
  const columnNames = { inbox: 'Inbox', in_progress: 'In Progress', review: 'Review', done: 'Done' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
            <h3 className="font-semibold text-white">{columnNames[column]}</h3>
            <span className="text-gray-500 text-sm">{tasks.filter(t => t.status === column).length}</span>
          </div>
          <div className="space-y-3">
            {tasks.filter(t => t.status === column).map((task) => {
              const agent = agents.find(a => a.id === task.agentId);
              const colorClass = agent?.color === 'green' ? 'text-green-400 bg-green-900/30' :
                                agent?.color === 'blue' ? 'text-blue-400 bg-blue-900/30' :
                                'text-amber-400 bg-amber-900/30';
              return (
                <div 
                  key={task.id} 
                  onClick={() => onTaskClick(task.id)}
                  className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">{task.title}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityColors[task.priority]}`}>{task.priority}</span>
                  </div>
                  {task.progressPercent !== undefined && task.progressPercent > 0 && (
                    <div className="mb-2">
                      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${task.progressPercent}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{task.progressPercent}%</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>{agent?.name || 'Unassigned'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ACTIVITY FEED
// ============================================================================

function ActivityFeedPreview({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-400" />Activity Feed
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">No activities yet</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-800 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                {activityIcons[activity.type] || <Activity className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white"><span className="font-semibold">{activity.agentName}</span> {activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function MissionControl() {
  const { agents, tasks, activities, loading, error: agentsError } = useAgents();
  const { createTask, creating, error: createTaskError } = useCreateTask();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Note: Heartbeat is disabled for now - would need 'garion' agent in DB
  // or use a different identification method
  // useHeartbeat('garion');

  const displayAgents = agents.length > 0 ? agents : DEFAULT_AGENTS;
  const displayTasks = tasks.length > 0 ? tasks : DEFAULT_TASKS;
  const displayActivities = activities.length > 0 ? activities : DEFAULT_ACTIVITIES;

  const refreshData = () => {
    setLastUpdated(new Date());
    window.location.reload();
  };

  const handleCreateTask = async (input: CreateTaskInput) => {
    const agent = displayAgents.find(a => a.id === input.agentId);
    const agentName = agent?.name || 'Unknown';
    await createTask(input, agentName);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        agents={displayAgents}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTask}
        agents={displayAgents.map(a => ({ id: a.id, name: a.name, color: a.color }))}
        creating={creating}
        error={createTaskError}
      />

      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back to Tools
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8">
          {/* Top row: Title + Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Bot className="w-3 h-3" />AI Agent Squad
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">AWE2M8</span>{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">Mission Control</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                Your AI agent squad working together. Track progress, assign tasks, and manage deliverables.
              </p>
            </div>
            
            {/* Navigation Tabs */}
            <div className="lg:pt-8">
              <NavigationTabs />
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{displayAgents.length}</div>
            <div className="text-sm text-gray-500">Active Agents</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">{displayTasks.filter(t => t.status === 'in_progress').length}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">{displayTasks.filter(t => t.status === 'done').length}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{displayActivities.length}</div>
            <div className="text-sm text-gray-500">Activities Today</div>
          </div>
        </div>

        {/* Agent Cards */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />Your Squad
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </section>

        {/* Investigation Board */}
        <section className="mb-12">
          <InvestigationBoard onStoryClick={setSelectedTaskId} />
        </section>

        {/* Agent Work Calendar */}
        <section className="mb-12">
          <AgentWorkCalendar />
        </section>

        {/* Activity Feed Preview */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />Recent Activity
            </h2>
            <Link 
              href="/admin/mission-control/activity"
              className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeedPreview activities={displayActivities} />
            </div>
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 bg-green-900/30 border border-green-800 rounded-lg hover:bg-green-900/50 transition-colors text-left"
                >
                  <span className="text-sm text-green-400 font-medium">+ Assign New Task</span>
                  <ArrowRight className="w-4 h-4 text-green-400" />
                </button>
                <Link 
                  href="/admin/mission-control/activity"
                  className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-sm text-white">View All Activities</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-400">Last Updated</h4>
                  <button onClick={refreshData} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                    <RefreshCw className="w-3 h-3" />Refresh
                  </button>
                </div>
                <p className="text-xs text-gray-500">{lastUpdated.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Mission Control v1.0 • AWE2M8 AI Squad • {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
