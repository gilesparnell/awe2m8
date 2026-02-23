/**
 * Mission Control Dashboard - v3
 * 
 * Main page using composable components
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, Loader2, Target, Database, DollarSign, AlertTriangle } from 'lucide-react';
import { DashboardHeader } from '@/components/mission-control/DashboardHeader';
import { StatsBar } from '@/components/mission-control/StatsBar';
import { AgentStrip } from '@/components/mission-control/AgentStrip';
import { ActivityTimeline } from '@/components/mission-control/ActivityTimeline';
import { QuickActions } from '@/components/mission-control/QuickActions';

import { useCostTracking } from '@/hooks/useCostTracking';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  color: string;
}

export default function MissionControlPage() {
  const { todayCost, weekCost, costByAgent, totalAllTimeSpend, providers, loading: costsLoading } = useCostTracking();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; count: number } | null>(null);

  // Fetch agents from API (not direct Firestore)
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        if (data.success) setAgents(data.agents);
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      }
    }
    fetchAgents();
  }, []);

  // Calculate stats
  const openTasks = 0;
  const completedTasks = 0;

  const refreshData = () => {
    setLastUpdated(new Date());
    window.location.reload();
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/seed-activities');
      const result = await response.json();
      setSeedResult(result);
      if (result.success) {
        // Refresh the page after a short delay to show new data
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Failed to seed data:', error);
      setSeedResult({ success: false, count: 0 });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <DashboardHeader todayCost={totalAllTimeSpend || todayCost} budgetLimit={150} />

      {/* Stats */}
      <StatsBar
        activeAgents={agents.length || 11}
        openTasks={openTasks}
        completedTasks={completedTasks}
        todayCost={totalAllTimeSpend || todayCost}
        dailyBudget={150}
      />

      {/* Agent Strip */}
      <section className="mb-8">
        <AgentStrip />
      </section>

      {/* Real Cost Summary — Always visible */}
      <section className="mb-8">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-white">Real LLM Spend</h3>
            <span className="text-xs text-gray-500 ml-2">Live from provider APIs</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total All-Time */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total All-Time</p>
              <p className="text-2xl font-bold text-white">
                {costsLoading ? '...' : `$${totalAllTimeSpend.toFixed(2)}`}
              </p>
              <p className="text-xs text-gray-600 mt-1">All providers combined</p>
            </div>
            {/* OpenRouter */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">OpenRouter Used</p>
              <p className="text-2xl font-bold text-blue-400">
                {costsLoading ? '...' : `$${providers?.openRouter?.totalUsed?.toFixed(2) ?? '0.00'}`}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                of ${providers?.openRouter?.totalCredits?.toFixed(2) ?? '0.00'} loaded
              </p>
            </div>
            <div className={`bg-gray-800/50 rounded-xl p-4 ${(providers?.openRouter?.remaining ?? 999) < 15 ? 'border border-red-800' : ''}`}>
              <p className="text-xs text-gray-500 mb-1">OpenRouter Remaining</p>
              <p className={`text-2xl font-bold ${(providers?.openRouter?.remaining ?? 999) < 15 ? 'text-red-400' : 'text-green-400'}`}>
                {costsLoading ? '...' : `$${providers?.openRouter?.remaining?.toFixed(2) ?? '0.00'}`}
              </p>
              {(providers?.openRouter?.remaining ?? 999) < 15 && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Top up soon
                </p>
              )}
            </div>
            {/* Anthropic */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Anthropic Direct</p>
              <p className="text-2xl font-bold text-purple-400">
                {costsLoading ? '...' : `$${providers?.anthropic?.totalUsed?.toFixed(2) ?? '15.00'}`}
              </p>
              <p className="text-xs text-gray-600 mt-1">{providers?.anthropic?.note ?? 'Manually tracked'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Activity + Quick Actions */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityTimeline />
          </div>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link
                  href="/admin/mission-control/board"
                  className="w-full flex items-center justify-between p-3 bg-green-900/30 border border-green-800 rounded-lg hover:bg-green-900/50 transition-colors text-left"
                >
                  <span className="text-sm text-green-400 font-medium">+ Task Board</span>
                  <ArrowRight className="w-4 h-4 text-green-400" />
                </Link>
                <Link 
                  href="/admin/mission-control/activity"
                  className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-sm text-white">View All Activities</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={seedData}
                    disabled={seeding}
                    className="w-full flex items-center justify-between p-3 bg-purple-900/30 border border-purple-800 rounded-lg hover:bg-purple-900/50 transition-colors text-left disabled:opacity-50"
                  >
                    <span className="text-sm text-purple-400 font-medium">
                      {seeding ? 'Seeding...' : seedResult?.success ? `✓ Seeded ${seedResult.count} items` : 'Seed Test Data'}
                    </span>
                    {seeding ? (
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                  {seedResult && !seedResult.success && (
                    <p className="text-xs text-red-400 mt-2">Failed to seed data</p>
                  )}
                </div>
              )}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Last Updated</span>
                  <button onClick={refreshData} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />Refresh
                  </button>
                </div>
                <p className="text-xs text-gray-500">{lastUpdated.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Mission Control v3.0 • AWE2M8 AI Squad • {new Date().getFullYear()}</p>
      </footer>

      {/* Floating Quick Actions */}
      <QuickActions onCreateTask={() => window.location.href = '/admin/mission-control/board'} />
    </div>
  );
}
