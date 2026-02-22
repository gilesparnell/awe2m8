/**
 * Activity Feed Hook
 * 
 * Provides real-time activity feed from Firestore with filtering and pagination
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit,
  startAfter,
  where,
  onSnapshot,
  QueryConstraint,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  limit as queryLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ActivityLog, 
  ActivityFilter, 
  ActivityPagination,
  ActivityGroup,
  ActivityActor,
  ActivityCategory,
  ACTOR_LABELS,
} from '@/types/activity';

// ============================================================================
// HOOK INTERFACE
// ============================================================================

interface UseActivityFeedReturn {
  activities: ActivityLog[];
  groupedActivities: ActivityGroup[];
  loading: boolean;
  error: string | null;
  pagination: ActivityPagination;
  filter: ActivityFilter;
  setFilter: (filter: ActivityFilter) => void;
  loadMore: () => void;
  refresh: () => void;
  hasMore: boolean;
}

interface UseActivityFeedOptions {
  initialLimit?: number;
  realTime?: boolean;
  initialFilter?: ActivityFilter;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_LIMIT = 50;

const DEFAULT_FILTER: ActivityFilter = {
  actors: undefined,
  categories: undefined,
  actions: undefined,
  startDate: undefined,
  endDate: undefined,
  project: undefined,
  taskId: undefined,
  searchQuery: undefined,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Firestore timestamp to JS Date
 */
function timestampToDate(timestamp: Timestamp | Date | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
}

/**
 * Group activities by date for display
 */
function groupActivitiesByDate(activities: ActivityLog[]): ActivityGroup[] {
  const groups: Map<string, ActivityGroup> = new Map();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  activities.forEach((activity) => {
    const date = timestampToDate(activity.timestamp);
    const dateKey = date.toISOString().split('T')[0];
    
    let label: string;
    const activityDate = new Date(dateKey);
    activityDate.setHours(0, 0, 0, 0);
    
    if (activityDate.getTime() === today.getTime()) {
      label = 'Today';
    } else if (activityDate.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        label,
        date: activityDate,
        activities: [],
      });
    }
    
    groups.get(dateKey)!.activities.push(activity);
  });
  
  // Sort by date descending
  return Array.from(groups.values()).sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );
}

/**
 * Build Firestore query constraints from filter
 * NOTE: To avoid requiring composite indexes, we only use orderBy + limit by default.
 * Filters are applied client-side for the initial implementation.
 */
function buildQueryConstraints(
  filter: ActivityFilter,
  limit: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): QueryConstraint[] {
  // Start with just orderBy - this doesn't require any indexes
  const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')];
  
  // Only add filters if they don't conflict with ordering (avoid composite index requirement)
  // For now, we apply most filters client-side to avoid index errors
  
  // Date range on timestamp is ok - same field as orderBy
  if (filter.startDate) {
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(filter.startDate)));
  }
  if (filter.endDate) {
    constraints.push(where('timestamp', '<=', Timestamp.fromDate(filter.endDate)));
  }
  
  // Task filter - may require index if combined with orderBy
  // Only apply if no date filters (to keep it simple)
  if (filter.taskId && !filter.startDate && !filter.endDate) {
    // Skip for now - apply client-side
  }
  
  // Pagination
  constraints.push(queryLimit((limit || DEFAULT_LIMIT) * 3)); // Fetch more for client-side filtering
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  return constraints;
}

/**
 * Apply client-side filters to activities
 */
function applyClientFilters(
  activities: ActivityLog[],
  filter: ActivityFilter
): ActivityLog[] {
  return activities.filter(activity => {
    // Actor filter
    if (filter.actors && filter.actors.length > 0) {
      if (!filter.actors.includes(activity.actor)) {
        return false;
      }
    }
    
    // Category filter
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(activity.category)) {
        return false;
      }
    }
    
    // Task filter
    if (filter.taskId && activity.taskId !== filter.taskId) {
      return false;
    }
    
    // Project filter
    if (filter.project && activity.project !== filter.project) {
      return false;
    }
    
    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matches = 
        activity.description.toLowerCase().includes(query) ||
        ACTOR_LABELS[activity.actor].toLowerCase().includes(query);
      if (!matches) return false;
    }
    
    return true;
  });
}

/**
 * Convert Firestore document to ActivityLog
 */
function docToActivityLog(
  doc: QueryDocumentSnapshot<DocumentData>
): ActivityLog {
  const data = doc.data();
  
  return {
    id: doc.id,
    timestamp: data.timestamp as Timestamp,
    actor: data.actor as ActivityActor,
    actorType: data.actorType || 'main',
    category: data.category as ActivityCategory,
    action: data.action,
    description: data.description,
    metadata: data.metadata || {},
    sessionId: data.sessionId,
    taskId: data.taskId,
    project: data.project,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useActivityFeed(
  options: UseActivityFeedOptions = {}
): UseActivityFeedReturn {
  const { 
    initialLimit = DEFAULT_LIMIT, 
    realTime = true,
    initialFilter = DEFAULT_FILTER 
  } = options;
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<ActivityFilter>(initialFilter);
  const [limitState, setLimitState] = useState(initialLimit);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Apply client-side filters
  const filteredActivities = useMemo(() => 
    applyClientFilters(activities, filter),
    [activities, filter]
  );
  
  // Memoized grouped activities
  const groupedActivities = useMemo(() => 
    groupActivitiesByDate(filteredActivities),
    [filteredActivities]
  );
  
  // Reset activities when filter changes (except pagination)
  const setFilter = useCallback((newFilter: ActivityFilter) => {
    setActivities([]);
    setLastDoc(null);
    setHasMore(true);
    setFilterState(newFilter);
    setLimitState(initialLimit);
  }, [initialLimit]);
  
  // Main data fetching effect
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const activitiesRef = collection(db, 'activities');
    const constraints = buildQueryConstraints(filter, limitState, undefined);
    const q = query(activitiesRef, ...constraints);
    
    if (realTime) {
      // Real-time updates with onSnapshot
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const newActivities: ActivityLog[] = [];
          let last: QueryDocumentSnapshot<DocumentData> | null = null;
          
          snapshot.forEach((doc) => {
            newActivities.push(docToActivityLog(doc));
            last = doc;
          });
          
          setActivities(newActivities);
          setLastDoc(last);
          // We fetch more items for client-side filtering, so hasMore is less reliable
          setHasMore(snapshot.docs.length >= (limitState || DEFAULT_LIMIT));
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching activities:', err);
          setError('Failed to load activities: ' + err.message);
          setLoading(false);
        }
      );
      
      return () => unsubscribe();
    } else {
      // One-time fetch (not real-time)
      const fetchData = async () => {
        try {
          const { getDocs } = await import('firebase/firestore');
          const snapshot = await getDocs(q);
          
          const newActivities: ActivityLog[] = [];
          let last: QueryDocumentSnapshot<DocumentData> | null = null;
          
          snapshot.forEach((doc) => {
            newActivities.push(docToActivityLog(doc));
            last = doc;
          });
          
          setActivities(newActivities);
          setLastDoc(last);
          setHasMore(snapshot.docs.length >= initialLimit);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching activities:', err);
          setError('Failed to load activities');
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [filter, realTime]);
  
  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || !lastDoc || loading) return;
    
    setLoading(true);
    
    try {
      const activitiesRef = collection(db, 'activities');
      const constraints = buildQueryConstraints(filter, limitState, lastDoc);
      const q = query(activitiesRef, ...constraints);
      
      const { getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(q);
      
      const newActivities: ActivityLog[] = [];
      let last: QueryDocumentSnapshot<DocumentData> | null = null;
      
      snapshot.forEach((doc) => {
        newActivities.push(docToActivityLog(doc));
        last = doc;
      });
      
      setActivities((prev) => [...prev, ...newActivities]);
      setLastDoc(last);
      setHasMore(snapshot.docs.length === initialLimit);
    } catch (err) {
      console.error('Error loading more activities:', err);
      setError('Failed to load more activities');
    } finally {
      setLoading(false);
    }
  }, [filter, hasMore, lastDoc, loading]);
  
  // Refresh (manual re-fetch)
  const refresh = useCallback(() => {
    setActivities([]);
    setLastDoc(null);
    setHasMore(true);
    setFilterState((prev) => ({ ...prev })); // Trigger re-fetch
  }, []);
  
  return {
    activities: filteredActivities,
    groupedActivities,
    loading,
    error,
    pagination: {
      limit: initialLimit,
      cursor: lastDoc?.id,
      hasMore,
    },
    filter,
    setFilter,
    loadMore,
    refresh,
    hasMore,
  };
}

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for fetching a single activity by ID
 */
export function useActivity(activityId: string | null) {
  const [activity, setActivity] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!activityId) {
      setActivity(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const fetchActivity = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'activities', activityId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setActivity(docToActivityLog(docSnap));
        } else {
          setError('Activity not found');
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to load activity');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivity();
  }, [activityId]);
  
  return { activity, loading, error };
}

/**
 * Hook for activity statistics
 */
export function useActivityStats(days: number = 7) {
  const [stats, setStats] = useState({
    total: 0,
    byActor: {} as Record<ActivityActor, number>,
    byCategory: {} as Record<ActivityCategory, number>,
    loading: true,
    error: null as string | null,
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { 
          collection, 
          query, 
          where, 
          getDocs,
          Timestamp 
        } = await import('firebase/firestore');
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const activitiesRef = collection(db, 'activities');
        const q = query(
          activitiesRef,
          where('timestamp', '>=', Timestamp.fromDate(startDate))
        );
        
        const snapshot = await getDocs(q);
        
        const byActor: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        let total = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          total++;
          
          byActor[data.actor] = (byActor[data.actor] || 0) + 1;
          byCategory[data.category] = (byCategory[data.category] || 0) + 1;
        });
        
        setStats({
          total,
          byActor: byActor as Record<ActivityActor, number>,
          byCategory: byCategory as Record<ActivityCategory, number>,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error fetching activity stats:', err);
        setStats((prev) => ({ ...prev, loading: false, error: 'Failed to load stats' }));
      }
    };
    
    fetchStats();
  }, [days]);
  
  return stats;
}
