'use client';

import React from 'react';
import Link from 'next/link';
import { MonitorPlay, ShieldCheck, ArrowRight, LayoutDashboard, Settings, Bot, Code } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans p-8">
            <div className="max-w-5xl mx-auto">
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
                    <Link href="/admin/demos" className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-900/20 hover:-translate-y-1">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-green-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                                <MonitorPlay className="w-6 h-6 text-green-400 group-hover:text-green-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Sales Demo Builder</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Generate personalized AI demo pages, analyze prospect websites, and manage content modules.
                            </p>
                            <div className="flex items-center text-green-400 text-sm font-bold group-hover:gap-2 transition-all">
                                Launch Tool <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
                    </Link>

                    {/* Tool 2: Twilio Compliance */}
                    <Link href="/admin/twilio" className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                <ShieldCheck className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Twilio Bundle Manager</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Manage A2P 10DLC regulatory bundles, submit compliance documents, and check approval status.
                            </p>
                            <div className="flex items-center text-blue-400 text-sm font-bold group-hover:gap-2 transition-all">
                                Launch Tool <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                    </Link>

                    {/* Tool 3: Admin Users */}
                    <Link href="/admin/users" className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-900/20 hover:-translate-y-1">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-amber-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                                <ShieldCheck className="w-6 h-6 text-amber-400 group-hover:text-amber-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Admin Users</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Manage admin access, add new team members, and review user roles.
                            </p>
                            <div className="flex items-center text-amber-400 text-sm font-bold group-hover:gap-2 transition-all">
                                Launch Tool <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
                    </Link>

                    {/* Tool 4: Mission Control */}
                    <Link href="/admin/mission-control" className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-1">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                                <Bot className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Mission Control</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                AI Agent Squad dashboard. Track agent progress, manage tasks, and monitor squad activity.
                            </p>
                            <div className="flex items-center text-purple-400 text-sm font-bold group-hover:gap-2 transition-all">
                                Launch Tool <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
                    </Link>

                    {/* Tool 5: GHL Workflow Triggers */}
                    <Link href="/admin/ghl-workflow-triggers" className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-900/20 hover:-translate-y-1">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-orange-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                                <Code className="w-6 h-6 text-orange-400 group-hover:text-orange-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">GHL Workflow Triggers</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Create custom webhook pages for GoHighLevel workflows. Paste code and generate live URLs.
                            </p>
                            <div className="flex items-center text-orange-400 text-sm font-bold group-hover:gap-2 transition-all">
                                Launch Tool <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all"></div>
                    </Link>

                </div>

                {/* Footer / Stats */}
                <div className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
                    <p>Internal Tools v2.0 • Secure Access Only</p>
                </div>
            </div>
        </div>
    );
}
