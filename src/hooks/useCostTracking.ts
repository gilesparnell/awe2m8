/**
 * useCostTracking.ts
 * 
 * Hook for aggregating and tracking costs from agent activities
 * Fetches from Firebase and provides computed cost metrics
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';

interface Activity {
  id: string;
  cost?: number;
  timestamp: Timestamp | string;
  agentId: string;
  areaId?: string;
}

interface CostTrackingState {
  todayCost: number;
  weekCost: number;
  monthCost: number;
  costByAgent: Record<string, number>;
  costByArea: Record<string, number>;
  loading: boolean;
  error: string | null;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function timestampToDate(timestamp: Timestamp | string | Date): Date {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  // Firebase Timestamp
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date();
}

export function useCostTracking(): CostTrackingState {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get start of today for query
    const todayStart = Timestamp.fromDate(getStartOfDay(new Date()));

    // Query activities from today onwards
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('timestamp', '>=', todayStart),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const fetchedActivities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Activity));
        
        setActivities(fetchedActivities);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching activities for cost tracking:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const costs = useMemo(() => {
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const weekStart = getStartOfWeek(now);
    const monthStart = getStartOfMonth(now);

    let todayCost = 0;
    let weekCost = 0;
    let monthCost = 0;
    const costByAgent: Record<string, number> = {};
    const costByArea: Record<string, number> = {};

    activities.forEach(activity => {
      const activityDate = timestampToDate(activity.timestamp);
      const cost = activity.cost || 0;

      // Aggregate by time period
      if (activityDate >= todayStart) {
        todayCost += cost;
      }
      if (activityDate >= weekStart) {
        weekCost += cost;
      }
      if (activityDate >= monthStart) {
        monthCost += cost;
      }

      // Aggregate by agent
      if (activity.agentId) {
        costByAgent[activity.agentId] = (costByAgent[activity.agentId] || 0) + cost;
      }

      // Aggregate by area
      if (activity.areaId) {
        costByArea[activity.areaId] = (costByArea[activity.areaId] || 0) + cost;
      }
    });

    return {
      todayCost,
      weekCost,
      monthCost,
      costByAgent,
      costByArea,
    };
  }, [activities]);

  return {
    ...costs,
    loading,
    error,
  };
}

export default useCostTracking;