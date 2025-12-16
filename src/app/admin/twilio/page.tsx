'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Settings, FilePlus, List, ChevronLeft, ArrowRightLeft, Loader2, Phone } from 'lucide-react';
import { ConfigurationForm } from '@/components/admin/twilio/ConfigurationForm';
import { CreateBundleForm } from '@/components/admin/twilio/CreateBundleForm';
import { BundleList } from '@/components/admin/twilio/BundleList';

import { NumberManager } from '@/components/admin/twilio/NumberManager';

function TwilioAdminContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'config' | 'create' | 'list' | 'numbers'>('config');
    const [credentials, setCredentials] = useState({ accountSid: '', authToken: '' });

    useEffect(() => {
        // Load creds
        const sid = localStorage.getItem('twilio_account_sid');
        const token = localStorage.getItem('twilio_auth_token');
        if (sid && token) {
            setCredentials({ accountSid: sid, authToken: token });
        }

        // Check URL params for tab
        const tabParam = searchParams.get('tab');
        if (tabParam && ['config', 'create', 'list', 'numbers'].includes(tabParam)) {
            setActiveTab(tabParam as any);
        } else if (sid && token) {
            // Default to 'create' if configured and no specific tab requested
            setActiveTab('create');
        }
    }, [searchParams]);

    const handleConfigSave = (creds: { accountSid: string; authToken: string }) => {
        setCredentials(creds);
        // Automatically switch to create if saving for first time
        if (activeTab === 'config') setActiveTab('create');
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Custom Header similar to AdminHeader */}
                <header className="mb-12 text-center relative">
                    <div className="mb-6">
                        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                            <ChevronLeft className="w-4 h-4" />
                            Back to Tools
                        </Link>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-800 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 mt-8 md:mt-0">
                        Regulatory Compliance
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-600 tracking-tight mb-4">
                        Twilio Regulatory Bundle Manager
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Streamline phone number regulatory compliance for your agency clients. Manage approvals, documents, and sub-accounts in one place.
                    </p>
                </header>

                {/* Modern Navigation Grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
                    <TabButton
                        active={activeTab === 'config'}
                        onClick={() => { setActiveTab('config'); window.history.pushState({}, '', '?tab=config'); }}
                        icon={<Settings className="w-5 h-5" />}
                        label="Config"
                        desc="Setup API"
                    />
                    <TabButton
                        active={activeTab === 'create'}
                        onClick={() => { setActiveTab('create'); window.history.pushState({}, '', '?tab=create'); }}
                        icon={<FilePlus className="w-5 h-5" />}
                        label="Create"
                        desc="New Bundle"
                    />
                    <TabButton
                        active={activeTab === 'list'}
                        onClick={() => { setActiveTab('list'); window.history.pushState({}, '', '?tab=list'); }}
                        icon={<List className="w-5 h-5" />}
                        label="Bundles"
                        desc="View All"
                    />
                    <TabButton
                        active={activeTab === 'numbers'}
                        onClick={() => { setActiveTab('numbers'); window.history.pushState({}, '', '?tab=numbers'); }}
                        icon={<Phone className="w-5 h-5" />}
                        label="Numbers"
                        desc="Manage All"
                    />


                    {/* Maintenance Tool */}
                    <Link
                        href="/admin/twilio/cleanup"
                        className="group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50"
                    >
                        <div className="p-2 rounded-lg bg-gray-800 text-gray-400 group-hover:text-blue-400 group-hover:scale-110 transition-all mb-2">
                            <span className="text-xl">🧹</span>
                        </div>
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white">Maintenance</span>
                        <span className="text-xs text-gray-500 mt-0.5">Cleanup Tools</span>
                    </Link>
                </div>

                {/* Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'config' && (
                        <ConfigurationForm onSave={handleConfigSave} />
                    )}

                    {activeTab === 'create' && (
                        <CreateBundleForm
                            credentials={credentials}
                            onSuccess={() => setActiveTab('list')}
                        />
                    )}

                    {activeTab === 'list' && (
                        <BundleList credentials={credentials} />
                    )}

                    {activeTab === 'numbers' && (
                        <NumberManager credentials={credentials} />
                    )}
                </div>
            </div>
        </div>
    );
}

const TabButton = ({ active, onClick, icon, label, desc }: any) => (
    <button
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${active
            ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
            : 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
            }`}
    >
        <div className={`p-2 rounded-lg mb-2 transition-all duration-200 ${active
            ? 'bg-blue-500 text-white shadow-lg'
            : 'bg-gray-800 text-gray-400 group-hover:text-blue-400 group-hover:scale-110'
            }`}>
            {icon}
        </div>
        <span className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
            {label}
        </span>
        <span className={`text-xs mt-0.5 ${active ? 'text-blue-200' : 'text-gray-500'}`}>
            {desc}
        </span>
    </button>
);

export default function TwilioAdminPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 text-white p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <TwilioAdminContent />
        </Suspense>
    );
}