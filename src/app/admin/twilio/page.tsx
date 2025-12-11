
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Settings, FilePlus, List, ChevronLeft, ArrowRightLeft, Loader2 } from 'lucide-react';
import { ConfigurationForm } from '@/components/admin/twilio/ConfigurationForm';
import { CreateBundleForm } from '@/components/admin/twilio/CreateBundleForm';
import { BundleList } from '@/components/admin/twilio/BundleList';
import { NumberPortForm } from '@/components/admin/twilio/NumberPortForm';

function TwilioAdminContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'config' | 'create' | 'list' | 'port'>('config');
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
        if (tabParam && ['config', 'create', 'list', 'port'].includes(tabParam)) {
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
                        A2P 10DLC Compliance
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-600 tracking-tight mb-4">
                        Twilio Regulatory Bundle Manager
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Streamline A2P 10DLC compliance for your agency clients. Manage approvals, documents, and sub-accounts in one place.
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <TabButton
                        active={activeTab === 'config'}
                        onClick={() => setActiveTab('config')}
                        icon={<Settings className="w-5 h-5" />}
                        label="Configuration"
                    />
                    <TabButton
                        active={activeTab === 'create'}
                        onClick={() => setActiveTab('create')}
                        icon={<FilePlus className="w-5 h-5" />}
                        label="Create Bundle"
                    />
                    <TabButton
                        active={activeTab === 'list'}
                        onClick={() => setActiveTab('list')}
                        icon={<List className="w-5 h-5" />}
                        label="View Bundles"
                    />
                    <TabButton
                        active={activeTab === 'port'}
                        onClick={() => setActiveTab('port')}
                        icon={<ArrowRightLeft className="w-5 h-5" />}
                        label="Port Number"
                    />
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

                    {activeTab === 'port' && (
                        <NumberPortForm credentials={credentials} />
                    )}
                </div>
            </div>
        </div>
    );
}

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
            : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-800'
            }`}
    >
        {icon}
        {label}
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
