/**
 * @jest-environment jsdom
 */

import { logActivity, logFileRead, logFileWrite, logFileEdit, logWebSearch, logWebFetch, logCommandExecution, logAgentSpawn, logMessageSent, logTaskCreated, logTaskCompleted } from '@/lib/activity-logger';

// Mock Firebase
const mockAddDoc = jest.fn();
const mockCollection = jest.fn();

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  Timestamp: {
    now: () => ({ 
      seconds: 1234567890, 
      nanoseconds: 0,
      toDate: () => new Date(),
    }),
  },
}));

describe('Activity Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue({});
    mockAddDoc.mockResolvedValue({ id: 'activity-123' });
  });

  describe('logActivity', () => {
    it('should log a basic activity', async () => {
      const activityId = await logActivity({
        actor: 'garion',
        actorType: 'main',
        category: 'file',
        action: 'read',
        description: 'Test activity',
      });

      expect(activityId).toBe('activity-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          actor: 'garion',
          category: 'file',
          action: 'read',
          description: 'Test activity',
          timestamp: expect.any(Object),
          sessionId: 'unknown',
        })
      );
    });

    it('should include custom sessionId when provided', async () => {
      await logActivity({
        actor: 'barak',
        actorType: 'subagent',
        category: 'web',
        action: 'search',
        description: 'Test search',
        sessionId: 'test-session-123',
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          sessionId: 'test-session-123',
        })
      );
    });

    it('should include metadata when provided', async () => {
      await logActivity({
        actor: 'garion',
        actorType: 'main',
        category: 'file',
        action: 'write',
        description: 'Wrote file',
        metadata: { filePath: '/test/file.ts', lines: 100 },
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          metadata: { filePath: '/test/file.ts', lines: 100 },
        })
      );
    });

    it('should include taskId when provided', async () => {
      await logActivity({
        actor: 'silk',
        actorType: 'subagent',
        category: 'task',
        action: 'create',
        description: 'Created task',
        taskId: 'task-123',
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          taskId: 'task-123',
        })
      );
    });

    it('should handle Firestore errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAddDoc.mockRejectedValueOnce(new Error('Firestore error'));

      const activityId = await logActivity({
        actor: 'garion',
        actorType: 'main',
        category: 'file',
        action: 'read',
        description: 'Test activity',
      });

      expect(activityId).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not throw when logging fails', async () => {
      mockAddDoc.mockRejectedValueOnce(new Error('Network error'));

      await expect(logActivity({
        actor: 'garion',
        actorType: 'main',
        category: 'file',
        action: 'read',
        description: 'Test activity',
      })).resolves.not.toThrow();
    });
  });

  describe('logFileRead', () => {
    it('should log file read with correct category and action', async () => {
      await logFileRead('/path/to/file.ts', 'garion');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          category: 'file',
          action: 'read',
          description: 'Read file: /path/to/file.ts',
          metadata: expect.objectContaining({ filePath: '/path/to/file.ts' }),
        })
      );
    });

    it('should use garion as default actor', async () => {
      await logFileRead('/path/to/file.ts');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          actor: 'garion',
          actorType: 'main',
        })
      );
    });

    it('should include additional metadata', async () => {
      await logFileRead('/path/to/file.ts', 'garion', { size: 1024 });

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          metadata: expect.objectContaining({ filePath: '/path/to/file.ts', size: 1024 }),
        })
      );
    });
  });

  describe('logFileWrite', () => {
    it('should log file write with correct category and action', async () => {
      await logFileWrite('/path/to/file.ts', 'barak');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          actor: 'barak',
          actorType: 'subagent',
          category: 'file',
          action: 'write',
          description: 'Wrote file: /path/to/file.ts',
        })
      );
    });
  });

  describe('logFileEdit', () => {
    it('should log file edit with correct category and action', async () => {
      await logFileEdit('/path/to/file.ts', 'silk');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          actor: 'silk',
          actorType: 'subagent',
          category: 'file',
          action: 'edit',
          description: 'Edited file: /path/to/file.ts',
        })
      );
    });
  });

  describe('logWebSearch', () => {
    it('should log web search with query and result count', async () => {
      await logWebSearch('AI receptionist pricing', 10, 'garion');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          category: 'web',
          action: 'search',
          description: 'Searched web: "AI receptionist pricing" (10 results)',
          metadata: expect.objectContaining({ query: 'AI receptionist pricing', resultCount: 10 }),
        })
      );
    });
  });

  describe('logWebFetch', () => {
    it('should log web fetch with URL', async () => {
      await logWebFetch('https://example.com', 'polgara');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          actor: 'polgara',
          actorType: 'subagent',
          category: 'web',
          action: 'fetch',
          description: 'Fetched URL: https://example.com',
          metadata: expect.objectContaining({ url: 'https://example.com' }),
        })
      );
    });
  });

  describe('logCommandExecution', () => {
    it('should log command with exit code', async () => {
      await logCommandExecution('npm run build', 0, 'garion');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          category: 'tool',
          action: 'run',
          description: 'Executed: npm',
          metadata: expect.objectContaining({ 
            command: 'npm run build', 
            exitCode: 0, 
            success: true 
          }),
        })
      );
    });

    it('should mark success as false for non-zero exit code', async () => {
      await logCommandExecution('npm run build', 1, 'garion');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          metadata: expect.objectContaining({ 
            exitCode: 1, 
            success: false 
          }),
        })
      );
    });
  });

  describe('logAgentSpawn', () => {
    it('should log agent spawn with target and task', async () => {
      await logAgentSpawn('barak', 'Research competitors', 'garion');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          actor: 'garion',
          actorType: 'main',
          category: 'agent',
          action: 'spawn',
          description: 'Spawned barak for: Research competitors',
          metadata: expect.objectContaining({ targetAgent: 'barak', task: 'Research competitors' }),
        })
      );
    });
  });

  describe('logMessageSent', () => {
    it('should log message with channel and recipient', async () => {
      await logMessageSent('whatsapp', 'Jesse', 'garion');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          category: 'communication',
          action: 'send',
          description: 'Sent message to Jesse via whatsapp',
          metadata: expect.objectContaining({ channel: 'whatsapp', recipient: 'Jesse' }),
        })
      );
    });
  });

  describe('logTaskCreated', () => {
    it('should log task creation with title and ID', async () => {
      await logTaskCreated('Build feature', 'task-123', 'silk');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          actor: 'silk',
          actorType: 'subagent',
          category: 'task',
          action: 'create',
          description: 'Created task: Build feature',
          taskId: 'task-123',
          metadata: expect.objectContaining({ taskTitle: 'Build feature' }),
        })
      );
    });
  });

  describe('logTaskCompleted', () => {
    it('should log task completion with title and ID', async () => {
      await logTaskCompleted('Build feature', 'task-123', 'garion');

      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          actor: 'garion',
          actorType: 'main',
          category: 'task',
          action: 'complete',
          description: 'Completed task: Build feature',
          taskId: 'task-123',
          metadata: expect.objectContaining({ taskTitle: 'Build feature' }),
        })
      );
    });
  });
});
