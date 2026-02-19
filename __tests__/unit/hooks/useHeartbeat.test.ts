/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useHeartbeat } from '@/hooks/useHeartbeat';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('useHeartbeat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not send heartbeat when agentId is null', () => {
    renderHook(() => useHeartbeat(null));
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should send initial heartbeat on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    renderHook(() => useHeartbeat('fury'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/agents/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentId: 'fury' }),
    });
  });

  it('should send heartbeat every 30 seconds', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    renderHook(() => useHeartbeat('fury'));

    // Initial heartbeat
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Advance 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Advance another 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  it('should handle heartbeat failure gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderHook(() => useHeartbeat('fury'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Should log warning but not throw
    expect(consoleSpy).toHaveBeenCalledWith('Heartbeat error:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should handle non-ok response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    renderHook(() => useHeartbeat('fury'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Should continue operating despite error
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should stop sending heartbeat on unmount', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { unmount } = renderHook(() => useHeartbeat('fury'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Advance time after unmount
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should not have sent more heartbeats
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should update agentId when prop changes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { rerender } = renderHook(
      ({ agentId }) => useHeartbeat(agentId),
      { initialProps: { agentId: 'fury' } }
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/agents/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId: 'fury' }),
      });
    });

    // Change agentId
    rerender({ agentId: 'friday' });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/agents/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId: 'friday' }),
      });
    });
  });
});
