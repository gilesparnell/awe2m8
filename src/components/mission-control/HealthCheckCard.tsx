'use client';

import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, DollarSign, Shield, XCircle } from 'lucide-react';

interface HealthCheckCardProps {
  activeAgents: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  todayCost: number;
  weekCost: number;
  totalAllTimeSpend: number;
  zeroCostCompletions: number;
  loading?: boolean;
}

export function HealthCheckCard({
  activeAgents,
  activeTasks,
  completedTasks,
  failedTasks,
  todayCost,
  weekCost,
  totalAllTimeSpend,
  zeroCostCompletions,
  loading = false,
}: HealthCheckCardProps) {
  const finishedTasks = completedTasks + failedTasks;
  const successRate = finishedTasks > 0 ? (completedTasks / finishedTasks) * 100 : 100;

  const hasCriticalAlert = failedTasks > 0 || zeroCostCompletions > 0;
  const hasWarning = todayCost > 50 * 0.8;

  const healthLabel = hasCriticalAlert ? 'Degraded' : hasWarning ? 'Warning' : 'Healthy';
  const healthColor = hasCriticalAlert ? 'text-red-400 border-red-500/30 bg-red-900/10' : hasWarning ? 'text-amber-400 border-amber-500/30 bg-amber-900/10' : 'text-green-400 border-green-500/30 bg-green-900/10';

  const StatusIcon = hasCriticalAlert ? XCircle : hasWarning ? AlertTriangle : CheckCircle2;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Health Check
        </h3>
        <span className={`px-2 py-1 text-xs rounded-full border ${healthColor}`}>
          {healthLabel}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading health metrics...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Success Rate" value={`${successRate.toFixed(0)}%`} icon={<Activity className="w-4 h-4 text-green-400" />} />
            <Metric label="Agents Online" value={`${activeAgents}`} icon={<Shield className="w-4 h-4 text-blue-400" />} />
            <Metric label="Tasks Active" value={`${activeTasks}`} icon={<Activity className="w-4 h-4 text-amber-400" />} />
            <Metric label="Failed Tasks" value={`${failedTasks}`} icon={<XCircle className="w-4 h-4 text-red-400" />} />
          </div>

          <div className="rounded-lg border border-gray-700/60 bg-gray-800/40 p-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Cost Today
              </span>
              <span className="text-white">${todayCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
              <span>Cost This Week</span>
              <span className="text-white">${weekCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
              <span>Total Spend</span>
              <span className="text-white">${totalAllTimeSpend.toFixed(2)}</span>
            </div>
          </div>

          {(failedTasks > 0 || zeroCostCompletions > 0) && (
            <div className="rounded-lg border border-red-500/30 bg-red-900/10 p-3">
              <div className="flex items-center gap-2 text-red-300 text-sm">
                <StatusIcon className="w-4 h-4" />
                <span>Warnings</span>
              </div>
              {failedTasks > 0 && (
                <p className="text-xs text-red-200 mt-1">
                  {failedTasks} failed task{failedTasks !== 1 ? 's' : ''} detected.
                </p>
              )}
              {zeroCostCompletions > 0 && (
                <p className="text-xs text-red-200 mt-1">
                  {zeroCostCompletions} completed/failed task{zeroCostCompletions !== 1 ? 's' : ''} missing cost ($0.00).
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-700/60 bg-gray-800/40 p-3">
      <div className="flex items-center gap-1 text-gray-400 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-white font-semibold mt-1">{value}</div>
    </div>
  );
}

export default HealthCheckCard;
