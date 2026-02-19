/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateTask, CreateTaskInput } from '@/hooks/useAgents';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  Timestamp: {
    now: () => ({ 
      seconds: 1234567890, 
      nanoseconds: 0,
      toDate: () => new Date(),
    }),
  },
}));

describe('useCreateTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockCollection.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockAddDoc.mockResolvedValue({ id: 'new-task-123' });
    mockGetDoc.mockResolvedValue({
      data: () => ({ workload: 2 }),
    });
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useCreateTask());

    expect(result.current.creating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.createTask).toBe('function');
  });

  it('should create a task successfully', async () => {
    const { result } = renderHook(() => useCreateTask());

    const input: CreateTaskInput = {
      title: 'Test Task',
      description: 'Test description',
      agentId: 'fury',
      priority: 'P1',
      estimatedHours: 4,
      clientName: 'Test Client',
    };

    let taskId: string | null = null;
    
    await act(async () => {
      taskId = await result.current.createTask(input, 'Fury');
    });

    expect(taskId).toBe('new-task-123');
    expect(result.current.creating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set creating state during task creation', async () => {
    const { result } = renderHook(() => useCreateTask());

    // Delay the resolution to check loading state
    mockAddDoc.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ id: 'task-123' }), 100);
    }));

    const input: CreateTaskInput = {
      title: 'Test Task',
      agentId: 'fury',
      priority: 'P2',
    };

    act(() => {
      result.current.createTask(input, 'Fury');
    });

    // Should be loading immediately
    expect(result.current.creating).toBe(true);

    await waitFor(() => {
      expect(result.current.creating).toBe(false);
    });
  });

  it('should create task document with correct data', async () => {
    const { result } = renderHook(() => useCreateTask());

    const input: CreateTaskInput = {
      title: 'Research Competitors',
      description: 'Analyze top 3 competitors',
      agentId: 'fury',
      priority: 'P0',
      estimatedHours: 6,
      clientName: 'Sunset Plumbing',
    };

    await act(async () => {
      await result.current.createTask(input, 'Fury');
    });

    expect(mockAddDoc).toHaveBeenCalledWith(
      {}, // collection ref
      expect.objectContaining({
        title: 'Research Competitors',
        description: 'Analyze top 3 competitors',
        agentId: 'fury',
        status: 'inbox',
        priority: 'P0',
        estimatedHours: 6,
        clientName: 'Sunset Plumbing',
        progressPercent: 0,
        currentPhase: 'research',
        blockers: [],
        nextActions: [],
      })
    );
  });

  it('should create initial log entry', async () => {
    const { result } = renderHook(() => useCreateTask());

    const input: CreateTaskInput = {
      title: 'Test Task',
      agentId: 'friday',
      priority: 'P1',
    };

    await act(async () => {
      await result.current.createTask(input, 'Friday');
    });

    // Should create log in task's logs subcollection
    expect(mockCollection).toHaveBeenCalledWith({}, 'tasks', 'new-task-123', 'logs');
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        agentId: 'friday',
        agentName: 'Friday',
        type: 'milestone',
        message: 'Task created: Test Task',
      })
    );
  });

  it('should create activity entry', async () => {
    const { result } = renderHook(() => useCreateTask());

    const input: CreateTaskInput = {
      title: 'Test Task',
      agentId: 'loki',
      priority: 'P2',
    };

    await act(async () => {
      await result.current.createTask(input, 'Loki');
    });

    // Should create activity in activities collection
    expect(mockCollection).toHaveBeenCalledWith({}, 'activities');
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actor: 'loki',
        actorType: 'subagent',
        category: 'task',
        action: 'create',
        description: 'Created task: Test Task',
      })
    );
  });

  it('should update agent workload', async () => {
    const { result } = renderHook(() => useCreateTask());

    const input: CreateTaskInput = {
      title: 'Test Task',
      agentId: 'fury',
      priority: 'P1',
    };

    await act(async () => {
      await result.current.createTask(input, 'Fury');
    });

    expect(mockDoc).toHaveBeenCalledWith({}, 'agents', 'fury');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        workload: expect.any(Number),
      })
    );
  });

  it('should use default values for optional fields', async () => {
    const { result } = renderHook(() => useCreateTask());

    const input: CreateTaskInput = {
      title: 'Minimal Task',
      agentId: 'fury',
      priority: 'P2',
    };

    await act(async () => {
      await result.current.createTask(input, 'Fury');
    });

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        description: '',
        estimatedHours: 0,
        clientId: null,
        clientName: 'Internal',
      })
    );
  });

  it('should handle creation errors', async () => {
    mockAddDoc.mockRejectedValueOnce(new Error('Firestore error'));

    const { result } = renderHook(() => useCreateTask());

    const input: CreateTaskInput = {
      title: 'Test Task',
      agentId: 'fury',
      priority: 'P1',
    };

    let taskId: string | null = 'should-be-null';
    
    await act(async () => {
      taskId = await result.current.createTask(input, 'Fury');
    });

    expect(taskId).toBeNull();
    expect(result.current.error).toBe('Failed to create task');
    expect(result.current.creating).toBe(false);
  });

  it('should clear error on new creation attempt', async () => {
    mockAddDoc
      .mockRejectedValueOnce(new Error('Firestore error'))
      .mockResolvedValueOnce({ id: 'task-123' });

    const { result } = renderHook(() => useCreateTask());

    const input: CreateTaskInput = {
      title: 'Test Task',
      agentId: 'fury',
      priority: 'P1',
    };

    // First attempt fails
    await act(async () => {
      await result.current.createTask(input, 'Fury');
    });

    expect(result.current.error).toBe('Failed to create task');

    // Second attempt should clear error
    await act(async () => {
      await result.current.createTask(input, 'Fury');
    });

    expect(result.current.error).toBeNull();
  });
});
