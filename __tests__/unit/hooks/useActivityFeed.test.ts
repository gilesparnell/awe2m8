/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useActivityFeed, useActivity, useActivityStats } from '@/hooks/useActivityFeed';
import { ActivityLog, ActivityFilter, ActivityActor, ActivityCategory } from '@/types/activity';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
const mockUnsubscribe = jest.fn();
const mockOnSnapshot = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockCollection = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockStartAfter = jest.fn();
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
  limit: (...args: any[]) => mockLimit(...args),
  startAfter: (...args: any[]) => mockStartAfter(...args),
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

// Mock activity data with proper Timestamp shape
const createMockTimestamp = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => new Date(date),
} as Timestamp);

// Use a fixed "today" date for consistent testing
const MOCK_TODAY = new Date();
MOCK_TODAY.setHours(12, 0, 0, 0); // noon today

const createMockActivity = (id: string, actor: ActivityActor, category: ActivityCategory): ActivityLog => ({
  id,
  timestamp: createMockTimestamp(MOCK_TODAY),
  actor,
  actorType: actor === 'garion' ? 'main' : 'subagent',
  category,
  action: 'write',
  description: `Test activity ${id}`,
  metadata: {},
  sessionId: 'test-session',
});

describe('useActivityFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations - use setTimeout to simulate async
    mockCollection.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockLimit.mockReturnValue({});
    mockStartAfter.mockReturnValue({});
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      // Simulate async Firestore response
      setTimeout(() => {
        onSuccess({
          docs: [],
          forEach: jest.fn(),
        });
      }, 0);
      return mockUnsubscribe;
    });
  });

  it('should initialize with loading state', async () => {
    const { result } = renderHook(() => useActivityFeed());
    
    // Should start loading
    expect(result.current.loading).toBe(true);
    expect(result.current.activities).toEqual([]);
    expect(result.current.error).toBeNull();
    
    // Wait for effect to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should load activities on mount', async () => {
    const mockActivities = [
      createMockActivity('1', 'garion', 'file'),
      createMockActivity('2', 'fury', 'web'),
    ];

    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      setTimeout(() => {
        onSuccess({
          docs: mockActivities.map(a => ({
            id: a.id,
            data: () => ({
              timestamp: a.timestamp,
              actor: a.actor,
              actorType: a.actorType,
              category: a.category,
              action: a.action,
              description: a.description,
              metadata: a.metadata,
              sessionId: a.sessionId,
            }),
          })),
          forEach: function(callback: any) {
            this.docs.forEach((doc: any) => callback(doc));
          },
        });
      }, 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useActivityFeed());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toHaveLength(2);
    expect(result.current.activities[0].actor).toBe('garion');
  });

  it('should group activities by date', async () => {
    const mockActivities = [
      createMockActivity('1', 'garion', 'file'),
      createMockActivity('2', 'fury', 'web'),
    ];

    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      setTimeout(() => {
        onSuccess({
          docs: mockActivities.map(a => ({
            id: a.id,
            data: () => ({
              timestamp: a.timestamp,
              actor: a.actor,
              actorType: a.actorType,
              category: a.category,
              action: a.action,
              description: a.description,
              metadata: a.metadata,
              sessionId: a.sessionId,
            }),
          })),
          forEach: function(callback: any) {
            this.docs.forEach((doc: any) => callback(doc));
          },
        });
      }, 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useActivityFeed());

    await waitFor(() => {
      expect(result.current.groupedActivities.length).toBeGreaterThan(0);
    });

    const groups = result.current.groupedActivities;
    expect(groups[0].label).toBe('Today');
    expect(groups[0].activities.length).toBe(2);
  });

  it('should apply actor filter with single actor', async () => {
    const filter: ActivityFilter = { actors: ['garion'] };
    
    renderHook(() => useActivityFeed({ initialFilter: filter }));

    await waitFor(() => {
      // Single actor should use '==' not 'in'
      expect(mockWhere).toHaveBeenCalledWith('actor', '==', 'garion');
    });
  });

  it('should apply actor filter with multiple actors', async () => {
    const filter: ActivityFilter = { actors: ['garion', 'fury'] };
    
    renderHook(() => useActivityFeed({ initialFilter: filter }));

    await waitFor(() => {
      // Multiple actors should use 'in'
      expect(mockWhere).toHaveBeenCalledWith('actor', 'in', ['garion', 'fury']);
    });
  });

  it('should apply category filter', async () => {
    const filter: ActivityFilter = { categories: ['file', 'web'] };
    
    renderHook(() => useActivityFeed({ initialFilter: filter }));

    await waitFor(() => {
      expect(mockWhere).toHaveBeenCalledWith('category', 'in', ['file', 'web']);
    });
  });

  it('should handle errors gracefully', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess, onError) => {
      setTimeout(() => {
        onError(new Error('Firestore error'));
      }, 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useActivityFeed());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load activities');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should refresh activities', async () => {
    const { result } = renderHook(() => useActivityFeed());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.refresh();
    });

    // Should be loading again after refresh
    expect(result.current.loading).toBe(true);
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useActivityFeed());
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('useActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no activityId provided', () => {
    const { result } = renderHook(() => useActivity(null));
    
    expect(result.current.activity).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should fetch single activity', async () => {
    const mockActivity = createMockActivity('123', 'garion', 'file');
    
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: mockActivity.id,
      data: () => ({
        timestamp: mockActivity.timestamp,
        actor: mockActivity.actor,
        actorType: mockActivity.actorType,
        category: mockActivity.category,
        action: mockActivity.action,
        description: mockActivity.description,
        metadata: mockActivity.metadata,
        sessionId: mockActivity.sessionId,
      }),
    });

    const { result } = renderHook(() => useActivity('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity).not.toBeNull();
    expect(result.current.activity?.id).toBe('123');
  });

  it('should handle activity not found', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const { result } = renderHook(() => useActivity('nonexistent'));

    await waitFor(() => {
      expect(result.current.error).toBe('Activity not found');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle fetch errors', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useActivity('123'));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load activity');
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useActivityStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetDocs.mockResolvedValue({
      forEach: jest.fn(),
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useActivityStats());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.total).toBe(0);
  });

  it('should calculate stats correctly', async () => {
    const mockDocs = [
      { actor: 'garion', category: 'file' },
      { actor: 'garion', category: 'web' },
      { actor: 'fury', category: 'file' },
    ];

    mockGetDocs.mockResolvedValue({
      forEach: (callback: any) => {
        mockDocs.forEach((doc, i) => callback({
          id: `doc-${i}`,
          data: () => doc,
        }));
      },
    });

    const { result } = renderHook(() => useActivityStats(7));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.total).toBe(3);
    expect(result.current.byActor.garion).toBe(2);
    expect(result.current.byActor.fury).toBe(1);
    expect(result.current.byCategory.file).toBe(2);
    expect(result.current.byCategory.web).toBe(1);
  });

  it('should handle empty results', async () => {
    mockGetDocs.mockResolvedValue({
      forEach: jest.fn(),
    });

    const { result } = renderHook(() => useActivityStats(7));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.total).toBe(0);
  });

  it('should handle errors', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore error'));

    const { result } = renderHook(() => useActivityStats());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load stats');
      expect(result.current.loading).toBe(false);
    });
  });
});
