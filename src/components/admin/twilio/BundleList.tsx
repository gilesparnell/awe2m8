
import React, { useEffect, useState } from 'react';
import { RefreshCw, Package, Clock, CheckCircle, XCircle, Search, Database, History, Activity } from 'lucide-react';

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
    const [searchResults, setSearchResults] = useState<Bundle[]>([]);

    const [loadingRecent, setLoadingRecent] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [targetSubAccountSid, setTargetSubAccountSid] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [hasSearched, setHasSearched] = useState(false);

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

    // Explicit Search
    const handleSearch = async () => {
        if (!searchTerm && !targetSubAccountSid) {
            // If clearing search, maybe reset?
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setLoadingSearch(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (targetSubAccountSid) params.append("subAccountSid", targetSubAccountSid);
            if (searchTerm) params.append("friendlyName", searchTerm);
            params.append("limit", "50");

            const res = await fetch(`/api/twilio/bundles?${params.toString()}`, {
                headers: {
                    'x-twilio-account-sid': credentials.accountSid,
                    'x-twilio-auth-token': credentials.authToken
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to search bundles');

            setSearchResults(data.results || []);
            setHasSearched(true);

        } catch (err: any) {
            setError(err.message); // Show error but don't break whole page
        } finally {
            setLoadingSearch(false);
        }
    };

    // Reload when credentials or subaccount changes
    useEffect(() => {
        fetchRecentActivity();
        // Reset search results when context changes
        setSearchResults([]);
        setHasSearched(false);
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


            {/* SECTION 2: Search History */}
            <div className="pt-8 border-t border-gray-800">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-6">
                    <History className="w-4 h-4" />
                    Search Bundle History
                </h4>

                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by Friendly Name..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        <Search className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loadingSearch}
                        className="bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800 text-blue-100 px-6 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingSearch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Search
                    </button>
                </div>

                {hasSearched && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                            <span>Found {searchResults.length} results</span>
                            {searchResults.length >= 50 && <span className="text-yellow-600">Limited to 50 results</span>}
                        </div>

                        {searchResults.length === 0 && !loadingSearch && (
                            <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-xl p-8 text-center text-gray-500 text-sm">
                                No bundles found matching "{searchTerm}"
                            </div>
                        )}

                        <div className="grid gap-4">
                            {searchResults.map(renderBundleCard)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
