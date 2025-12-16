'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Sparkles, Shield } from 'lucide-react';
import { UserAvatar } from '@/components/auth/UserAvatar';

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans p-8">
            <div className="max-w-5xl mx-auto">
                {/* User Avatar */}
                <div className="flex justify-end mb-4">
                    <UserAvatar />
                </div>

                {/* Header */}
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
                        Internal Tools
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            AWE2M8
                        </span>{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                            Command Center
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Select a tool to manage sales demos, compliance, or system configurations.
                    </p>
                </header>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Tool 1: Sales Demo Builder */}
                    <Link
                        href="/demos"
                        className="group block bg-gray-900/50 border border-gray-800 hover:border-blue-500/50 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-blue-900/20"
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-800/50 group-hover:border-purple-500/50 transition-colors">
                                <Sparkles className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Demo Builder</h3>
                        </div>
                        <p className="text-gray-400 text-sm">Create stunning AI-powered demo pages for your clients</p>
                    </Link>

                    {/* Tool 2: Twilio Compliance */}
                    <Link
                        href="/twilio"
                        className="group block bg-gray-900/50 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-cyan-900/20"
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-800/50 group-hover:border-cyan-500/50 transition-colors">
                                <Shield className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Twilio Bundle Manager</h3>
                        </div>
                        <p className="text-gray-400 text-sm">Manage A2P 10DLC regulatory compliance bundles</p>
                    </Link>

                    {/* Tool 3: Placeholder / System Config */}
                    <div className="group relative overflow-hidden bg-gray-900/50 border border-gray-800 rounded-2xl p-6 opacity-60">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                                <Settings className="w-6 h-6 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 mb-2">System Settings</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Global API configurations and system monitoring tools.
                            </p>
                            <div className="flex items-center text-gray-600 text-sm font-bold cursor-not-allowed">
                                Coming Soon
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer / Stats */}
                <div className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
                    <p>Internal Tools v2.0 • Secure Access Only</p>
                </div>
            </div>
        </div>
    );
}
