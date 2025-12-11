'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Grid3X3, ArrowRightLeft, Settings, FilePlus, List, Search, Loader2 } from 'lucide-react';

interface Bundle {
    sid: string;
    friendlyName: string;
    status: string;
    isoCountry: string;
    numberType: string;
    regulationType: string;
    dateCreated: string;
}

interface Address {
    sid: string;
    customerName: string;
    street: string;
    city: string;
    region: string;
    isoCountry: string;
    validated: boolean;
    dateCreated: string;
}

export default function CleanupPage() {
    const [subAccountSid, setSubAccountSid] = useState('');
    const [loading, setLoading] = useState(false);
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [duplicateAddresses, setDuplicateAddresses] = useState<string[]>([]);
    const [selectedBundles, setSelectedBundles] = useState<string[]>([]);
    const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

    const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const loadData = async () => {
        if (!subAccountSid.trim()) {
            showMessage('Please enter a sub-account SID', 'error');
            return;
        }

        setLoading(true);
        try {
            await Promise.all([
                (async () => {
                    const bundlesRes = await fetch('/api/twilio/cleanup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'list-bundles',
                            subAccountSid: subAccountSid.trim()
                        })
                    });
                    const bundlesData = await bundlesRes.json();
                    if (bundlesData.success) {
                        setBundles(bundlesData.bundles || []);
                    }
                })(),
                (async () => {
                    const addressesRes = await fetch('/api/twilio/cleanup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'list-addresses',
                            subAccountSid: subAccountSid.trim()
                        })
                    });
                    const addressesData = await addressesRes.json();
                    if (addressesData.success) {
                        setAddresses(addressesData.addresses || []);
                        setDuplicateAddresses(addressesData.duplicates || []);
                    }
                })()
            ]);

            showMessage('Data loaded successfully', 'success');
        } catch (error: any) {
            showMessage(`Error loading data: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteBundles = async (sids: string[]) => {
        if (sids.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${sids.length} bundle(s)? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/twilio/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete-bundles',
                    subAccountSid: subAccountSid.trim(),
                    bundleSids: sids
                })
            });
            const data = await res.json();

            if (data.success) {
                showMessage(`Deleted ${data.summary.deleted} bundle(s)`, 'success');
                setSelectedBundles([]);
                await loadData(); // Refresh
            } else {
                showMessage(`Error: ${data.error}`, 'error');
            }
        } catch (error: any) {
            showMessage(`Error deleting bundles: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const cleanupAddresses = async () => {
        if (!confirm('This will keep one address per country and delete all duplicates. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/twilio/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'cleanup-addresses',
                    subAccountSid: subAccountSid.trim()
                })
            });
            const data = await res.json();

            if (data.success) {
                showMessage(`Cleanup complete! Deleted ${data.summary.deleted} duplicate address(es)`, 'success');
                setSelectedAddresses([]);
                await loadData(); // Refresh
            } else {
                showMessage(`Error: ${data.error}`, 'error');
            }
        } catch (error: any) {
            showMessage(`Error cleaning up addresses: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteSelectedAddresses = async () => {
        if (selectedAddresses.length === 0) return;

        if (!confirm(`Delete ${selectedAddresses.length} selected address(es)?`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/twilio/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete-addresses',
                    subAccountSid: subAccountSid.trim(),
                    addressSids: selectedAddresses
                })
            });
            const data = await res.json();

            if (data.success) {
                showMessage(`Deleted ${data.summary.deleted} address(es)`, 'success');
                setSelectedAddresses([]);
                await loadData(); // Refresh
            } else {
                showMessage(`Error: ${data.error}`, 'error');
            }
        } catch (error: any) {
            showMessage(`Error deleting addresses: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'twilio-approved': return 'bg-green-900/30 text-green-400 border border-green-800';
            case 'pending-review':
            case 'in-review': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800';
            case 'draft': return 'bg-gray-800 text-gray-300 border border-gray-700';
            case 'twilio-rejected': return 'bg-red-900/30 text-red-400 border border-red-800';
            default: return 'bg-gray-800 text-gray-300 border border-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'twilio-approved': return '✅';
            case 'pending-review':
            case 'in-review': return '⏳';
            case 'draft': return '📝';
            case 'twilio-rejected': return '❌';
            default: return '⚪';
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Custom Header similar to AdminHeader */}
                <header className="mb-12 text-center relative">
                    <div className="mb-6">
                        <Link
                            href="/admin/twilio"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Tools
                        </Link>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-800 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 mt-8 md:mt-0">
                        A2P 10DLC Compliance
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-600 tracking-tight mb-4">
                        Twilio Compliance Cleanup
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Manage regulatory bundles and addresses for your sub-accounts. Remove duplicates and maintain compliance.
                    </p>
                </header>

                {/* Navigation Tabs */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <Link
                        href="/admin/twilio?tab=config"
                        className="flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-3 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-800"
                    >
                        <Settings className="w-5 h-5" />
                        Configuration
                    </Link>
                    <Link
                        href="/admin/twilio?tab=create"
                        className="flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-3 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-800"
                    >
                        <FilePlus className="w-5 h-5" />
                        Create Bundle
                    </Link>
                    <Link
                        href="/admin/twilio?tab=list"
                        className="flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-3 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-800"
                    >
                        <List className="w-5 h-5" />
                        View Bundles
                    </Link>
                    <Link
                        href="/admin/twilio?tab=port"
                        className="flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-3 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-800"
                    >
                        <ArrowRightLeft className="w-5 h-5" />
                        Port Number
                    </Link>
                    <button
                        className="flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-3 bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    >
                        <Grid3X3 className="w-5 h-5" />
                        Cleanup
                    </button>
                </div>

                {/* Alert Messages */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${messageType === 'success' ? 'bg-green-900/20 border-green-800 text-green-200' :
                        messageType === 'error' ? 'bg-red-900/20 border-red-800 text-red-200' :
                            'bg-blue-900/20 border-blue-800 text-blue-200'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Sub-Account Scanner */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8 shadow-xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
                            <Search className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Scan Sub-Account</h2>
                        <p className="text-gray-400">Enter a sub-account SID to view and manage compliance resources</p>
                    </div>

                    <div className="flex gap-4 max-w-2xl mx-auto">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={subAccountSid}
                                onChange={(e) => setSubAccountSid(e.target.value)}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-4 pr-4 py-4 text-white font-mono placeholder:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="bg-blue-900/40 border border-blue-800 text-blue-300 hover:bg-blue-800/40 hover:text-white px-8 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {loading ? 'Scanning...' : 'Scan Account'}
                        </button>
                    </div>
                </div>

                {/* Bundles Section */}
                {bundles.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span>📦</span> Regulatory Bundles
                                <span className="text-sm font-normal text-gray-500">({bundles.length})</span>
                            </h2>
                            {selectedBundles.length > 0 && (
                                <button
                                    onClick={() => deleteBundles(selectedBundles)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
                                >
                                    Delete Selected ({selectedBundles.length})
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {bundles.map((bundle) => (
                                <div
                                    key={bundle.sid}
                                    className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-all group"
                                >
                                    {(bundle.status === 'draft' || bundle.status === 'twilio-rejected') && (
                                        <input
                                            type="checkbox"
                                            checked={selectedBundles.includes(bundle.sid)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedBundles([...selectedBundles, bundle.sid]);
                                                } else {
                                                    setSelectedBundles(selectedBundles.filter(s => s !== bundle.sid));
                                                }
                                            }}
                                            className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-600 focus:ring-offset-gray-900"
                                        />
                                    )}

                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Name</div>
                                            <div className="font-medium text-sm truncate" title={bundle.friendlyName}>{bundle.friendlyName}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Status</div>
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${getStatusColor(bundle.status)}`}>
                                                {getStatusIcon(bundle.status)} {bundle.status}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Country</div>
                                            <div className="text-sm">{bundle.isoCountry}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Type</div>
                                            <div className="text-sm text-gray-400">{bundle.numberType}</div>
                                        </div>
                                    </div>

                                    {(bundle.status === 'draft' || bundle.status === 'twilio-rejected') && (
                                        <button
                                            onClick={() => deleteBundles([bundle.sid])}
                                            disabled={loading}
                                            className="px-3 py-1 bg-red-900/10 hover:bg-red-900/30 text-red-500 hover:text-red-400 border border-transparent hover:border-red-900/30 rounded text-xs transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Addresses Section */}
                {addresses.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span>📍</span> Addresses
                                <span className="text-sm font-normal text-gray-500">({addresses.length})</span>
                                {duplicateAddresses.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-yellow-900/30 border border-yellow-800 rounded text-xs text-yellow-400 font-mono">
                                        {duplicateAddresses.length} Duplicates
                                    </span>
                                )}
                            </h2>
                            <div className="flex gap-2">
                                {selectedAddresses.length > 0 && (
                                    <button
                                        onClick={deleteSelectedAddresses}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Delete Selected ({selectedAddresses.length})
                                    </button>
                                )}
                                {duplicateAddresses.length > 0 && (
                                    <button
                                        onClick={cleanupAddresses}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 text-blue-300 disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Auto-Cleanup Duplicates
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {addresses.map((address) => {
                                const isDuplicate = duplicateAddresses.includes(address.sid);
                                return (
                                    <div
                                        key={address.sid}
                                        className={`rounded-xl p-4 flex items-center gap-4 transition-all border group ${isDuplicate
                                            ? 'bg-yellow-900/10 border-yellow-900/30'
                                            : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedAddresses.includes(address.sid)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedAddresses([...selectedAddresses, address.sid]);
                                                } else {
                                                    setSelectedAddresses(selectedAddresses.filter(s => s !== address.sid));
                                                }
                                            }}
                                            className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-600 focus:ring-offset-gray-900"
                                        />

                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Customer</div>
                                                <div className="font-medium text-sm truncate">{address.customerName}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Address</div>
                                                <div className="text-sm text-gray-400 truncate">{address.street}, {address.city}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Country</div>
                                                <div className="text-sm">{address.isoCountry}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Status</div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    {address.validated ? (
                                                        <span className="text-green-400">✅ Validated</span>
                                                    ) : (
                                                        <span className="text-gray-500">⚪ Unverified</span>
                                                    )}
                                                    {isDuplicate && <span className="text-yellow-500 text-xs border border-yellow-900/50 bg-yellow-900/20 px-1.5 rounded">DUP</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedAddresses([...selectedAddresses, address.sid])}
                                            disabled={loading}
                                            className="px-3 py-1 bg-red-900/10 hover:bg-red-900/30 text-red-500 hover:text-red-400 border border-transparent hover:border-red-900/30 rounded text-xs transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && bundles.length === 0 && addresses.length === 0 && subAccountSid && (
                    <div className="bg-gray-900/30 border border-gray-800/50 rounded-2xl p-16 text-center animate-in fade-in zoom-in-95">
                        <div className="text-6xl mb-4 opacity-30 grayscale">📭</div>
                        <h3 className="text-xl font-bold text-white mb-2">No Resources Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">No regulatory bundles or addresses found for the provided sub-account SID.</p>
                    </div>
                )}
            </div>
        </div>
    );
}