'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { CreateTaskInput } from '@/hooks/useAgents';

interface Agent {
  id: string;
  name: string;
  color: 'green' | 'blue' | 'amber' | 'purple';
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateTaskInput) => Promise<void>;
  agents: Agent[];
  creating: boolean;
  error?: string | null;
}

const agentColors = {
  green: 'bg-green-900/30 text-green-400 border-green-700',
  blue: 'bg-blue-900/30 text-blue-400 border-blue-700',
  amber: 'bg-amber-900/30 text-amber-400 border-amber-700',
  purple: 'bg-purple-900/30 text-purple-400 border-purple-700',
};

const priorityColors = {
  P0: 'bg-red-500/20 text-red-400 border-red-500/50',
  P1: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  P2: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  P3: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
};

export function CreateTaskModal({ isOpen, onClose, onCreate, agents, creating, error }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [priority, setPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [clientName, setClientName] = useState('');

  // Update agentId when agents prop changes (e.g., when data loads)
  useEffect(() => {
    if (agents.length > 0 && !agentId) {
      setAgentId(agents[0].id);
    }
  }, [agents, agentId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAgentId(agents[0]?.id || '');
      setPriority('P2');
      setEstimatedHours(2);
      setClientName('');
    }
  }, [isOpen, agents]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !agentId) return;

    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        agentId,
        priority,
        estimatedHours,
        clientName: clientName.trim() || 'Internal'
      });
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create New Task</h2>
              <p className="text-sm text-gray-400">Assign work to your AI squad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={creating}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Research competitor pricing"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
              required
              disabled={creating}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 resize-none"
              disabled={creating}
            />
          </div>

          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Assign To <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setAgentId(agent.id)}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    agentId === agent.id
                      ? agentColors[agent.color]
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
                  disabled={creating}
                >
                  {agent.name}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                    priority === p
                      ? priorityColors[p]
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
                  disabled={creating}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Hours & Client */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Est. Hours
              </label>
              <input
                type="number"
                min={0.5}
                max={100}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                disabled={creating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Client/Project
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., Sunset Plumbing"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                disabled={creating}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={creating || !title.trim() || !agentId}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Task...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
