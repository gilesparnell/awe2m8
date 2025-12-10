
import React, { useEffect, useState } from 'react';
import { Save, Lock, Bell } from 'lucide-react';

interface ConfigurationFormProps {
    onSave: (creds: { accountSid: string; authToken: string }) => void;
}

export const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ onSave }) => {
    const [sid, setSid] = useState('');
    const [token, setToken] = useState('');
    const [notifyNumbers, setNotifyNumbers] = useState('+61401027141, +61404283605');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
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

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 mb-6">
                Twilio Configuration
            </h2>

            <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-4 mb-6 flex gap-3 text-blue-300 text-sm">
                <Lock className="w-5 h-5 flex-shrink-0" />
                <div>
                    <p className="mb-2">
                        Credentials found in the (Vercel) Server environment settings <code>TWILIO_ACCOUNT_SID</code> and <code>TWILIO_AUTH_TOKEN</code> environment variables will be used automatically.
                    </p>
                    <p className="text-blue-400/70">
                        You can override them here for this browser session only. Leave blank to use server defaults.
                    </p>
                </div>
            </div>

            <div className="space-y-6 max-w-xl">
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Account SID <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={sid}
                        onChange={(e) => setSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Auth Token <span className="text-red-500">*</span></label>
                    <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Your Twilio Auth Token"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
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
