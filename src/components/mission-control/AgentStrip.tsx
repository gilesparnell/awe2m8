/**
 * AgentStrip - Mission Control v3
 * 
 * Compact horizontal agent row with status dots and hover detail
 */

'use client';

import React, { useState } from 'react';
import { Bot, Target, FileText, Activity, Users, CheckCircle2, Clock, MessageSquare, X } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'active' | 'completed' | 'blocked';
  currentTask: string;
  lastActivity: string;
  color: 'green' | 'blue' | 'amber' | 'purple';
  icon: string;
  isOnline?: boolean;
}

interface AgentStripProps {
  agents: Agent[];
}

const iconMap: Record<string, React.ReactNode> = {
  Target: <Target className="w-4 h-4" />,
  Bot: <Bot className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  CheckCircle2: <CheckCircle2 className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  MessageSquare: <MessageSquare className="w-4 h-4" />,
};

const colorStyles = {
  green: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-400' },
  blue: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  amber: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  purple: { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-500/30', dot: 'bg-purple-400' },
};

const statusStyles = {
  idle: { dot: 'bg-gray-400', label: 'Idle' },
  active: { dot: 'bg-green-400 animate-pulse', label: 'Active' },
  completed: { dot: 'bg-blue-400', label: 'Done' },
  blocked: { dot: 'bg-red-400', label: 'Blocked' },
};

function AgentPill({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const style = colorStyles[agent.color];
  const status = statusStyles[agent.status];
  const icon = iconMap[agent.icon] || <Bot className="w-4 h-4" />;

  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-full
        border ${style.border} ${style.bg}
        hover:border-opacity-100 hover:shadow-lg transition-all
        min-w-fit
      `}
    >
      {/* Status Dot */}
      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
      
      {/* Icon */}
      <span className={style.text}>{icon}</span>
      
      {/* Name */}
      <span className="text-sm font-medium text-white whitespace-nowrap">{agent.name}</span>
    </button>
  );
}

function AgentDetailModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  if (!agent) return null;

  const style = colorStyles[agent.color];
  const status = statusStyles[agent.status];
  const icon = iconMap[agent.icon] || <Bot className="w-6 h-6" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
        {/* Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 ${style.bg} rounded-xl flex items-center justify-center border ${style.border}`}>
            <div className={style.text}>{icon}</div>
          </div>
          <div>
            <h3 className={`text-xl font-bold ${style.text}`}>{agent.name}</h3>
            <p className="text-gray-400 text-sm">{agent.role}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              <span className="text-xs text-gray-500">{status.label}</span>
              {agent.isOnline && <span className="text-xs text-green-400">• Online</span>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Task</p>
            <p className="text-white text-sm">{agent.currentTask || 'No active task'}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Activity</p>
            <p className="text-gray-300 text-sm">{agent.lastActivity}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentStrip({ agents }: AgentStripProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  if (!agents || agents.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-500 text-sm">No agents available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium">Squad</span>
        <span className="text-gray-600">•</span>
        <span>{agents.length} agents</span>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {agents.map((agent) => (
          <AgentPill 
            key={agent.id} 
            agent={agent} 
            onClick={() => setSelectedAgent(agent)} 
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal 
          agent={selectedAgent} 
          onClose={() => setSelectedAgent(null)} 
        />
      )}
    </div>
  );
}

export default AgentStrip;