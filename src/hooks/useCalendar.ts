/**
 * Calendar Hook
 * 
 * Provides calendar data management, navigation, and event fetching
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  CalendarEvent, 
  CalendarFilter, 
  CalendarViewMode,
  CalendarDay,
  CalendarWeek,
  CalendarMonth,
  sortEventsByTime,
  isEventOnDate,
} from '@/types/calendar';

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get start of week (Sunday) for a date
 */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Get end of week (Saturday) for a date
 */
function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

/**
 * Get start of month
 */
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month
 */
function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get array of dates for a week
 */
function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
}

/**
 * Get weeks for a month view (including days from prev/next months)
 */
function getMonthWeeks(year: number, month: number): CalendarWeek[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Get the Sunday of the week containing the first day
  const startDate = getStartOfWeek(firstDayOfMonth);
  
  // Get the Saturday of the week containing the last day
  const endDate = getEndOfWeek(lastDayOfMonth);
  
  const weeks: CalendarWeek[] = [];
  let currentDate = new Date(startDate);
  let weekNumber = 1;
  
  while (currentDate <= endDate) {
    const weekDays: CalendarDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      weekDays.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: isToday(date),
        events: [], // Will be populated later
      });
      currentDate = addDays(currentDate, 1);
    }
    
    weeks.push({
      weekNumber,
      days: weekDays,
    });
    weekNumber++;
  }
  
  return weeks;
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

interface UseCalendarReturn {
  // Events
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  
  // Navigation
  currentDate: Date;
  viewMode: CalendarViewMode;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToDate: (date: Date) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  
  // View data
  weekDays: Date[];
  monthWeeks: CalendarWeek[];
  
  // Filter
  filter: CalendarFilter;
  setFilter: (filter: CalendarFilter) => void;
  
  // Selected event
  selectedEvent: CalendarEvent | null;
  setSelectedEvent: (event: CalendarEvent | null) => void;
}

interface UseCalendarOptions {
  initialViewMode?: CalendarViewMode;
  initialDate?: Date;
  realTime?: boolean;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useCalendar(options: UseCalendarOptions = {}): UseCalendarReturn {
  const {
    initialViewMode = 'week',
    initialDate = new Date(),
    realTime = true,
  } = options;
  
  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewModeState] = useState<CalendarViewMode>(initialViewMode);
  const [filter, setFilter] = useState<CalendarFilter>({});
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return {
          start: new Date(currentDate.setHours(0, 0, 0, 0)),
          end: new Date(currentDate.setHours(23, 59, 59, 999)),
        };
      case 'week':
        return {
          start: getStartOfWeek(currentDate),
          end: getEndOfWeek(currentDate),
        };
      case 'month':
        return {
          start: getStartOfMonth(currentDate),
          end: getEndOfMonth(currentDate),
        };
      default:
        return {
          start: getStartOfWeek(currentDate),
          end: getEndOfWeek(currentDate),
        };
    }
  }, [currentDate, viewMode]);
  
  // Fetch events from Firestore
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const eventsRef = collection(db, 'calendar_events');
    
    // Build query based on date range
    let q = query(
      eventsRef,
      where('startDate', '>=', Timestamp.fromDate(dateRange.start)),
      where('startDate', '<=', Timestamp.fromDate(dateRange.end)),
      orderBy('startDate', 'asc')
    );
    
    // Apply additional filters
    if (filter.actors && filter.actors.length > 0) {
      if (filter.actors.length === 1) {
        q = query(q, where('actor', '==', filter.actors[0]));
      }
    }
    
    if (filter.types && filter.types.length > 0) {
      if (filter.types.length === 1) {
        q = query(q, where('type', '==', filter.types[0]));
      }
    }
    
    if (filter.statuses && filter.statuses.length > 0) {
      if (filter.statuses.length === 1) {
        q = query(q, where('status', '==', filter.statuses[0]));
      }
    }
    
    if (realTime) {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const newEvents: CalendarEvent[] = [];
          snapshot.forEach((doc) => {
            newEvents.push(docToCalendarEvent(doc));
          });
          setEvents(newEvents);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching calendar events:', err);
          setError('Failed to load calendar events');
          setLoading(false);
        }
      );
      
      return () => unsubscribe();
    } else {
      // One-time fetch
      const fetchEvents = async () => {
        try {
          const { getDocs } = await import('firebase/firestore');
          const snapshot = await getDocs(q);
          const newEvents: CalendarEvent[] = [];
          snapshot.forEach((doc) => {
            newEvents.push(docToCalendarEvent(doc));
          });
          setEvents(newEvents);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching calendar events:', err);
          setError('Failed to load calendar events');
          setLoading(false);
        }
      };
      
      fetchEvents();
    }
  }, [dateRange, filter, realTime]);
  
  // Navigation functions
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);
  
  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      switch (viewMode) {
        case 'day':
          return addDays(prev, -1);
        case 'week':
          return addDays(prev, -7);
        case 'month':
          return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
        default:
          return addDays(prev, -7);
      }
    });
  }, [viewMode]);
  
  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      switch (viewMode) {
        case 'day':
          return addDays(prev, 1);
        case 'week':
          return addDays(prev, 7);
        case 'month':
          return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        default:
          return addDays(prev, 7);
      }
    });
  }, [viewMode]);
  
  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);
  
  const setViewMode = useCallback((mode: CalendarViewMode) => {
    setViewModeState(mode);
  }, []);
  
  // Calculate week days for week view
  const weekDays = useMemo(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    return getWeekDays(startOfWeek);
  }, [currentDate]);
  
  // Calculate month weeks for month view
  const monthWeeks = useMemo(() => {
    const weeks = getMonthWeeks(currentDate.getFullYear(), currentDate.getMonth());
    
    // Add events to each day
    return weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        events: sortEventsByTime(
          events.filter((event) => isEventOnDate(event, day.date))
        ),
      })),
    }));
  }, [currentDate, events]);
  
  // Apply client-side filtering for complex filters
  const filteredEvents = useMemo(() => {
    let result = events;
    
    // Filter by actors (if multiple)
    if (filter.actors && filter.actors.length > 1) {
      result = result.filter((e) => e.actor && filter.actors!.includes(e.actor));
    }
    
    // Filter by types (if multiple)
    if (filter.types && filter.types.length > 1) {
      result = result.filter((e) => filter.types!.includes(e.type));
    }
    
    // Filter by priorities
    if (filter.priorities && filter.priorities.length > 0) {
      result = result.filter((e) => filter.priorities!.includes(e.priority));
    }
    
    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          (e.description && e.description.toLowerCase().includes(query))
      );
    }
    
    return sortEventsByTime(result);
  }, [events, filter]);
  
  return {
    events: filteredEvents,
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
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Firestore document to CalendarEvent
 */
function docToCalendarEvent(
  doc: QueryDocumentSnapshot<DocumentData>
): CalendarEvent {
  const data = doc.data();
  
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    startDate: data.startDate as Timestamp,
    endDate: data.endDate as Timestamp | undefined,
    allDay: data.allDay,
    type: data.type,
    actor: data.actor,
    status: data.status,
    priority: data.priority,
    color: data.color,
    taskId: data.taskId,
    project: data.project,
    recurrence: data.recurrence,
    metadata: data.metadata,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp | undefined,
  };
}

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for fetching a single calendar event
 */
export function useCalendarEvent(eventId: string | null) {
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const fetchEvent = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'calendar_events', eventId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setEvent(docToCalendarEvent(docSnap));
        } else {
          setError('Event not found');
        }
      } catch (err) {
        console.error('Error fetching calendar event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId]);
  
  return { event, loading, error };
}

/**
 * Hook for getting upcoming events
 */
export function useUpcomingEvents(limit: number = 5) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const now = new Date();
    const eventsRef = collection(db, 'calendar_events');
    
    const q = query(
      eventsRef,
      where('startDate', '>=', Timestamp.fromDate(now)),
      where('status', 'in', ['pending', 'in_progress']),
      orderBy('startDate', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        newEvents.push(docToCalendarEvent(doc));
        if (newEvents.length >= limit) return;
      });
      setEvents(newEvents.slice(0, limit));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [limit]);
  
  return { events, loading };
}

export default useCalendar;
