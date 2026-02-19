'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { GHLTriggerPage } from '@/types';
import { Plus, Copy, Edit2, Trash2, ChevronLeft, AlertCircle, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GHLTriggersPage() {
    const router = useRouter();
    const [triggers, setTriggers] = useState<GHLTriggerPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setLoading(true);
        const triggersQuery = query(
            collection(db, 'ghl_triggers'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            triggersQuery,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => doc.data() as GHLTriggerPage);
                setTriggers(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching triggers:', err);
                setError('Failed to load triggers');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'ghl_triggers', id));
            setDeleteId(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete trigger');
        }
    };

    const handleCopyUrl = (id: string) => {
        const url = `${window.location.origin}/ghl-triggers/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const filteredTriggers = useMemo(() => {
        if (!searchQuery.trim()) return triggers;
        const query = searchQuery.toLowerCase();
        return triggers.filter(trigger =>
            trigger.name.toLowerCase().includes(query) ||
            trigger.description?.toLowerCase().includes(query) ||
            trigger.id.toLowerCase().includes(query)
        );
    }, [triggers, searchQuery]);

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Tools
                    </Link>

                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-white">GHL Workflow Triggers</h1>
                        <Link
                            href="/admin/ghl-workflow-triggers/new"
                            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Trigger
                        </Link>
                    </div>
                    <p className="text-gray-400 mb-6">
                        Create custom webhook pages for GoHighLevel automation workflows.
                    </p>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search triggers by name, description, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin">
                            <div className="w-8 h-8 border-4 border-gray-700 border-t-orange-500 rounded-full"></div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && triggers.length === 0 && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="w-16 h-16 bg-orange-900/20 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-orange-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No triggers yet</h3>
                        <p className="text-gray-400 mb-6">
                            Create your first GHL workflow trigger to get started.
                        </p>
                        <Link
                            href="/admin/ghl-workflow-triggers/new"
                            className="inline-block bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                        >
                            Create First Trigger
                        </Link>
                    </div>
                )}

                {/* No Results */}
                {!loading && triggers.length > 0 && filteredTriggers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No triggers match your search.</p>
                    </div>
                )}

                {/* Triggers List */}
                {!loading && filteredTriggers.length > 0 && (
                    <div className="space-y-3">
                        {filteredTriggers.map((trigger) => (
                            <div key={trigger.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-orange-500/30 transition-colors flex items-center justify-between group">
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/admin/ghl-workflow-triggers/view/${trigger.id}`}
                                        className="text-lg font-bold text-orange-400 hover:text-orange-300 transition-colors text-left truncate block"
                                    >
                                        {trigger.name}
                                    </Link>
                                    {trigger.description && (
                                        <p className="text-sm text-gray-400 line-clamp-1">{trigger.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span>{formatDate(trigger.createdAt)}</span>
                                        <span>{Math.round(trigger.code.length / 1024)} KB</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                    <button
                                        onClick={() => handleCopyUrl(trigger.id)}
                                        className="p-2 hover:bg-gray-800 rounded transition-colors"
                                        title="Copy public URL"
                                    >
                                        <Copy className={`w-4 h-4 ${copiedId === trigger.id ? 'text-green-400' : 'text-gray-400'}`} />
                                    </button>
                                    <Link
                                        href={`/admin/ghl-workflow-triggers/edit/${trigger.id}`}
                                        className="p-2 hover:bg-gray-800 rounded transition-colors"
                                        title="Edit trigger"
                                    >
                                        <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-orange-400" />
                                    </Link>
                                    <button
                                        onClick={() => setDeleteId(trigger.id)}
                                        className="p-2 hover:bg-red-900/20 rounded transition-colors"
                                        title="Delete trigger"
                                    >
                                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm">
                            <h3 className="text-lg font-bold text-white mb-4">Delete Trigger?</h3>
                            <p className="text-gray-400 mb-6">
                                This action cannot be undone. The trigger and its public URL will be permanently deleted.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteId)}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
