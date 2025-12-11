'use client';

import { useState } from 'react';

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
            // Load bundles
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

            // Load addresses
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

            showMessage('Data loaded successfully', 'success');
        } catch (error: any) {
            showMessage(`Error loading data: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteBundles = async (sids: string[]) => {
        if (sids.length === 0) return;

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
            case 'twilio-approved': return 'bg-green-100 text-green-800';
            case 'pending-review':
            case 'in-review': return 'bg-yellow-100 text-yellow-800';
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'twilio-rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
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
        <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Tools
                </button>

                {/* Header with Gradient Title */}
                <div className="mb-8 text-center">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Twilio Compliance Cleanup
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Manage regulatory bundles and addresses for your sub-accounts. Remove duplicates and maintain compliance.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 mb-8 justify-center flex-wrap">
                    <button
                        onClick={() => window.location.href = '/admin/twilio?tab=config'}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all"
                    >
                        <span>⚙️</span>
                        <span>Configuration</span>
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/twilio?tab=create'}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all"
                    >
                        <span>📄</span>
                        <span>Create Bundle</span>
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/twilio?tab=list'}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all"
                    >
                        <span>📋</span>
                        <span>View Bundles</span>
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/twilio?tab=port'}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all"
                    >
                        <span>🔄</span>
                        <span>Port Number</span>
                    </button>
                    <button
                        onClick={() => window.location.href = '/twilio/cleanup'}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 border border-blue-500 rounded-xl font-medium shadow-lg shadow-blue-500/20"
                    >
                        <span>🧹</span>
                        <span>Cleanup</span>
                    </button>
                </div>

                {/* Alert Messages */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border ${messageType === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        messageType === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Sub-Account Scanner - Card Style */}
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20">
                            <span className="text-3xl">🔍</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2">Scan Sub-Account</h2>
                    <p className="text-gray-400 text-center mb-6">Enter a sub-account SID to view and manage compliance resources</p>

                    <div className="flex gap-4 max-w-2xl mx-auto">
                        <input
                            type="text"
                            value={subAccountSid}
                            onChange={(e) => setSubAccountSid(e.target.value)}
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Scanning...
                                </span>
                            ) : (
                                '🔍 Scan Account'
                            )}
                        </button>
                    </div>
                </div>

                {/* Bundles Section */}
                {bundles.length > 0 && (
                    <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <span>📦</span> Regulatory Bundles
                                <span className="text-sm font-normal text-gray-400">({bundles.length})</span>
                            </h2>
                            {selectedBundles.length > 0 && (
                                <button
                                    onClick={() => deleteBundles(selectedBundles)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600/90 hover:bg-red-600 disabled:bg-gray-700 rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/20"
                                >
                                    🗑️ Delete Selected ({selectedBundles.length})
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {bundles.map((bundle) => (
                                <div
                                    key={bundle.sid}
                                    className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-800/60 hover:border-gray-600/50 transition-all"
                                >
                                    {bundle.status !== 'twilio-approved' && (
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
                                            className="w-4 h-4"
                                        />
                                    )}

                                    <div className="flex-1 grid grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-400">Name</div>
                                            <div className="font-medium">{bundle.friendlyName}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400">Status</div>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(bundle.status)}`}>
                                                {getStatusIcon(bundle.status)} {bundle.status}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400">Country</div>
                                            <div>{bundle.isoCountry}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400">Type</div>
                                            <div className="text-sm">{bundle.numberType}</div>
                                        </div>
                                    </div>

                                    {bundle.status !== 'twilio-approved' && (
                                        <button
                                            onClick={() => deleteBundles([bundle.sid])}
                                            disabled={loading}
                                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-sm"
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
                    <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <span>📍</span> Addresses
                                <span className="text-sm font-normal text-gray-400">({addresses.length})</span>
                                {duplicateAddresses.length > 0 && (
                                    <span className="ml-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm text-yellow-400">
                                        ⚠️ {duplicateAddresses.length} duplicate(s)
                                    </span>
                                )}
                            </h2>
                            <div className="flex gap-2">
                                {selectedAddresses.length > 0 && (
                                    <button
                                        onClick={deleteSelectedAddresses}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-600/90 hover:bg-red-600 disabled:bg-gray-700 rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/20"
                                    >
                                        🗑️ Delete Selected ({selectedAddresses.length})
                                    </button>
                                )}
                                {duplicateAddresses.length > 0 && (
                                    <button
                                        onClick={cleanupAddresses}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        🧹 Cleanup Duplicates
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
                                        className={`rounded-xl p-4 flex items-center gap-4 transition-all ${isDuplicate
                                            ? 'bg-yellow-500/5 border border-yellow-500/30 hover:bg-yellow-500/10'
                                            : 'bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600/50'
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
                                            className="w-4 h-4"
                                        />

                                        <div className="flex-1 grid grid-cols-4 gap-4">
                                            <div>
                                                <div className="text-sm text-gray-400">Customer</div>
                                                <div className="font-medium">{address.customerName}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Address</div>
                                                <div className="text-sm">{address.street}, {address.city}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Country</div>
                                                <div>{address.isoCountry}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Status</div>
                                                <div className="flex items-center gap-2">
                                                    {address.validated ? (
                                                        <span className="text-green-400">✅ Validated</span>
                                                    ) : (
                                                        <span className="text-gray-400">⚪ Not validated</span>
                                                    )}
                                                    {isDuplicate && <span className="text-yellow-400">⚠️ Duplicate</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => deleteSelectedAddresses()}
                                            disabled={loading}
                                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-sm"
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
                    <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-16 text-center">
                        <div className="text-7xl mb-4 opacity-50">📭</div>
                        <h3 className="text-xl font-semibold mb-2">No Resources Found</h3>
                        <p className="text-gray-400">No bundles or addresses found for this sub-account.</p>
                    </div>
                )}
            </div>
        </div>
    );
}