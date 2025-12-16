/**
 * Number Manager - Clean UI for viewing and porting Twilio numbers
 * 
 * Features:
 * - Shows all numbers across all subaccounts in one view
 * - Easy drag-and-drop or click-to-move functionality
 * - Visual account grouping with color coding
 * - Confetti celebration on successful port
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Phone,
    ArrowRight,
    Loader2,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Building2,
    Hash,
    ChevronDown,
    Sparkles
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
    { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-600' },
    { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-600' },
    { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-600' },
    { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-600' },
    { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', badge: 'bg-pink-600' },
    { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-600' },
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
    const [allNumbers, setAllNumbers] = useState<TwilioNumber[]>([]);

    const [selectedNumber, setSelectedNumber] = useState<TwilioNumber | null>(null);
    const [targetAccount, setTargetAccount] = useState<string>('');
    const [showMoveDialog, setShowMoveDialog] = useState(false);

    // Fetch all subaccounts and their numbers
    const fetchAllData = useCallback(async () => {
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
            const numbersFlat: TwilioNumber[] = [];

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

                        numbersFlat.push(...numbersWithAccount);
                    }
                } catch (e) {
                    console.warn(`Failed to fetch numbers for ${account.friendlyName}:`, e);
                }
            }

            setSubAccounts(accountsWithNumbers);
            setAllNumbers(numbersFlat);

        } catch (err: any) {
            setError('Failed to load accounts and numbers: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [credentials]);

    useEffect(() => {
        if (credentials.accountSid) {
            fetchAllData();
        }
    }, [credentials, fetchAllData]);

    const handleMoveClick = (number: TwilioNumber) => {
        setSelectedNumber(number);
        setTargetAccount('');
        setShowMoveDialog(true);
        setError(null);
        setSuccess(null);
    };

    const executePort = async () => {
        if (!selectedNumber || !targetAccount) return;

        setPorting(true);
        setError(null);

        try {
            const response = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountSid: credentials.accountSid,
                    authToken: credentials.authToken,
                    sourceAccountSid: selectedNumber.accountSid,
                    targetAccountSid: targetAccount,
                    phoneNumberSid: selectedNumber.sid
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to port number');
            }

            // Find target account name
            const targetAccountName = subAccounts.find(a => a.sid === targetAccount)?.friendlyName || targetAccount;

            setSuccess(`✨ Successfully moved ${selectedNumber.phoneNumber} to ${targetAccountName}!`);
            setShowMoveDialog(false);
            setSelectedNumber(null);

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
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <Sparkles className="w-5 h-5" />
                    <span>{success}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="ml-3 text-gray-400">Loading accounts and numbers...</span>
                </div>
            )}

            {/* Numbers by Account */}
            {!loading && subAccounts.length > 0 && (
                <div className="grid gap-6">
                    {subAccounts.map((account, accountIndex) => {
                        const colors = getAccountColor(accountIndex);
                        return (
                            <div
                                key={account.sid}
                                className={`${colors.bg} ${colors.border} border rounded-2xl overflow-hidden`}
                            >
                                {/* Account Header */}
                                <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${colors.badge}`} />
                                        <div>
                                            <h3 className={`font-bold ${colors.text}`}>
                                                {account.friendlyName}
                                            </h3>
                                            <code className="text-xs text-gray-500 font-mono">
                                                {account.sid}
                                            </code>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {account.numbers.length} number{account.numbers.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Numbers List */}
                                <div className="divide-y divide-gray-800/30">
                                    {account.numbers.length === 0 ? (
                                        <div className="px-6 py-8 text-center text-gray-500">
                                            No phone numbers in this account
                                        </div>
                                    ) : (
                                        account.numbers.map((number) => (
                                            <div
                                                key={number.sid}
                                                className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Phone className="w-5 h-5 text-gray-500" />
                                                    <div>
                                                        <div className="font-mono font-bold text-white">
                                                            {number.phoneNumber}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            {number.friendlyName && number.friendlyName !== number.phoneNumber && (
                                                                <span className="text-sm text-gray-400">
                                                                    {number.friendlyName}
                                                                </span>
                                                            )}
                                                            <code className="text-xs text-gray-600 font-mono">
                                                                {number.sid}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleMoveClick(number)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                    Move
                                                </button>
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

            {/* Move Dialog */}
            {showMoveDialog && selectedNumber && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-2">Move Phone Number</h3>
                        <p className="text-gray-400 mb-6">
                            Select the destination account for <span className="text-blue-400 font-mono">{selectedNumber.phoneNumber}</span>
                        </p>

                        {/* Current Location */}
                        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Location</div>
                            <div className="text-white font-medium">{selectedNumber.accountName}</div>
                            <code className="text-xs text-gray-500">{selectedNumber.accountSid}</code>
                        </div>

                        {/* Target Account Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Move To
                            </label>
                            <div className="relative">
                                <select
                                    value={targetAccount}
                                    onChange={(e) => setTargetAccount(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="">Select destination account...</option>
                                    {subAccounts
                                        .filter(a => a.sid !== selectedNumber.accountSid)
                                        .map((account, i) => (
                                            <option key={account.sid} value={account.sid}>
                                                {account.friendlyName}
                                            </option>
                                        ))
                                    }
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Error in dialog */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowMoveDialog(false);
                                    setSelectedNumber(null);
                                    setError(null);
                                }}
                                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executePort}
                                disabled={!targetAccount || porting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {porting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Moving...
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-5 h-5" />
                                        Move Number
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
