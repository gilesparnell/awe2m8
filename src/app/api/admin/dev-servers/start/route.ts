import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { DevServerConfig } from '@/types/dev-server';

const CONFIG_DIR = join(process.cwd(), '.allconvos');
const CONFIG_PATH = join(CONFIG_DIR, 'dev-servers.json');

const SAFE_SCRIPT_PATTERN = /^[a-zA-Z0-9_:-]+$/;

function loadConfigs(): DevServerConfig[] {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch {
    // Ignore
  }
  return [];
}

function saveConfigs(configs: DevServerConfig[]) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(configs, null, 2));
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, cwd, script, port } = body;

    if (!name || !cwd || !script || !port) {
      return NextResponse.json(
        { error: 'name, cwd, script, and port are required' },
        { status: 400 }
      );
    }

    // Validate script name (only alphanumeric, hyphens, colons, underscores)
    if (!SAFE_SCRIPT_PATTERN.test(script)) {
      return NextResponse.json(
        { error: 'Invalid script name. Only alphanumeric characters, hyphens, colons, and underscores allowed.' },
        { status: 400 }
      );
    }

    // Validate cwd - no path traversal sequences
    if (cwd.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid cwd path - directory traversal not allowed' },
        { status: 400 }
      );
    }

    const normalizedCwd = normalize(resolve(cwd));

    // Check cwd exists
    if (!existsSync(normalizedCwd)) {
      return NextResponse.json(
        { error: `Directory does not exist: ${normalizedCwd}` },
        { status: 400 }
      );
    }

    // Spawn detached process
    const child = spawn('npm', ['run', script], {
      cwd: normalizedCwd,
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    // Save to config
    const configs = loadConfigs();
    const existing = configs.findIndex((c) => c.port === port);
    const newConfig: DevServerConfig = { name, cwd: normalizedCwd, script, port };

    if (existing >= 0) {
      configs[existing] = newConfig;
    } else {
      configs.push(newConfig);
    }
    saveConfigs(configs);

    return NextResponse.json({
      success: true,
      pid: child.pid,
      message: `Started ${name} on port ${port}`,
    });
  } catch (error) {
    console.error('Start server error:', error);
    return NextResponse.json(
      { error: 'Failed to start server' },
      { status: 500 }
    );
  }
}
