#!/usr/bin/env node

/**
 * Standalone local scanner server for Dev Server Manager.
 * Run this on your machine so the production dashboard can detect local dev servers.
 *
 * Usage: npm run scanner
 * Listens on: http://localhost:9111
 */

import http from 'node:http';
import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, normalize, resolve } from 'node:path';

const PORT = 9111;
const DEV_PORTS = [3000, 3001, 3002, 4000, 4200, 4321, 5000, 5173, 5174, 8000, 8080, 8888, 9000, 9090];
const SYSTEM_PROCESSES = new Set(['ControlCe', 'rapportd', 'sharingd', 'AirPlayMDN']);
const CONFIG_DIR = join(process.cwd(), '.allconvos');
const CONFIG_PATH = join(CONFIG_DIR, 'dev-servers.json');
const SAFE_SCRIPT_PATTERN = /^[a-zA-Z0-9_:-]+$/;

const GENERIC_NAMES = new Set([
  'next-app', 'my-app', 'app', 'client', 'server', 'frontend', 'backend',
  'vite-project', 'vite_react_shadcn_ts', 'my-project', 'starter', 'template',
  'create-next-app', 'create-react-app', 'remix-app', 'nuxt-app',
]);

function findPackageInfo(dir) {
  let current = dir;
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(current, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        const dirName = basename(current);
        const pkgName = pkg.name || dirName;
        const displayName = GENERIC_NAMES.has(pkgName) ? dirName : pkgName;
        return { name: displayName, description: pkg.description, dir: current };
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

function resolveApp(pid, fallback) {
  const defaultName = fallback || 'unknown';
  try {
    const cwdOutput = execSync(
      `lsof -a -p ${pid} -d cwd -Fn 2>/dev/null | grep '^n/' | head -1`,
      { encoding: 'utf-8', timeout: 3000 }
    ).trim();
    const cwd = cwdOutput.replace(/^n/, '');
    if (cwd.startsWith('/')) {
      const info = findPackageInfo(cwd);
      if (info) return { name: info.name, cwd: info.dir };
      return { name: basename(cwd), cwd };
    }
  } catch {}
  try {
    const psOutput = execSync(`ps -p ${pid} -o command= 2>/dev/null`, {
      encoding: 'utf-8', timeout: 3000,
    }).trim();
    const dirMatch = psOutput.match(/(?:^|\s)(\/[^\s]+)/);
    if (dirMatch) {
      const info = findPackageInfo(dirMatch[1]);
      if (info) return { name: info.name, cwd: info.dir };
    }
  } catch {}
  return { name: defaultName, cwd: '' };
}

function parseLsofOutput(output) {
  if (!output.trim()) return [];
  const lines = output.trim().split('\n').filter(
    (line) => !line.startsWith('COMMAND') && line.includes('(LISTEN)')
  );
  const seen = new Set();
  const entries = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 10) continue;
    const command = parts[0];
    const pid = parseInt(parts[1], 10);
    const nameField = parts[parts.length - 2];
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

function getRunningServers() {
  let lsofOutput;
  try {
    lsofOutput = execSync('lsof -iTCP -sTCP:LISTEN -n -P 2>/dev/null', {
      encoding: 'utf-8', timeout: 5000,
    });
  } catch { return []; }
  const devPortSet = new Set(DEV_PORTS);
  return parseLsofOutput(lsofOutput)
    .filter((e) => devPortSet.has(e.port))
    .filter((e) => !SYSTEM_PROCESSES.has(e.command))
    .map((entry) => {
      const resolved = resolveApp(entry.pid, entry.command);
      return {
        name: resolved.name, port: entry.port, pid: entry.pid,
        url: `http://localhost:${entry.port}`, status: 'running',
        command: entry.command, cwd: resolved.cwd, source: 'detected',
      };
    });
}

function loadConfigs() {
  try {
    if (existsSync(CONFIG_PATH)) return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {}
  return [];
}

function saveConfigs(configs) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(configs, null, 2));
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, data, status = 200) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /api/dev-servers
  if (req.method === 'GET' && url.pathname === '/api/dev-servers') {
    const detected = getRunningServers();
    const savedConfigs = loadConfigs();
    const detectedPorts = new Set(detected.map((s) => s.port));
    const stopped = savedConfigs
      .filter((c) => !detectedPorts.has(c.port))
      .map((c) => ({
        name: c.name, port: c.port, pid: null, url: `http://localhost:${c.port}`,
        status: 'stopped', command: `npm run ${c.script}`, cwd: c.cwd, source: 'manual',
      }));
    return json(res, { success: true, servers: [...detected, ...stopped] });
  }

  // POST /api/dev-servers/stop
  if (req.method === 'POST' && url.pathname === '/api/dev-servers/stop') {
    const { pid, port } = await readBody(req);
    if (!pid || !port) return json(res, { error: 'pid and port are required' }, 400);
    try {
      const check = execSync(`lsof -p ${pid} -iTCP -n -P 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 });
      if (!check.includes(`:${port}`)) return json(res, { error: `Process ${pid} is no longer listening on port ${port}` }, 409);
    } catch { return json(res, { error: `Process ${pid} is no longer listening on port ${port}` }, 409); }
    execSync(`kill -TERM ${pid}`, { timeout: 3000 });
    return json(res, { success: true, message: `Sent SIGTERM to PID ${pid}` });
  }

  // POST /api/dev-servers/start
  if (req.method === 'POST' && url.pathname === '/api/dev-servers/start') {
    const { name, cwd, script, port } = await readBody(req);
    if (!name || !cwd || !script || !port) return json(res, { error: 'name, cwd, script, and port are required' }, 400);
    if (!SAFE_SCRIPT_PATTERN.test(script)) return json(res, { error: 'Invalid script name' }, 400);
    if (cwd.includes('..')) return json(res, { error: 'Invalid cwd path' }, 400);
    const normalizedCwd = normalize(resolve(cwd));
    if (!existsSync(normalizedCwd)) return json(res, { error: `Directory does not exist: ${normalizedCwd}` }, 400);
    const child = spawn('npm', ['run', script], { cwd: normalizedCwd, detached: true, stdio: 'ignore' });
    child.unref();
    const configs = loadConfigs();
    const existing = configs.findIndex((c) => c.port === port);
    const newConfig = { name, cwd: normalizedCwd, script, port };
    if (existing >= 0) configs[existing] = newConfig; else configs.push(newConfig);
    saveConfigs(configs);
    return json(res, { success: true, pid: child.pid, message: `Started ${name} on port ${port}` });
  }

  json(res, { error: 'Not found' }, 404);
});

server.listen(PORT, () => {
  console.log(`\n  🖥️  Dev Scanner running at http://localhost:${PORT}`);
  console.log(`  Your production dashboard can now detect local dev servers.\n`);
});
