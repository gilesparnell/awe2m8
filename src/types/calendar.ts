/**
 * Calendar Types for Mission Control
 * 
 * Types for calendar events, scheduling, and date-based views
 */

import { Timestamp } from 'firebase/firestore';
import { ActivityActor } from './activity';

// ============================================================================
// CORE TYPES
// ============================================================================

/** Types of calendar events */
export type CalendarEventType = 
  | 'task'      // Task deadline or scheduled work
  | 'cron'      // Recurring cron job
  | 'reminder'  // One-time reminder
  | 'deadline'  // Hard deadline
  | 'milestone' // Project milestone
  | 'meeting';  // Scheduled meeting/call

/** Calendar event priority */
export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

/** Calendar view modes */
export type CalendarViewMode = 'day' | 'week' | 'month';

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * Single calendar event
 * Stored in Firestore collection: 'calendar_events'
 */
export interface CalendarEvent {
  id: string;
  
  /** Event title */
  title: string;
  
  /** Event description */
  description?: string;
  
  /** Start date/time */
  startDate: Timestamp;
  
  /** End date/time (optional for all-day events) */
  endDate?: Timestamp;
  
  /** Is this an all-day event? */
  allDay?: boolean;
  
  /** Type of event */
  type: CalendarEventType;
  
  /** Associated actor */
  actor?: ActivityActor;
  
  /** Event status */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  /** Priority level */
  priority: EventPriority;
  
  /** Color for display (optional, falls back to type/actor color) */
  color?: string;
  
  /** Associated task ID */
  taskId?: string;
  
  /** Associated project */
  project?: string;
  
  /** Recurrence rule (if recurring) */
  recurrence?: RecurrenceRule;
  
  /** Metadata */
  metadata?: Record<string, unknown>;
  
  /** Created timestamp */
  createdAt: Timestamp;
  
  /** Updated timestamp */
  updatedAt?: Timestamp;
}

// ============================================================================
// RECURRENCE TYPES
// ============================================================================

export interface RecurrenceRule {
  /** Recurrence frequency */
  frequency: 'daily' | 'weekly' | 'monthly';
  
  /** Interval (e.g., every 2 weeks) */
  interval: number;
  
  /** End date for recurrence (optional) */
  endDate?: Timestamp;
  
  /** Number of occurrences (optional) */
  count?: number;
  
  /** Days of week for weekly recurrence (0=Sunday, 6=Saturday) */
  daysOfWeek?: number[];
}

// ============================================================================
// DISPLAY TYPES
// ============================================================================

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-11
  weeks: CalendarWeek[];
}

export interface EventGroup {
  label: string; // "Today", "Tomorrow", "This Week", etc.
  events: CalendarEvent[];
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface CalendarFilter {
  actors?: ActivityActor[];
  types?: CalendarEventType[];
  statuses?: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
  priorities?: EventPriority[];
  startDate?: Date;
  endDate?: Date;
  project?: string;
  searchQuery?: string;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface CalendarNavigation {
  currentDate: Date;
  viewMode: CalendarViewMode;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToDate: (date: Date) => void;
  setViewMode: (mode: CalendarViewMode) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  task: 'blue',
  cron: 'purple',
  reminder: 'amber',
  deadline: 'red',
  milestone: 'green',
  meeting: 'cyan',
};

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  task: 'Task',
  cron: 'Cron Job',
  reminder: 'Reminder',
  deadline: 'Deadline',
  milestone: 'Milestone',
  meeting: 'Meeting',
};

export const PRIORITY_COLORS: Record<EventPriority, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

export const PRIORITY_LABELS: Record<EventPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const VIEW_MODE_LABELS: Record<CalendarViewMode, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isCalendarEventType(value: unknown): value is CalendarEventType {
  return typeof value === 'string' && 
    ['task', 'cron', 'reminder', 'deadline', 'milestone', 'meeting'].includes(value);
}

export function isEventPriority(value: unknown): value is EventPriority {
  return typeof value === 'string' && 
    ['low', 'medium', 'high', 'critical'].includes(value);
}

export function isCalendarViewMode(value: unknown): value is CalendarViewMode {
  return typeof value === 'string' && 
    ['day', 'week', 'month'].includes(value);
}

export function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== 'object') return false;
  
  const event = value as Partial<CalendarEvent>;
  return (
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.startDate !== 'undefined' &&
    isCalendarEventType(event.type) &&
    typeof event.status === 'string' &&
    isEventPriority(event.priority)
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color class for event type
 */
export function getEventTypeColorClass(type: CalendarEventType): string {
  const color = EVENT_TYPE_COLORS[type];
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colorMap[color] || colorMap.gray;
}

/**
 * Get color class for priority
 */
export function getPriorityColorClass(priority: EventPriority): string {
  const color = PRIORITY_COLORS[priority];
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colorMap[color] || colorMap.gray;
}

/**
 * Format event time range
 */
export function formatEventTimeRange(event: CalendarEvent): string {
  const start = event.startDate instanceof Date 
    ? event.startDate 
    : event.startDate.toDate();
    
  if (event.allDay) {
    return 'All day';
  }
  
  const startTime = start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (!event.endDate) {
    return startTime;
  }
  
  const end = event.endDate instanceof Date 
    ? event.endDate 
    : event.endDate.toDate();
    
  const endTime = end.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `${startTime} - ${endTime}`;
}

/**
 * Check if event is on a specific date
 */
export function isEventOnDate(event: CalendarEvent, date: Date): boolean {
  const eventDate = event.startDate instanceof Date 
    ? event.startDate 
    : event.startDate.toDate();
    
  return (
    eventDate.getFullYear() === date.getFullYear() &&
    eventDate.getMonth() === date.getMonth() &&
    eventDate.getDate() === date.getDate()
  );
}

/**
 * Sort events by start time
 */
export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aTime = a.startDate instanceof Date 
      ? a.startDate.getTime() 
      : a.startDate.toDate().getTime();
    const bTime = b.startDate instanceof Date 
      ? b.startDate.toDate().getTime() 
      : b.startDate.toDate().getTime();
    return aTime - bTime;
  });
}
