/**
 * ActivityFeed Component
 * 
 * Displays a full-screen activity feed with filtering and grouping
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Filter, 
  Search, 
  Calendar,
  FileText,
  Globe,
  Wrench,
  Bot,
  MessageSquare,
  Settings,
  CheckSquare,
  ChevronDown,
  X,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  ActivityLog, 
  ActivityGroup, 
  ActivityActor, 
  ActivityCategory,
  ActivityFilter,
  ACTIVITY_ICONS,
  ACTOR_COLORS,
  ACTOR_LABELS,
} from '@/types/activity';
import { useActivityFeed } from '@/hooks/useActivityFeed';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ActivityFeedProps {
  initialFilter?: ActivityFilter;
  showFilters?: boolean;
  maxHeight?: string;
  onActivityClick?: (activity: ActivityLog) => void;
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  color?: string;
}

interface ActivityItemProps {
  activity: ActivityLog;
  onClick?: (activity: ActivityLog) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimeAgo(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return timestamp.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

function getActivityIcon(category: ActivityCategory): React.ReactNode {
  switch (category) {
    case 'file':
      return <FileText className="w-4 h-4" />;
    case 'web':
      return <Globe className="w-4 h-4" />;
    case 'tool':
      return <Wrench className="w-4 h-4" />;
    case 'agent':
      return <Bot className="w-4 h-4" />;
    case 'communication':
      return <MessageSquare className="w-4 h-4" />;
    case 'system':
      return <Settings className="w-4 h-4" />;
    case 'task':
      return <CheckSquare className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

function getActorColorClass(actor: ActivityActor): string {
  const color = ACTOR_COLORS[actor];
  switch (color) {
    case 'green':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'blue':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'amber':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'purple':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FilterChip({ label, isActive, onClick, icon, color }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
        transition-all duration-200 border
        ${isActive 
          ? 'bg-green-500/20 text-green-400 border-green-500/50' 
          : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const timestamp = activity.timestamp instanceof Date 
    ? activity.timestamp 
    : activity.timestamp.toDate();
  
  const actorColorClass = getActorColorClass(activity.actor);
  const icon = getActivityIcon(activity.category);
  
  return (
    <div 
      onClick={() => onClick?.(activity)}
      className={`
        group flex items-start gap-3 p-3 rounded-lg
        hover:bg-gray-800/50 transition-colors cursor-pointer
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Icon */}
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${actorColorClass}
      `}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white">
            {ACTOR_LABELS[activity.actor]}
          </span>
          <span className="text-gray-400">{activity.description}</span>
        </div>
        
        {/* Metadata */}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(timestamp)}
          </span>
          
          {activity.metadata.filePath && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const fullPath = `/Users/gilesparnell/Documents/VSStudio/awe2m8-local/${activity.metadata.filePath}`;
                window.open(`vscode://file${fullPath}`, '_blank');
              }}
              className="truncate max-w-[200px] text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
              title={`Open ${activity.metadata.filePath} in VS Code`}
            >
              {activity.metadata.filePath.split('/').pop()}
            </button>
          )}
          
          {activity.metadata.searchQuery && (
            <span className="truncate max-w-[200px]">
              &quot;{activity.metadata.searchQuery}&quot;
            </span>
          )}
          
          {activity.metadata.url && (
            <span className="truncate max-w-[200px] text-blue-400">
              {new URL(activity.metadata.url).hostname}
            </span>
          )}
        </div>
      </div>
      
      {/* Arrow indicator */}
      {onClick && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
        </div>
      )}
    </div>
  );
}

function ActivityGroupSection({ group, onActivityClick }: { 
  group: ActivityGroup; 
  onActivityClick?: (activity: ActivityLog) => void;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
        {group.label}
      </h3>
      <div className="space-y-1">
        {group.activities.map((activity) => (
          <ActivityItem 
            key={activity.id} 
            activity={activity} 
            onClick={onActivityClick}
          />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-gray-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
        <Activity className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No activities yet</h3>
      <p className="text-gray-500 max-w-sm">
        Activities will appear here when Garion and the agents start working.
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ActivityFeed({ 
  initialFilter, 
  showFilters = true,
  maxHeight = '600px',
  onActivityClick 
}: ActivityFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActors, setSelectedActors] = useState<ActivityActor[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ActivityCategory[]>([]);
  
  const filter: ActivityFilter = useMemo(() => ({
    ...initialFilter,
    actors: selectedActors.length > 0 ? selectedActors : undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    searchQuery: searchQuery || undefined,
  }), [initialFilter, selectedActors, selectedCategories, searchQuery]);
  
  const { 
    groupedActivities, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    refresh 
  } = useActivityFeed({ 
    initialFilter: filter,
    realTime: true 
  });
  
  const toggleActor = (actor: ActivityActor) => {
    setSelectedActors(prev => 
      prev.includes(actor)
        ? prev.filter(a => a !== actor)
        : [...prev, actor]
    );
  };
  
  const toggleCategory = (category: ActivityCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const clearFilters = () => {
    setSelectedActors([]);
    setSelectedCategories([]);
    setSearchQuery('');
  };
  
  const hasActiveFilters = selectedActors.length > 0 || 
                           selectedCategories.length > 0 || 
                           searchQuery.length > 0;
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Error loading activities</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header with Search and Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-800 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50
                         transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Actor Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 mr-1">Actors:</span>
            {(['garion', 'barak', 'silk', 'polgara'] as ActivityActor[]).map((actor) => (
              <FilterChip
                key={actor}
                label={ACTOR_LABELS[actor]}
                isActive={selectedActors.includes(actor)}
                onClick={() => toggleActor(actor)}
              />
            ))}
          </div>
          
          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 mr-1">Types:</span>
            {(['file', 'web', 'tool', 'agent', 'communication', 'system'] as ActivityCategory[]).map((category) => (
              <FilterChip
                key={category}
                label={category.charAt(0).toUpperCase() + category.slice(1)}
                isActive={selectedCategories.includes(category)}
                onClick={() => toggleCategory(category)}
                icon={getActivityIcon(category)}
              />
            ))}
          </div>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      )}
      
      {/* Activity List */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {loading && groupedActivities.length === 0 ? (
          <LoadingSkeleton />
        ) : groupedActivities.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-4">
            {groupedActivities.map((group) => (
              <ActivityGroupSection 
                key={group.label} 
                group={group}
                onActivityClick={onActivityClick}
              />
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg
                             transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;
