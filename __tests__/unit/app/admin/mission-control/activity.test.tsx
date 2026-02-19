/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActivityPage from '@/app/admin/mission-control/activity/page';
import { useActivityStats } from '@/hooks/useActivityFeed';

// Mock the components and hooks
jest.mock('@/components/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed">Activity Feed Component</div>,
}));

const mockUseActivityStats = jest.fn();
jest.mock('@/hooks/useActivityFeed', () => ({
  useActivityStats: (...args: any[]) => mockUseActivityStats(...args),
  useActivityFeed: () => ({
    activities: [],
    groupedActivities: [],
    loading: false,
    error: null,
    hasMore: false,
    loadMore: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('ActivityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseActivityStats.mockReturnValue({
      total: 42,
      byActor: {
        garion: 20,
        fury: 10,
        friday: 8,
        loki: 4,
        system: 0,
      },
      byCategory: {},
      loading: false,
      error: null,
    });
  });

  it('should render page title and description', () => {
    render(<ActivityPage />);
    
    expect(screen.getByText('All Activities')).toBeInTheDocument();
    expect(screen.getByText(/Complete history of everything/)).toBeInTheDocument();
  });

  it('should render back link to Mission Control', () => {
    render(<ActivityPage />);
    
    const backLink = screen.getByText('Back to Mission Control');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/admin/mission-control');
  });

  it('should render activity feed component', () => {
    render(<ActivityPage />);
    
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
  });

  it('should render stats cards with correct values', () => {
    render(<ActivityPage />);
    
    expect(screen.getByText('Total (7 days)')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    
    expect(screen.getByText('Garion')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    
    expect(screen.getByText('Fury')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    
    expect(screen.getByText('Loki')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render export button', () => {
    render(<ActivityPage />);
    
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should handle loading state for stats', () => {
    mockUseActivityStats.mockReturnValue({
      total: 0,
      byActor: {},
      byCategory: {},
      loading: true,
      error: null,
    });
    
    render(<ActivityPage />);
    
    // Should show 0 while loading
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('should handle empty stats gracefully', () => {
    mockUseActivityStats.mockReturnValue({
      total: 0,
      byActor: {},
      byCategory: {},
      loading: false,
      error: null,
    });
    
    render(<ActivityPage />);
    
    // Should show 0 values for all stat cards
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBe(6); // Total + 5 actors
  });
});
