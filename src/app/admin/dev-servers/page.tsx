'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Server,
  ExternalLink,
  Square,
  Play,
  Loader2,
  Plus,
  X,
  RefreshCw,
} from 'lucide-react';
import { useDevServers } from '@/hooks/useDevServers';

export default function DevServersPage() {
  const {
    servers,
    loading,
    error,
    scannerConnected,
    stopServer,
    startServer,
    pausePolling,
    resumePolling,
    refresh,
    isRemote,
  } = useDevServers();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cwd: '',
    script: 'dev',
    port: '',
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleStop = async (pid: number, port: number) => {
    setActionLoading(port);
    const result = await stopServer(pid, port);
    setActionLoading(null);
    if (result.error) {
      alert(result.error);
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const port = parseInt(formData.port, 10);
    if (!formData.name || !formData.cwd || !formData.script || isNaN(port)) {
      setFormError('All fields are required');
      return;
    }

    setActionLoading(port);
    const result = await startServer(formData.name, formData.cwd, formData.script, port);
    setActionLoading(null);

    if (result.error) {
      setFormError(result.error);
    } else {
      setShowForm(false);
      setFormData({ name: '', cwd: '', script: 'dev', port: '' });
    }
  };

  const handleStartSaved = async (server: typeof servers[0]) => {
    setActionLoading(server.port);
    // Extract script from "npm run <script>" format
    const script = server.command.replace('npm run ', '');
    const result = await startServer(server.name, server.cwd, script, server.port);
    setActionLoading(null);
    if (result.error) {
      alert(result.error);
    }
  };

  const toggleForm = () => {
    if (!showForm) {
      pausePolling();
    } else {
      resumePolling();
    }
    setShowForm(!showForm);
    setFormError(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Tools
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-rose-900/30 border border-rose-800 rounded-full text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Server className="w-3 h-3" />
            Dev Tools
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-pink-500">
              Dev Server
            </span>{' '}
            <span className="text-white">Manager</span>
          </h1>

          <p className="mt-3 text-gray-400 max-w-3xl">
            Monitor and control your locally running development servers. Auto-detects processes on common dev ports.
          </p>
        </header>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm font-medium transition-colors"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'Add Server'}
            </button>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Auto-refreshes every 5s
          </div>
        </div>

        {/* Scanner not connected banner */}
        {isRemote && !scannerConnected && !loading && (
          <div className="mb-6 bg-amber-900/20 border border-amber-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-amber-400 mb-2">Local Scanner Not Connected</h3>
            <p className="text-gray-400 text-sm mb-3">
              To see your local dev servers from this production page, start the scanner on your machine:
            </p>
            <code className="block bg-gray-950 rounded-lg px-4 py-3 text-sm text-green-400 font-mono">
              npm run scanner
            </code>
            <p className="text-gray-500 text-xs mt-3">
              This runs a lightweight local service on port 9111 that lets the dashboard detect your running servers.
            </p>
          </div>
        )}

        {/* Add Server Form */}
        {showForm && (
          <div className="mb-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Add New Server</h3>
            <form onSubmit={handleStart} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My App"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Project Directory</label>
                <input
                  type="text"
                  value={formData.cwd}
                  onChange={(e) => setFormData({ ...formData, cwd: e.target.value })}
                  placeholder="/Users/you/projects/my-app"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">NPM Script</label>
                <input
                  type="text"
                  value={formData.script}
                  onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                  placeholder="dev"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Port</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  placeholder="3000"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                  {actionLoading !== null ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Start Server
                </button>
                {formError && (
                  <span className="text-red-400 text-sm">{formError}</span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-800 rounded-2xl p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && servers.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <Server className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No servers detected</h3>
            <p className="text-gray-500 text-sm">
              Start a dev server or click &quot;Add Server&quot; to register one manually.
            </p>
          </div>
        )}

        {/* Server List */}
        {!loading && !error && servers.length > 0 && (
          <div className="space-y-3">
            {servers.map((server) => (
              <div
                key={`${server.port}-${server.pid}`}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Status indicator */}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      server.status === 'running'
                        ? 'bg-green-400 shadow-lg shadow-green-400/50'
                        : server.status === 'starting'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-gray-600'
                    }`}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white truncate">{server.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          server.status === 'running'
                            ? 'bg-green-900/30 text-green-400'
                            : server.status === 'starting'
                            ? 'bg-amber-900/30 text-amber-400'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {server.status}
                      </span>
                      <span className="text-xs text-gray-600">
                        {server.source === 'manual' ? 'manual' : 'detected'}
                      </span>
                    </div>
                    {server.cwd && (
                      <p className="text-xs text-gray-500 truncate max-w-md" title={server.cwd}>
                        {server.cwd}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span className="font-mono">:{server.port}</span>
                      {server.pid && (
                        <span className="text-gray-600">PID {server.pid}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Open URL */}
                  {server.status === 'running' && (
                    <a
                      href={server.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  )}

                  {/* Start / Stop */}
                  {server.status === 'running' && server.pid ? (
                    <button
                      onClick={() => handleStop(server.pid!, server.port)}
                      disabled={actionLoading === server.port}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-lg text-xs text-red-400 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === server.port ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      Stop
                    </button>
                  ) : server.status === 'stopped' && server.source === 'manual' ? (
                    <button
                      onClick={() => handleStartSaved(server)}
                      disabled={actionLoading === server.port}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 hover:bg-green-900/50 border border-green-800/50 rounded-lg text-xs text-green-400 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === server.port ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Start
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Port Legend */}
        <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500">
            <span className="font-bold text-gray-400">Monitored ports:</span>{' '}
            3000, 3001, 3002, 4000, 4200, 4321, 5000, 5173, 5174, 8000, 8080, 8888, 9000, 9090
          </p>
        </div>
      </div>
    </div>
  );
}
