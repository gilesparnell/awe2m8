/**
 * @jest-environment jsdom
 */

import {
  instrumentedRead,
  instrumentedWrite,
  instrumentedEdit,
  instrumentedWebSearch,
  instrumentedWebFetch,
  instrumentedExec,
  instrumentedAgentSpawn,
  useInstrumentedOperations,
} from '@/lib/instrumented-tools';

// Mock the activity logger
const mockLogFileRead = jest.fn();
const mockLogFileWrite = jest.fn();
const mockLogFileEdit = jest.fn();
const mockLogWebSearch = jest.fn();
const mockLogWebFetch = jest.fn();
const mockLogCommandExecution = jest.fn();
const mockLogAgentSpawn = jest.fn();

jest.mock('@/lib/activity-logger', () => ({
  logFileRead: (...args: any[]) => mockLogFileRead(...args),
  logFileWrite: (...args: any[]) => mockLogFileWrite(...args),
  logFileEdit: (...args: any[]) => mockLogFileEdit(...args),
  logWebSearch: (...args: any[]) => mockLogWebSearch(...args),
  logWebFetch: (...args: any[]) => mockLogWebFetch(...args),
  logCommandExecution: (...args: any[]) => mockLogCommandExecution(...args),
  logAgentSpawn: (...args: any[]) => mockLogAgentSpawn(...args),
}));

import { renderHook } from '@testing-library/react';

describe('Instrumented Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogFileRead.mockResolvedValue('activity-1');
    mockLogFileWrite.mockResolvedValue('activity-2');
    mockLogFileEdit.mockResolvedValue('activity-3');
    mockLogWebSearch.mockResolvedValue('activity-4');
    mockLogWebFetch.mockResolvedValue('activity-5');
    mockLogCommandExecution.mockResolvedValue('activity-6');
    mockLogAgentSpawn.mockResolvedValue('activity-7');
  });

  describe('instrumentedRead', () => {
    it('should read file and log activity', async () => {
      const readFn = jest.fn().mockResolvedValue('file content');
      
      const result = await instrumentedRead(readFn, '/path/to/file.ts', 'garion');
      
      expect(result).toBe('file content');
      expect(readFn).toHaveBeenCalled();
      expect(mockLogFileRead).toHaveBeenCalledWith('/path/to/file.ts', 'garion', { size: 12 });
    });

    it('should use default actor if not specified', async () => {
      const readFn = jest.fn().mockResolvedValue('content');
      
      await instrumentedRead(readFn, '/path/file.ts');
      
      expect(mockLogFileRead).toHaveBeenCalledWith('/path/file.ts', 'garion', { size: 7 });
    });

    it('should pass custom actor to logger', async () => {
      const readFn = jest.fn().mockResolvedValue('content');
      
      await instrumentedRead(readFn, '/path/file.ts', 'fury');
      
      expect(mockLogFileRead).toHaveBeenCalledWith('/path/file.ts', 'fury', { size: 7 });
    });
  });

  describe('instrumentedWrite', () => {
    it('should write file and log activity', async () => {
      const writeFn = jest.fn().mockResolvedValue(undefined);
      
      await instrumentedWrite(writeFn, '/path/to/file.ts', 'new content', 'garion');
      
      expect(writeFn).toHaveBeenCalled();
      expect(mockLogFileWrite).toHaveBeenCalledWith('/path/to/file.ts', 'garion', { size: 11 });
    });

    it('should throw if write fails', async () => {
      const writeFn = jest.fn().mockRejectedValue(new Error('Write failed'));
      
      await expect(instrumentedWrite(writeFn, '/path/file.ts', 'content')).rejects.toThrow('Write failed');
      expect(mockLogFileWrite).not.toHaveBeenCalled();
    });
  });

  describe('instrumentedEdit', () => {
    it('should edit file and log activity', async () => {
      const editFn = jest.fn().mockResolvedValue(undefined);
      
      await instrumentedEdit(editFn, '/path/to/file.ts', 'garion');
      
      expect(editFn).toHaveBeenCalled();
      expect(mockLogFileEdit).toHaveBeenCalledWith('/path/to/file.ts', 'garion');
    });
  });

  describe('instrumentedWebSearch', () => {
    it('should search and log activity', async () => {
      const searchFn = jest.fn().mockResolvedValue(['result1', 'result2', 'result3']);
      
      const results = await instrumentedWebSearch(searchFn, 'test query', 'garion');
      
      expect(results).toHaveLength(3);
      expect(mockLogWebSearch).toHaveBeenCalledWith('test query', 3, 'garion');
    });

    it('should count single result as 1', async () => {
      const searchFn = jest.fn().mockResolvedValue({ data: 'single result' });
      
      await instrumentedWebSearch(searchFn, 'query');
      
      expect(mockLogWebSearch).toHaveBeenCalledWith('query', 1, 'garion');
    });
  });

  describe('instrumentedWebFetch', () => {
    it('should fetch and log activity', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ html: '<html></html>' });
      
      const result = await instrumentedWebFetch(fetchFn, 'https://example.com', 'loki');
      
      expect(result.html).toBe('<html></html>');
      expect(mockLogWebFetch).toHaveBeenCalledWith('https://example.com', 'loki');
    });
  });

  describe('instrumentedExec', () => {
    it('should execute command and log with exit code 0', async () => {
      const execFn = jest.fn().mockResolvedValue({
        stdout: 'success output',
        stderr: '',
        exitCode: 0,
      });
      
      const result = await instrumentedExec(execFn, 'npm test', 'garion');
      
      expect(result.exitCode).toBe(0);
      expect(mockLogCommandExecution).toHaveBeenCalledWith(
        'npm test',
        0,
        'garion',
        expect.objectContaining({
          stdout: 'success output',
        })
      );
    });

    it('should log failed commands with non-zero exit code', async () => {
      const execFn = jest.fn().mockResolvedValue({
        stdout: '',
        stderr: 'error message',
        exitCode: 1,
      });
      
      await instrumentedExec(execFn, 'npm test');
      
      expect(mockLogCommandExecution).toHaveBeenCalledWith(
        'npm test',
        1,
        'garion',
        expect.objectContaining({
          stderr: 'error message',
        })
      );
    });
  });

  describe('instrumentedAgentSpawn', () => {
    it('should spawn agent and log activity', async () => {
      const spawnFn = jest.fn().mockResolvedValue({ id: 'subagent-123' });
      
      const result = await instrumentedAgentSpawn(spawnFn, 'fury', 'Research task', 'garion');
      
      expect(result.id).toBe('subagent-123');
      expect(mockLogAgentSpawn).toHaveBeenCalledWith('fury', 'Research task', 'garion');
    });
  });

  describe('useInstrumentedOperations', () => {
    it('should return all instrumented functions', () => {
      const { result } = renderHook(() => useInstrumentedOperations());

      expect(result.current.readFile).toBeDefined();
      expect(result.current.writeFile).toBeDefined();
      expect(result.current.editFile).toBeDefined();
      expect(result.current.webSearch).toBeDefined();
      expect(result.current.webFetch).toBeDefined();
      expect(result.current.runCommand).toBeDefined();
      expect(result.current.spawnAgent).toBeDefined();
    });

    it('should use custom actor when provided', async () => {
      const { result } = renderHook(() =>
        useInstrumentedOperations({ actor: 'friday' })
      );

      const readFn = jest.fn().mockResolvedValue('content');
      await result.current.readFile('/path/file.ts', readFn);

      expect(mockLogFileRead).toHaveBeenCalledWith('/path/file.ts', 'friday', { size: 7 });
    });
  });
});
