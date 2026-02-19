/**
 * Calendar View Component
 * 
 * Displays calendar with week, month, and day views
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Filter,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  useCalendar 
} from '@/hooks/useCalendar';
import { 
  CalendarEvent, 
  CalendarViewMode,
  CalendarDay,
  getEventTypeColorClass,
  formatEventTimeRange,
  VIEW_MODE_LABELS,
  EVENT_TYPE_LABELS,
} from '@/types/calendar';
import { ActivityActor, ACTOR_LABELS } from '@/types/activity';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CalendarViewProps {
  className?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date?: Date) => void;
}

interface EventCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const colorClass = getEventTypeColorClass(event.type);
  
  return (
    <button
      onClick={() => onClick?.(event)}
      className={`
        w-full text-left rounded-lg border transition-all
        hover:shadow-md hover:scale-[1.02]
        ${colorClass}
        ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
      `}
    >
      <div className="font-medium truncate">{event.title}</div>
      {!compact && (
        <div className="text-xs opacity-80 mt-0.5">
          {formatEventTimeRange(event)}
        </div>
      )}
    </button>
  );
}

function DayCell({ 
  day, 
  onEventClick, 
  onAddEvent 
}: { 
  day: CalendarDay; 
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
}) {
  return (
    <div 
      className={`
        min-h-[100px] p-2 border border-gray-800
        ${day.isCurrentMonth ? 'bg-gray-900' : 'bg-gray-900/50'}
        ${day.isToday ? 'ring-2 ring-green-500/50 ring-inset' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`
          text-sm font-medium
          ${day.isToday ? 'text-green-400' : 'text-gray-400'}
          ${!day.isCurrentMonth ? 'opacity-50' : ''}
        `}>
          {day.date.getDate()}
        </span>
        {day.isToday && (
          <span className="text-xs text-green-400 font-medium">Today</span>
        )}
      </div>
      
      <div className="space-y-1">
        {day.events.slice(0, 3).map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            onClick={onEventClick}
            compact
          />
        ))}
        {day.events.length > 3 && (
          <button 
            onClick={() => onAddEvent?.(day.date)}
            className="text-xs text-gray-500 hover:text-gray-300 w-full text-left px-2"
          >
            +{day.events.length - 3} more
          </button>
        )}
      </div>
    </div>
  );
}

function WeekView({ 
  currentDate, 
  weekDays, 
  events, 
  onEventClick 
}: { 
  currentDate: Date;
  weekDays: Date[];
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Get events for each day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = event.startDate instanceof Date 
        ? event.startDate 
        : event.startDate.toDate();
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };
  
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-gray-800">
          <div className="p-3 text-gray-500 text-sm">Time</div>
          {weekDays.map((day, i) => (
            <div 
              key={i} 
              className={`
                p-3 text-center
                ${isSameDay(day, new Date()) ? 'bg-green-500/10' : ''}
              `}
            >
              <div className="text-sm text-gray-400">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`
                text-lg font-semibold
                ${isSameDay(day, new Date()) ? 'text-green-400' : 'text-white'}
              `}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div className="grid grid-cols-8">
          {/* Time labels */}
          <div className="border-r border-gray-800">
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="h-16 border-b border-gray-800/50 px-2 py-1"
              >
                <span className="text-xs text-gray-500">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>
          
          {/* Days */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="border-r border-gray-800 relative">
              {hours.map((hour) => (
                <div 
                  key={hour} 
                  className="h-16 border-b border-gray-800/50 hover:bg-gray-800/30"
                />
              ))}
              
              {/* Events */}
              {getEventsForDay(day).map((event) => {
                const eventDate = event.startDate instanceof Date 
                  ? event.startDate 
                  : event.startDate.toDate();
                const hour = eventDate.getHours();
                const minute = eventDate.getMinutes();
                const top = hour * 64 + (minute / 60) * 64; // 64px per hour
                
                return (
                  <div
                    key={event.id}
                    className="absolute left-1 right-1 z-10"
                    style={{ top: `${top}px` }}
                  >
                    <EventCard 
                      event={event} 
                      onClick={onEventClick}
                      compact
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthView({ 
  monthWeeks, 
  onEventClick, 
  onAddEvent 
}: { 
  monthWeeks: { weekNumber: number; days: CalendarDay[] }[];
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
}) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div>
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm text-gray-500 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div>
        {monthWeeks.map((week) => (
          <div key={week.weekNumber} className="grid grid-cols-7">
            {week.days.map((day, i) => (
              <DayCell 
                key={i} 
                day={day} 
                onEventClick={onEventClick}
                onAddEvent={onAddEvent}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({ 
  currentDate, 
  events, 
  onEventClick 
}: { 
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const dayEvents = events.filter((event) => {
    const eventDate = event.startDate instanceof Date 
      ? event.startDate 
      : event.startDate.toDate();
    return isSameDay(eventDate, currentDate);
  });
  
  return (
    <div>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 text-center">
        <div className="text-3xl font-bold text-white">
          {currentDate.getDate()}
        </div>
        <div className="text-gray-400">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long' })}
        </div>
      </div>
      
      {/* Time grid */}
      <div>
        {hours.map((hour) => (
          <div key={hour} className="flex border-b border-gray-800/50 min-h-[80px]">
            <div className="w-20 p-3 text-right text-sm text-gray-500 border-r border-gray-800">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            <div className="flex-1 p-2 relative hover:bg-gray-800/20">
              {dayEvents
                .filter((e) => {
                  const eventDate = e.startDate instanceof Date 
                    ? e.startDate 
                    : e.startDate.toDate();
                  return eventDate.getHours() === hour;
                })
                .map((event) => (
                  <div key={event.id} className="mb-2">
                    <EventCard event={event} onClick={onEventClick} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', options)} - ${end.getDate()}`;
  }
  
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CalendarView({ 
  className = '',
  onEventClick,
  onAddEvent
}: CalendarViewProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    events,
    loading,
    error,
    currentDate,
    viewMode,
    goToToday,
    goToPrevious,
    goToNext,
    goToDate,
    setViewMode,
    weekDays,
    monthWeeks,
    filter,
    setFilter,
    selectedEvent,
    setSelectedEvent,
  } = useCalendar({ initialViewMode: 'week' });
  
  // Get date range string for header
  const dateRangeString = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
      case 'week': {
        const start = weekDays[0];
        const end = weekDays[6];
        return formatDateRange(start, end);
      }
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return '';
    }
  }, [currentDate, viewMode, weekDays]);
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    onEventClick?.(event);
  };
  
  const toggleActorFilter = (actor: ActivityActor) => {
    const current = filter.actors || [];
    const updated = current.includes(actor)
      ? current.filter((a: ActivityActor) => a !== actor)
      : [...current, actor];
    setFilter({ ...filter, actors: updated });
  };
  
  const toggleTypeFilter = (type: string) => {
    const current = filter.types || [];
    const updated = current.includes(type as any)
      ? current.filter((t: string) => t !== type)
      : [...current, type as any];
    setFilter({ ...filter, types: updated });
  };
  
  if (error) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Error loading calendar</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToNext}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-white">
              {dateRangeString}
            </h2>
          </div>
          
          {/* View mode & actions */}
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                    ${viewMode === mode 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                >
                  {VIEW_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                p-2 rounded-lg transition-colors
                ${showFilters ? 'bg-green-500/20 text-green-400' : 'hover:bg-gray-800 text-gray-400'}
              `}
            >
              <Filter className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => onAddEvent?.(currentDate)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Event</span>
            </button>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
            {/* Actor filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Actors:</span>
              {(['garion', 'barak', 'silk', 'polgara'] as ActivityActor[]).map((actor) => (
                <button
                  key={actor}
                  onClick={() => toggleActorFilter(actor)}
                  className={`
                    px-3 py-1 rounded-full text-sm transition-colors
                    ${filter.actors?.includes(actor)
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                    }
                  `}
                >
                  {ACTOR_LABELS[actor]}
                </button>
              ))}
            </div>
            
            {/* Type filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Types:</span>
              {(['task', 'deadline', 'reminder', 'milestone'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`
                    px-3 py-1 rounded-full text-sm transition-colors capitalize
                    ${filter.types?.includes(type)
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                    }
                  `}
                >
                  {EVENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Calendar content */}
      <div className="overflow-auto" style={{ maxHeight: '600px' }}>
        {loading && events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-800 rounded w-48 mx-auto" />
              <div className="h-64 bg-gray-800/50 rounded" />
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'day' && (
              <DayView 
                currentDate={currentDate} 
                events={events}
                onEventClick={handleEventClick}
              />
            )}
            {viewMode === 'week' && (
              <WeekView 
                currentDate={currentDate}
                weekDays={weekDays}
                events={events}
                onEventClick={handleEventClick}
              />
            )}
            {viewMode === 'month' && (
              <MonthView 
                monthWeeks={monthWeeks}
                onEventClick={handleEventClick}
                onAddEvent={onAddEvent}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CalendarView;
