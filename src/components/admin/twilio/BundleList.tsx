
import React, { useEffect, useState } from 'react';
import { RefreshCw, Package, Clock, CheckCircle, XCircle } from 'lucide-react';

interface BundleListProps {
    credentials: { accountSid: string; authToken: string };
}

interface Bundle {
    sid: string;
    friendly_name: string;
    status: string;
    regulation_type: string;
    date_created: string;
    email: string;
}

export const BundleList: React.FC<BundleListProps> = ({ credentials }) => {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBundles = async () => {
        if (!credentials.accountSid || !credentials.authToken) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/twilio/bundles', {
                headers: {
                    'x-twilio-account-sid': credentials.accountSid,
                    'x-twilio-auth-token': credentials.authToken
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch bundles');

            setBundles(data.results || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBundles();
    }, [credentials]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'twilio-approved': return 'bg-green-900/40 text-green-400 border-green-800';
            case 'twilio-rejected': return 'bg-red-900/40 text-red-400 border-red-800';
            case 'pending-review': return 'bg-yellow-900/40 text-yellow-400 border-yellow-800';
            default: return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    // Auto-poll for pending bundles status every 30 seconds
    useEffect(() => {
        // Find pending bundles
        const pending = bundles.filter(b => b.status === 'pending-review');
        if (pending.length === 0) return;

        const interval = setInterval(() => {
            pending.forEach(async (bundle) => {
                try {
                    console.log('Auto-checking bundle status:', bundle.sid);
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

                    // If status CHANGED, refresh the main list
                    if (d.success && d.status !== 'pending-review') {
                        console.log(`Bundle ${bundle.sid} updated to ${d.status}`);
                        // We could just update local state, but fetching fresh list is safer to sync UI
                        fetchBundles();
                    }
                } catch (e) { console.error('Poll error', e); }
            });
        }, 30000); // Poll every 30s

        return () => clearInterval(interval);
    }, [bundles, credentials]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'twilio-approved': return <CheckCircle className="w-4 h-4" />;
            case 'twilio-rejected': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (!credentials.accountSid) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
                <p>Please configure your Twilio credentials first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-500" />
                    Submitted Bundles
                </h3>
                <button
                    onClick={fetchBundles}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-xl">
                    {error}
                </div>
            )}

            {bundles.length === 0 && !loading && !error && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                    <p className="text-gray-400 mb-2">No bundles found.</p>
                    <p className="text-sm text-gray-600">Bundles submitted through this tool or existing on your account will appear here.</p>
                </div>
            )}

            <div className="grid gap-4">
                {bundles.map((bundle) => (
                    <div key={bundle.sid} className="bg-gray-950 border border-gray-800 hover:border-green-500/50 rounded-xl p-6 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                                    {bundle.friendly_name}
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
                                <span className="text-gray-300">{new Date(bundle.date_created).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="block text-gray-600 text-xs mb-1">Email</span>
                                <span className="text-gray-300">{bundle.email}</span>
                            </div>
                            <div>
                                <span className="block text-gray-600 text-xs mb-1">Type</span>
                                <span className="text-gray-300 bg-gray-900 px-2 py-0.5 rounded text-xs">{bundle.regulation_type}</span>
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
                                                    fetchBundles(); // Refresh list
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
                ))}
            </div>
            {/* Show simple loader skeleton if needed, but the button spinner is probably enough for refresh */}
        </div>
    );
};
