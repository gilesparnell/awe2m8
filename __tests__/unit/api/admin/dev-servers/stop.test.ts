/**
 * @jest-environment node
 */

const originalEnv = process.env.NODE_ENV;

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

describe('POST /api/admin/dev-servers/stop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return 403 in production', async () => {
    process.env.NODE_ENV = 'production';
    const { POST } = require('@/app/api/admin/dev-servers/stop/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ pid: 12345, port: 3000 }),
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it('should return 400 if pid or port missing', async () => {
    const { POST } = require('@/app/api/admin/dev-servers/stop/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ pid: 12345 }),
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('pid and port');
  });

  it('should validate PID is still on expected port before killing', async () => {
    const { execSync } = require('child_process');

    execSync.mockImplementation((cmd: string) => {
      if (cmd.includes('lsof')) return ':3000';
      return '';
    });

    const { POST } = require('@/app/api/admin/dev-servers/stop/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ pid: 12345, port: 3000 }),
    });
    const response = await POST(req);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('kill'),
      expect.any(Object)
    );
  });

  it('should reject if PID is no longer on expected port', async () => {
    const { execSync } = require('child_process');

    execSync.mockImplementation((cmd: string) => {
      if (cmd.includes('lsof')) return ':5000'; // Different port
      return '';
    });

    const { POST } = require('@/app/api/admin/dev-servers/stop/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ pid: 12345, port: 3000 }),
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toContain('no longer');
  });
});
