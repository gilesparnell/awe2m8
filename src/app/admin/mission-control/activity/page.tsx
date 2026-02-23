'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Bot,
  Target,
  AlertTriangle,
  ShieldCheck,
  Database,
  Filter,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  agentName: string;
  message: string;
  timestamp: string;
  cost?: number;
  metadata?: Record<string, unknown>;
}

const activityIcons: Record<string, React.ReactNode> = {
  task_started: <Clock className="w-4 h-4 text-blue-400" />,
  task_completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  message: <MessageSquare className="w-4 h-4 text-gray-400" />,
  file_created: <FileText className="w-4 h-4 text-amber-400" />,
  agent_spawned: <Bot className="w-4 h-4 text-purple-400" />,
  oversight_report: <ShieldCheck className="w-4 h-4 text-amber-400" />,
  backup_complete: <Database className="w-4 h-4 text-blue-400" />,
  research_complete: <Target className="w-4 h-4 text-green-400" />,
  status_change: <Activity className="w-4 h-4 text-gray-400" />,
  blocker: <AlertTriangle className="w-4 h-4 text-red-400" />,
};

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'task', label: 'Tasks', types: ['task_started', 'task_completed'] },
  { key: 'research', label: 'Research', types: ['research_complete'] },
  { key: 'oversight', label: 'Oversight', types: ['oversight_report'] },
  { key: 'backup', label: 'Backups', types: ['backup_complete'] },
  { key: 'agent', label: 'Agents', types: ['agent_spawned', 'status_change'] },
  { key: 'file', label: 'Files', types: ['file_created'] },
];

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleString('en-AU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch('/api/activities');
        const data = await res.json();
        if (data.success) setActivities(data.activities);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  const filtered = useMemo(() => {
    let result = activities;

    // Apply type filter
    if (activeFilter !== 'all') {
      const filter = filterOptions.find((f) => f.key === activeFilter);
      if (filter?.types) {
        result = result.filter((a) => filter.types!.includes(a.type));
      }
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.agentName.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activities, activeFilter, search]);

  // Stats
  const totalCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0);
  const agentCounts: Record<string, number> = {};
  activities.forEach((a) => {
    agentCounts[a.agentName] = (agentCounts[a.agentName] || 0) + 1;
  });
  const mostActive = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-900/30 border border-green-800 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
            <p className="text-sm text-gray-400">Complete history of agent actions</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-2xl font-bold text-white">{activities.length}</p>
          <p className="text-xs text-gray-400">Total Activities</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-2xl font-bold text-green-400">${totalCost.toFixed(3)}</p>
          <p className="text-xs text-gray-400">Total Cost</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-2xl font-bold text-blue-400">{Object.keys(agentCounts).length}</p>
          <p className="text-xs text-gray-400">Active Agents</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-2xl font-bold text-amber-400 truncate">{mostActive ? mostActive[0] : '—'}</p>
          <p className="text-xs text-gray-400">Most Active ({mostActive ? mostActive[1] : 0})</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            {filterOptions.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === f.key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-800" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No activities found</p>
            {(search || activeFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setActiveFilter('all'); }}
                className="text-xs text-green-400 hover:text-green-300 mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {filtered.map((activity) => {
              const icon = activityIcons[activity.type] || <Activity className="w-4 h-4 text-gray-400" />;
              return (
                <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-800/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.agentName}</span>{' '}
                      <span className="text-gray-300">{activity.message}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                      <span className="text-xs text-gray-600">{formatTime(activity.timestamp)}</span>
                      <span className="text-xs text-gray-700 bg-gray-800 px-2 py-0.5 rounded">{activity.type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  {activity.cost !== undefined && activity.cost > 0 && (
                    <span className="text-sm font-medium text-green-400 flex-shrink-0">
                      ${activity.cost.toFixed(3)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
          <span>Showing {filtered.length} of {activities.length} activities</span>
          <span>Polling every 30s</span>
        </div>
      </div>
    </div>
  );
}
