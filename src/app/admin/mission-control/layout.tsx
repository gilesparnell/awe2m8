/**
 * Mission Control Layout - v3
 * 
 * Sidebar navigation for desktop, bottom tabs for mobile
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Target, 
  Calendar, 
  Activity, 
  Settings,
  Bot
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'office',
    label: 'Office',
    href: '/admin/mission-control',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: 'board',
    label: 'Board',
    href: '/admin/mission-control/board',
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/admin/mission-control/calendar',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    id: 'activity',
    label: 'Activity',
    href: '/admin/mission-control/activity',
    icon: <Activity className="w-5 h-5" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/mission-control/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

function SidebarItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl
        text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }
      `}
    >
      <span className={isActive ? 'text-green-400' : 'text-gray-500'}>
        {item.icon}
      </span>
      {item.label}
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />
      )}
    </Link>
  );
}

function MobileTab({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`
        flex flex-col items-center gap-1 px-3 py-2 rounded-lg
        text-xs font-medium transition-colors
        ${isActive 
          ? 'text-green-400' 
          : 'text-gray-500'
        }
      `}
    >
      <span className={isActive ? 'text-green-400' : 'text-gray-500'}>
        {item.icon}
      </span>
      <span className="text-[10px]">{item.label}</span>
      {isActive && (
        <span className="absolute -bottom-0.5 w-8 h-0.5 bg-green-500 rounded-full" />
      )}
    </Link>
  );
}

export default function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find(item => pathname.startsWith(item.href)) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-gray-800 bg-gray-950">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <Link href="/admin/mission-control" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900/30 border border-green-800 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h1 className="font-bold text-white">Mission Control</h1>
                <p className="text-xs text-gray-500">v3.0</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={activeItem.id === item.id}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-600 text-center">
              AWE2M8 AI Squad
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2 z-50">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => (
            <div key={item.id} className="relative">
              <MobileTab
                item={item}
                isActive={activeItem.id === item.id}
              />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
