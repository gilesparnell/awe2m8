/**
 * Mission Control - Calendar Page
 * 
 * Calendar view for scheduling agent tasks, deadlines, and milestones
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon,
  ArrowLeft,
  Plus,
  Loader2
} from 'lucide-react';
import { CalendarView } from '@/components/CalendarView';
import { NavigationTabs } from '@/components/NavigationTabs';
import { CalendarEvent } from '@/types/calendar';

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    // TODO: Open event detail modal
    console.log('Event clicked:', event);
  };

  const handleAddEvent = (date?: Date) => {
    // TODO: Open add event modal
    console.log('Add event for date:', date);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8">
          {/* Top row: Title + Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-800 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                <CalendarIcon className="w-3 h-3" />
                Schedule
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">Agent</span>{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-600">Calendar</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                Schedule tasks, set deadlines, and track milestones for your AI agent squad.
              </p>
            </div>
            
            {/* Navigation Tabs */}
            <div className="lg:pt-8">
              <NavigationTabs />
            </div>
          </div>
        </header>

        {/* Calendar */}
        <section className="mb-12">
          <CalendarView 
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
          />
        </section>

        {/* Quick Tips */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Task Deadlines</h3>
            <p className="text-sm text-gray-400">
              Set due dates for tasks to keep your agents on track. Deadlines sync with the task board.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Plus className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Recurring Events</h3>
            <p className="text-sm text-gray-400">
              Schedule recurring cron jobs and heartbeat checks for automated agent workflows.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
              <CalendarIcon className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Milestones</h3>
            <p className="text-sm text-gray-400">
              Mark project milestones to track progress and celebrate wins with your squad.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Mission Control Calendar • AWE2M8 AI Squad • {new Date().getFullYear()}</p>
        </footer>
      </div>

      {/* Event Detail Modal - TODO */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">{selectedEvent.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{selectedEvent.description}</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
