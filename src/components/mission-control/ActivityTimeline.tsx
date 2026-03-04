'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  FileText,
  AlertCircle,
  Bot,
  Target,
  AlertTriangle,
  Heart,
  Search,
  Database,
  DollarSign,
  Settings,
  Shield,
  Filter,
  X
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ActivityCategory = 'agent_work' | 'system_operations' | 'infrastructure' | 'cost_monitoring';

interface ActivityItem {
  id: string;
  type: string;
  agentName: string;
  message: string;
  timestamp: string;
  cost?: number;
  category: ActivityCategory;
}

interface CategoryConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

const CATEGORY_CONFIG: Record<ActivityCategory, CategoryConfig> = {
  agent_work: {
    label: 'Agent Work',
    icon: <Bot className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  system_operations: {
    label: 'System Operations',
    icon: <Settings className="w-3.5 h-3.5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  infrastructure: {
    label: 'Infrastructure',
    icon: <Database className="w-3.5 h-3.5" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  cost_monitoring: {
    label: 'Cost Monitoring',
    icon: <DollarSign className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
};

// ============================================================================
// ACTIVITY TYPE CONFIGURATION
// ============================================================================

const activityIcons: Record<string, React.ReactNode> = {
  // Agent Work
  task_started: <Clock className="w-4 h-4 text-purple-400" />,
  task_completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  task_failed: <AlertCircle className="w-4 h-4 text-red-400" />,
  agent_spawned: <Bot className="w-4 h-4 text-purple-400" />,
  agent_online: <Activity className="w-4 h-4 text-green-400" />,
  agent_offline: <AlertCircle className="w-4 h-4 text-red-400" />,
  
  // System Operations
  heartbeat: <Heart className="w-4 h-4 text-blue-400" />,
  oversight: <Search className="w-4 h-4 text-blue-400" />,
  maintenance: <Settings className="w-4 h-4 text-blue-400" />,
  
  // Infrastructure
  backup_complete: <Database className="w-4 h-4 text-green-400" />,
  health_check: <Shield className="w-4 h-4 text-green-400" />,
  cleanup: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  
  // Cost Monitoring
  budget_alert: <DollarSign className="w-4 h-4 text-amber-400" />,
  cost_report: <DollarSign className="w-4 h-4 text-amber-400" />,
  usage_tracking: <Activity className="w-4 h-4 text-amber-400" />,
  
  // Legacy types
  message: <MessageSquare className="w-4 h-4 text-gray-400" />,
  file_created: <FileText className="w-4 h-4 text-amber-400" />,
  milestone: <Target className="w-4 h-4 text-purple-400" />,
  blocker: <AlertTriangle className="w-4 h-4 text-red-400" />,
  oversight_report: <Search className="w-4 h-4 text-blue-400" />,
  research_complete: <FileText className="w-4 h-4 text-green-400" />,
  status_change: <Activity className="w-4 h-4 text-gray-400" />,
};

// Map activity types to categories
const getActivityCategory = (type: string): ActivityCategory => {
  const systemOps = ['heartbeat', 'oversight', 'maintenance', 'oversight_report'];
  const infrastructure = ['backup_complete', 'health_check', 'cleanup'];
  const costMonitoring = ['budget_alert', 'cost_report', 'usage_tracking'];
  
  if (systemOps.includes(type)) return 'system_operations';
  if (infrastructure.includes(type)) return 'infrastructure';
  if (costMonitoring.includes(type)) return 'cost_monitoring';
  return 'agent_work';
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

function CategoryBadge({ category }: { category: ActivityCategory }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function TimelineItem({ activity }: { activity: ActivityItem }) {
  const icon = activityIcons[activity.type] || <Activity className="w-4 h-4" />;
  const timeAgo = formatTimeAgo(activity.timestamp);
  const category = activity.category || getActivityCategory(activity.type);
  const categoryConfig = CATEGORY_CONFIG[category];

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 rounded-lg px-2 -mx-2 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryConfig.bgColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <CategoryBadge category={category} />
        </div>
        <p className="text-sm text-white">
          <span className="font-medium">{activity.agentName}</span>{' '}
          <span className="text-gray-300">{activity.message}</span>
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">{timeAgo}</span>
          {activity.cost !== undefined && activity.cost > 0 && (
            <span className="text-xs text-green-400">${activity.cost.toFixed(3)}</span>
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

// ============================================================================
// CATEGORY FILTER COMPONENT
// ============================================================================

function CategoryFilter({ 
  selectedCategories, 
  onChange 
}: { 
  selectedCategories: ActivityCategory[];
  onChange: (categories: ActivityCategory[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCategory = (category: ActivityCategory) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter(c => c !== category));
    } else {
      onChange([...selectedCategories, category]);
    }
  };

  const selectAll = () => onChange(['agent_work', 'system_operations', 'infrastructure', 'cost_monitoring']);
  const clearAll = () => onChange([]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-colors"
      >
        <Filter className="w-3.5 h-3.5" />
        Filter
        {selectedCategories.length < 4 && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px]">
            {selectedCategories.length}/4
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-xl shadow-xl border border-gray-700 z-50 py-2">
            <div className="flex items-center justify-between px-3 pb-2 border-b border-gray-700">
              <span className="text-xs font-medium text-gray-400">Filter by category</span>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300">All</button>
                <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-400">None</button>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {(Object.keys(CATEGORY_CONFIG) as ActivityCategory[]).map((category) => {
                const config = CATEGORY_CONFIG[category];
                const isSelected = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isSelected ? 'bg-gray-700 text-white' : 'hover:bg-gray-700/50 text-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${config.bgColor}`}>
                      {config.icon}
                    </div>
                    <span className="flex-1 text-left">{config.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ActivityTimeline() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<ActivityCategory[]>([
    'agent_work', 'system_operations', 'infrastructure', 'cost_monitoring'
  ]);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch('/api/activities');
        const data = await res.json();
        if (data.success) {
          // Add category to each activity
          const activitiesWithCategory = data.activities.map((activity: ActivityItem) => ({
            ...activity,
            category: activity.category || getActivityCategory(activity.type)
          }));
          setActivities(activitiesWithCategory);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter activities by selected categories
  const filteredActivities = activities.filter(activity => {
    const category = activity.category || getActivityCategory(activity.type);
    return selectedCategories.includes(category);
  });

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Activity Feed
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-800" />
              <div className="flex-1">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

  const groups = groupActivitiesByTime(filteredActivities);

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          Activity Feed
        </h3>
        <CategoryFilter 
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
        />
      </div>
      
      <div className="max-h-[500px] overflow-y-auto pr-2">
        <TimeGroup title="Today" activities={groups.today} />
        <TimeGroup title="Yesterday" activities={groups.yesterday} />
        <TimeGroup title="Earlier" activities={groups.earlier} />
      </div>
    </div>
  );
}

export default ActivityTimeline;
