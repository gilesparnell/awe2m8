/**
 * useCostTracking.test.ts
 * 
 * Unit tests for cost tracking hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useCostTracking } from '@/hooks/useCostTracking';
import { db } from '@/lib/firebase';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
}));

import { onSnapshot, Timestamp } from 'firebase/firestore';

describe('useCostTracking', () => {
  const mockActivities = [
    { id: '1', cost: 5.50, timestamp: Timestamp.fromDate(new Date()), agentId: 'garion' },
    { id: '2', cost: 3.25, timestamp: Timestamp.fromDate(new Date()), agentId: 'silk' },
    { id: '3', cost: 0, timestamp: Timestamp.fromDate(new Date()), agentId: 'garion' }, // no cost
    { id: '4', cost: 10.00, timestamp: Timestamp.fromDate(new Date()), agentId: 'barak' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate total cost for today', async () => {
    (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
      callback({
        docs: mockActivities.map(a => ({
          id: a.id,
          data: () => a,
        })),
      });
      return jest.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useCostTracking());

    await waitFor(() => {
      expect(result.current.todayCost).toBe(18.75);
    });
  });

  it('should calculate cost by agent', async () => {
    (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
      callback({
        docs: mockActivities.map(a => ({
          id: a.id,
          data: () => a,
        })),
      });
      return jest.fn();
    });

    const { result } = renderHook(() => useCostTracking());

    await waitFor(() => {
      expect(result.current.costByAgent).toEqual({
        garion: 5.50,
        silk: 3.25,
        barak: 10.00,
      });
    });
  });

  it('should handle activities without cost field', async () => {
    const activitiesWithoutCost = [
      { id: '1', timestamp: Timestamp.fromDate(new Date()), agentId: 'garion' },
      { id: '2', cost: 5.00, timestamp: Timestamp.fromDate(new Date()), agentId: 'silk' },
    ];

    (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
      callback({
        docs: activitiesWithoutCost.map(a => ({
          id: a.id,
          data: () => a,
        })),
      });
      return jest.fn();
    });

    const { result } = renderHook(() => useCostTracking());

    await waitFor(() => {
      expect(result.current.todayCost).toBe(5.00);
    });
  });

  it('should return loading state initially', () => {
    (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useCostTracking());

    expect(result.current.loading).toBe(true);
  });

  it('should return error when Firebase fails', async () => {
    (onSnapshot as jest.Mock).mockImplementation((q, callback, errorCallback) => {
      errorCallback?.(new Error('Firebase error'));
      return jest.fn();
    });

    const { result } = renderHook(() => useCostTracking());

    await waitFor(() => {
      expect(result.current.error).toBe('Firebase error');
      expect(result.current.loading).toBe(false);
    });
  });
});
