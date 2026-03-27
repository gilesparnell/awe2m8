import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { DevServer, DEV_PORTS } from '@/types/dev-server';

interface LsofEntry {
  command: string;
  pid: number;
  port: number;
}

export function parseLsofOutput(output: string | Buffer): LsofEntry[] {
  const str = typeof output === 'string' ? output : output.toString();
  if (!str.trim()) return [];

  const lines = str.trim().split('\n');
  // Skip header line
  const dataLines = lines.filter(
    (line) => !line.startsWith('COMMAND') && line.includes('(LISTEN)')
  );

  const seen = new Set<string>();
  const entries: LsofEntry[] = [];

  for (const line of dataLines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 10) continue;

    const command = parts[0];
    const pid = parseInt(parts[1], 10);
    const nameField = parts[parts.length - 2]; // e.g. "*:3000" or "127.0.0.1:3000"

    const portMatch = nameField.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1], 10);
    const key = `${pid}:${port}`;

    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({ command, pid, port });
  }

  return entries;
}

function findPackageJsonName(dir: string): string | null {
  let current = dir;
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(current, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        return pkg.name || null;
      } catch {
        return null;
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

export function resolveAppName(pid: number, fallback?: string): string {
  const defaultName = fallback || 'unknown';

  try {
    // Try to get the cwd of the process via lsof
    const cwdOutput = execSync(`lsof -p ${pid} -Fn 2>/dev/null | grep '^n/' | head -5`, {
      encoding: 'utf-8',
      timeout: 3000,
    }).trim();

    // Look for the cwd entry (first path that looks like a project dir)
    const paths = cwdOutput
      .split('\n')
      .map((l) => l.replace(/^n/, ''))
      .filter((p) => p.startsWith('/'));

    for (const p of paths) {
      const name = findPackageJsonName(p);
      if (name) return name;
    }
  } catch {
    // lsof failed, try ps
  }

  try {
    const psOutput = execSync(`ps -p ${pid} -o command= 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 3000,
    }).trim();

    // Try to extract a directory from the command args
    const dirMatch = psOutput.match(/(?:^|\s)(\/[^\s]+)/);
    if (dirMatch) {
      const name = findPackageJsonName(dirMatch[1]);
      if (name) return name;
    }
  } catch {
    // ps also failed
  }

  return defaultName;
}

export function getRunningServers(): DevServer[] {
  let lsofOutput: string;

  try {
    lsofOutput = execSync('lsof -iTCP -sTCP:LISTEN -n -P 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 5000,
    });
  } catch {
    return [];
  }

  const entries = parseLsofOutput(lsofOutput);
  const devPortSet = new Set<number>(DEV_PORTS);

  return entries
    .filter((entry) => devPortSet.has(entry.port))
    .map((entry) => ({
      name: resolveAppName(entry.pid, entry.command),
      port: entry.port,
      pid: entry.pid,
      url: `http://localhost:${entry.port}`,
      status: 'running' as const,
      command: entry.command,
      cwd: '',
      source: 'detected' as const,
    }));
}
