/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ActivityLog, ActivityActor, ActivityCategory } from '@/types/activity';
import { Timestamp } from 'firebase/firestore';

// Mock the hook
const mockUseActivityFeed = jest.fn();
jest.mock('@/hooks/useActivityFeed', () => ({
  useActivityFeed: (...args: any[]) => mockUseActivityFeed(...args),
}));

const createMockTimestamp = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
} as Timestamp);

const createMockActivity = (
  id: string, 
  actor: ActivityActor, 
  category: ActivityCategory,
  description: string
): ActivityLog => ({
  id,
  timestamp: createMockTimestamp(new Date()),
  actor,
  actorType: actor === 'garion' ? 'main' : 'subagent',
  category,
  action: 'write',
  description,
  metadata: {},
  sessionId: 'test-session',
});

describe('ActivityFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock return
    mockUseActivityFeed.mockReturnValue({
      activities: [],
      groupedActivities: [],
      loading: false,
      error: null,
      pagination: { limit: 50, hasMore: false },
      filter: {},
      setFilter: jest.fn(),
      loadMore: jest.fn(),
      refresh: jest.fn(),
      hasMore: false,
    });
  });

  it('should render empty state when no activities', () => {
    render(<ActivityFeed />);
    
    expect(screen.getByText('No activities yet')).toBeInTheDocument();
    expect(screen.getByText(/Activities will appear here/)).toBeInTheDocument();
  });

  it('should render loading skeleton when loading', () => {
    mockUseActivityFeed.mockReturnValue({
      activities: [],
      groupedActivities: [],
      loading: true,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });
    
    render(<ActivityFeed />);
    
    // Should show loading state (skeleton elements)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render error state', () => {
    mockUseActivityFeed.mockReturnValue({
      activities: [],
      groupedActivities: [],
      loading: false,
      error: 'Failed to load activities',
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });
    
    render(<ActivityFeed />);
    
    expect(screen.getByText('Error loading activities')).toBeInTheDocument();
    expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should render grouped activities', () => {
    const mockActivities = [
      createMockActivity('1', 'garion', 'file', 'Created file'),
      createMockActivity('2', 'fury', 'web', 'Searched web'),
    ];

    mockUseActivityFeed.mockReturnValue({
      activities: mockActivities,
      groupedActivities: [{
        label: 'Today',
        date: new Date(),
        activities: mockActivities,
      }],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });
    
    render(<ActivityFeed />);
    
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getAllByText('Garion').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Created file')).toBeInTheDocument();
    expect(screen.getAllByText('Fury').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Searched web')).toBeInTheDocument();
  });

  it('should filter by actor when clicking actor chips', async () => {
    render(<ActivityFeed />);
    
    // Click on Garion filter
    const garionChip = screen.getByText('Garion');
    fireEvent.click(garionChip);
    
    // Should call useActivityFeed with updated filter
    await waitFor(() => {
      expect(mockUseActivityFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          initialFilter: expect.objectContaining({
            actors: ['garion'],
          }),
        })
      );
    });
  });

  it('should filter by category when clicking category chips', async () => {
    render(<ActivityFeed />);
    
    // Click on File filter
    const fileChip = screen.getByText('File');
    fireEvent.click(fileChip);
    
    // Should call useActivityFeed with updated filter
    await waitFor(() => {
      expect(mockUseActivityFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          initialFilter: expect.objectContaining({
            categories: ['file'],
          }),
        })
      );
    });
  });

  it('should update search query', async () => {
    render(<ActivityFeed />);
    
    const searchInput = screen.getByPlaceholderText('Search activities...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Should update filter with search query
    await waitFor(() => {
      expect(mockUseActivityFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          initialFilter: expect.objectContaining({
            searchQuery: 'test query',
          }),
        })
      );
    });
  });

  it('should clear filters when clicking clear button', async () => {
    render(<ActivityFeed />);
    
    // First apply a filter
    const garionChip = screen.getByText('Garion');
    fireEvent.click(garionChip);
    
    // Then clear filters
    await waitFor(() => {
      const clearButton = screen.getByText('Clear filters');
      fireEvent.click(clearButton);
    });
    
    // Should reset filter
    await waitFor(() => {
      expect(mockUseActivityFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          initialFilter: expect.not.objectContaining({
            actors: expect.anything(),
          }),
        })
      );
    });
  });

  it('should show load more button when hasMore is true', () => {
    const mockLoadMore = jest.fn();
    
    mockUseActivityFeed.mockReturnValue({
      activities: [createMockActivity('1', 'garion', 'file', 'Test')],
      groupedActivities: [{
        label: 'Today',
        date: new Date(),
        activities: [createMockActivity('1', 'garion', 'file', 'Test')],
      }],
      loading: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refresh: jest.fn(),
    });
    
    render(<ActivityFeed />);
    
    const loadMoreButton = screen.getByText('Load more');
    expect(loadMoreButton).toBeInTheDocument();
    
    fireEvent.click(loadMoreButton);
    expect(mockLoadMore).toHaveBeenCalled();
  });

  it('should call onActivityClick when activity is clicked', () => {
    const mockOnClick = jest.fn();
    const mockActivity = createMockActivity('1', 'garion', 'file', 'Created file');
    
    mockUseActivityFeed.mockReturnValue({
      activities: [mockActivity],
      groupedActivities: [{
        label: 'Today',
        date: new Date(),
        activities: [mockActivity],
      }],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });
    
    render(<ActivityFeed onActivityClick={mockOnClick} />);
    
    // Click on the activity
    const activityElement = screen.getByText('Created file').closest('.group');
    if (activityElement) {
      fireEvent.click(activityElement);
      expect(mockOnClick).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
        actor: 'garion',
      }));
    }
  });

  it('should hide filters when showFilters is false', () => {
    render(<ActivityFeed showFilters={false} />);
    
    // Search input should not be visible
    expect(screen.queryByPlaceholderText('Search activities...')).not.toBeInTheDocument();
    
    // Actor chips should not be visible
    expect(screen.queryByText('Actors:')).not.toBeInTheDocument();
  });

  it('should display activity metadata correctly', () => {
    const mockActivity: ActivityLog = {
      ...createMockActivity('1', 'garion', 'file', 'Updated file'),
      metadata: {
        filePath: '/memory/test.md',
        searchQuery: 'AI receptionist',
        url: 'https://example.com/page',
      },
    };
    
    mockUseActivityFeed.mockReturnValue({
      activities: [mockActivity],
      groupedActivities: [{
        label: 'Today',
        date: new Date(),
        activities: [mockActivity],
      }],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });
    
    render(<ActivityFeed />);
    
    // Should show file name from path
    expect(screen.getByText('test.md')).toBeInTheDocument();
  });

  it('should handle refresh button click in error state', () => {
    const mockRefresh = jest.fn();
    
    mockUseActivityFeed.mockReturnValue({
      activities: [],
      groupedActivities: [],
      loading: false,
      error: 'Failed to load',
      hasMore: false,
      loadMore: jest.fn(),
      refresh: mockRefresh,
    });
    
    render(<ActivityFeed />);
    
    const tryAgainButton = screen.getByText('Try again');
    fireEvent.click(tryAgainButton);
    
    expect(mockRefresh).toHaveBeenCalled();
  });
});
