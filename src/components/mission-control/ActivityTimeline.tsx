/**
 * ActivityTimeline - Mission Control v3
 * 
 * Timeline grouped by time: Today, Yesterday, Earlier
 */

'use client';

import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  FileText,
  AlertCircle,
  Bot,
  Target,
  Wrench,
  AlertTriangle
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'task_started' | 'task_completed' | 'message' | 'file_created' | 'agent_online' | 'agent_offline' | 'milestone' | 'blocker';
  agentName: string;
  message: string;
  timestamp: string;
  cost?: number;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

const activityIcons: Record<string, React.ReactNode> = {
  task_started: <Clock className="w-4 h-4 text-blue-400" />,
  task_completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  message: <MessageSquare className="w-4 h-4 text-gray-400" />,
  file_created: <FileText className="w-4 h-4 text-amber-400" />,
  agent_online: <Activity className="w-4 h-4 text-green-400" />,
  agent_offline: <AlertCircle className="w-4 h-4 text-red-400" />,
  milestone: <Target className="w-4 h-4 text-purple-400" />,
  blocker: <AlertTriangle className="w-4 h-4 text-red-400" />,
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function groupActivitiesByTime(activities: ActivityItem[]) {
  const groups: { [key: string]: ActivityItem[] } = {
    today: [],
    yesterday: [],
    earlier: []
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  activities.forEach(activity => {
    const activityDate = new Date(activity.timestamp);
    
    if (activityDate >= todayStart) {
      groups.today.push(activity);
    } else if (activityDate >= yesterdayStart) {
      groups.yesterday.push(activity);
    } else {
      groups.earlier.push(activity);
    }
  });

  return groups;
}

function TimelineItem({ activity }: { activity: ActivityItem }) {
  const icon = activityIcons[activity.type] || <Activity className="w-4 h-4" />;
  const timeAgo = formatTimeAgo(activity.timestamp);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-800/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          <span className="font-medium">{activity.agentName}</span>{' '}
          <span className="text-gray-300">{activity.message}</span>
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">{timeAgo}</span>
          {activity.cost !== undefined && activity.cost > 0 && (
            <span className="text-xs text-green-400">${activity.cost.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeGroup({ title, activities }: { title: string; activities: ActivityItem[] }) {
  if (activities.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-gray-900/95 backdrop-blur py-2">
        {title}
        <span className="ml-2 text-gray-600">({activities.length})</span>
      </h4>
      <div className="space-y-1">
        {activities.map((activity) => (
          <TimelineItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          Activity Feed
        </h3>
        <p className="text-gray-500 text-sm text-center py-8">No recent activity</p>
      </div>
    );
  }

  const groups = groupActivitiesByTime(activities);

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-400" />
        Activity Feed
      </h3>
      
      <div className="max-h-[500px] overflow-y-auto pr-2">
        <TimeGroup title="Today" activities={groups.today} />
        <TimeGroup title="Yesterday" activities={groups.yesterday} />
        <TimeGroup title="Earlier" activities={groups.earlier} />
      </div>
    </div>
  );
}

export default ActivityTimeline;