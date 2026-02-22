/**
 * StatsBar - Mission Control v3
 * 
 * Four stat cards with cost tracking and color-coded budgets
 */

'use client';

import React from 'react';
import { Users, CheckSquare, DollarSign, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsBarProps {
  activeAgents: number;
  openTasks: number;
  completedTasks: number;
  todayCost: number;
  dailyBudget?: number;
  activeAreas?: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'amber' | 'red' | 'gray';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

const colorStyles = {
  green: { bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-500/30', icon: 'text-green-400' },
  blue: { bg: 'bg-blue-900/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: 'text-blue-400' },
  amber: { bg: 'bg-amber-900/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: 'text-amber-400' },
  red: { bg: 'bg-red-900/20', text: 'text-red-400', border: 'border-red-500/30', icon: 'text-red-400' },
  gray: { bg: 'bg-gray-800', text: 'text-gray-300', border: 'border-gray-700', icon: 'text-gray-400' },
};

function StatCard({ label, value, icon, color, trend, subtitle }: StatCardProps) {
  const style = colorStyles[color];
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500';

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4 hover:border-opacity-100 transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${style.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${style.bg}`}>
          <span className={style.icon}>{icon}</span>
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}</span>
        </div>
      )}
    </div>
  );
}

export function StatsBar({ 
  activeAgents, 
  openTasks, 
  completedTasks,
  todayCost,
  dailyBudget = 50,
  activeAreas = 0
}: StatsBarProps) {
  // Determine cost color based on budget
  const costPercent = (todayCost / dailyBudget) * 100;
  const costColor: 'green' | 'amber' | 'red' = 
    costPercent > 100 ? 'red' : costPercent > 80 ? 'amber' : 'green';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Active Agents"
        value={activeAgents}
        icon={<Users className="w-5 h-5" />}
        color="blue"
        subtitle="Online now"
      />
      
      <StatCard
        label="Open Tasks"
        value={openTasks}
        icon={<CheckSquare className="w-5 h-5" />}
        color="amber"
        subtitle={`${completedTasks} completed`}
      />
      
      <StatCard
        label="Cost Today"
        value={`$${todayCost.toFixed(2)}`}
        icon={<DollarSign className="w-5 h-5" />}
        color={costColor}
        subtitle={`Budget: $${dailyBudget}`}
        trend={costPercent > 80 ? 'up' : 'neutral'}
      />
      
      <StatCard
        label="Active Areas"
        value={activeAreas}
        icon={<Target className="w-5 h-5" />}
        color="green"
        subtitle="Investigations"
      />
    </div>
  );
}

export default StatsBar;