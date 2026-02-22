/**
 * Mission Control Dashboard - v3
 * 
 * Main page using composable components
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, Loader2, Target } from 'lucide-react';
import { useAgents, CreateTaskInput, DEFAULT_AGENTS, DEFAULT_TASKS, DEFAULT_ACTIVITIES } from '@/hooks/useAgents';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { InvestigationBoard } from '@/components/InvestigationBoard';
import { AgentWorkCalendar } from '@/components/AgentWorkCalendar';
import { DashboardHeader } from '@/components/mission-control/DashboardHeader';
import { StatsBar } from '@/components/mission-control/StatsBar';
import { AgentStrip } from '@/components/mission-control/AgentStrip';
import { ActivityTimeline } from '@/components/mission-control/ActivityTimeline';
import { QuickActions } from '@/components/mission-control/QuickActions';

import { useCostTracking } from '@/hooks/useCostTracking';

export default function MissionControlPage() {
  const { agents, tasks, loading } = useAgents();
  const { todayCost, weekCost, costByAgent, loading: costLoading } = useCostTracking();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Use defaults if data not loaded yet
  const displayAgents = agents.length > 0 ? agents : DEFAULT_AGENTS;
  const displayTasks = tasks.length > 0 ? tasks : DEFAULT_TASKS;
  const displayActivities = DEFAULT_ACTIVITIES; // TODO: wire real activities

  // Calculate stats
  const openTasks = displayTasks.filter(t => t.status !== 'done').length;
  const completedTasks = displayTasks.filter(t => t.status === 'done').length;

  const refreshData = () => {
    setLastUpdated(new Date());
    window.location.reload();
  };

  const handleCreateTask = async (input: CreateTaskInput) => {
    // Task creation handled by modal
    setIsCreateModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTask}
        agents={displayAgents.map(a => ({ id: a.id, name: a.name, color: a.color }))}
        creating={false}
      />

      {/* Header */}
      <DashboardHeader todayCost={todayCost} budgetLimit={50} />

      {/* Stats */}
      <StatsBar
        activeAgents={displayAgents.length}
        openTasks={openTasks}
        completedTasks={completedTasks}
        todayCost={todayCost}
        dailyBudget={50}
      />

      {/* Agent Strip */}
      <section className="mb-8">
        <AgentStrip agents={displayAgents} />
      </section>

      {/* Investigation Board */}
      <section className="mb-8">
        <InvestigationBoard />
      </section>

      {/* Calendar */}
      <section className="mb-8">
        <AgentWorkCalendar />
      </section>

      {/* Activity + Quick Actions */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityTimeline activities={displayActivities} />
          </div>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 bg-green-900/30 border border-green-800 rounded-lg hover:bg-green-900/50 transition-colors text-left"
                >
                  <span className="text-sm text-green-400 font-medium">+ Assign New Task</span>
                  <ArrowRight className="w-4 h-4 text-green-400" />
                </button>
                <Link 
                  href="/admin/mission-control/activity"
                  className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-sm text-white">View All Activities</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
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
      <QuickActions onCreateTask={() => setIsCreateModalOpen(true)} />
    </div>
  );
}
