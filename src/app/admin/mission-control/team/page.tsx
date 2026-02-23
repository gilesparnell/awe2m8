/**
 * Mission Control - Team Page
 * 
 * Displays a grid of all AI agents with their status,
 * role, and last activity time.
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Crown, 
  Bot, 
  Target, 
  FileText, 
  Layout, 
  Rocket, 
  TrendingUp, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  Sword,
  Users,
  RefreshCw,
  Loader2,
  Circle,
  AlertCircle
} from 'lucide-react';

// Icon mapping for agents
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown,
  Bot,
  Target,
  FileText,
  Layout,
  Rocket,
  TrendingUp,
  ShieldCheck,
  Wrench,
  Sparkles,
  Sword
};

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'active' | 'completed' | 'blocked' | 'error';
  currentTask: string;
  lastActivity: string;
  color: 'green' | 'blue' | 'amber' | 'purple';
  icon: string;
  isOnline?: boolean;
  workload?: number;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'idle':
      return 'bg-gray-500';
    case 'error':
    case 'blocked':
      return 'bg-red-500';
    case 'completed':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusTextColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-400';
    case 'idle':
      return 'text-gray-400';
    case 'error':
    case 'blocked':
      return 'text-red-400';
    case 'completed':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
}

function getBorderColor(color: string): string {
  switch (color) {
    case 'green':
      return 'border-green-800';
    case 'blue':
      return 'border-blue-800';
    case 'amber':
      return 'border-amber-800';
    case 'purple':
      return 'border-purple-800';
    default:
      return 'border-gray-800';
  }
}

function getIconBgColor(color: string): string {
  switch (color) {
    case 'green':
      return 'bg-green-900/30';
    case 'blue':
      return 'bg-blue-900/30';
    case 'amber':
      return 'bg-amber-900/30';
    case 'purple':
      return 'bg-purple-900/30';
    default:
      return 'bg-gray-800';
  }
}

function getIconColor(color: string): string {
  switch (color) {
    case 'green':
      return 'text-green-400';
    case 'blue':
      return 'text-blue-400';
    case 'amber':
      return 'text-amber-400';
    case 'purple':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
}

function AgentIcon({ iconName, color }: { iconName: string; color: string }) {
  const IconComponent = ICON_MAP[iconName] || Bot;
  return (
    <div className={`w-12 h-12 ${getIconBgColor(color)} border ${getBorderColor(color)} rounded-xl flex items-center justify-center`}>
      <IconComponent className={`w-6 h-6 ${getIconColor(color)}`} />
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const statusColor = getStatusColor(agent.status);
  const statusTextColor = getStatusTextColor(agent.status);
  const borderColor = getBorderColor(agent.color);

  return (
    <div className={`bg-gray-900 rounded-2xl p-5 border ${borderColor} hover:border-gray-700 transition-colors`}>
      <div className="flex items-start justify-between mb-4">
        <AgentIcon iconName={agent.icon} color={agent.color} />
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor} ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium capitalize ${statusTextColor}`}>
            {agent.status}
          </span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
      <p className="text-sm text-gray-400 mb-3">{agent.role}</p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Circle className="w-3 h-3" />
          <span className="truncate">{agent.currentTask}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-3 h-3" />
          <span>Last active: {agent.lastActivity}</span>
        </div>
      </div>

      {agent.workload !== undefined && agent.workload > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Active tasks</span>
            <span className="text-white font-medium">{agent.workload}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load agents');
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Calculate stats
  const activeCount = agents.filter(a => a.status === 'active').length;
  const idleCount = agents.filter(a => a.status === 'idle').length;
  const errorCount = agents.filter(a => a.status === 'error' || a.status === 'blocked').length;
  const onlineCount = agents.filter(a => a.isOnline).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-900/30 border border-green-800 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Team</h1>
            <p className="text-sm text-gray-400">Manage your AI agent squad</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-2xl font-bold text-white">{agents.length}</p>
          <p className="text-xs text-gray-400">Total Agents</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-2xl font-bold text-blue-400">{idleCount}</p>
          <p className="text-xs text-gray-400">Idle</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-2xl font-bold text-gray-400">{onlineCount}</p>
          <p className="text-xs text-gray-400">Online</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-2xl p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm text-red-400 font-medium">{error}</p>
            <button 
              onClick={fetchAgents}
              className="text-xs text-red-400 hover:text-red-300 underline mt-1"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          <span className="ml-3 text-gray-400">Loading agents...</span>
        </div>
      ) : (
        <>
          {/* Agent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {/* Empty State */}
          {agents.length === 0 && !loading && !error && (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No agents found</p>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </footer>
    </div>
  );
}
