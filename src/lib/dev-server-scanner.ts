import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { DevServer, DEV_PORTS } from '@/types/dev-server';

// macOS system processes that listen on dev ports but aren't dev servers
const SYSTEM_PROCESSES = new Set([
  'ControlCe',  // AirPlay Receiver (port 5000)
  'rapportd',   // Apple rapport daemon
  'sharingd',   // Apple sharing daemon
  'AirPlayMDN', // AirPlay
]);

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

interface PackageInfo {
  name: string;
  description?: string;
  dir: string;
}

function findPackageInfo(dir: string): PackageInfo | null {
  let current = dir;
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(current, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        const dirName = basename(current);
        // Prefer description for display, then use directory name if package name is generic
        const genericNames = new Set([
          'next-app', 'my-app', 'app', 'client', 'server', 'frontend', 'backend',
          'vite-project', 'vite_react_shadcn_ts', 'my-project', 'starter', 'template',
          'create-next-app', 'create-react-app', 'remix-app', 'nuxt-app',
        ]);
        const pkgName = pkg.name || dirName;
        const displayName = genericNames.has(pkgName) ? dirName : pkgName;
        return {
          name: displayName,
          description: pkg.description,
          dir: current,
        };
      } catch {
        return { name: basename(current), dir: current };
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

// Keep backward compat for tests
function findPackageJsonName(dir: string): string | null {
  const info = findPackageInfo(dir);
  return info?.name || null;
}

interface ResolvedApp {
  name: string;
  cwd: string;
}

export function resolveAppName(pid: number, fallback?: string): string {
  return resolveApp(pid, fallback).name;
}

function resolveApp(pid: number, fallback?: string): ResolvedApp {
  const defaultName = fallback || 'unknown';

  // Try to get the cwd of the process via /proc or lsof
  try {
    // On macOS, use lsof with -d cwd to get just the working directory
    const cwdOutput = execSync(
      `lsof -a -p ${pid} -d cwd -Fn 2>/dev/null | grep '^n/' | head -1`,
      { encoding: 'utf-8', timeout: 3000 }
    ).trim();

    const cwd = cwdOutput.replace(/^n/, '');
    if (cwd.startsWith('/')) {
      const info = findPackageInfo(cwd);
      if (info) {
        return { name: info.name, cwd: info.dir };
      }
      // No package.json — use directory name
      return { name: basename(cwd), cwd };
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
      const info = findPackageInfo(dirMatch[1]);
      if (info) {
        return { name: info.name, cwd: info.dir };
      }
    }
  } catch {
    // ps also failed
  }

  return { name: defaultName, cwd: '' };
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
    .filter((entry) => !SYSTEM_PROCESSES.has(entry.command))
    .map((entry) => {
      const resolved = resolveApp(entry.pid, entry.command);
      return {
        name: resolved.name,
        port: entry.port,
        pid: entry.pid,
        url: `http://localhost:${entry.port}`,
        status: 'running' as const,
        command: entry.command,
        cwd: resolved.cwd,
        source: 'detected' as const,
      };
    });
}
