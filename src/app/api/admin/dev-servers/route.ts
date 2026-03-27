import { NextResponse } from 'next/server';
import { getRunningServers } from '@/lib/dev-server-scanner';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DevServer, DevServerConfig } from '@/types/dev-server';

const CONFIG_PATH = join(process.cwd(), '.allconvos', 'dev-servers.json');

function loadSavedConfigs(): DevServerConfig[] {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }

  try {
    const detected = getRunningServers();
    const savedConfigs = loadSavedConfigs();
    const detectedPorts = new Set(detected.map((s) => s.port));

    // Add saved configs that aren't currently running as "stopped"
    const stoppedServers: DevServer[] = savedConfigs
      .filter((config) => !detectedPorts.has(config.port))
      .map((config) => ({
        name: config.name,
        port: config.port,
        pid: null,
        url: `http://localhost:${config.port}`,
        status: 'stopped' as const,
        command: `npm run ${config.script}`,
        cwd: config.cwd,
        source: 'manual' as const,
      }));

    const servers = [...detected, ...stoppedServers];

    return NextResponse.json({ success: true, servers });
  } catch (error) {
    console.error('Dev servers error:', error);
    return NextResponse.json(
      { error: 'Failed to scan servers' },
      { status: 500 }
    );
  }
}
