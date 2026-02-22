/**
 * Squad Showcase Page
 * 
 * Beautiful settings page showing all 10 agents with avatars, core functions, and edit links
 */

'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Code, 
  Search, 
  FileText, 
  Bot, 
  MessageSquare,
  BarChart3,
  Shield,
  Hammer,
  Eye,
  Sword,
  BookOpen,
  Edit3,
  ExternalLink,
  DollarSign,
  Clock,
  Target
} from 'lucide-react';
import { getAgentConfig, AgentConfig } from '@/lib/agents/config';

// Agent icons mapping
const AGENT_ICONS = {
  garion: Shield,
  silk: Code,
  barak: Search,
  polgara: FileText,
  cenedra: MessageSquare,
  taiba: Eye,
  beldin: BarChart3,
  relg: Target,
  durnik: Hammer,
  errand: BookOpen,
  mandorallen: Sword,
} as const;

// Agent gradient backgrounds
const AGENT_GRADIENTS = {
  garion: 'from-purple-600 to-indigo-600',
  silk: 'from-blue-600 to-cyan-600',
  barak: 'from-green-600 to-emerald-600',
  polgara: 'from-amber-600 to-orange-600',
  cenedra: 'from-rose-600 to-pink-600',
  taiba: 'from-indigo-600 to-purple-600',
  beldin: 'from-slate-600 to-gray-600',
  relg: 'from-orange-600 to-red-600',
  durnik: 'from-brown-600 to-amber-700',
  errand: 'from-violet-600 to-purple-600',
  mandorallen: 'from-silver-600 to-gray-500',
} as const;

// Agent role colors
const AGENT_ROLE_COLORS = {
  garion: 'text-purple-400',
  silk: 'text-blue-400',
  barak: 'text-green-400',
  polgara: 'text-amber-400',
  cenedra: 'text-rose-400',
  taiba: 'text-indigo-400',
  beldin: 'text-slate-400',
  relg: 'text-orange-400',
  durnik: 'text-brown-400',
  errand: 'text-violet-400',
  mandorallen: 'text-gray-400',
} as const;

interface AgentCardProps {
  agent: AgentConfig;
  onEdit: (agent: AgentConfig) => void;
  onViewDetails: (agent: AgentConfig) => void;
}

function AgentCard({ agent, onEdit, onViewDetails }: AgentCardProps) {
  const Icon = AGENT_ICONS[agent.id] || Bot;
  const gradient = AGENT_GRADIENTS[agent.id] || 'from-gray-600 to-gray-700';
  const roleColor = AGENT_ROLE_COLORS[agent.id] || 'text-gray-400';
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20 hover:-translate-y-1 group">
      {/* Header with gradient background */}
      <div className={`h-24 bg-gradient-to-br ${gradient} relative overflow-hidden transition-all duration-300 group-hover:h-28`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <Icon className="w-12 h-12 text-white/90 transition-all duration-300 group-hover:w-14 group-hover:h-14" />
        </div>
        {/* Decorative elements */}
        <div className="absolute top-2 right-2 w-4 h-4 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute bottom-3 left-3 w-2 h-2 bg-white/20 rounded-full" />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Agent Info */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-1">
            {agent.name}
          </h3>
          <p className={`text-sm font-medium ${roleColor} mb-2`}>
            {agent.role}
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            {agent.description}
          </p>
        </div>
        
        {/* Cost Info */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Cost per 1K tokens</span>
            <span className="text-green-400 font-mono">${agent.costProfile.estimatedCostPer1KTokens.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-500">Daily budget</span>
            <span className="text-blue-400 font-mono">${agent.costProfile.dailyBudget.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Capabilities */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Capabilities</h4>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 4).map((capability) => (
              <span 
                key={capability}
                className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full"
              >
                {capability.replace('_', ' ')}
              </span>
            ))}
            {agent.capabilities.length > 4 && (
              <span className="text-xs px-2 py-1 bg-gray-800 text-gray-500 rounded-full">
                +{agent.capabilities.length - 4} more
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(agent)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => onEdit(agent)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-800 text-green-400 rounded-lg transition-colors text-sm"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

interface AgentDetailModalProps {
  agent: AgentConfig | null;
  onClose: () => void;
}

function AgentDetailModal({ agent, onClose }: AgentDetailModalProps) {
  if (!agent) return null;
  
  const Icon = AGENT_ICONS[agent.id] || Bot;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <p className="text-sm text-gray-400">{agent.belgariadName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Agent Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Role</span>
                <p className="text-white font-medium">{agent.role}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Model</span>
                <p className="text-white font-medium">{agent.model.provider}/{agent.model.model}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Temperature</span>
                <p className="text-white font-medium">{agent.model.temperature}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Max Tokens</span>
                <p className="text-white font-medium">{agent.model.maxTokens.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Cost Profile */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Cost Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400 text-sm">Cost per 1K tokens</span>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  ${agent.costProfile.estimatedCostPer1KTokens.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-sm">Daily budget</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  ${agent.costProfile.dailyBudget.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Capabilities */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Capabilities</h3>
            <div className="grid grid-cols-2 gap-2">
              {agent.capabilities.map((capability) => (
                <div key={capability} className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-gray-300 text-sm">
                    {capability.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Escalation Triggers */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Escalation Triggers</h3>
            <div className="space-y-2">
              {agent.escalationTriggers.length > 0 ? (
                agent.escalationTriggers.map((trigger) => (
                  <div key={trigger} className="flex items-center gap-2 p-2 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    <span className="text-amber-300 text-sm capitalize">
                      {trigger.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No escalation triggers configured</p>
              )}
            </div>
          </div>
          
          {/* Personality */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Personality</h3>
            <p className="text-gray-300 leading-relaxed">{agent.personality}</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-800 bg-gray-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SquadShowcasePage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get all agents (excluding future agents)
  const allAgents = getAllAgents().filter(agent => agent.id !== 'cenedra');
  
  // Filter agents based on search query
  const agents = allAgents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.belgariadName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent(agent);
  };
  
  const handleViewDetails = (agent: AgentConfig) => {
    setSelectedAgent(agent);
  };
  
  const handleCloseModal = () => {
    setSelectedAgent(null);
    setEditingAgent(null);
  };
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                The Belgariad AI Squad
              </h1>
              <p className="text-gray-400 mt-1">
                Meet your mystical team of specialized AI agents
              </p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mt-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
            <div className="text-xl lg:text-2xl font-bold text-white">{agents.length}</div>
            <div className="text-xs lg:text-sm text-gray-400">Active Agents</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
            <div className="text-xl lg:text-2xl font-bold text-green-400">
              ${agents.reduce((sum, agent) => sum + agent.costProfile.dailyBudget, 0).toFixed(2)}
            </div>
            <div className="text-xs lg:text-sm text-gray-400">Total Daily Budget</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
            <div className="text-xl lg:text-2xl font-bold text-blue-400">
              ${Math.min(...agents.map(a => a.costProfile.estimatedCostPer1KTokens)).toFixed(2)}
            </div>
            <div className="text-xs lg:text-sm text-gray-400">Min Cost per 1K tokens</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 lg:p-4">
            <div className="text-xl lg:text-2xl font-bold text-purple-400">
              ${Math.max(...agents.map(a => a.costProfile.estimatedCostPer1KTokens)).toFixed(2)}
            </div>
            <div className="text-xs lg:text-sm text-gray-400">Max Cost per 1K tokens</div>
          </div>
        </div>
      </div>
      
      {/* Agent Grid */}
      {agents.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No agents found</h3>
          <p className="text-gray-500">
            {searchQuery ? `No agents match "${searchQuery}"` : 'No agents to display'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEditAgent}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
      
      {/* Modals */}
      <AgentDetailModal
        agent={selectedAgent}
        onClose={handleCloseModal}
      />
      
      {/* Edit Modal - Coming Soon */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <Edit3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Agent Editor</h3>
              <p className="text-gray-500 text-sm mb-4">
                Full editing capability coming in Phase 2.
                <br />
                Agent: {editingAgent.name}
              </p>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get all agents
function getAllAgents() {
  const agentIds = ['garion', 'silk', 'barak', 'polgara', 'taiba', 'beldin', 'relg', 'durnik', 'errand', 'mandorallen'] as const;
  return agentIds.map(id => getAgentConfig(id));
}