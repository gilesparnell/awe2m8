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
    Pencil,
    Check,
    X,
    Search
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
    customer?: string;
}

interface SubAccount {
    sid: string;
    friendlyName: string;
    numbers: TwilioNumber[];
}

interface AvailableNumber {
    phoneNumber: string;
    friendlyName?: string;
    locality?: string;
    region?: string;
}

interface ApprovedBundleCountriesResponse {
    success: boolean;
    countries?: string[];
    error?: string;
}

interface BundleListItem {
    status?: string;
    isoCountry?: string;
    iso_country?: string;
    regulationType?: string;
    regulation_type?: string;
}

interface BundlesApiResponse {
    results?: BundleListItem[];
    error?: string;
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
    const [editingCustomerSid, setEditingCustomerSid] = useState<string | null>(null);
    const [customerDraft, setCustomerDraft] = useState('');
    const [savingCustomerSid, setSavingCustomerSid] = useState<string | null>(null);
    const [customerFilter, setCustomerFilter] = useState('');
    const [createSubAccountSid, setCreateSubAccountSid] = useState('');
    const [createCountry, setCreateCountry] = useState('');
    const [approvedBundleCountries, setApprovedBundleCountries] = useState<string[]>([]);
    const [loadingBundleCountries, setLoadingBundleCountries] = useState(false);
    const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');
    const [searchingAvailableNumbers, setSearchingAvailableNumbers] = useState(false);
    const [creatingNumber, setCreatingNumber] = useState(false);
    const [activeTab, setActiveTab] = useState<'move' | 'create'>('move');

    // Track which dropdown is open (by number SID)
    const [openMenuSid, setOpenMenuSid] = useState<string | null>(null);

    // Fetch all subaccounts and their numbers
    const fetchAllData = useCallback(async () => {
        // We allow the request to proceed even without client-side credentials,
        // as the backend may have server-side environment variables configured.
        if (!credentials.accountSid || !credentials.authToken) {
            console.log("NumberManager: No client credentials provided. Attempting to use Server Environment Variables via API...");
        } else {
            console.log("NumberManager: Using provided client credentials.");
        }

        console.log("NumberManager: Starting fetchAllData...");
        setOpenMenuSid(null); // Close any open menus so overlay doesn't block UI
        setEditingCustomerSid(null);
        setLoading(true);
        setError(null);
        setSubAccounts([]);

        try {
            // First get list of subaccounts
            console.log("NumberManager: Fetching subaccounts list...");
            const accountsRes = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list-accounts',
                    accountSid: credentials.accountSid || '',
                    authToken: credentials.authToken || ''
                })
            });

            if (!accountsRes.ok) {
                const errorData = await accountsRes.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch accounts: ${accountsRes.statusText}`);
            }

            const accountsData = await accountsRes.json();
            const knownAccounts = accountsData.subAccounts || [];
            console.log(`NumberManager: Found ${knownAccounts.length} subaccounts.`);

            // Fetch numbers from each known subaccount in PARALLEL
            const accountsWithNumbers = await Promise.all(knownAccounts.map(async (account: any) => {
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

                    let numbers: TwilioNumber[] = [];
                    if (data.success && data.numbers) {
                        numbers = data.numbers.map((n: any) => ({
                            ...n,
                            accountSid: account.sid,
                            accountName: account.friendlyName
                        }));
                    }

                    return {
                        sid: account.sid,
                        friendlyName: account.friendlyName,
                        numbers: numbers
                    };

                } catch (e) {
                    console.warn(`Failed to fetch numbers for ${account.friendlyName}:`, e);
                    // Return account with empty numbers on error to preserve it in the list
                    return {
                        sid: account.sid,
                        friendlyName: account.friendlyName,
                        numbers: []
                    };
                }
            }));

            setSubAccounts(accountsWithNumbers);
            setCreateSubAccountSid((current) => {
                if (current && accountsWithNumbers.some(a => a.sid === current)) return current;
                return accountsWithNumbers[0]?.sid || '';
            });

        } catch (err: any) {
            console.error("NumberManager Error:", err);
            setError('Failed to load accounts and numbers: ' + err.message);
        } finally {
            setLoading(false);
            console.log("NumberManager: Fetch complete.");
        }
    }, [credentials.accountSid, credentials.authToken]);

    // Initial load - ensures runs on mount and when creds become available
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        const extractCountryFromBundle = (bundle: BundleListItem): string => {
            const directIso = (bundle.isoCountry || bundle.iso_country || '').toUpperCase();
            if (directIso.length === 2) return directIso;
            const regulationType = (bundle.regulationType || bundle.regulation_type || '').toUpperCase();
            const prefix = regulationType.split(/[^A-Z]/).find(Boolean) || '';
            return prefix.length === 2 ? prefix : '';
        };

        const deriveCountriesFromBundlesApi = async (): Promise<string[]> => {
            const res = await fetch(`/api/twilio/bundles?subAccountSid=${encodeURIComponent(createSubAccountSid)}&limit=100`, {
                headers: {
                    ...(credentials.accountSid ? { 'x-twilio-account-sid': credentials.accountSid } : {}),
                    ...(credentials.authToken ? { 'x-twilio-auth-token': credentials.authToken } : {})
                }
            });
            const data: BundlesApiResponse = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load bundles');
            }

            const approved = (data.results || []).filter((bundle) => {
                const status = String(bundle.status || '').toLowerCase();
                return status.includes('approved') && !status.includes('rejected');
            });

            return Array.from(
                new Set(approved.map(extractCountryFromBundle).filter((iso) => iso.length === 2))
            ).sort();
        };

        const loadApprovedBundleCountries = async () => {
            if (!createSubAccountSid) {
                setApprovedBundleCountries([]);
                setCreateCountry('');
                return;
            }

            setLoadingBundleCountries(true);
            try {
                const response = await fetch('/api/twilio/port-number', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'list-approved-bundle-countries',
                        accountSid: credentials.accountSid || '',
                        authToken: credentials.authToken || '',
                        subAccountSid: createSubAccountSid
                    })
                });

                const data: ApprovedBundleCountriesResponse = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to load approved bundle countries');
                }

                let countries = data.countries || [];
                if (countries.length === 0) {
                    // Fallback to same source used by Bundle Manager to avoid API shape mismatches.
                    countries = await deriveCountriesFromBundlesApi();
                }
                setApprovedBundleCountries(countries);
                setCreateCountry((prev) => (prev && countries.includes(prev) ? prev : (countries[0] || '')));
            } catch (err: any) {
                setApprovedBundleCountries([]);
                setCreateCountry('');
                setError(err.message || 'Failed to load approved bundle countries');
            } finally {
                setLoadingBundleCountries(false);
            }
        };

        loadApprovedBundleCountries();
    }, [createSubAccountSid, credentials.accountSid, credentials.authToken]);

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

    const startEditCustomer = (number: TwilioNumber) => {
        setEditingCustomerSid(number.sid);
        setCustomerDraft(number.customer || '');
    };

    const cancelEditCustomer = () => {
        setEditingCustomerSid(null);
        setCustomerDraft('');
    };

    const saveCustomer = async (number: TwilioNumber) => {
        setSavingCustomerSid(number.sid);
        setError(null);

        try {
            const response = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update-customer',
                    accountSid: credentials.accountSid || '',
                    authToken: credentials.authToken || '',
                    phoneNumberSid: number.sid,
                    customer: customerDraft
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to save customer');
            }

            setSubAccounts(prev => prev.map(account => ({
                ...account,
                numbers: account.numbers.map(n => n.sid === number.sid ? { ...n, customer: data.data.customer } : n)
            })));
            setEditingCustomerSid(null);
            setCustomerDraft('');
        } catch (err: any) {
            setError(err.message || 'Failed to save customer');
        } finally {
            setSavingCustomerSid(null);
        }
    };

    const searchAvailableNumbers = async () => {
        if (!createSubAccountSid) {
            setError('Select a subaccount before searching for numbers');
            return;
        }
        if (!createCountry) {
            setError('No approved bundle countries found for this subaccount');
            return;
        }

        setSearchingAvailableNumbers(true);
        setError(null);
        setSuccess(null);
        setSelectedPhoneNumber('');
        setAvailableNumbers([]);

        try {
            const response = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'search-available-numbers',
                    accountSid: credentials.accountSid || '',
                    authToken: credentials.authToken || '',
                    subAccountSid: createSubAccountSid,
                    isoCountry: createCountry,
                    limit: 20
                })
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to search available numbers');
            }

            const numbers = data.numbers || [];
            setAvailableNumbers(numbers);
            setSelectedPhoneNumber(numbers[0]?.phoneNumber || '');
            if (numbers.length === 0) {
                setSuccess(`No available ${createCountry} numbers were returned by Twilio.`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to search available numbers');
        } finally {
            setSearchingAvailableNumbers(false);
        }
    };

    const createNumber = async () => {
        if (!createSubAccountSid) {
            setError('Select a subaccount before creating a number');
            return;
        }
        if (!createCountry) {
            setError('No approved bundle countries found for this subaccount');
            return;
        }
        if (!selectedPhoneNumber) {
            setError('Select an available number to create');
            return;
        }

        setCreatingNumber(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create-number',
                    accountSid: credentials.accountSid || '',
                    authToken: credentials.authToken || '',
                    subAccountSid: createSubAccountSid,
                    isoCountry: createCountry,
                    phoneNumber: selectedPhoneNumber
                })
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create number');
            }

            setSuccess(`✨ Successfully created ${data.data.phoneNumber} in ${subAccounts.find(a => a.sid === createSubAccountSid)?.friendlyName || 'selected subaccount'}.`);
            setAvailableNumbers(prev => prev.filter(n => n.phoneNumber !== selectedPhoneNumber));
            setSelectedPhoneNumber('');
            await fetchAllData();
        } catch (err: any) {
            setError(err.message || 'Failed to create number');
        } finally {
            setCreatingNumber(false);
        }
    };

    const getAccountColor = (index: number) => ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
    const normalizedCustomerFilter = customerFilter.trim().toLowerCase();
    const hasActiveCustomerFilter = normalizedCustomerFilter.length > 0;
    const visibleSubAccounts = hasActiveCustomerFilter
        ? subAccounts
            .map((account) => ({
                ...account,
                numbers: account.numbers.filter((number) => (number.customer || '').toLowerCase().includes(normalizedCustomerFilter))
            }))
            .filter((account) => account.numbers.length > 0)
        : subAccounts;

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
                    onClick={() => {
                        console.log("Refesh clicked");
                        fetchAllData();
                    }}
                    disabled={loading}
                    className="relative z-10 flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50 text-sm cursor-pointer"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="inline-flex p-1 rounded-xl border border-gray-800 bg-gray-900/70 gap-1">
                <button
                    onClick={() => {
                        setActiveTab('move');
                        setOpenMenuSid(null);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === 'move' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800'}`}
                >
                    Move Numbers
                </button>
                <button
                    onClick={() => {
                        setActiveTab('create');
                        setOpenMenuSid(null);
                        setEditingCustomerSid(null);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === 'create' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800'}`}
                >
                    Create New Number
                </button>
            </div>

            {activeTab === 'create' && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Create Twilio Number</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Purchase a new number for a subaccount. Requires an approved regulatory bundle in that subaccount.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                            <label htmlFor="create-subaccount" className="block text-xs font-semibold text-gray-400 mb-1.5">Subaccount</label>
                            <select
                                id="create-subaccount"
                                value={createSubAccountSid}
                                onChange={(e) => {
                                    setCreateSubAccountSid(e.target.value);
                                    setAvailableNumbers([]);
                                    setSelectedPhoneNumber('');
                                }}
                                className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="" disabled>Select a subaccount</option>
                                {subAccounts.map(account => (
                                    <option key={account.sid} value={account.sid}>
                                        {account.friendlyName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="create-country" className="block text-xs font-semibold text-gray-400 mb-1.5">Country</label>
                            <select
                                id="create-country"
                                value={createCountry}
                                onChange={(e) => {
                                    setCreateCountry(e.target.value);
                                    setAvailableNumbers([]);
                                    setSelectedPhoneNumber('');
                                }}
                                disabled={loadingBundleCountries || approvedBundleCountries.length === 0}
                                className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            >
                                <option value="" disabled>
                                    {loadingBundleCountries ? 'Loading approved countries...' : (approvedBundleCountries.length ? 'Select a country' : 'No approved bundle countries')}
                                </option>
                                {approvedBundleCountries.map((iso) => (
                                    <option key={iso} value={iso}>{iso}</option>
                                ))}
                            </select>
                            {approvedBundleCountries.length === 0 && !loadingBundleCountries && (
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Create and approve a regulatory bundle in this subaccount before purchasing numbers.
                                </p>
                            )}
                            {approvedBundleCountries.length > 0 && (
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Eligible countries: {approvedBundleCountries.join(', ')}
                                </p>
                            )}
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={searchAvailableNumbers}
                                disabled={searchingAvailableNumbers || loadingBundleCountries || !createSubAccountSid || !createCountry}
                                className="w-full h-10 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {searchingAvailableNumbers && <Loader2 className="w-4 h-4 animate-spin" />}
                                Find Available
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                        <div className="md:col-span-3">
                            <label htmlFor="available-numbers" className="block text-xs font-semibold text-gray-400 mb-1.5">Available Numbers</label>
                            <select
                                id="available-numbers"
                                value={selectedPhoneNumber}
                                onChange={(e) => setSelectedPhoneNumber(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                disabled={availableNumbers.length === 0}
                            >
                                <option value="" disabled>{availableNumbers.length ? 'Select a number' : 'Search first to load numbers'}</option>
                                {availableNumbers.map((n) => (
                                    <option key={n.phoneNumber} value={n.phoneNumber}>
                                        {n.phoneNumber}{n.locality ? ` - ${n.locality}` : ''}{n.region ? `, ${n.region}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={createNumber}
                                disabled={creatingNumber || !selectedPhoneNumber}
                                className="w-full h-10 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {creatingNumber && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Number
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'move' && (
                <div className="relative max-w-md">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={customerFilter}
                        onChange={(e) => setCustomerFilter(e.target.value)}
                        placeholder="Search numbers by customer"
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            )}

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
            {activeTab === 'move' && loading && subAccounts.length === 0 && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="ml-3 text-gray-400">Loading accounts and numbers...</span>
                </div>
            )}

            {/* List Layout for Accounts */}
            {activeTab === 'move' && !loading && visibleSubAccounts.length > 0 && (
                <div className="flex flex-col gap-3">
                    {visibleSubAccounts.map((account, accountIndex) => {
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
                                                    {editingCustomerSid === number.sid ? (
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                value={customerDraft}
                                                                onChange={(e) => setCustomerDraft(e.target.value)}
                                                                placeholder="Optional customer"
                                                                className="h-7 px-2 w-40 rounded-md border border-gray-700 bg-gray-800 text-[11px] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    saveCustomer(number);
                                                                }}
                                                                disabled={savingCustomerSid === number.sid}
                                                                className="p-1 rounded hover:bg-emerald-600/20 text-emerald-400 transition-colors disabled:opacity-50"
                                                                title="Save Customer"
                                                            >
                                                                {savingCustomerSid === number.sid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    cancelEditCustomer();
                                                                }}
                                                                className="p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
                                                                title="Cancel Customer Edit"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-500">
                                                            Customer: {number.customer?.trim() ? number.customer : 'Unassigned'}
                                                        </span>
                                                    )}
                                                </div>

                                                {editingCustomerSid !== number.sid && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditCustomer(number);
                                                        }}
                                                        className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-500 hover:text-cyan-400"
                                                        title="Edit Customer"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

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

            {/* Filter Empty State */}
            {activeTab === 'move' && !loading && subAccounts.length > 0 && hasActiveCustomerFilter && visibleSubAccounts.length === 0 && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
                    <h3 className="text-lg font-bold text-white mb-2">No matching customers</h3>
                    <p className="text-gray-400 text-sm">
                        No numbers found for "{customerFilter.trim()}".
                    </p>
                </div>
            )}

            {/* Empty State */}
            {activeTab === 'move' && !loading && subAccounts.length === 0 && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Subaccounts Found</h3>
                    <p className="text-gray-400 mb-6">
                        Configure your subaccounts in the Configuration tab to see numbers here.
                    </p>
                </div>
            )}

            {/* Click Outside Overlay */}
            {activeTab === 'move' && openMenuSid && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setOpenMenuSid(null)}
                    aria-label="Close menu"
                />
            )}
        </div>
    );
};
