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
  Loader2
} from 'lucide-react';
import { useAgents, DEFAULT_AGENTS, DEFAULT_TASKS, DEFAULT_ACTIVITIES, Agent, Task, ActivityItem } from '@/hooks/useAgents';

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
  file_created: <FileText className="w-4 h-4" />
};

// Components
function AgentCard({ agent }: { agent: Agent }) {
  const colorStyles = {
    green: {
      border: 'border-green-500/50',
      bg: 'bg-green-900/20',
      text: 'text-green-400',
      glow: 'bg-green-500/10'
    },
    blue: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-900/20',
      text: 'text-blue-400',
      glow: 'bg-blue-500/10'
    },
    amber: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-900/20',
      text: 'text-amber-400',
      glow: 'bg-amber-500/10'
    }
  };

  const style = colorStyles[agent.color];
  const icon = iconMap[agent.icon] || <Bot className="w-6 h-6" />;

  return (
    <div className={`group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:${style.border} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
      <div className="relative z-10">
        <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center mb-4 group-hover:bg-opacity-30 transition-colors`}>
          <div className={style.text}>{icon}</div>
        </div>
        <h3 className={`text-xl font-bold text-white mb-2 group-hover:${style.text} transition-colors`}>
          {agent.name}
        </h3>
        <p className="text-gray-400 text-sm mb-4">{agent.role}</p>
        
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Current Task:</span>
            <p className="text-gray-300 mt-1">{agent.currentTask}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-400 animate-pulse' : agent.status === 'blocked' ? 'bg-red-400' : 'bg-gray-400'}`}></span>
            <span className={agent.status === 'active' ? 'text-green-400' : agent.status === 'blocked' ? 'text-red-400' : 'text-gray-400'}>
              {agent.status}
            </span>
            <span className="text-gray-500 ml-auto">{agent.lastActivity}</span>
          </div>
        </div>
      </div>
      
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${style.glow} rounded-full blur-3xl group-hover:opacity-40 transition-all`}></div>
    </div>
  );
}

function TaskBoard({ tasks, agents }: { tasks: Task[]; agents: Agent[] }) {
  const columns = ['inbox', 'in_progress', 'review', 'done'] as const;
  
  const columnNames = {
    inbox: 'Inbox',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
            <h3 className="font-semibold text-white">{columnNames[column]}</h3>
            <span className="text-gray-500 text-sm">
              {tasks.filter(t => t.status === column).length}
            </span>
          </div>
          <div className="space-y-3">
            {tasks.filter(t => t.status === column).map((task) => {
              const agent = agents.find(a => a.id === task.agentId);
              const colorClass = agent?.color === 'green' ? 'text-green-400 bg-green-900/30' :
                                agent?.color === 'blue' ? 'text-blue-400 bg-blue-900/30' :
                                'text-amber-400 bg-amber-900/30';
              return (
                <div key={task.id} className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer">
                  <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-400">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                      {agent?.name || 'Unassigned'}
                    </span>
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

function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-400" />
        Activity Feed
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
                <p className="text-sm text-white">
                  <span className="font-semibold">{activity.agentName}</span>{' '}
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Main Page
export default function MissionControl() {
  const { agents, tasks, activities, loading, error } = useAgents();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Use fallback data if Firebase is empty
  const displayAgents = agents.length > 0 ? agents : DEFAULT_AGENTS;
  const displayTasks = tasks.length > 0 ? tasks : DEFAULT_TASKS;
  const displayActivities = activities.length > 0 ? activities : DEFAULT_ACTIVITIES;

  const refreshData = () => {
    setLastUpdated(new Date());
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
            Back to Tools
          </Link>
        </div>

        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Bot className="w-3 h-3" />
            AI Agent Squad
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              AWE2M8
            </span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
              Mission Control
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your AI agent squad working together. Track progress, assign tasks, and manage deliverables.
          </p>
        </header>

        {/* Connection Status */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-center">
            {error} — Using offline mode
          </div>
        )}

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
            <Users className="w-5 h-5 text-green-400" />
            Your Squad
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

        {/* Task Board */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Task Board
          </h2>
          <TaskBoard tasks={displayTasks} agents={displayAgents} />
        </section>

        {/* Activity Feed */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed activities={displayActivities} />
            </div>
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <span className="text-sm text-white">Assign New Task</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <span className="text-sm text-white">View All Deliverables</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <span className="text-sm text-white">Generate Daily Report</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-400">Last Updated</h4>
                  <button 
                    onClick={refreshData}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-gray-500">{lastUpdated.toLocaleTimeString()}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-600">
                    {agents.length > 0 ? 'Connected to Firebase' : 'Offline Mode'}
                  </p>
                </div>
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
