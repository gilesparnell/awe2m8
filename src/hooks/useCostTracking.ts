'use client';

import { useState, useEffect } from 'react';

interface ProviderCosts {
  openRouter: {
    totalCredits: number;
    totalUsed: number;
    remaining: number;
  } | null;
  anthropic: {
    totalUsed: number;
    note: string;
  };
}

interface CostTrackingState {
  todayCost: number;
  weekCost: number;
  monthCost: number;
  costByAgent: Record<string, number>;
  totalActivities: number;
  totalAllTimeSpend: number;
  providers: ProviderCosts | null;
  loading: boolean;
  error: string | null;
}

export function useCostTracking(): CostTrackingState {
  const [state, setState] = useState<CostTrackingState>({
    todayCost: 0,
    weekCost: 0,
    monthCost: 0,
    costByAgent: {},
    totalActivities: 0,
    totalAllTimeSpend: 0,
    providers: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchCosts() {
      try {
        const res = await fetch('/api/costs');
        const data = await res.json();
        if (data.success) {
          setState({
            todayCost: data.todayCost,
            weekCost: data.weekCost,
            monthCost: data.monthCost,
            costByAgent: data.costByAgent || {},
            totalActivities: data.totalActivities || 0,
            totalAllTimeSpend: data.totalAllTimeSpend || 0,
            providers: data.providers || null,
            loading: false,
            error: null,
          });
        } else {
          setState((prev) => ({ ...prev, loading: false, error: data.error }));
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch costs',
        }));
      }
    }

    fetchCosts();
    const interval = setInterval(fetchCosts, 30000);
    return () => clearInterval(interval);
  }, []);

  return state;
}

export default useCostTracking;
