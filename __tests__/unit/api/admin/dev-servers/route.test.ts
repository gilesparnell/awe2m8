/**
 * @jest-environment node
 */

const originalEnv = process.env.NODE_ENV;

jest.mock('@/lib/dev-server-scanner', () => ({
  getRunningServers: jest.fn(),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

describe('GET /api/admin/dev-servers', () => {
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
    const { GET } = require('@/app/api/admin/dev-servers/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Dev only');
  });

  it('should return detected servers', async () => {
    const { getRunningServers } = require('@/lib/dev-server-scanner');
    const fs = require('fs');

    getRunningServers.mockReturnValue([
      {
        name: 'allconvos',
        port: 3000,
        pid: 12345,
        url: 'http://localhost:3000',
        status: 'running',
        command: 'node',
        cwd: '',
        source: 'detected',
      },
    ]);
    fs.existsSync.mockReturnValue(false);

    const { GET } = require('@/app/api/admin/dev-servers/route');
    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.servers).toHaveLength(1);
    expect(json.servers[0].name).toBe('allconvos');
    expect(json.servers[0].port).toBe(3000);
  });

  it('should merge saved configs with detected servers', async () => {
    const { getRunningServers } = require('@/lib/dev-server-scanner');
    const fs = require('fs');

    getRunningServers.mockReturnValue([]);
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(
      JSON.stringify([
        { name: 'My App', cwd: '/path/to/app', script: 'dev', port: 4000 },
      ])
    );

    const { GET } = require('@/app/api/admin/dev-servers/route');
    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.servers).toHaveLength(1);
    expect(json.servers[0].name).toBe('My App');
    expect(json.servers[0].status).toBe('stopped');
    expect(json.servers[0].source).toBe('manual');
  });
});
