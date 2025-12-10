
import React, { useState } from 'react';
import { Play, Loader2, ArrowRightLeft, CheckCircle, AlertCircle, Phone, Database, Search, RefreshCw } from 'lucide-react';

interface Credentials {
    accountSid: string;
    authToken: string;
}

interface NumberPortFormProps {
    credentials: Credentials;
}

interface TwilioNumber {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
}

export const NumberPortForm: React.FC<NumberPortFormProps> = ({ credentials }) => {
    const [loading, setLoading] = useState(false);
    const [loadingNumbers, setLoadingNumbers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        sourceAccountSid: '',
        targetAccountSid: ''
    });

    const [availableNumbers, setAvailableNumbers] = useState<TwilioNumber[]>([]);
    const [selectedNumberSid, setSelectedNumberSid] = useState<string>('');
    const [numbersFetched, setNumbersFetched] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Reset numbers if source account changes
        if (name === 'sourceAccountSid') {
            setAvailableNumbers([]);
            setNumbersFetched(false);
            setSelectedNumberSid('');
        }
    };

    const fetchNumbers = async () => {
        if (!formData.sourceAccountSid) {
            setError("Please enter a Source Account SID first.");
            return;
        }

        setLoadingNumbers(true);
        setError(null);
        setAvailableNumbers([]);

        try {
            const response = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list',
                    accountSid: credentials.accountSid,
                    authToken: credentials.authToken,
                    sourceAccountSid: formData.sourceAccountSid
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch numbers');
            }

            setAvailableNumbers(data.numbers || []);
            setNumbersFetched(true);

            if (data.numbers && data.numbers.length === 0) {
                setError("No phone numbers found for this subaccount.");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingNumbers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (!credentials.accountSid || !credentials.authToken) {
                throw new Error("Missing Master Account credentials. Please configure them in the Configuration tab.");
            }

            if (!selectedNumberSid) {
                throw new Error("Please select a phone number to port.");
            }

            const response = await fetch('/api/twilio/port-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'port',
                    accountSid: credentials.accountSid,
                    authToken: credentials.authToken,
                    sourceAccountSid: formData.sourceAccountSid,
                    targetAccountSid: formData.targetAccountSid,
                    phoneNumberSid: selectedNumberSid
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to port number');
            }

            const portedNumber = availableNumbers.find(n => n.sid === selectedNumberSid);
            setSuccessMessage(`Successfully ported ${portedNumber?.phoneNumber || 'number'} to account ${data.data.newAccountSid}`);

            // Remove the ported number from the list
            setAvailableNumbers(prev => prev.filter(n => n.sid !== selectedNumberSid));
            setSelectedNumberSid('');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
                        <ArrowRightLeft className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Twilio Number Port</h2>
                    <p className="text-gray-400">
                        Move a Twilio phone number from one sub-account to another instantly.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Source Account SID */}
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2">
                            Source Account SID (Moving From/Losing) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    name="sourceAccountSid"
                                    value={formData.sourceAccountSid}
                                    onChange={handleInputChange}
                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-4 text-white font-mono placeholder:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                                <Database className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            </div>
                            <button
                                type="button"
                                onClick={fetchNumbers}
                                disabled={loadingNumbers || !formData.sourceAccountSid}
                                className="bg-blue-900/40 border border-blue-800 text-blue-300 hover:bg-blue-800/40 hover:text-white px-4 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingNumbers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                {loadingNumbers ? 'Fetching...' : 'Find Numbers'}
                            </button>
                        </div>
                    </div>

                    {/* Number Selection Area */}
                    {numbersFetched && availableNumbers.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="block text-gray-400 text-sm font-bold mb-2">
                                Select Number to Port <span className="text-red-500">*</span>
                            </label>
                            <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                                {availableNumbers.map((num) => (
                                    <label
                                        key={num.sid}
                                        className={`flex items-center p-4 border-b border-gray-900 cursor-pointer transition-colors ${selectedNumberSid === num.sid ? 'bg-blue-900/20' : 'hover:bg-gray-900'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="selectedNumber"
                                            value={num.sid}
                                            checked={selectedNumberSid === num.sid}
                                            onChange={() => setSelectedNumberSid(num.sid)}
                                            className="w-5 h-5 text-blue-500 bg-gray-800 border-gray-700 focus:ring-blue-500 focus:ring-2 mr-4"
                                        />
                                        <div className="flex-1">
                                            <div className="text-white font-mono font-bold flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-gray-500" />
                                                {num.phoneNumber}
                                            </div>
                                            {num.friendlyName && num.friendlyName !== num.phoneNumber && (
                                                <div className="text-gray-500 text-xs mt-1">{num.friendlyName}</div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-right">{availableNumbers.length} numbers found</p>
                        </div>
                    )}

                    {/* Target Account SID - Only show if number selected */}
                    {selectedNumberSid && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="block text-gray-400 text-sm font-bold mb-2">
                                Target Account SID (Moving To/Gaining) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="targetAccountSid"
                                    value={formData.targetAccountSid}
                                    onChange={handleInputChange}
                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-4 text-white font-mono placeholder:text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                                <Database className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="font-bold mb-1">Error</div>
                                <div className="text-sm">{error}</div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-green-900/20 border border-green-800 text-green-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="font-bold mb-1">Success</div>
                                <div className="text-sm">{successMessage}</div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedNumberSid || !formData.targetAccountSid}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRightLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                        {loading ? 'Moving Number...' : 'Port Number Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};
