/**
 * DashboardHeader - Mission Control v3
 * 
 * Header with title, navigation tabs, date, and cost summary
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, LayoutDashboard, Target, Calendar, Activity, Settings, ChevronRight } from 'lucide-react';

interface NavTab {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardHeaderProps {
  todayCost?: number;
  budgetLimit?: number;
}

const NAV_TABS: NavTab[] = [
  {
    id: 'office',
    label: 'Office',
    href: '/admin/mission-control',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'board',
    label: 'Board',
    href: '/admin/mission-control/board',
    icon: <Target className="w-4 h-4" />,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/admin/mission-control/calendar',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: 'activity',
    label: 'Activity',
    href: '/admin/mission-control/activity',
    icon: <Activity className="w-4 h-4" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/mission-control/settings',
    icon: <Settings className="w-4 h-4" />,
  },
];

function CostPill({ todayCost = 0, budgetLimit = 50 }: DashboardHeaderProps) {
  const percentUsed = Math.min((todayCost / budgetLimit) * 100, 100);
  const isOverBudget = todayCost > budgetLimit;
  const isWarning = todayCost > budgetLimit * 0.8;
  
  const colorClass = isOverBudget 
    ? 'bg-red-500/20 text-red-400 border-red-500/50' 
    : isWarning 
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
      : 'bg-green-500/20 text-green-400 border-green-500/50';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClass} text-sm`}>
      <span className="font-medium">${todayCost.toFixed(2)}</span>
      <span className="text-xs opacity-70">/ ${budgetLimit} today</span>
      {isOverBudget && <span className="text-xs">⚠️</span>}
    </div>
  );
}

function TabItem({ tab, isActive }: { tab: NavTab; isActive: boolean }) {
  return (
    <Link
      href={tab.href}
      className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-lg
        text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'text-white' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
        }
      `}
    >
      <span className={`
        transition-colors
        ${isActive ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-400'}
      `}>
        {tab.icon}
      </span>
      
      <span className="hidden sm:inline">{tab.label}</span>
      
      {isActive && (
        <>
          <span className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
          <span className="absolute inset-x-0 -bottom-px h-0.5 bg-green-500 rounded-full" />
          <span className="absolute inset-0 bg-green-500/10 rounded-lg -z-10" />
        </>
      )}
    </Link>
  );
}

export function DashboardHeader({ todayCost = 0, budgetLimit = 50 }: DashboardHeaderProps) {
  const pathname = usePathname();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const activeTabId = NAV_TABS.find(t => pathname.startsWith(t.href))?.id || 'office';

  return (
    <div className="mb-8">
      {/* Back Link */}
      <div className="mb-4">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Back to Tools
        </Link>
      </div>

      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Title Section */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Bot className="w-3 h-3" />
            AI Agent Squad
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">AWE2M8</span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">Mission Control</span>
          </h1>
          <p className="text-gray-400">{today}</p>
        </div>

        {/* Right Side: Cost + Nav */}
        <div className="flex flex-col items-start lg:items-end gap-4">
          <CostPill todayCost={todayCost} budgetLimit={budgetLimit} />
          
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-gray-900/50 border border-gray-800 rounded-xl">
            {NAV_TABS.map((tab) => (
              <TabItem key={tab.id} tab={tab} isActive={tab.id === activeTabId} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;