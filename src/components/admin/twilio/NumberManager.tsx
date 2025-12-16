/**
 * Number Manager - Clean UI for viewing and porting Twilio numbers
 * 
 * Features:
 * - Shows all numbers across all subaccounts in a condensed list view
 * - Horizontal layout: Account Info | Numbers
 * - Inline move functionality with dropdown
 * - Confetti celebration on successful port
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Phone,
    ArrowRight,
    Loader2,
    RefreshCw,
    AlertCircle,
    Building2,
    Sparkles,
    Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Credentials {
    accountSid: string;
    authToken: string;
}

interface TwilioNumber {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
    accountSid: string;
    accountName?: string;
}

interface SubAccount {
    sid: string;
    friendlyName: string;
    numbers: TwilioNumber[];
}

// Predefined account colors for visual distinction
const ACCOUNT_COLORS = [
    { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-600' },
    { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-600' },
    { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400', badge: 'bg-purple-600' },
    { bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-600' },
    { bg: 'bg-pink-500/5', border: 'border-pink-500/20', text: 'text-pink-400', badge: 'bg-pink-600' },
    { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', badge: 'bg-cyan-600' },
];

interface NumberManagerProps {
    credentials: Credentials;
}

export const NumberManager: React.FC<NumberManagerProps> = ({ credentials }) => {
    const [loading, setLoading] = useState(false);
    const [porting, setPorting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);

    // Track which dropdown is open (by number SID)
    const [openMenuSid, setOpenMenuSid] = useState<string | null>(null);

    // Fetch all subaccounts and their numbers
    const fetchAllData = useCallback(async () => {
        if (!credentials.accountSid || !credentials.authToken) return;

        setLoading(true);
        setError(null);

        try {
            // First get list of subaccounts
            const accountsRes = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list-accounts',
                    accountSid: credentials.accountSid,
                    authToken: credentials.authToken
                })
            });
            const accountsData = await accountsRes.json();

            // Fetch numbers from each known subaccount
            const knownAccounts = accountsData.subAccounts || [];

            const accountsWithNumbers: SubAccount[] = [];

            for (const account of knownAccounts) {
                try {
                    const response = await fetch('/api/twilio/port-number', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'list',
                            accountSid: credentials.accountSid,
                            authToken: credentials.authToken,
                            sourceAccountSid: account.sid
                        })
                    });

                    const data = await response.json();

                    if (data.success && data.numbers) {
                        const numbersWithAccount = data.numbers.map((n: any) => ({
                            ...n,
                            accountSid: account.sid,
                            accountName: account.friendlyName
                        }));

                        accountsWithNumbers.push({
                            sid: account.sid,
                            friendlyName: account.friendlyName,
                            numbers: numbersWithAccount
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to fetch numbers for ${account.friendlyName}:`, e);
                }
            }

            setSubAccounts(accountsWithNumbers);

        } catch (err: any) {
            setError('Failed to load accounts and numbers: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [credentials.accountSid, credentials.authToken]);

    // Initial load - ensures runs on mount and when creds become available
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const executePort = async (number: TwilioNumber, targetSid: string) => {
        setPorting(true);
        setError(null);
        setOpenMenuSid(null);

        try {
            const response = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountSid: credentials.accountSid,
                    authToken: credentials.authToken,
                    sourceAccountSid: number.accountSid,
                    targetAccountSid: targetSid,
                    phoneNumberSid: number.sid
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to port number');
            }

            // Find target account name
            const targetAccountName = subAccounts.find(a => a.sid === targetSid)?.friendlyName || 'target account';

            setSuccess(`✨ Successfully moved ${number.phoneNumber} to ${targetAccountName}!`);

            // CELEBRATE! 🎉
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#22c55e', '#3b82f6', '#a855f7', '#ffffff']
            });

            // Refresh the data
            await fetchAllData();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setPorting(false);
        }
    };

    const getAccountColor = (index: number) => ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Phone className="w-7 h-7 text-blue-400" />
                        Number Manager
                    </h2>
                    <p className="text-gray-400 mt-1">
                        View and move phone numbers between subaccounts
                    </p>
                </div>
                <button
                    onClick={fetchAllData}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Notifications */}
            {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <Sparkles className="w-5 h-5" />
                    <span>{success}</span>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && subAccounts.length === 0 && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="ml-3 text-gray-400">Loading accounts and numbers...</span>
                </div>
            )}

            {/* List Layout for Accounts */}
            {!loading && subAccounts.length > 0 && (
                <div className="flex flex-col gap-3">
                    {subAccounts.map((account, accountIndex) => {
                        const colors = getAccountColor(accountIndex);
                        const hasNumbers = account.numbers.length > 0;

                        return (
                            <div
                                key={account.sid}
                                className={`${colors.bg} ${colors.border} border rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-lg hover:bg-opacity-50`}
                            >
                                {/* Account Info (Left) */}
                                <div className="flex items-center gap-3 min-w-[250px]">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.badge}`} />
                                    <div>
                                        <div className={`font-bold ${colors.text} text-sm`}>
                                            {account.friendlyName}
                                        </div>
                                        <div className="flex items-center gap-2 group cursor-pointer" title="Copy SID">
                                            <code className="text-xs text-gray-500 font-mono">
                                                {account.sid}
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* Numbers List (Right/Flex) */}
                                <div className="flex-1 flex flex-wrap items-center gap-2 justify-start md:justify-end">
                                    {!hasNumbers ? (
                                        <div className="text-xs text-gray-600 italic px-2">
                                            No numbers
                                        </div>
                                    ) : (
                                        account.numbers.map((number) => (
                                            <div
                                                key={number.sid}
                                                className="relative group flex items-center bg-gray-900 border border-gray-700 rounded-md pl-3 pr-1 py-1 gap-2 hover:border-gray-600 transition-colors"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs text-gray-200 font-medium">
                                                        {number.phoneNumber}
                                                    </span>
                                                </div>

                                                {/* Move Action */}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuSid(openMenuSid === number.sid ? null : number.sid);
                                                        }}
                                                        className={`p-1 rounded hover:bg-gray-700 transition-colors ${openMenuSid === number.sid ? 'text-blue-400 bg-gray-800' : 'text-gray-500 hover:text-blue-400'
                                                            }`}
                                                        title="Move Number"
                                                    >
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openMenuSid === number.sid && (
                                                        <div className={`absolute right-0 z-50 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right
                                                            ${(accountIndex > subAccounts.length / 2) ? 'bottom-full mb-2' : 'top-full mt-2'}
                                                        `}>
                                                            <div className="bg-gray-800/50 px-3 py-2 border-b border-gray-800">
                                                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Move to Account</div>
                                                            </div>
                                                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                                {porting ? (
                                                                    <div className="p-3 text-center text-xs text-blue-400 flex items-center justify-center gap-2">
                                                                        <Loader2 className="w-3 h-3 animate-spin api-spin" />
                                                                        Moving...
                                                                    </div>
                                                                ) : (
                                                                    subAccounts
                                                                        .filter(a => a.sid !== account.sid)
                                                                        .map(target => (
                                                                            <button
                                                                                key={target.sid}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    executePort(number, target.sid);
                                                                                }}
                                                                                className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors truncate flex items-center justify-between group/item"
                                                                            >
                                                                                <span className="truncate">{target.friendlyName}</span>
                                                                            </button>
                                                                        ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {!loading && subAccounts.length === 0 && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Subaccounts Found</h3>
                    <p className="text-gray-400 mb-6">
                        Configure your subaccounts in the Configuration tab to see numbers here.
                    </p>
                </div>
            )}

            {/* Click Outside Overlay */}
            {openMenuSid && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setOpenMenuSid(null)}
                    aria-label="Close menu"
                />
            )}
        </div>
    );
};
