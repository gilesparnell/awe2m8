'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle, CheckCircle, Trash2, RefreshCw, ShieldAlert, Loader2 } from 'lucide-react';

export default function CleanupPage() {
    const [credentials, setCredentials] = useState<{ accountSid: string; authToken: string, subAccountSid?: string }>({ accountSid: '', authToken: '' });
    const [subAccountSid, setSubAccountSid] = useState('');
    const [loading, setLoading] = useState(false);
    const [healthData, setHealthData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const sid = localStorage.getItem('twilio_account_sid');
        const token = localStorage.getItem('twilio_auth_token');
        const lastSub = localStorage.getItem('twilio_last_subaccount_sid');

        if (sid && token) {
            setCredentials({ accountSid: sid, authToken: token });
        }
        if (lastSub) {
            setSubAccountSid(lastSub);
        }
    }, []);

    const runHealthCheck = async () => {
        if (!subAccountSid) {
            setError("Please enter a Subaccount SID to inspect.");
            return;
        }

        setLoading(true);
        setError(null);
        setHealthData(null);

        try {
            const res = await fetch('/api/twilio/cleanup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-twilio-account-sid': credentials.accountSid,
                    'x-twilio-auth-token': credentials.authToken
                },
                body: JSON.stringify({
                    action: 'health-check',
                    subAccountSid: subAccountSid,
                    accountSid: credentials.accountSid,
                    authToken: credentials.authToken
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setHealthData(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const runCleanup = async () => {
        if (!confirm("Are you sure? This will delete duplicate addresses and non-compliant drafts. This cannot be undone.")) return;

        setLoading(true);
        try {
            // Cleanup Addresses
            const addrRes = await fetch('/api/twilio/cleanup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-twilio-account-sid': credentials.accountSid,
                    'x-twilio-auth-token': credentials.authToken
                },
                body: JSON.stringify({
                    action: 'cleanup-addresses',
                    subAccountSid: subAccountSid,
                    accountSid: credentials.accountSid,
                    authToken: credentials.authToken
                })
            });

            const addrData = await addrRes.json();

            // Re-run health check
            await runHealthCheck();

            alert(`Cleanup Complete!\nDeleted ${addrData.summary?.deleted || 0} duplicate addresses.`);

        } catch (e: any) {
            alert(`Cleanup Failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <Link href="/admin/twilio?tab=config" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-4">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Twilio Manager
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl">🧹</span>
                        Bundle & Address Maintenance
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Scan subaccounts for "zombie" bundles, orphaned addresses, and duplicates.
                    </p>
                </header>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-gray-400 text-sm font-bold mb-2">Target Subaccount SID</label>
                            <input
                                type="text"
                                value={subAccountSid}
                                onChange={(e) => {
                                    setSubAccountSid(e.target.value);
                                    localStorage.setItem('twilio_last_subaccount_sid', e.target.value);
                                }}
                                placeholder="AC..."
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>
                        <button
                            onClick={runHealthCheck}
                            disabled={loading || !subAccountSid}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                            Run Health Check
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {healthData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Card */}
                        <div className={`border rounded-2xl p-6 ${healthData.healthy ? 'bg-green-900/10 border-green-900/30' : 'bg-orange-900/10 border-orange-900/30'}`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-full ${healthData.healthy ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {healthData.healthy ? <CheckCircle className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold ${healthData.healthy ? 'text-green-400' : 'text-orange-400'}`}>
                                        {healthData.healthy ? 'System Healthy' : 'Issues Detected'}
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        {healthData.healthy ? 'No compliance issues found in this subaccount.' : 'Verification required.'}
                                    </p>
                                </div>
                            </div>

                            {/* Issues List */}
                            {healthData.issues && healthData.issues.length > 0 && (
                                <div className="mb-4 bg-red-950/30 border border-red-900/30 rounded-lg p-4">
                                    <h3 className="text-red-400 font-bold mb-2 text-sm uppercase tracking-wide">Critical Issues</h3>
                                    <ul className="list-disc list-inside text-red-200 space-y-1 text-sm">
                                        {healthData.issues.map((issue: string, i: number) => (
                                            <li key={i}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Warnings List */}
                            {healthData.warnings && healthData.warnings.length > 0 && (
                                <div className="bg-orange-950/30 border border-orange-900/30 rounded-lg p-4">
                                    <h3 className="text-orange-400 font-bold mb-2 text-sm uppercase tracking-wide">Warnings</h3>
                                    <ul className="list-disc list-inside text-orange-200 space-y-1 text-sm">
                                        {healthData.warnings.map((warn: string, i: number) => (
                                            <li key={i}>{warn}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                                <h3 className="text-gray-400 font-bold mb-4 text-sm uppercase">Regulatory Bundles</h3>
                                <div className="space-y-2">
                                    <StatRow label="Approved" value={healthData.bundles.approved} color="text-green-400" />
                                    <StatRow label="Pending / In-Review" value={healthData.bundles.pending} color="text-yellow-400" />
                                    <StatRow label="Drafts" value={healthData.bundles.draft} color="text-gray-500" />
                                    <StatRow label="Rejected" value={healthData.bundles.rejected} color="text-red-400" />
                                </div>
                            </div>

                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                                <h3 className="text-gray-400 font-bold mb-4 text-sm uppercase">Addresses</h3>
                                <div className="space-y-2">
                                    <StatRow label="Total Addresses" value={healthData.addresses.total} />
                                    <StatRow label="Validated" value={healthData.addresses.validated} color="text-green-400" />
                                    <StatRow label="Duplicates Detected" value={healthData.addresses.hasDuplicates ? 'Yes' : 'No'} color={healthData.addresses.hasDuplicates ? 'text-red-400' : 'text-gray-500'} />
                                </div>
                            </div>
                        </div>

                        {/* Duplicate Details Table */}
                        {healthData.addresses.duplicates && healthData.addresses.duplicates.length > 0 && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mt-6">
                                <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
                                    <h3 className="text-gray-200 font-bold flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-orange-400" />
                                        Detected Duplicates
                                        <span className="text-xs font-normal text-gray-500 ml-2 bg-gray-800 px-2 py-0.5 rounded-full">
                                            {healthData.addresses.duplicates.length} items
                                        </span>
                                    </h3>
                                    <span className="text-xs text-blue-400 font-mono">
                                        Subaccount: {subAccountSid}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-gray-800/50 text-gray-400 border-b border-gray-800">
                                                <th className="px-6 py-3 font-semibold">Address</th>
                                                <th className="px-6 py-3 font-semibold">Details</th>
                                                <th className="px-6 py-3 font-semibold">Status</th>
                                                <th className="px-6 py-3 font-semibold text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {healthData.addresses.duplicates.map((dup: any) => (
                                                <tr key={dup.sid} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <div className="font-medium text-white">{dup.customerName}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{dup.sid}</div>
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-400 text-xs">
                                                        {dup.street}, {dup.city}, {dup.isoCountry}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {dup.isUsedInBundle ? (
                                                            <div className="flex items-center gap-2 text-red-300 bg-red-900/20 px-2 py-1 rounded inline-flex">
                                                                <ShieldAlert className="w-3 h-3" />
                                                                <span className="text-xs font-bold">Locked: {dup.bundleName}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-green-300 bg-green-900/20 px-2 py-1 rounded inline-flex">
                                                                <CheckCircle className="w-3 h-3" />
                                                                <span className="text-xs">Safe to Delete</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        {dup.isUsedInBundle ? (
                                                            <span className="text-xs text-gray-600 italic cursor-not-allowed">
                                                                Cannot Delete
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-red-400 opacity-50">
                                                                Pending Cleanup
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-800/50">
                            {healthData.addresses.hasDuplicates && (
                                <button
                                    onClick={runCleanup}
                                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Auto-Resolve Duplicates
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const StatRow = ({ label, value, color = "text-white" }: { label: string, value: string | number, color?: string }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">{label}</span>
        <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
);
