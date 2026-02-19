/**
 * @jest-environment node
 */

import {
  ActivityActor,
  ActivityCategory,
  ActivityAction,
  ActivityLog,
  ActivityMetadata,
  isActivityActor,
  isActivityCategory,
  isActivityAction,
  isActivityLog,
  ACTIVITY_ICONS,
  ACTOR_COLORS,
  ACTOR_LABELS,
} from '@/types/activity';
import { Timestamp } from 'firebase/firestore';

describe('Activity Types', () => {
  describe('Type Guards', () => {
    describe('isActivityActor', () => {
      it('should return true for valid actors', () => {
        expect(isActivityActor('garion')).toBe(true);
        expect(isActivityActor('fury')).toBe(true);
        expect(isActivityActor('friday')).toBe(true);
        expect(isActivityActor('loki')).toBe(true);
        expect(isActivityActor('system')).toBe(true);
      });

      it('should return false for invalid actors', () => {
        expect(isActivityActor('invalid')).toBe(false);
        expect(isActivityActor('')).toBe(false);
        expect(isActivityActor(null)).toBe(false);
        expect(isActivityActor(undefined)).toBe(false);
        expect(isActivityActor(123)).toBe(false);
        expect(isActivityActor({})).toBe(false);
      });
    });

    describe('isActivityCategory', () => {
      it('should return true for valid categories', () => {
        expect(isActivityCategory('file')).toBe(true);
        expect(isActivityCategory('web')).toBe(true);
        expect(isActivityCategory('tool')).toBe(true);
        expect(isActivityCategory('agent')).toBe(true);
        expect(isActivityCategory('communication')).toBe(true);
        expect(isActivityCategory('system')).toBe(true);
        expect(isActivityCategory('task')).toBe(true);
      });

      it('should return false for invalid categories', () => {
        expect(isActivityCategory('invalid')).toBe(false);
        expect(isActivityCategory('')).toBe(false);
        expect(isActivityCategory(null)).toBe(false);
        expect(isActivityCategory(undefined)).toBe(false);
      });
    });

    describe('isActivityAction', () => {
      it('should return true for valid actions', () => {
        expect(isActivityAction('read')).toBe(true);
        expect(isActivityAction('write')).toBe(true);
        expect(isActivityAction('search')).toBe(true);
        expect(isActivityAction('spawn')).toBe(true);
        expect(isActivityAction('complete')).toBe(true);
      });

      it('should return false for invalid actions', () => {
        expect(isActivityAction('invalid')).toBe(false);
        expect(isActivityAction('')).toBe(false);
        expect(isActivityAction(null)).toBe(false);
        expect(isActivityAction(undefined)).toBe(false);
      });
    });

    describe('isActivityLog', () => {
      it('should return true for valid activity log', () => {
        const mockTimestamp = { seconds: 1234567890, nanoseconds: 0 } as Timestamp;
        const validLog: ActivityLog = {
          id: 'test-id',
          timestamp: mockTimestamp,
          actor: 'garion',
          actorType: 'main',
          category: 'file',
          action: 'write',
          description: 'Test activity',
          metadata: {},
          sessionId: 'session-123',
        };
        expect(isActivityLog(validLog)).toBe(true);
      });

      it('should return false for invalid activity log', () => {
        expect(isActivityLog(null)).toBe(false);
        expect(isActivityLog(undefined)).toBe(false);
        expect(isActivityLog('string')).toBe(false);
        expect(isActivityLog(123)).toBe(false);
        expect(isActivityLog({})).toBe(false);
        expect(isActivityLog({ id: 'test' })).toBe(false); // Missing required fields
      });
    });
  });

  describe('Constants', () => {
    describe('ACTIVITY_ICONS', () => {
      it('should have icons for all categories', () => {
        const categories: ActivityCategory[] = ['file', 'web', 'tool', 'agent', 'communication', 'system', 'task'];
        categories.forEach((cat) => {
          expect(ACTIVITY_ICONS[cat]).toBeDefined();
          expect(typeof ACTIVITY_ICONS[cat]).toBe('string');
        });
      });
    });

    describe('ACTOR_COLORS', () => {
      it('should have colors for all actors', () => {
        const actors: ActivityActor[] = ['garion', 'fury', 'friday', 'loki', 'system'];
        actors.forEach((actor) => {
          expect(ACTOR_COLORS[actor]).toBeDefined();
          expect(typeof ACTOR_COLORS[actor]).toBe('string');
        });
      });

      it('should have correct color assignments', () => {
        expect(ACTOR_COLORS.garion).toBe('purple');
        expect(ACTOR_COLORS.fury).toBe('green');
        expect(ACTOR_COLORS.friday).toBe('blue');
        expect(ACTOR_COLORS.loki).toBe('amber');
        expect(ACTOR_COLORS.system).toBe('gray');
      });
    });

    describe('ACTOR_LABELS', () => {
      it('should have labels for all actors', () => {
        const actors: ActivityActor[] = ['garion', 'fury', 'friday', 'loki', 'system'];
        actors.forEach((actor) => {
          expect(ACTOR_LABELS[actor]).toBeDefined();
          expect(typeof ACTOR_LABELS[actor]).toBe('string');
        });
      });

      it('should have correct label assignments', () => {
        expect(ACTOR_LABELS.garion).toBe('Garion');
        expect(ACTOR_LABELS.fury).toBe('Fury');
        expect(ACTOR_LABELS.friday).toBe('Friday');
        expect(ACTOR_LABELS.loki).toBe('Loki');
        expect(ACTOR_LABELS.system).toBe('System');
      });
    });
  });

  describe('ActivityLog Interface', () => {
    it('should accept valid activity log structure', () => {
      const mockTimestamp = { seconds: 1234567890, nanoseconds: 0 } as Timestamp;
      
      const log: ActivityLog = {
        id: 'activity-123',
        timestamp: mockTimestamp,
        actor: 'garion',
        actorType: 'main',
        category: 'file',
        action: 'write',
        description: 'Created new file',
        metadata: {
          filePath: '/test/file.txt',
          fileSize: 1024,
        },
        sessionId: 'session-abc',
        taskId: 'task-123',
        project: 'awe2m8',
      };

      expect(log.id).toBe('activity-123');
      expect(log.actor).toBe('garion');
      expect(log.metadata.filePath).toBe('/test/file.txt');
    });

    it('should work with minimal metadata', () => {
      const mockTimestamp = { seconds: 1234567890, nanoseconds: 0 } as Timestamp;
      
      const log: ActivityLog = {
        id: 'activity-456',
        timestamp: mockTimestamp,
        actor: 'fury',
        actorType: 'subagent',
        category: 'web',
        action: 'search',
        description: 'Searched for competitors',
        metadata: {},
        sessionId: 'session-def',
      };

      expect(log.metadata).toEqual({});
    });
  });

  describe('ActivityMetadata Interface', () => {
    it('should support all metadata fields', () => {
      const metadata: ActivityMetadata = {
        filePath: '/path/to/file.md',
        fileSize: 2048,
        url: 'https://example.com',
        searchQuery: 'AI receptionist',
        resultCount: 10,
        toolName: 'web_search',
        command: 'npm test',
        exitCode: 0,
        targetAgent: 'friday',
        taskTitle: 'Build workflow',
        recipient: 'user@example.com',
        channel: 'email',
        duration: 5000,
        success: true,
        errorMessage: undefined,
        context: { extra: 'data' },
      };

      expect(metadata).toBeDefined();
      expect(Object.keys(metadata).length).toBe(16);
    });
  });
});
