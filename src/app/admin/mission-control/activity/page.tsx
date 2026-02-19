/**
 * Activity Feed Page
 * 
 * Full-page view of all activities with comprehensive filtering
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  FileText
} from 'lucide-react';
import { ActivityFeed } from '@/components/ActivityFeed';
import { useActivityStats } from '@/hooks/useActivityFeed';
import { ActivityLog, ActivityActor, ACTOR_COLORS, ACTOR_LABELS } from '@/types/activity';

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color] || colorClasses.gray}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ActivityPage() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const { total, byActor, byCategory, loading: statsLoading } = useActivityStats(7);

  const handleActivityClick = (activity: ActivityLog) => {
    setSelectedActivity(activity);
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export activities');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Link */}
          <div className="mb-4">
            <Link 
              href="/admin/mission-control" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Mission Control
            </Link>
          </div>

          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Activity className="w-3 h-3" />
                Activity Feed
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  All Activities
                </span>
              </h1>
              <p className="text-gray-400 mt-1">
                Complete history of everything Garion and your agents are working on.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard 
            label="Total (7 days)" 
            value={statsLoading ? 0 : total} 
            color="green" 
          />
          <StatCard 
            label={ACTOR_LABELS.garion} 
            value={statsLoading ? 0 : (byActor.garion || 0)} 
            color={ACTOR_COLORS.garion} 
          />
          <StatCard 
            label={ACTOR_LABELS.barak} 
            value={statsLoading ? 0 : (byActor.barak || 0)} 
            color={ACTOR_COLORS.barak} 
          />
          <StatCard 
            label={ACTOR_LABELS.silk} 
            value={statsLoading ? 0 : (byActor.silk || 0)} 
            color={ACTOR_COLORS.silk} 
          />
          <StatCard 
            label={ACTOR_LABELS.polgara} 
            value={statsLoading ? 0 : (byActor.polgara || 0)} 
            color={ACTOR_COLORS.polgara} 
          />
          <StatCard 
            label="System" 
            value={statsLoading ? 0 : (byActor.system || 0)} 
            color={ACTOR_COLORS.system} 
          />
        </div>

        {/* Activity Feed */}
        <ActivityFeed 
          showFilters={true}
          maxHeight="800px"
          onActivityClick={handleActivityClick}
        />
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActivityDetailModal 
          activity={selectedActivity} 
          onClose={() => setSelectedActivity(null)} 
        />
      )}
    </div>
  );
}

// ============================================================================
// ACTIVITY DETAIL MODAL
// ============================================================================

interface ActivityDetailModalProps {
  activity: ActivityLog;
  onClose: () => void;
}

function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  const timestamp = activity.timestamp instanceof Date 
    ? activity.timestamp 
    : activity.timestamp.toDate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Activity Details</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Actor */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500">Actor:</span>
            <span className="font-semibold text-white">{ACTOR_LABELS[activity.actor]}</span>
            <span className="text-xs text-gray-500">({activity.actorType})</span>
          </div>

          {/* Action */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500">Action:</span>
            <span className="font-semibold text-white capitalize">{activity.action}</span>
          </div>

          {/* Category */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500">Category:</span>
            <span className="font-semibold text-white capitalize">{activity.category}</span>
          </div>

          {/* Description */}
          <div>
            <span className="text-gray-500 block mb-1">Description:</span>
            <p className="text-white">{activity.description}</p>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500">Time:</span>
            <span className="text-white">
              {timestamp.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          {/* Session ID */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500">Session:</span>
            <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
              {activity.sessionId}
            </code>
          </div>

          {/* File Path */}
          {activity.metadata.filePath && (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                File:
              </span>
              <button
                onClick={() => {
                  const fullPath = `/Users/gilesparnell/Documents/VSStudio/awe2m8-local/${activity.metadata.filePath}`;
                  window.open(`vscode://file${fullPath}`, '_blank');
                }}
                className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer font-mono text-sm"
                title="Open in VS Code"
              >
                {activity.metadata.filePath}
              </button>
            </div>
          )}

          {/* Metadata */}
          {Object.keys(activity.metadata).length > 0 && (
            <div className="border-t border-gray-800 pt-4 mt-4">
              <span className="text-gray-500 block mb-2">Metadata:</span>
              <pre className="bg-gray-800 p-3 rounded-lg text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(activity.metadata, null, 2)}
              </pre>
            </div>
          )}
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
