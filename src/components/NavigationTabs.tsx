/**
 * Mission Control Navigation Tabs
 * 
 * Provides navigation between different sections of Mission Control
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Activity, 
  Calendar, 
  Search,
  ChevronRight
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface NavTab {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavigationTabsProps {
  className?: string;
}

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

const NAV_TABS: NavTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/admin/mission-control',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'activity',
    label: 'Activity',
    href: '/admin/mission-control/activity',
    icon: <Activity className="w-4 h-4" />,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/admin/mission-control/calendar',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: 'search',
    label: 'Search',
    href: '/admin/mission-control/search',
    icon: <Search className="w-4 h-4" />,
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TabItem({ 
  tab, 
  isActive 
}: { 
  tab: NavTab; 
  isActive: boolean;
}) {
  return (
    <Link
      href={tab.href}
      className={`
        group relative flex items-center gap-2 px-4 py-2.5 rounded-lg
        text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'text-white' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
        }
      `}
    >
      {/* Icon */}
      <span className={`
        transition-colors
        ${isActive ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-400'}
      `}>
        {tab.icon}
      </span>
      
      {/* Label */}
      <span>{tab.label}</span>
      
      {/* Badge */}
      {tab.badge !== undefined && tab.badge > 0 && (
        <span className={`
          ml-1 px-1.5 py-0.5 text-xs rounded-full
          ${isActive 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-gray-700 text-gray-400'
          }
        `}>
          {tab.badge}
        </span>
      )}
      
      {/* Active indicator */}
      {isActive && (
        <>
          {/* Top glow line */}
          <span className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
          
          {/* Bottom border */}
          <span className="absolute inset-x-0 -bottom-px h-0.5 bg-green-500 rounded-full" />
          
          {/* Background */}
          <span className="absolute inset-0 bg-green-500/10 rounded-lg -z-10" />
        </>
      )}
    </Link>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NavigationTabs({ className = '' }: NavigationTabsProps) {
  const pathname = usePathname();
  
  // Determine active tab based on current pathname
  const getActiveTabId = (): string => {
    if (pathname === '/admin/mission-control') return 'overview';
    if (pathname.startsWith('/admin/mission-control/activity')) return 'activity';
    if (pathname.startsWith('/admin/mission-control/calendar')) return 'calendar';
    if (pathname.startsWith('/admin/mission-control/search')) return 'search';
    return 'overview';
  };
  
  const activeTabId = getActiveTabId();
  const activeTab = NAV_TABS.find(t => t.id === activeTabId);
  
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Tabs */}
      <nav className="hidden sm:flex items-center gap-1 p-1 bg-gray-900/50 border border-gray-800 rounded-xl">
        {NAV_TABS.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
          />
        ))}
      </nav>
      
      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <div className="relative">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-green-400">{activeTab?.icon}</span>
              <span className="font-medium text-white">{activeTab?.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500 -rotate-90" />
          </div>
          
          {/* Mobile menu - simplified inline display */}
          <div className="mt-2 p-2 bg-gray-900 border border-gray-800 rounded-xl space-y-1">
            {NAV_TABS.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  transition-colors
                  ${tab.id === activeTabId 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavigationTabs;
