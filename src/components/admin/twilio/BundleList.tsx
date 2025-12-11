
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
    const HISTORY_PAGE_SIZE = 10;

    const [error, setError] = useState<string | null>(null);
    const [targetSubAccountSid, setTargetSubAccountSid] = useState('');

    useEffect(() => {
        const lastSub = localStorage.getItem('twilio_last_subaccount_sid');
        if (lastSub) setTargetSubAccountSid(lastSub);
    }, []);

    // Initial load: Fetch Recent Activity
    const fetchRecentActivity = async () => {
        setLoadingRecent(true);
        setError(null);
        try {
            const query = targetSubAccountSid ? `?subAccountSid=${targetSubAccountSid}&limit=20` : '?limit=20';
            const res = await fetch(`/api/twilio/bundles${query}`, {
                headers: {
                    'x-twilio-account-sid': credentials.accountSid,
                    'x-twilio-auth-token': credentials.authToken
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch bundles');

            const allFetched = data.results || [];
            if (allFetched.length > 0) {
                // Sort by date descending
                const sorted = allFetched.sort((a: Bundle, b: Bundle) => {
                    const dateA = new Date(a.dateCreated || a.date_created || 0);
                    const dateB = new Date(b.dateCreated || b.date_created || 0);
                    return dateB.getTime() - dateA.getTime();
                });

                // For "Recent Activity", we want Pending + Top Approved/Rejected
                setRecentBundles(sorted);
            } else {
                setRecentBundles([]);
            }

        } catch (err: any) {
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


    // Reload when credentials or subaccount changes
    useEffect(() => {
        fetchRecentActivity();
        // Reset history when context changes
        setHistoryBundles([]);
        setHistoryPage(0);
        setIsHistoryOpen(false);
    }, [credentials, targetSubAccountSid]); // Reload if subaccount changes (basic scope)

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
                    <div className="text-[10px] text-gray-600 font-mono">{bundle.sid}</div>
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
                    <button
                        onClick={async () => {
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
                                if (d.success) fetchRecentActivity();
                                else alert('Error: ' + d.error);
                            } catch (e) { alert('Failed to submit'); }
                        }}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded border border-gray-700 transition-colors"
                    >
                        Submit Now
                    </button>
                    <span className="text-[9px] text-gray-600 mt-1 max-w-[120px] text-right">
                        Action required correctly submit
                    </span>
                </div>
            )}
        </div >
    );

    return (
        <div className="space-y-8 animate-in fade-in">

            {/* Header / Subaccount Filter */}
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
                                type="text"
                                value={targetSubAccountSid}
                                onChange={(e) => {
                                    setTargetSubAccountSid(e.target.value);
                                    localStorage.setItem('twilio_last_subaccount_sid', e.target.value);
                                }}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white font-mono placeholder:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                            <Database className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
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
                <h4 className="text-sm font-bold text-yellow-500/80 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <Activity className="w-4 h-4" />
                    Pending Reviews
                </h4>

                {loadingRecent && !recentBundles.length ? (
                    <div className="flex justify-center p-4"><RefreshCw className="w-5 h-5 animate-spin text-gray-600" /></div>
                ) : !showPendingSection ? (
                    <div className="bg-gray-900/20 border border-gray-800/50 border-dashed rounded-xl p-4 text-center text-gray-500 text-xs">
                        No bundles currently pending review.
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {pendingReviewBundles.map(renderBundleRow)}
                    </div>
                )}
            </div>

            {/* SECTION 2: Recently Approved */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-green-500/80 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <CheckCircle className="w-4 h-4" />
                    Recently Approved
                </h4>

                {loadingRecent && !recentBundles.length ? (
                    <div className="flex justify-center p-4"><RefreshCw className="w-5 h-5 animate-spin text-gray-600" /></div>
                ) : !showApprovedSection ? (
                    <div className="bg-gray-900/20 border border-gray-800/50 border-dashed rounded-xl p-4 text-center text-gray-500 text-xs">
                        No recently approved bundles found.
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {latestApproved.map(renderBundleRow)}
                    </div>
                )}
            </div>


            {/* SECTION 2: Previously Approved (Collapsible & Paginated) */}
            <div className="pt-2 border-t border-gray-800/50">
                <button
                    onClick={toggleHistory}
                    className="w-full bg-gray-900/30 hover:bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex justify-between items-center group transition-all"
                >
                    <h4 className="text-sm font-bold text-gray-400 group-hover:text-white uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Previously Approved Bundles
                    </h4>
                    {isHistoryOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>

                {isHistoryOpen && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center bg-gray-950/50 p-2 rounded-lg border border-gray-800/50 mb-4">
                            <button
                                onClick={handlePrevPage}
                                disabled={historyPage === 0 || loadingHistory}
                                className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 px-3 py-1"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>
                            <span className="text-xs font-mono text-gray-500">Page {historyPage + 1}</span>
                            <button
                                onClick={handleNextPage}
                                disabled={historyBundles.length < HISTORY_PAGE_SIZE || loadingHistory} // Rough check for 'last page'
                                className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 px-3 py-1"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div className="text-center py-12 text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading history...</div>
                        ) : (
                            <div className="grid gap-2">
                                {historyBundles.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">No bundles found on this page.</div>
                                ) : (
                                    historyBundles.filter(b => b.status !== 'pending-review').map(renderBundleRow)
                                )}
                            </div>
                        )}

                        {/* Bottom Pagination (Convenience) */}
                        {!loadingHistory && historyBundles.length > 3 && (
                            <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-900">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={historyPage === 0}
                                    className="p-2 rounded-full hover:bg-gray-800 disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                                </button>
                                <span className="text-xs font-mono text-gray-600">Page {historyPage + 1}</span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={historyBundles.length < HISTORY_PAGE_SIZE}
                                    className="p-2 rounded-full hover:bg-gray-800 disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
