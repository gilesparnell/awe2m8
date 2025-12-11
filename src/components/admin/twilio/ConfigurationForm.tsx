
import React, { useEffect, useState } from 'react';
import { Save, Lock, Bell, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ConfigurationFormProps {
    onSave: (creds: { accountSid: string; authToken: string }) => void;
}

export const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ onSave }) => {
    const [sid, setSid] = useState('');
    const [token, setToken] = useState('');
    const [notifyNumbers, setNotifyNumbers] = useState(''); // Default empty, load from server
    const [saved, setSaved] = useState(false);
    const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
    const [loadingEnv, setLoadingEnv] = useState(true);

    const fetchConfig = async () => {
        try {
            setLoadingEnv(true);
            const res = await fetch('/api/twilio/config');
            const data = await res.json();

            if (data.envStatus) {
                setEnvStatus(data.envStatus);
            }
            if (data.notificationNumbers && Array.isArray(data.notificationNumbers)) {
                // Only set if not already overridden by local storage in the other effect
                // Actually, let's merge or prefer Server if Local is empty?
                // The existing logic preferred LocalStorage. Let's keep that but populate if empty.
                const serverNumbers = data.notificationNumbers.join(', ');
                setNotifyNumbers(prev => prev || serverNumbers);
            }
        } catch (e) {
            console.error("Failed to fetch server config", e);
        } finally {
            setLoadingEnv(false);
        }
    };

    useEffect(() => {
        fetchConfig();

        // Check for local storage overrides
        const savedSid = localStorage.getItem('twilio_account_sid');
        const savedToken = localStorage.getItem('twilio_auth_token');
        const savedNotifyNumbers = localStorage.getItem('twilio_notify_numbers');

        if (savedSid) setSid(savedSid);
        if (savedToken) setToken(savedToken);
        if (savedNotifyNumbers) setNotifyNumbers(savedNotifyNumbers);

        if (savedSid && savedToken) {
            onSave({ accountSid: savedSid, authToken: savedToken });
        }
    }, [onSave]);

    const handleSave = async () => {
        // Save credentials to localStorage
        localStorage.setItem('twilio_account_sid', sid);
        localStorage.setItem('twilio_auth_token', token);
        localStorage.setItem('twilio_notify_numbers', notifyNumbers);

        // Save notification numbers to server
        try {
            const numbers = notifyNumbers.split(',').map(n => n.trim()).filter(n => n.length > 0);
            await fetch('/api/twilio/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationNumbers: numbers })
            });
        } catch (e) {
            console.error('Failed to save notification numbers:', e);
        }

        onSave({ accountSid: sid, authToken: token });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const EnvStatusItem = ({ name, isSet }: { name: string, isSet: boolean }) => (
        <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
            <code className="text-xs text-gray-400 font-mono bg-gray-900 px-2 py-1 rounded">{name}</code>
            {isSet ? (
                <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Set</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>Missing</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 mb-6">
                Twilio Configuration
            </h2>

            {/* Server Environment Variables Status */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-900/20 rounded-lg">
                            <Lock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-200">Server Environment Variables</h3>
                            <p className="text-xs text-gray-500">Variables detected on the running server</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchConfig}
                        className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-900 rounded-lg"
                        title="Refresh Status"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingEnv ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="bg-gray-900/50 rounded-lg border border-gray-800 px-4">
                    <EnvStatusItem name="TWILIO_ACCOUNT_SID" isSet={envStatus.TWILIO_ACCOUNT_SID} />
                    <EnvStatusItem name="TWILIO_AUTH_TOKEN" isSet={envStatus.TWILIO_AUTH_TOKEN} />
                    <EnvStatusItem name="TWILIO_SMS_ACCOUNT_SID" isSet={envStatus.TWILIO_SMS_ACCOUNT_SID} />
                    <EnvStatusItem name="TWILIO_SMS_AUTH_TOKEN" isSet={envStatus.TWILIO_SMS_AUTH_TOKEN} />
                    <EnvStatusItem name="OPENAI_API_KEY" isSet={envStatus.OPENAI_API_KEY} />
                </div>

                <div className="mt-4 flex gap-3 text-xs text-blue-300/80 bg-blue-900/10 p-3 rounded-lg border border-blue-900/20">
                    <p>
                        <strong>Note:</strong> Server-side credentials are used automatically by default.
                        You can override the <strong>Account SID</strong> and <strong>Auth Token</strong> below for this browser session only (useful for testing different accounts).
                    </p>
                </div>
            </div>

            <div className="space-y-6 max-w-xl">
                <div className="bg-blue-900/10 border border-blue-900/20 rounded-lg p-3 text-xs text-blue-300">
                    <strong>Note:</strong> These credentials must belong to the <strong>Parent Account</strong>.
                    They are used to authenticate API calls and then "act as" subaccounts.
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Override Parent Account SID (Optional)</label>
                    <input
                        type="text"
                        value={sid}
                        onChange={(e) => setSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-800"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Override Parent Auth Token (Optional)</label>
                    <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Your Twilio Auth Token"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-800"
                    />
                </div>

                <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-green-400" />
                        <label className="block text-gray-400 text-sm font-bold">
                            SMS Notification Numbers
                        </label>
                    </div>
                    <p className="text-gray-500 text-xs mb-3">
                        Phone numbers to receive SMS notifications when bundles are approved. Separate multiple numbers with commas.
                    </p>
                    <input
                        type="text"
                        value={notifyNumbers}
                        onChange={(e) => setNotifyNumbers(e.target.value)}
                        placeholder="+61401027141, +61404283605"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-green-900/20"
                    >
                        <Save className="w-5 h-5" />
                        {saved ? 'Saved!' : 'Save Configuration'}
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch('/api/twilio/test-sms', {
                                    method: 'POST',
                                    body: JSON.stringify({ accountSid: sid, authToken: token }),
                                    headers: { 'Content-Type': 'application/json' }
                                });
                                const data = await res.json();
                                if (data.success) {
                                    alert(`✅ Test SMS Sent Successfully!\n\nFrom: ${data.from}\nTo: ${data.sentTo.join(', ')}\nMessage SIDs: ${data.sids.join(', ')}`);
                                } else {
                                    alert(`❌ Failed to send test SMS:\n\n${data.error}`);
                                }
                            } catch (e: any) {
                                alert(`❌ Error sending test SMS:\n\n${e.message}`);
                            }
                        }}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-xl transition-all border border-gray-700"
                    >
                        Test SMS
                    </button>
                </div>
            </div>
        </div>
    );
};
