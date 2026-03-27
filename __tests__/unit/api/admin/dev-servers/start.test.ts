/**
 * @jest-environment node
 */

const originalEnv = process.env.NODE_ENV;

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('POST /api/admin/dev-servers/start', () => {
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
    const { POST } = require('@/app/api/admin/dev-servers/start/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'App', cwd: '/tmp', script: 'dev', port: 3000 }),
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it('should return 400 if required fields missing', async () => {
    const { POST } = require('@/app/api/admin/dev-servers/start/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'App' }),
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('required');
  });

  it('should reject scripts with dangerous characters', async () => {
    const { POST } = require('@/app/api/admin/dev-servers/start/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'App', cwd: '/tmp', script: 'dev; rm -rf /', port: 3000 }),
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid script');
  });

  it('should spawn a detached process for valid input', async () => {
    const { spawn } = require('child_process');
    const fs = require('fs');

    const mockProcess = {
      pid: 99999,
      unref: jest.fn(),
      on: jest.fn(),
    };
    spawn.mockReturnValue(mockProcess);
    fs.existsSync.mockReturnValue(true);
    fs.writeFileSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue('[]');

    const { POST } = require('@/app/api/admin/dev-servers/start/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'My App', cwd: '/tmp/project', script: 'dev', port: 4000 }),
    });
    const response = await POST(req);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.pid).toBe(99999);
    expect(spawn).toHaveBeenCalledWith(
      'npm',
      ['run', 'dev'],
      expect.objectContaining({
        cwd: '/tmp/project',
        detached: true,
        stdio: 'ignore',
      })
    );
    expect(mockProcess.unref).toHaveBeenCalled();
  });

  it('should reject cwd paths with traversal', async () => {
    const { POST } = require('@/app/api/admin/dev-servers/start/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'App', cwd: '/tmp/../etc', script: 'dev', port: 3000 }),
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid');
  });
});
