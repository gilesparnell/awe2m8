'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Wrench } from 'lucide-react';

type Provider = 'ghl' | 'assistable' | 'custom';

const examplePayload = {
  to: '+15551234567',
  from: '+15557654321',
  agentId: 'your-agent-id',
  contactName: 'Test Contact',
};

export default function GhlAssistableDebugPage() {
  const [provider, setProvider] = useState<Provider>('assistable');
  const [method, setMethod] = useState('POST');
  const [endpoint, setEndpoint] = useState('/v1/calls');
  const [url, setUrl] = useState('');
  const [headersText, setHeadersText] = useState('');
  const [bodyText, setBodyText] = useState(JSON.stringify(examplePayload, null, 2));
  const [timeoutMs, setTimeoutMs] = useState('30000');
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const endpointPlaceholder = useMemo(() => {
    if (provider === 'ghl') return '/contacts/';
    if (provider === 'assistable') return '/v1/calls';
    return '/path';
  }, [provider]);

  const parseHeadersText = () => {
    const lines = headersText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const headers: Array<{ key: string; value: string }> = [];
    for (const line of lines) {
      const idx = line.includes(':') ? line.indexOf(':') : line.indexOf('=');
      if (idx <= 0) continue;
      headers.push({
        key: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      });
    }
    return headers;
  };

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/api-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          method,
          endpoint,
          url,
          body: bodyText,
          headers: parseHeadersText(),
          timeoutMs: Number(timeoutMs),
          showSecrets,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Tools
          </Link>
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-cyan-900/30 border border-cyan-800 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-wider">
            API Troubleshooting
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              GHL / Assistable
            </span>{' '}
            <span className="text-white">Debug Console</span>
          </h1>
          <p className="mt-3 text-gray-400 max-w-3xl">
            Run controlled API tests from the admin area and inspect request/response payloads without exposing secrets in the browser.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold mb-4">
              <Wrench className="w-4 h-4" />
              Request Builder
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="text-gray-300 mb-1">Provider</div>
                <select
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                >
                  <option value="assistable">Assistable</option>
                  <option value="ghl">GHL</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <label className="text-sm">
                <div className="text-gray-300 mb-1">Method</div>
                <select
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block text-sm">
                <div className="text-gray-300 mb-1">Endpoint</div>
                <input
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  placeholder={endpointPlaceholder}
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                <div className="text-gray-300 mb-1">Full URL override (optional)</div>
                <input
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  placeholder="https://api.example.com/path"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                <div className="text-gray-300 mb-1">Headers (one per line: `Header: value`)</div>
                <textarea
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm h-24 font-mono"
                  placeholder={'Version: 2021-07-28\nx-api-key: your_key'}
                  value={headersText}
                  onChange={(e) => setHeadersText(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                <div className="text-gray-300 mb-1">Body (JSON or plain text)</div>
                <textarea
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm h-44 font-mono"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="text-sm">
                <span className="text-gray-300 mr-2">Timeout (ms)</span>
                <input
                  className="w-28 bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-sm"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(e.target.value)}
                />
              </label>
              <label className="text-sm flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={showSecrets}
                  onChange={(e) => setShowSecrets(e.target.checked)}
                />
                Show unmasked secret headers
              </label>
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              className="mt-6 inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 disabled:text-cyan-300 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
              {loading ? 'Running...' : 'Run Debug Call'}
            </button>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-cyan-300 font-semibold mb-4">Response Log</div>
            <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-200 overflow-auto h-[680px]">
              {result
                ? JSON.stringify(result, null, 2)
                : 'Run a request to see structured request/response output here.'}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
