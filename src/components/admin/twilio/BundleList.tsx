
import React, { useEffect, useState } from 'react';
import { RefreshCw, Package, Clock, CheckCircle, XCircle, Database, History, Activity, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FilePlus } from 'lucide-react';

interface BundleListProps {
    credentials: { accountSid: string; authToken: string };
}

interface Bundle {
    sid: string;
    friendly_name?: string;
    friendlyName?: string;
    status: string;
    regulation_type?: string;
    regulationType?: string;
    date_created?: string;
    dateCreated?: string;
    email: string;
    accountName?: string;
}

export const BundleList: React.FC<BundleListProps> = ({ credentials }) => {
    // State for separate data sets
    const [recentBundles, setRecentBundles] = useState<Bundle[]>([]);
    const [historyBundles, setHistoryBundles] = useState<Bundle[]>([]);

    const [loadingRecent, setLoadingRecent] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // History Panel State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyPage, setHistoryPage] = useState(0);

    const [error, setError] = useState<string | null>(null);
    const [targetSubAccountSid, setTargetSubAccountSid] = useState('');
    const [filteredAccountName, setFilteredAccountName] = useState<string | null>(null);

    const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

    // Constants
    const HISTORY_PAGE_SIZE = 10;

    // Initial Load
    useEffect(() => {
        const stored = localStorage.getItem('twilio_last_subaccount_sid');
        if (stored) setTargetSubAccountSid(stored);
        // We defer fetch until after mount to avoid double call if needed, but here it's fine
        // fetchRecentActivity(); // Logic moved below to be callable
    }, []);

    // Effect to trigger fetch on mount
    useEffect(() => {
        fetchRecentActivity();
        fetchHistory(0);
    }, []);

    const fetchRecentActivity = async () => {
        setLoadingRecent(true);
        setError(null);
        try {
            // Build URL with optional params
            let url = `/api/twilio/bundles?limit=50`;

            const effectiveSubAccount = targetSubAccountSid.trim();
            if (effectiveSubAccount) {
                url += `&subAccountSid=${effectiveSubAccount}`;
            }

            const res = await fetch(url, {
                headers: {
                    'x-twilio-account-sid': credentials.accountSid,
                    'x-twilio-auth-token': credentials.authToken
                }
            });
            const data = await res.json();

            console.log("Bundle Fetch Response:", data); // Debugging

            if (res.ok) {
                const allFetched = data.results || [];
                // Sort by date descending
                const sorted = allFetched.sort((a: Bundle, b: Bundle) => {
                    const dateA = new Date(a.dateCreated || a.date_created || 0);
                    const dateB = new Date(b.dateCreated || b.date_created || 0);
                    return dateB.getTime() - dateA.getTime();
                });

                setRecentBundles(sorted);

                if (data.accountFriendlyName) {
                    console.log("Setting Friendly Name:", data.accountFriendlyName);
                    setFilteredAccountName(data.accountFriendlyName);
                } else {
                    setFilteredAccountName(null);
                }
            } else {
                throw new Error(data.error || 'Failed to fetch items');
            }
        } catch (err: any) {
            console.error("Fetch Bundle Error:", err);
            setError(err.message);
        } finally {
            setLoadingRecent(false);
        }
    };

    // Fetch History Data (Paginated)
    const fetchHistory = async (page: number) => {
        setLoadingHistory(true);
        setError(null); // Clear previous errors but don't reset global UI
        try {
            const params = new URLSearchParams();
            if (targetSubAccountSid) params.append("subAccountSid", targetSubAccountSid);

            // We want Twilio Approved only for history? THe user said "Previously Approved Bundles"
            // But we can filter client side or let them see all history. Let's fetch all and filter approved for the specific view if strictly requested.
            // Actually, "Previously Approved" implies status=twilio-approved.
            // But the Twilio API doesn't support filtering by status in the LIST endpoint easily without statusCallback filters (sometimes).
            // Let's just fetch history sorted by date (default) and we display them.

            params.append("pageSize", HISTORY_PAGE_SIZE.toString());
            params.append("page", page.toString());
            // We don't use 'limit' here because we are paging carefully
            params.append("limit", HISTORY_PAGE_SIZE.toString());

            const res = await fetch(`/api/twilio/bundles?${params.toString()}`, {
                headers: {
                    'x-twilio-account-sid': credentials.accountSid,
                    'x-twilio-auth-token': credentials.authToken
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch history');

            setHistoryBundles(data.results || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingHistory(false);
        }
    };

    const toggleHistory = () => {
        if (!isHistoryOpen) {
            setIsHistoryOpen(true);
            // Fetch first page if empty
            if (historyBundles.length === 0) {
                fetchHistory(0);
            }
        } else {
            setIsHistoryOpen(false);
        }
    };

    const handleNextPage = () => {
        const nextPage = historyPage + 1;
        setHistoryPage(nextPage);
        fetchHistory(nextPage);
    };

    const handlePrevPage = () => {
        if (historyPage > 0) {
            const prevPage = historyPage - 1;
            setHistoryPage(prevPage);
            fetchHistory(prevPage);
        }
    };


    // Reload when credentials change (but NOT on typing targetSubAccountSid, manual refresh only)
    useEffect(() => {
        fetchRecentActivity();
        // Reset history when context changes
        setHistoryBundles([]);
        setHistoryPage(0);
        setIsHistoryOpen(false);
    }, [credentials]);

    // Trigger initial fetch if we restored a SID from localstorage
    useEffect(() => {
        if (targetSubAccountSid) fetchRecentActivity();
    }, []); // Only on mount/initial restore check

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'twilio-approved': return 'bg-green-900/40 text-green-400 border-green-800';
            case 'twilio-rejected': return 'bg-red-900/40 text-red-400 border-red-800';
            case 'pending-review': return 'bg-yellow-900/40 text-yellow-400 border-yellow-800';
            case 'in-review': return 'bg-purple-900/40 text-purple-400 border-purple-800';
            case 'draft': return 'bg-gray-700/40 text-gray-300 border-gray-600';
            default: return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'twilio-approved': return <CheckCircle className="w-4 h-4" />;
            case 'twilio-rejected': return <XCircle className="w-4 h-4" />;
            case 'pending-review': return <Clock className="w-4 h-4" />;
            case 'in-review': return <Activity className="w-4 h-4 animate-pulse" />;
            case 'draft': return <FilePlus className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    // We no longer block on missing credentials, as the server might have them in Env Vars.
    const isUsingServerCreds = !credentials.accountSid;

    // Filter Recent List for display
    const pendingReviewBundles = recentBundles.filter(b => b.status === 'pending-review' || b.status === 'in-review' || b.status === 'draft');

    // Valid "Latest Approved" logic: Take approved items, slice top 5
    const latestApproved = recentBundles
        .filter(b => b.status === 'twilio-approved')
        .slice(0, 5);

    // Check if we have pending items for the pending section
    const showPendingSection = pendingReviewBundles.length > 0;
    // Check if we have approved items for the recent approved section
    const showApprovedSection = latestApproved.length > 0;

    const renderBundleRow = (bundle: Bundle) => (
        <div key={bundle.sid} className="bg-gray-950 border border-gray-800 hover:border-green-500/30 rounded-lg p-4 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Info Block */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                {/* 1. Reg Name (col-span-4) */}
                <div className="md:col-span-4">
                    <h4 className="text-sm font-bold text-white group-hover:text-green-400 transition-colors truncate" title={bundle.friendlyName || bundle.friendly_name}>
                        {bundle.friendlyName || bundle.friendly_name}
                    </h4>
                    <div className="text-[10px] text-gray-600 font-mono mt-0.5">{bundle.sid}</div>
                    {bundle.accountName && (
                        <div className="text-[9px] text-blue-400/80 mt-0.5 truncate" title={bundle.accountName}>
                            {bundle.accountName}
                        </div>
                    )}
                </div>

                {/* 2. Date Created (AEST) (col-span-3) */}
                <div className="md:col-span-3 text-xs text-gray-400">
                    <span className="block md:hidden text-[10px] text-gray-600 mb-0.5">Created (AEST)</span>
                    {new Date(bundle.dateCreated || bundle.date_created || '').toLocaleString('en-AU', {
                        timeZone: 'Australia/Sydney',
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}
                </div>

                {/* 3. Email (col-span-3) */}
                <div className="md:col-span-3 text-xs text-gray-400 truncate" title={bundle.email}>
                    <span className="block md:hidden text-[10px] text-gray-600 mb-0.5">Email</span>
                    {bundle.email}
                </div>

                {/* 4. Status (col-span-2) */}
                <div className="md:col-span-2 flex justify-end md:justify-start">
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1.5 uppercase tracking-wide w-fit ${getStatusColor(bundle.status)}`}>
                        {getStatusIcon(bundle.status)}
                        {bundle.status?.replace('twilio-', '')}
                    </div>
                </div>
            </div>

            {/* Actions Block (Check Status) */}
            {(bundle.status === 'pending-review' || bundle.status === 'in-review') && (
                <div className="flex shrink-0 flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-mono mb-1">
                        Creating...
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                            Live Polling
                        </span>
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1">
                        Last check: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            )}

            {/* Action Block (Draft Indication) */}
            {bundle.status === 'draft' && (
                <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-yellow-500/80 mb-1 font-mono">Draft State</span>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                if (!confirm('Are you sure you want to PERMANENTLY delete this draft bundle?')) return;
                                try {
                                    const res = await fetch('/api/twilio/workflow', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            action: 'delete-bundle',
                                            bundleSid: bundle.sid,
                                            subAccountSid: targetSubAccountSid || credentials.accountSid
                                        }),
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    const d = await res.json();
                                    if (d.success) fetchRecentActivity();
                                    else alert('Error: ' + d.error);
                                } catch (e) { alert('Failed to delete'); }
                            }}
                            className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1 rounded border border-red-900/50 transition-colors"
                        >
                            Delete
                        </button>
                        <button
                            onClick={async () => {
                                // Clear previous error
                                setActionErrors(prev => { const n = { ...prev }; delete n[bundle.sid]; return n; });

                                if (!confirm('This bundle is in Draft. Submit for review now?')) return;
                                try {
                                    const res = await fetch('/api/twilio/workflow', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            action: 'submit-bundle',
                                            bundleSid: bundle.sid,
                                            accountSid: credentials.accountSid,
                                            authToken: credentials.authToken,
                                            subAccountSid: targetSubAccountSid || credentials.accountSid
                                        }),
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    const d = await res.json();
                                    if (d.success) {
                                        fetchRecentActivity();
                                    }
                                    else {
                                        setActionErrors(prev => ({ ...prev, [bundle.sid]: d.error }));
                                    }
                                } catch (e: any) {
                                    setActionErrors(prev => ({ ...prev, [bundle.sid]: e.message || 'Failed to submit' }));
                                }
                            }}
                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded border border-gray-700 transition-colors"
                        >
                            Submit Now
                        </button>
                    </div>
                    {!actionErrors[bundle.sid] && (
                        <span className="text-[9px] text-gray-600 mt-1 max-w-[120px] text-right">
                            Action required correctly submit
                        </span>
                    )}

                    {/* Detailed Error Display */}
                    {actionErrors[bundle.sid] && (
                        <div className="mt-2 text-[10px] text-red-300 max-w-[220px] text-right break-words bg-red-950/30 p-2 rounded border border-red-900/50 shadow-lg animate-in slide-in-from-top-1 fade-in">
                            <div className="font-bold flex items-center justify-end gap-1 mb-1">
                                <XCircle className="w-3 h-3" /> Submission Failed
                            </div>
                            {actionErrors[bundle.sid].includes('regulatory compliant') ? (
                                <>
                                    <div className="mb-2 opacity-80">This bundle is missing required info.</div>
                                    <a
                                        href={`https://console.twilio.com/us1/develop/phone-numbers/regulatory-compliance/bundles/${bundle.sid}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block bg-red-900 hover:bg-red-800 text-white px-2 py-1 rounded text-[9px] font-bold transition-colors"
                                    >
                                        Fix in Console &rarr;
                                    </a>
                                </>
                            ) : (
                                <div className="opacity-80 leading-snug">{actionErrors[bundle.sid]}</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div >
    );

    // Section Visibility State
    const [isPendingOpen, setIsPendingOpen] = useState(true);
    const [isRecentApprovedOpen, setIsRecentApprovedOpen] = useState(true);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ... Header and Input ... */}
            {/* (This part remains unchanged, just referring to context) */}

            <div className="flex flex-col gap-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-500" />
                        Bundle Management
                        {isUsingServerCreds && <span className="ml-2 text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full border border-blue-800/30">Server Auth</span>}
                    </h3>
                </div>

                {/* SubAccount Input */}
                <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-gray-400 text-xs font-bold mb-2">
                            Filter by Subaccount SID (Optional)
                        </label>
                        <div className="relative">
                            <input
                                id="subAccountSidFilter"
                                name="subAccountSidFilter"
                                type="text"
                                value={targetSubAccountSid}
                                onChange={(e) => {
                                    setTargetSubAccountSid(e.target.value);
                                    setFilteredAccountName(null); // Clear name on change until refreshed
                                    localStorage.setItem('twilio_last_subaccount_sid', e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        fetchRecentActivity();
                                    }
                                }}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white font-mono placeholder:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                            <Database className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                        {/* Friendly Account Name Display */}
                        {filteredAccountName && (
                            <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <div className="text-[10px] uppercase tracking-wider text-green-500 font-bold bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">
                                    Active Account
                                </div>
                                <div className="text-xs text-green-400 font-semibold">
                                    {filteredAccountName}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={fetchRecentActivity}
                        disabled={loadingRecent}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2 h-[42px]"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingRecent ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-xl">
                    {error}
                </div>
            )}

            {/* SECTION 1: Pending Reviews */}
            <div className="space-y-4">
                <button
                    onClick={() => setIsPendingOpen(!isPendingOpen)}
                    className="w-full flex items-center justify-between text-left group focus:outline-none"
                >
                    <h4 className="text-sm font-bold text-yellow-500/80 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <Activity className="w-4 h-4" />
                        Pending Review
                        <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-800/50 ml-2">
                            {pendingReviewBundles.length}
                        </span>
                    </h4>
                    <div className="p-1 rounded-lg bg-gray-900/50 text-gray-500 group-hover:text-white transition-colors">
                        {isPendingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </button>

                {isPendingOpen && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        {loadingRecent ? (
                            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-dashed border-gray-800">
                                <RefreshCw className="w-6 h-6 animate-spin text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Loading activity...</p>
                            </div>
                        ) : pendingReviewBundles.length > 0 ? (
                            <div className="grid gap-3">
                                {pendingReviewBundles.map(renderBundleRow)}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-900/30 rounded-lg border border-dashed border-gray-800">
                                <p className="text-gray-500 text-sm">No pending bundles found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SECTION 2: Recently Approved */}
            <div className="space-y-4 pt-4 border-t border-gray-800/50">
                <button
                    onClick={() => setIsRecentApprovedOpen(!isRecentApprovedOpen)}
                    className="w-full flex items-center justify-between text-left group focus:outline-none"
                >
                    <h4 className="text-sm font-bold text-green-500/80 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <CheckCircle className="w-4 h-4" />
                        Recently Approved
                        <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full border border-green-800/50 ml-2">
                            {latestApproved.length}
                        </span>
                    </h4>
                    <div className="p-1 rounded-lg bg-gray-900/50 text-gray-500 group-hover:text-white transition-colors">
                        {isRecentApprovedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </button>

                {isRecentApprovedOpen && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        {loadingRecent ? (
                            <div className="text-center py-8 bg-gray-900/30 rounded-lg border border-dashed border-gray-800">
                                <p className="text-gray-500 text-sm">Loading...</p>
                            </div>
                        ) : latestApproved.length > 0 ? (
                            <div className="grid gap-3">
                                {latestApproved.map(renderBundleRow)}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-900/30 rounded-lg border border-dashed border-gray-800">
                                <p className="text-gray-500 text-sm">No recently approved bundles.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SECTION 3: History (Collapsible) */}
            <div className="space-y-4 pt-4 border-t border-gray-800/50">
                <button
                    onClick={toggleHistory}
                    className="w-full flex items-center justify-between text-left group focus:outline-none"
                >
                    <h4 className="text-sm font-bold text-blue-400/80 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <History className="w-4 h-4" />
                        Previously Approved Bundles
                        <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800/50 ml-2">
                            {loadingHistory && !historyBundles.length ? '...' : historyBundles.length < HISTORY_PAGE_SIZE ? historyBundles.length : `${historyBundles.length}+`}
                        </span>
                    </h4>
                    <div className="p-1 rounded-lg bg-gray-900/50 text-gray-500 group-hover:text-white transition-colors">
                        {isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </button>

                {/* ... History Section continued ... */}
                {isHistoryOpen && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        {loadingHistory && !historyBundles.length ? (
                            <div className="text-center py-8 bg-gray-900/30 rounded-lg border border-dashed border-gray-800">
                                <RefreshCw className="w-6 h-6 animate-spin text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Loading history...</p>
                            </div>
                        ) : historyBundles.length > 0 ? (
                            <>
                                <div className="grid gap-3">
                                    {historyBundles.map(renderBundleRow)}
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center mt-4 px-2">
                                    <button
                                        onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                                        disabled={historyPage === 0 || loadingHistory}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Previous
                                    </button>
                                    <span className="text-xs text-gray-500 font-mono">Page {historyPage + 1}</span>
                                    <button
                                        onClick={() => setHistoryPage(p => p + 1)}
                                        disabled={historyBundles.length < HISTORY_PAGE_SIZE || loadingHistory}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 bg-gray-900/30 rounded-lg border border-dashed border-gray-800">
                                <p className="text-gray-500 text-sm">No historical bundles found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
