
import React, { useEffect, useState } from 'react';
import { RefreshCw, Package, Clock, CheckCircle, XCircle, Database, History, Activity, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

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
            default: return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'twilio-approved': return <CheckCircle className="w-4 h-4" />;
            case 'twilio-rejected': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    // We no longer block on missing credentials, as the server might have them in Env Vars.
    const isUsingServerCreds = !credentials.accountSid;

    // Filter Recent List for display
    const pendingReviewBundles = recentBundles.filter(b => b.status === 'pending-review');

    // Valid "Latest Approved" logic: Take approved items, slice top 5
    const latestApproved = recentBundles
        .filter(b => b.status === 'twilio-approved')
        .slice(0, 5);

    // If no specific recent activity found, we might fallback or show empty
    const showRecentSection = pendingReviewBundles.length > 0 || latestApproved.length > 0;


    const renderBundleCard = (bundle: Bundle) => (
        <div key={bundle.sid} className="bg-gray-950 border border-gray-800 hover:border-green-500/50 rounded-xl p-6 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                        {bundle.friendlyName || bundle.friendly_name}
                    </h4>
                    <div className="text-xs text-gray-500 font-mono mt-1">{bundle.sid}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 uppercase tracking-wide ${getStatusColor(bundle.status)}`}>
                    {getStatusIcon(bundle.status)}
                    {bundle.status}
                    {bundle.status === 'pending-review' && <span className="animate-pulse text-[10px] lowercase opacity-70 ml-1">(checking...)</span>}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-gray-900">
                <div>
                    <span className="block text-gray-600 text-xs mb-1">Created Date</span>
                    <span className="text-gray-300">
                        {new Date(bundle.dateCreated || bundle.date_created || '').toLocaleDateString()}
                    </span>
                </div>
                <div>
                    <span className="block text-gray-600 text-xs mb-1">Email</span>
                    <span className="text-gray-300">{bundle.email}</span>
                </div>
                <div>
                    <span className="block text-gray-600 text-xs mb-1">Type</span>
                    <span className="text-gray-300 bg-gray-900 px-2 py-0.5 rounded text-xs">
                        {bundle.regulationType || bundle.regulation_type}
                    </span>
                </div>
                {/* Check Status Button for Pending Bundles */}
                {bundle.status === 'pending-review' && (
                    <div className="flex items-end justify-end">
                        <button
                            onClick={async () => {
                                if (!confirm('Check status from Twilio and notify if approved?')) return;
                                try {
                                    const res = await fetch('/api/twilio/check-status', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            accountSid: credentials.accountSid,
                                            authToken: credentials.authToken,
                                            bundleSid: bundle.sid
                                        }),
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    const d = await res.json();
                                    if (d.success) {
                                        alert(`Status: ${d.status}\nSMS Sent: ${d.smsSent ? 'YES' : 'NO'}`);
                                        fetchRecentActivity(); // Refresh list
                                    } else {
                                        alert('Error: ' + d.error);
                                    }
                                } catch (e) { alert('Failed to check status'); }
                            }}
                            className="text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-800/50 transition-colors"
                        >
                            Check & Notify
                        </button>
                    </div>
                )}
            </div>
        </div>
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
                                onChange={(e) => setTargetSubAccountSid(e.target.value)}
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

            {/* SECTION 1: Pending & Recent Activity (Always Visible) */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Pending & Recent Approvals
                </h4>

                {!showRecentSection && !loadingRecent && (
                    <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-xl p-8 text-center text-gray-500 text-sm">
                        No recent activity found.
                    </div>
                )}

                {loadingRecent && (
                    <div className="text-center py-8 text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading activity...</div>
                )}

                <div className="grid gap-4">
                    {/* Prioritize Pending */}
                    {pendingReviewBundles.map(renderBundleCard)}
                    {/* Then Latest Approved */}
                    {latestApproved.map(renderBundleCard)}
                </div>
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
                            <div className="grid gap-4">
                                {historyBundles.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">No bundles found on this page.</div>
                                ) : (
                                    historyBundles.filter(b => b.status !== 'pending-review').map(renderBundleCard)
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
