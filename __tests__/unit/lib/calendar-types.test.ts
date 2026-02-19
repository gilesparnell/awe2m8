/**
 * @jest-environment node
 */

import {
  CalendarEvent,
  CalendarEventType,
  EventPriority,
  CalendarViewMode,
  isCalendarEventType,
  isEventPriority,
  isCalendarViewMode,
  isCalendarEvent,
  getEventTypeColorClass,
  getPriorityColorClass,
  formatEventTimeRange,
  isEventOnDate,
  sortEventsByTime,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  VIEW_MODE_LABELS,
} from '@/types/calendar';
import { Timestamp } from 'firebase/firestore';

describe('Calendar Types', () => {
  describe('Type Guards', () => {
    describe('isCalendarEventType', () => {
      it('should return true for valid event types', () => {
        expect(isCalendarEventType('task')).toBe(true);
        expect(isCalendarEventType('cron')).toBe(true);
        expect(isCalendarEventType('reminder')).toBe(true);
        expect(isCalendarEventType('deadline')).toBe(true);
        expect(isCalendarEventType('milestone')).toBe(true);
        expect(isCalendarEventType('meeting')).toBe(true);
      });

      it('should return false for invalid event types', () => {
        expect(isCalendarEventType('invalid')).toBe(false);
        expect(isCalendarEventType('')).toBe(false);
        expect(isCalendarEventType(null)).toBe(false);
        expect(isCalendarEventType(undefined)).toBe(false);
        expect(isCalendarEventType(123)).toBe(false);
      });
    });

    describe('isEventPriority', () => {
      it('should return true for valid priorities', () => {
        expect(isEventPriority('low')).toBe(true);
        expect(isEventPriority('medium')).toBe(true);
        expect(isEventPriority('high')).toBe(true);
        expect(isEventPriority('critical')).toBe(true);
      });

      it('should return false for invalid priorities', () => {
        expect(isEventPriority('invalid')).toBe(false);
        expect(isEventPriority('')).toBe(false);
        expect(isEventPriority(null)).toBe(false);
        expect(isEventPriority(undefined)).toBe(false);
      });
    });

    describe('isCalendarViewMode', () => {
      it('should return true for valid view modes', () => {
        expect(isCalendarViewMode('day')).toBe(true);
        expect(isCalendarViewMode('week')).toBe(true);
        expect(isCalendarViewMode('month')).toBe(true);
      });

      it('should return false for invalid view modes', () => {
        expect(isCalendarViewMode('invalid')).toBe(false);
        expect(isCalendarViewMode('year')).toBe(false);
        expect(isCalendarViewMode('')).toBe(false);
        expect(isCalendarViewMode(null)).toBe(false);
      });
    });

    describe('isCalendarEvent', () => {
      it('should return true for valid calendar event', () => {
        const mockTimestamp = { seconds: 1234567890, nanoseconds: 0 } as Timestamp;
        const validEvent: CalendarEvent = {
          id: 'event-123',
          title: 'Test Event',
          startDate: mockTimestamp,
          type: 'task',
          status: 'pending',
          priority: 'medium',
          createdAt: mockTimestamp,
        };
        expect(isCalendarEvent(validEvent)).toBe(true);
      });

      it('should return false for invalid calendar event', () => {
        expect(isCalendarEvent(null)).toBe(false);
        expect(isCalendarEvent(undefined)).toBe(false);
        expect(isCalendarEvent('string')).toBe(false);
        expect(isCalendarEvent({})).toBe(false);
        expect(isCalendarEvent({ id: 'test' })).toBe(false);
        expect(isCalendarEvent({ 
          id: 'test', 
          title: 'Test',
          type: 'invalid'
        })).toBe(false);
      });
    });
  });

  describe('Constants', () => {
    describe('EVENT_TYPE_COLORS', () => {
      it('should have colors for all event types', () => {
        const types: CalendarEventType[] = ['task', 'cron', 'reminder', 'deadline', 'milestone', 'meeting'];
        types.forEach((type) => {
          expect(EVENT_TYPE_COLORS[type]).toBeDefined();
          expect(typeof EVENT_TYPE_COLORS[type]).toBe('string');
        });
      });
    });

    describe('EVENT_TYPE_LABELS', () => {
      it('should have labels for all event types', () => {
        const types: CalendarEventType[] = ['task', 'cron', 'reminder', 'deadline', 'milestone', 'meeting'];
        types.forEach((type) => {
          expect(EVENT_TYPE_LABELS[type]).toBeDefined();
          expect(typeof EVENT_TYPE_LABELS[type]).toBe('string');
        });
      });
    });

    describe('PRIORITY_COLORS', () => {
      it('should have colors for all priorities', () => {
        const priorities: EventPriority[] = ['low', 'medium', 'high', 'critical'];
        priorities.forEach((priority) => {
          expect(PRIORITY_COLORS[priority]).toBeDefined();
          expect(typeof PRIORITY_COLORS[priority]).toBe('string');
        });
      });
    });

    describe('PRIORITY_LABELS', () => {
      it('should have labels for all priorities', () => {
        const priorities: EventPriority[] = ['low', 'medium', 'high', 'critical'];
        priorities.forEach((priority) => {
          expect(PRIORITY_LABELS[priority]).toBeDefined();
          expect(typeof PRIORITY_LABELS[priority]).toBe('string');
        });
      });
    });

    describe('VIEW_MODE_LABELS', () => {
      it('should have labels for all view modes', () => {
        const modes: CalendarViewMode[] = ['day', 'week', 'month'];
        modes.forEach((mode) => {
          expect(VIEW_MODE_LABELS[mode]).toBeDefined();
          expect(typeof VIEW_MODE_LABELS[mode]).toBe('string');
        });
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getEventTypeColorClass', () => {
      it('should return color class for each event type', () => {
        const types: CalendarEventType[] = ['task', 'cron', 'reminder', 'deadline', 'milestone', 'meeting'];
        types.forEach((type) => {
          const colorClass = getEventTypeColorClass(type);
          expect(colorClass).toBeDefined();
          expect(typeof colorClass).toBe('string');
          expect(colorClass).toContain('bg-');
        });
      });
    });

    describe('getPriorityColorClass', () => {
      it('should return color class for each priority', () => {
        const priorities: EventPriority[] = ['low', 'medium', 'high', 'critical'];
        priorities.forEach((priority) => {
          const colorClass = getPriorityColorClass(priority);
          expect(colorClass).toBeDefined();
          expect(typeof colorClass).toBe('string');
          expect(colorClass).toContain('bg-');
        });
      });
    });

    describe('formatEventTimeRange', () => {
      it('should return "All day" for all-day events', () => {
        const mockTimestamp = { 
          seconds: Math.floor(new Date('2024-01-15T10:00:00').getTime() / 1000), 
          nanoseconds: 0,
          toDate: () => new Date('2024-01-15T10:00:00')
        } as Timestamp;
        
        const event: CalendarEvent = {
          id: '1',
          title: 'All Day Event',
          startDate: mockTimestamp,
          type: 'task',
          status: 'pending',
          priority: 'medium',
          allDay: true,
          createdAt: mockTimestamp,
        };
        
        expect(formatEventTimeRange(event)).toBe('All day');
      });

      it('should return start time only when no end date', () => {
        const mockTimestamp = { 
          seconds: Math.floor(new Date('2024-01-15T14:30:00').getTime() / 1000), 
          nanoseconds: 0,
          toDate: () => new Date('2024-01-15T14:30:00')
        } as Timestamp;
        
        const event: CalendarEvent = {
          id: '1',
          title: 'Event',
          startDate: mockTimestamp,
          type: 'task',
          status: 'pending',
          priority: 'medium',
          createdAt: mockTimestamp,
        };
        
        const result = formatEventTimeRange(event);
        expect(result).toContain('2:30');
        expect(result).toContain('PM');
      });

      it('should return time range when has start and end', () => {
        const startTimestamp = { 
          seconds: Math.floor(new Date('2024-01-15T14:30:00').getTime() / 1000), 
          nanoseconds: 0,
          toDate: () => new Date('2024-01-15T14:30:00')
        } as Timestamp;
        
        const endTimestamp = { 
          seconds: Math.floor(new Date('2024-01-15T16:00:00').getTime() / 1000), 
          nanoseconds: 0,
          toDate: () => new Date('2024-01-15T16:00:00')
        } as Timestamp;
        
        const event: CalendarEvent = {
          id: '1',
          title: 'Event',
          startDate: startTimestamp,
          endDate: endTimestamp,
          type: 'task',
          status: 'pending',
          priority: 'medium',
          createdAt: startTimestamp,
        };
        
        const result = formatEventTimeRange(event);
        expect(result).toContain('2:30');
        expect(result).toContain('4:00');
        expect(result).toContain('-');
      });
    });

    describe('isEventOnDate', () => {
      it('should return true when event is on the same date', () => {
        const eventDate = new Date('2024-01-15T14:30:00');
        const checkDate = new Date('2024-01-15T00:00:00');
        
        const mockTimestamp = { 
          seconds: Math.floor(eventDate.getTime() / 1000), 
          nanoseconds: 0,
          toDate: () => eventDate
        } as Timestamp;
        
        const event: CalendarEvent = {
          id: '1',
          title: 'Event',
          startDate: mockTimestamp,
          type: 'task',
          status: 'pending',
          priority: 'medium',
          createdAt: mockTimestamp,
        };
        
        expect(isEventOnDate(event, checkDate)).toBe(true);
      });

      it('should return false when event is on different date', () => {
        const eventDate = new Date('2024-01-15T14:30:00');
        const checkDate = new Date('2024-01-16T00:00:00');
        
        const mockTimestamp = { 
          seconds: Math.floor(eventDate.getTime() / 1000), 
          nanoseconds: 0,
          toDate: () => eventDate
        } as Timestamp;
        
        const event: CalendarEvent = {
          id: '1',
          title: 'Event',
          startDate: mockTimestamp,
          type: 'task',
          status: 'pending',
          priority: 'medium',
          createdAt: mockTimestamp,
        };
        
        expect(isEventOnDate(event, checkDate)).toBe(false);
      });
    });

    describe('sortEventsByTime', () => {
      it('should sort events by start time', () => {
        const baseTime = new Date('2024-01-15T12:00:00').getTime();
        
        const events: CalendarEvent[] = [
          {
            id: '3',
            title: 'Event 3',
            startDate: { 
              seconds: Math.floor((baseTime + 2 * 3600000) / 1000), 
              nanoseconds: 0,
              toDate: () => new Date(baseTime + 2 * 3600000)
            } as Timestamp,
            type: 'task',
            status: 'pending',
            priority: 'medium',
            createdAt: { seconds: 0, nanoseconds: 0 } as Timestamp,
          },
          {
            id: '1',
            title: 'Event 1',
            startDate: { 
              seconds: Math.floor(baseTime / 1000), 
              nanoseconds: 0,
              toDate: () => new Date(baseTime)
            } as Timestamp,
            type: 'task',
            status: 'pending',
            priority: 'medium',
            createdAt: { seconds: 0, nanoseconds: 0 } as Timestamp,
          },
          {
            id: '2',
            title: 'Event 2',
            startDate: { 
              seconds: Math.floor((baseTime + 3600000) / 1000), 
              nanoseconds: 0,
              toDate: () => new Date(baseTime + 3600000)
            } as Timestamp,
            type: 'task',
            status: 'pending',
            priority: 'medium',
            createdAt: { seconds: 0, nanoseconds: 0 } as Timestamp,
          },
        ];
        
        const sorted = sortEventsByTime(events);
        
        expect(sorted[0].id).toBe('1');
        expect(sorted[1].id).toBe('2');
        expect(sorted[2].id).toBe('3');
      });

      it('should not mutate original array', () => {
        const baseTime = new Date('2024-01-15T12:00:00').getTime();
        
        const events: CalendarEvent[] = [
          {
            id: '2',
            title: 'Event 2',
            startDate: { 
              seconds: Math.floor((baseTime + 3600000) / 1000), 
              nanoseconds: 0,
              toDate: () => new Date(baseTime + 3600000)
            } as Timestamp,
            type: 'task',
            status: 'pending',
            priority: 'medium',
            createdAt: { seconds: 0, nanoseconds: 0 } as Timestamp,
          },
          {
            id: '1',
            title: 'Event 1',
            startDate: { 
              seconds: Math.floor(baseTime / 1000), 
              nanoseconds: 0,
              toDate: () => new Date(baseTime)
            } as Timestamp,
            type: 'task',
            status: 'pending',
            priority: 'medium',
            createdAt: { seconds: 0, nanoseconds: 0 } as Timestamp,
          },
        ];
        
        const sorted = sortEventsByTime(events);
        
        expect(events[0].id).toBe('2'); // Original unchanged
        expect(sorted[0].id).toBe('1'); // Sorted correctly
      });
    });
  });
});
