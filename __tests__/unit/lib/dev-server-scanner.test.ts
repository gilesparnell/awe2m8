/**
 * @jest-environment node
 */

import { parseLsofOutput, resolveAppName, getRunningServers } from '@/lib/dev-server-scanner';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('dev-server-scanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseLsofOutput', () => {
    it('should parse standard lsof output into server entries', () => {
      const lsofOutput = [
        'COMMAND   PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME',
        'node    12345 giles   23u  IPv6 0x1234567890      0t0  TCP *:3000 (LISTEN)',
        'node    12346 giles   24u  IPv6 0x1234567891      0t0  TCP *:5173 (LISTEN)',
      ].join('\n');

      const result = parseLsofOutput(lsofOutput);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        command: 'node',
        pid: 12345,
        port: 3000,
      });
      expect(result[1]).toEqual({
        command: 'node',
        pid: 12346,
        port: 5173,
      });
    });

    it('should handle empty lsof output', () => {
      const result = parseLsofOutput('');
      expect(result).toEqual([]);
    });

    it('should handle header-only output', () => {
      const lsofOutput = 'COMMAND   PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME';
      const result = parseLsofOutput(lsofOutput);
      expect(result).toEqual([]);
    });

    it('should deduplicate entries with same PID and port', () => {
      const lsofOutput = [
        'COMMAND   PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME',
        'node    12345 giles   23u  IPv4 0x1234567890      0t0  TCP *:3000 (LISTEN)',
        'node    12345 giles   24u  IPv6 0x1234567891      0t0  TCP *:3000 (LISTEN)',
      ].join('\n');

      const result = parseLsofOutput(lsofOutput);
      expect(result).toHaveLength(1);
      expect(result[0].pid).toBe(12345);
    });

    it('should handle non-standard commands (python, ruby)', () => {
      const lsofOutput = [
        'COMMAND   PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME',
        'python3 99999 giles   5u  IPv4 0x1234567890      0t0  TCP *:8000 (LISTEN)',
      ].join('\n');

      const result = parseLsofOutput(lsofOutput);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        command: 'python3',
        pid: 99999,
        port: 8000,
      });
    });

    it('should handle localhost-bound ports (127.0.0.1:PORT)', () => {
      const lsofOutput = [
        'COMMAND   PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME',
        'node    12345 giles   23u  IPv4 0x1234567890      0t0  TCP 127.0.0.1:3000 (LISTEN)',
      ].join('\n');

      const result = parseLsofOutput(lsofOutput);
      expect(result).toHaveLength(1);
      expect(result[0].port).toBe(3000);
    });
  });

  describe('resolveAppName', () => {
    it('should resolve name from package.json in cwd', () => {
      mockExecSync.mockReturnValue('n/Users/giles/projects/my-app\n');
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ name: 'my-cool-app' }));

      const name = resolveAppName(12345);
      expect(name).toBe('my-cool-app');
    });

    it('should fallback to command name when no package.json exists', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (typeof cmd === 'string' && cmd.includes('lsof')) {
          return Buffer.from('p12345\ncnode\nf4\n');
        }
        // pwdx / proc fallback
        throw new Error('not found');
      });
      mockExistsSync.mockReturnValue(false);

      const name = resolveAppName(12345, 'node');
      expect(name).toBe('node');
    });

    it('should fallback gracefully when lsof/ps fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const name = resolveAppName(12345, 'node');
      expect(name).toBe('node');
    });

    it('should handle malformed package.json', () => {
      mockExecSync.mockReturnValue(Buffer.from('/Users/giles/projects/my-app\n'));
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('not json');

      const name = resolveAppName(12345, 'node');
      expect(name).toBe('node');
    });
  });

  describe('getRunningServers', () => {
    it('should return running servers with resolved names', () => {
      // Mock lsof for port scanning
      mockExecSync.mockImplementation((cmd: string) => {
        if (typeof cmd === 'string' && cmd.includes('lsof') && cmd.includes('-iTCP')) {
          return Buffer.from([
            'COMMAND   PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME',
            'node    12345 giles   23u  IPv6 0x1234567890      0t0  TCP *:3000 (LISTEN)',
          ].join('\n'));
        }
        if (typeof cmd === 'string' && cmd.includes('lsof') && cmd.includes('-p')) {
          return Buffer.from('p12345\ncnode\nfcwd\nn/Users/giles/my-app\n');
        }
        return Buffer.from('');
      });
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ name: 'allconvos' }));

      const servers = getRunningServers();

      expect(servers).toHaveLength(1);
      expect(servers[0]).toMatchObject({
        port: 3000,
        pid: 12345,
        status: 'running',
        source: 'detected',
        url: 'http://localhost:3000',
      });
    });

    it('should return empty array when lsof fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('lsof not found');
      });

      const servers = getRunningServers();
      expect(servers).toEqual([]);
    });

    it('should filter to only known dev ports', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (typeof cmd === 'string' && cmd.includes('lsof') && cmd.includes('-iTCP')) {
          return Buffer.from([
            'COMMAND   PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME',
            'node    12345 giles   23u  IPv6 0x123      0t0  TCP *:3000 (LISTEN)',
            'postgres 9999 giles  10u  IPv4 0x456      0t0  TCP *:5432 (LISTEN)',
          ].join('\n'));
        }
        return Buffer.from('');
      });
      mockExistsSync.mockReturnValue(false);

      const servers = getRunningServers();
      // 5432 is not in DEV_PORTS, so only 3000 should appear
      expect(servers).toHaveLength(1);
      expect(servers[0].port).toBe(3000);
    });
  });
});
