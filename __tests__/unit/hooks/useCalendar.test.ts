/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendar, useCalendarEvent, useUpcomingEvents } from '@/hooks/useCalendar';
import { CalendarEvent, CalendarViewMode } from '@/types/calendar';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
const mockUnsubscribe = jest.fn();
const mockOnSnapshot = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockCollection = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ 
      seconds: Math.floor(date.getTime() / 1000), 
      nanoseconds: 0,
      toDate: () => date,
    }),
  },
}));

// Mock event data
const createMockEvent = (id: string, title: string, date: Date): CalendarEvent => ({
  id,
  title,
  startDate: { 
    seconds: Math.floor(date.getTime() / 1000), 
    nanoseconds: 0,
    toDate: () => date,
  } as Timestamp,
  type: 'task',
  status: 'pending',
  priority: 'medium',
  createdAt: { seconds: 0, nanoseconds: 0 } as Timestamp,
});

describe('useCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockCollection.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      setTimeout(() => {
        onSuccess({
          docs: [],
          forEach: jest.fn(),
        });
      }, 0);
      return mockUnsubscribe;
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCalendar());
    
    expect(result.current.events).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.viewMode).toBe('week');
    expect(result.current.selectedEvent).toBeNull();
  });

  it('should accept initial options', () => {
    const initialDate = new Date('2024-06-15');
    const { result } = renderHook(() => 
      useCalendar({ 
        initialViewMode: 'month', 
        initialDate,
        realTime: false 
      })
    );
    
    expect(result.current.viewMode).toBe('month');
  });

  it('should navigate to today', () => {
    const { result } = renderHook(() => useCalendar());
    
    act(() => {
      result.current.goToToday();
    });
    
    // Should be close to current date
    const diff = Math.abs(result.current.currentDate.getTime() - new Date().getTime());
    expect(diff).toBeLessThan(1000); // Within 1 second
  });

  it('should navigate to previous period', async () => {
    const initialDate = new Date('2024-06-15');
    const { result } = renderHook(() => 
      useCalendar({ initialDate, initialViewMode: 'week' })
    );
    
    act(() => {
      result.current.goToPrevious();
    });
    
    // Should go back 7 days for week view
    const expectedDate = new Date('2024-06-08');
    expect(result.current.currentDate.getDate()).toBe(expectedDate.getDate());
  });

  it('should navigate to next period', () => {
    const initialDate = new Date('2024-06-15');
    const { result } = renderHook(() => 
      useCalendar({ initialDate, initialViewMode: 'week' })
    );
    
    act(() => {
      result.current.goToNext();
    });
    
    // Should go forward 7 days for week view
    const expectedDate = new Date('2024-06-22');
    expect(result.current.currentDate.getDate()).toBe(expectedDate.getDate());
  });

  it('should navigate to specific date', () => {
    const { result } = renderHook(() => useCalendar());
    const targetDate = new Date('2024-12-25');
    
    act(() => {
      result.current.goToDate(targetDate);
    });
    
    expect(result.current.currentDate.getFullYear()).toBe(2024);
    expect(result.current.currentDate.getMonth()).toBe(11); // December
    expect(result.current.currentDate.getDate()).toBe(25);
  });

  it('should change view mode', () => {
    const { result } = renderHook(() => useCalendar({ initialViewMode: 'week' }));
    
    act(() => {
      result.current.setViewMode('month');
    });
    
    expect(result.current.viewMode).toBe('month');
  });

  it('should calculate week days correctly', () => {
    // June 15, 2024 is a Saturday
    const initialDate = new Date('2024-06-15');
    const { result } = renderHook(() => 
      useCalendar({ initialDate, initialViewMode: 'week' })
    );
    
    // Should have 7 days
    expect(result.current.weekDays).toHaveLength(7);
    
    // First day should be Sunday (June 9)
    expect(result.current.weekDays[0].getDay()).toBe(0); // Sunday
    
    // Last day should be Saturday (June 15)
    expect(result.current.weekDays[6].getDay()).toBe(6); // Saturday
  });

  it('should calculate month weeks correctly', () => {
    const initialDate = new Date('2024-06-15');
    const { result } = renderHook(() => 
      useCalendar({ initialDate, initialViewMode: 'month' })
    );
    
    // Should have multiple weeks
    expect(result.current.monthWeeks.length).toBeGreaterThan(0);
    
    // Each week should have 7 days
    result.current.monthWeeks.forEach((week) => {
      expect(week.days).toHaveLength(7);
    });
  });

  it('should select event', () => {
    const { result } = renderHook(() => useCalendar());
    
    const mockEvent = createMockEvent('1', 'Test Event', new Date());
    
    act(() => {
      result.current.setSelectedEvent(mockEvent);
    });
    
    expect(result.current.selectedEvent).toEqual(mockEvent);
  });

  it('should clear selected event', () => {
    const { result } = renderHook(() => useCalendar());
    
    const mockEvent = createMockEvent('1', 'Test Event', new Date());
    
    act(() => {
      result.current.setSelectedEvent(mockEvent);
    });
    
    act(() => {
      result.current.setSelectedEvent(null);
    });
    
    expect(result.current.selectedEvent).toBeNull();
  });

  it('should update filter', () => {
    const { result } = renderHook(() => useCalendar());
    
    act(() => {
      result.current.setFilter({ 
        types: ['task', 'deadline'],
        priorities: ['high', 'critical'] 
      });
    });
    
    expect(result.current.filter.types).toEqual(['task', 'deadline']);
    expect(result.current.filter.priorities).toEqual(['high', 'critical']);
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useCalendar());
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle day view navigation', () => {
    const initialDate = new Date('2024-06-15');
    const { result } = renderHook(() => 
      useCalendar({ initialDate, initialViewMode: 'day' })
    );
    
    act(() => {
      result.current.goToNext();
    });
    
    // Should advance by 1 day
    expect(result.current.currentDate.getDate()).toBe(16);
  });

  it('should handle month view navigation', () => {
    const initialDate = new Date('2024-06-15');
    const { result } = renderHook(() => 
      useCalendar({ initialDate, initialViewMode: 'month' })
    );
    
    act(() => {
      result.current.goToNext();
    });
    
    // Should advance to next month
    expect(result.current.currentDate.getMonth()).toBe(6); // July (0-indexed)
  });
});

describe('useCalendarEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no eventId provided', () => {
    const { result } = renderHook(() => useCalendarEvent(null));
    
    expect(result.current.event).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should fetch single event', async () => {
    const mockEvent = createMockEvent('123', 'Test Event', new Date());
    
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: '123',
      data: () => ({
        title: 'Test Event',
        startDate: mockEvent.startDate,
        type: 'task',
        status: 'pending',
        priority: 'medium',
        createdAt: { seconds: 0, nanoseconds: 0 },
      }),
    });
    
    const { result } = renderHook(() => useCalendarEvent('123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.event).not.toBeNull();
    expect(result.current.event?.title).toBe('Test Event');
  });

  it('should handle event not found', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });
    
    const { result } = renderHook(() => useCalendarEvent('nonexistent'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe('Event not found');
  });

  it('should handle fetch errors', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useCalendarEvent('123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe('Failed to load event');
  });
});

describe('useUpcomingEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCollection.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      setTimeout(() => {
        onSuccess({
          docs: [],
          forEach: jest.fn(),
        });
      }, 0);
      return mockUnsubscribe;
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useUpcomingEvents());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.events).toEqual([]);
  });

  it('should respect limit', async () => {
    const mockEvents = [
      createMockEvent('1', 'Event 1', new Date()),
      createMockEvent('2', 'Event 2', new Date()),
      createMockEvent('3', 'Event 3', new Date()),
      createMockEvent('4', 'Event 4', new Date()),
      createMockEvent('5', 'Event 5', new Date()),
      createMockEvent('6', 'Event 6', new Date()),
    ];
    
    let callCount = 0;
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      setTimeout(() => {
        onSuccess({
          docs: mockEvents.map(e => ({
            id: e.id,
            data: () => ({
              title: e.title,
              startDate: e.startDate,
              type: e.type,
              status: e.status,
              priority: e.priority,
              createdAt: e.createdAt,
            }),
          })),
          forEach: function(callback: any) {
            this.docs.forEach(callback);
          },
        });
      }, 0);
      return mockUnsubscribe;
    });
    
    const { result } = renderHook(() => useUpcomingEvents(3));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should limit to 3 events
    expect(result.current.events.length).toBeLessThanOrEqual(3);
  });
});
