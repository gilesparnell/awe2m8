#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnvFiles() {
  const root = path.resolve(__dirname, '..');
  const envFiles = [
    path.join(root, '.env.local'),
    path.join(root, '.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile, override: false });
    }
  }
}

function printHelp() {
  console.log(`
Usage:
  node scripts/debug-api-call.js --provider <ghl|assistable|custom> [options]

Options:
  --provider <name>       API preset: ghl, assistable, or custom
  --url <fullUrl>         Full URL (overrides --provider base + --endpoint)
  --endpoint <path>       API path, example: /v1/calls
  --method <verb>         HTTP method (default: GET)
  --header <k:v>          Extra header (repeatable), example: --header "x-api-key:abc"
  --body <jsonOrText>     Inline request body
  --body-file <path>      Request body file (.json or text)
  --timeout-ms <number>   Timeout in milliseconds (default: 30000)
  --show-secrets          Print raw auth headers (default masks secrets)
  --help                  Show this help

Examples:
  npm run debug:api -- --provider assistable --endpoint /v1/calls --method POST --body-file ./tmp/assistable-call.json
  npm run debug:api -- --provider ghl --endpoint /contacts/ --header "Version: 2021-07-28"
  npm run debug:api -- --url https://example.com/hook --method POST --body '{"hello":"world"}'
`);
}

function parseArgs(argv) {
  const opts = {
    provider: 'custom',
    headers: [],
    method: 'GET',
    timeoutMs: 30000,
    showSecrets: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === '--help' || token === '-h') {
      opts.help = true;
      continue;
    }
    if (token === '--show-secrets') {
      opts.showSecrets = true;
      continue;
    }

    const valueFlags = new Set([
      '--provider',
      '--url',
      '--endpoint',
      '--method',
      '--header',
      '--body',
      '--body-file',
      '--timeout-ms',
    ]);

    if (valueFlags.has(token)) {
      if (!next || next.startsWith('--')) {
        throw new Error(`Missing value for ${token}`);
      }
      i += 1;

      if (token === '--provider') opts.provider = String(next).toLowerCase();
      if (token === '--url') opts.url = next;
      if (token === '--endpoint') opts.endpoint = next;
      if (token === '--method') opts.method = String(next).toUpperCase();
      if (token === '--header') opts.headers.push(next);
      if (token === '--body') opts.body = next;
      if (token === '--body-file') opts.bodyFile = next;
      if (token === '--timeout-ms') opts.timeoutMs = Number(next);
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return opts;
}

function parseHeader(raw) {
  const separatorIndex = raw.includes(':') ? raw.indexOf(':') : raw.indexOf('=');
  if (separatorIndex <= 0) {
    throw new Error(`Invalid header format: ${raw}. Use "Header: value"`);
  }
  const key = raw.slice(0, separatorIndex).trim();
  const value = raw.slice(separatorIndex + 1).trim();
  return [key, value];
}

function parseBody(bodyText) {
  if (bodyText == null || bodyText === '') return undefined;
  try {
    return JSON.parse(bodyText);
  } catch {
    return bodyText;
  }
}

function readBodyFromFile(bodyFilePath) {
  const absolutePath = path.resolve(process.cwd(), bodyFilePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  return parseBody(content);
}

function joinUrl(base, endpoint) {
  if (!base) return endpoint;
  if (!endpoint) return base;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  const left = base.endsWith('/') ? base.slice(0, -1) : base;
  const right = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${left}${right}`;
}

function isSecretHeader(headerName) {
  const key = headerName.toLowerCase();
  return (
    key.includes('authorization') ||
    key.includes('api-key') ||
    key.includes('apikey') ||
    key.includes('token') ||
    key.includes('cookie')
  );
}

function maskValue(value) {
  if (typeof value !== 'string') return '***';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function printableHeaders(headersObj, showSecrets) {
  const out = {};
  for (const [key, value] of Object.entries(headersObj)) {
    out[key] = showSecrets || !isSecretHeader(key) ? value : maskValue(value);
  }
  return out;
}

function providerDefaults(provider) {
  if (provider === 'ghl') {
    const token = process.env.GHL_API_KEY || process.env.GHL_ACCESS_TOKEN;
    return {
      baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(process.env.GHL_API_VERSION ? { Version: process.env.GHL_API_VERSION } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  }

  if (provider === 'assistable') {
    const token = process.env.ASSISTABLE_API_KEY || process.env.ASSISTABLE_ACCESS_TOKEN;
    return {
      baseUrl: process.env.ASSISTABLE_BASE_URL || 'https://api.assistable.ai',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  }

  return {
    baseUrl: '',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
}

function toPretty(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function buildCurl({ method, url, headers, body, showSecrets }) {
  const parts = [`curl -i -X ${method}`, `'${url}'`];
  for (const [key, value] of Object.entries(headers)) {
    const safeValue = showSecrets || !isSecretHeader(key) ? value : maskValue(value);
    parts.push(`-H '${key}: ${safeValue}'`);
  }
  if (body !== undefined) {
    const serialized = typeof body === 'string' ? body : JSON.stringify(body);
    parts.push(`--data '${serialized.replace(/'/g, "'\\''")}'`);
  }
  return parts.join(' ');
}

async function run() {
  loadEnvFiles();
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    printHelp();
    return;
  }

  const defaults = providerDefaults(opts.provider);
  const extraHeaders = Object.fromEntries(opts.headers.map(parseHeader));
  const headers = { ...defaults.headers, ...extraHeaders };

  let body = undefined;
  if (opts.bodyFile) body = readBodyFromFile(opts.bodyFile);
  if (opts.body != null) body = parseBody(opts.body);

  const url = opts.url || joinUrl(defaults.baseUrl, opts.endpoint || '');
  if (!url) {
    throw new Error('No URL resolved. Set --url or use --provider with --endpoint');
  }

  const bodyAllowed = !['GET', 'HEAD'].includes(opts.method);
  const requestBody = bodyAllowed && body !== undefined
    ? (typeof body === 'string' ? body : JSON.stringify(body))
    : undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  const requestStart = Date.now();
  console.log('\n=== API DEBUG REQUEST ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Provider: ${opts.provider}`);
  console.log(`Method: ${opts.method}`);
  console.log(`URL: ${url}`);
  console.log(`Timeout: ${opts.timeoutMs}ms`);
  console.log('Headers:', toPretty(printableHeaders(headers, opts.showSecrets)));
  console.log('Body:', requestBody ? toPretty(parseBody(requestBody)) : '(none)');
  console.log('Repro (masked):');
  console.log(buildCurl({ method: opts.method, url, headers, body, showSecrets: opts.showSecrets }));

  let response;
  try {
    response = await fetch(url, {
      method: opts.method,
      headers,
      body: requestBody,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const elapsed = Date.now() - requestStart;
  const responseText = await response.text();
  let parsedResponse = responseText;
  try {
    parsedResponse = JSON.parse(responseText);
  } catch {
    // keep raw text
  }

  const responseHeaders = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  console.log('\n=== API DEBUG RESPONSE ===');
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Duration: ${elapsed}ms`);
  console.log('Headers:', toPretty(responseHeaders));
  console.log('Body:', toPretty(parsedResponse));
  console.log('==========================\n');

  if (!response.ok) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('\nAPI debug call failed.');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
