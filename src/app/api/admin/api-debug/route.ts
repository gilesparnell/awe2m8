import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/api-auth';

type Provider = 'ghl' | 'assistable' | 'custom';

function parsePossibleJson(value: string | null | undefined): unknown {
  if (!value || !value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseHeaders(headersInput: unknown): Record<string, string> {
  if (!headersInput) return {};
  if (Array.isArray(headersInput)) {
    const out: Record<string, string> = {};
    for (const entry of headersInput) {
      if (!entry || typeof entry !== 'object') continue;
      const key = String((entry as { key?: unknown }).key || '').trim();
      const value = String((entry as { value?: unknown }).value || '').trim();
      if (key) out[key] = value;
    }
    return out;
  }
  if (typeof headersInput === 'object') {
    return Object.fromEntries(
      Object.entries(headersInput as Record<string, unknown>)
        .filter(([key]) => Boolean(key))
        .map(([key, value]) => [key, String(value ?? '')]),
    );
  }
  return {};
}

function isSecretHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('authorization') ||
    lower.includes('api-key') ||
    lower.includes('apikey') ||
    lower.includes('token') ||
    lower.includes('cookie')
  );
}

function maskValue(value: string): string {
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function printableHeaders(headersObj: Record<string, string>, showSecrets: boolean): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headersObj)) {
    out[key] = showSecrets || !isSecretHeader(key) ? value : maskValue(value);
  }
  return out;
}

function providerDefaults(provider: Provider) {
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

function resolveUrl(baseUrl: string, endpoint: string, overrideUrl?: string): string {
  if (overrideUrl?.trim()) return overrideUrl.trim();
  if (!baseUrl && !endpoint) return '';
  if (!baseUrl) return endpoint;
  const left = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const right = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${left}${right}`;
}

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const provider = (body.provider || 'custom') as Provider;
  const method = String(body.method || 'GET').toUpperCase();
  const endpoint = String(body.endpoint || '');
  const timeoutMs = Number(body.timeoutMs || 30000);
  const showSecrets = Boolean(body.showSecrets);

  const defaults = providerDefaults(provider);
  const customHeaders = parseHeaders(body.headers);
  const headers = { ...defaults.headers, ...customHeaders };
  const url = resolveUrl(defaults.baseUrl, endpoint, body.url ? String(body.url) : undefined);

  if (!url) {
    return NextResponse.json({ error: 'URL is required. Set a provider+endpoint or url.' }, { status: 400 });
  }

  const rawBody = typeof body.body === 'string' ? body.body : JSON.stringify(body.body ?? '');
  const parsedBody = parsePossibleJson(rawBody);
  const hasBody = parsedBody !== undefined && !['GET', 'HEAD'].includes(method);
  const requestPayload = hasBody
    ? (typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody))
    : undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: requestPayload,
      signal: controller.signal,
    });

    const durationMs = Date.now() - start;
    const text = await res.text();
    let parsedResponse: unknown = text;
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      // keep raw text
    }

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      ok: res.ok,
      durationMs,
      request: {
        provider,
        method,
        url,
        headers: printableHeaders(headers, showSecrets),
        body: hasBody ? parsedBody : null,
      },
      response: {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: parsedResponse,
      },
    }, { status: res.ok ? 200 : 400 });
  } catch (error) {
    const durationMs = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      ok: false,
      durationMs,
      request: {
        provider,
        method,
        url,
        headers: printableHeaders(headers, showSecrets),
        body: hasBody ? parsedBody : null,
      },
      error: message,
    }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
