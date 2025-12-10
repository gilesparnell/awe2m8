
import React, { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2, Building, FileText, Database } from 'lucide-react';

interface Credentials {
    accountSid: string;
    authToken: string;
}

interface CreateBundleFormProps {
    credentials: Credentials;
    onSuccess: () => void;
}

const DEFAULT_BUSINESS_INFO = {
    businessName: "AWE2M8 Pty Ltd",
    businessType: "corporation",
    ein: "31687348134", // ABN
    website: "https://awe2m8.com",
    street: "50a Habitat Way",
    city: "Lennox Head",
    state: "NSW",
    postalCode: "2478",
    country: "AU",
    firstName: "Jesse",
    lastName: "Allan",
    email: "giles@awe2m8.com",
    phone: "+61412345678"
};

export const CreateBundleForm: React.FC<CreateBundleFormProps> = ({ credentials, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [subAccountSid, setSubAccountSid] = useState('');

    // Editable State
    const [businessInfo, setBusinessInfo] = useState(DEFAULT_BUSINESS_INFO);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBusinessInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setStatus('Initializing...');

        try {
            // Relaxed check: We allow empty credentials here because the backend will fallback to Env Vars.
            // if (!credentials.accountSid || !credentials.authToken) {
            //     throw new Error("Missing credentials. See Configuration.");
            // }
            // Removed client-side validation - backend will validate the SID format
            // This bypasses Vercel caching issues where old validation code persists
            // if (!subAccountSid.toUpperCase().startsWith('AC') || subAccountSid.length < 34) {
            //     throw new Error("Please enter a valid Sub-Account SID (starts with AC, 34 characters)");
            // }

            const body = new FormData();

            // 1. Use existing Sub-Account
            body.append('createSubAccount', 'false');
            body.append('targetSubAccountSid', subAccountSid);

            // 2. Use Editable Business Info
            Object.entries(businessInfo).forEach(([key, value]) => {
                body.append(key, value);
            });
            body.append('subAccountName', 'Existing SubAccount');

            // 3. Use Static Documents
            setStatus('Loading standard documents...');
            const docsToLoad = [
                { key: 'businessDoc', path: '/admin/documents/AWE2M8 Company Registration.pdf', name: 'AWE2M8 Company Registration.pdf' },
                { key: 'addressDoc', path: '/admin/documents/AWE2M8 Business Address.pdf', name: 'AWE2M8 Business Address.pdf' },
            ];

            for (const doc of docsToLoad) {
                try {
                    const response = await fetch(doc.path);
                    if (!response.ok) throw new Error(`Missing ${doc.name} in /public/admin/documents`);
                    const blob = await response.blob();
                    const file = new File([blob], doc.name, { type: blob.type });
                    body.append(doc.key, file);
                } catch (e) {
                    console.warn(`Could not load default doc: ${doc.name}. Uploading without it might fail.`);
                    throw new Error(`System Error: Could not load default document ${doc.name}. Please ensure it exists in public/admin/documents.`);
                }
            }

            setStatus('Submitting bundle to Twilio...');

            const res = await fetch('/api/twilio/workflow', {
                method: 'POST',
                headers: {
                    'x-twilio-account-sid': credentials.accountSid,
                    'x-twilio-auth-token': credentials.authToken
                },
                body: body
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create bundle');
            }

            setStatus('Success!');
            onSuccess();
            alert(`Bundle Created Successfully!\nSID: ${data.bundleSid}`);
            setSubAccountSid(''); // Reset

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
                        <Play className="w-8 h-8 text-blue-400 fill-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">One-Click Compliance</h2>
                    <p className="text-gray-400">
                        Create a regulatory bundle for an <strong>existing sub-account</strong>. Verify details below match your documents.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sub Account SID */}
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2">
                            Enter Sub-Account SID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={subAccountSid}
                            onChange={(e) => setSubAccountSid(e.target.value)}
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-4 text-white text-lg font-mono placeholder:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            required
                        />
                        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            Use the SID from Twilio or GoHighLevel settings
                        </p>
                    </div>

                    {/* Editable Business Info (Pre-filled) */}
                    <div className="bg-gray-950 rounded-xl p-6 border border-gray-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Details (Editable)</h4>
                            <span className="text-xs text-blue-400">Must match documents exactly</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-1">Business Name</label>
                                <input name="businessName" value={businessInfo.businessName} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-1">EIN / ABN</label>
                                <input name="ein" value={businessInfo.ein} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs font-bold mb-1">Street Address</label>
                            <input name="street" value={businessInfo.street} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-1">City</label>
                                <input name="city" value={businessInfo.city} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-1">State</label>
                                <input name="state" value={businessInfo.state} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-1">Postal Code</label>
                                <input name="postalCode" value={businessInfo.postalCode} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" />
                            </div>
                            <div className="col-span-3 mt-2">
                                <label className="block text-gray-400 text-xs font-bold mb-1">Country</label>
                                <select name="country" value={businessInfo.country} onChange={(e: any) => handleInputChange(e)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none appearance-none">
                                    <option value="AU">Australia (AU)</option>
                                    <option value="US">United States (US)</option>
                                    <option value="ZA">South Africa (ZA)</option>
                                    <option value="GT">Guatemala (GT)</option>
                                    <option disabled>──────────</option>
                                    <option value="AF">Afghanistan (AF)</option>
                                    <option value="AL">Albania (AL)</option>
                                    <option value="DZ">Algeria (DZ)</option>
                                    <option value="AR">Argentina (AR)</option>
                                    <option value="AM">Armenia (AM)</option>
                                    <option value="AT">Austria (AT)</option>
                                    <option value="BE">Belgium (BE)</option>
                                    <option value="BR">Brazil (BR)</option>
                                    <option value="BG">Bulgaria (BG)</option>
                                    <option value="CA">Canada (CA)</option>
                                    <option value="CN">China (CN)</option>
                                    <option value="HR">Croatia (HR)</option>
                                    <option value="CZ">Czech Republic (CZ)</option>
                                    <option value="DK">Denmark (DK)</option>
                                    <option value="EG">Egypt (EG)</option>
                                    <option value="EE">Estonia (EE)</option>
                                    <option value="FI">Finland (FI)</option>
                                    <option value="FR">France (FR)</option>
                                    <option value="DE">Germany (DE)</option>
                                    <option value="GB">United Kingdom (GB)</option>
                                    <option value="GR">Greece (GR)</option>
                                    <option value="HK">Hong Kong (HK)</option>
                                    <option value="HU">Hungary (HU)</option>
                                    <option value="IS">Iceland (IS)</option>
                                    <option value="IN">India (IN)</option>
                                    <option value="ID">Indonesia (ID)</option>
                                    <option value="IE">Ireland (IE)</option>
                                    <option value="IL">Israel (IL)</option>
                                    <option value="IT">Italy (IT)</option>
                                    <option value="JP">Japan (JP)</option>
                                    <option value="LV">Latvia (LV)</option>
                                    <option value="LT">Lithuania (LT)</option>
                                    <option value="LU">Luxembourg (LU)</option>
                                    <option value="MY">Malaysia (MY)</option>
                                    <option value="MX">Mexico (MX)</option>
                                    <option value="NL">Netherlands (NL)</option>
                                    <option value="NZ">New Zealand (NZ)</option>
                                    <option value="NO">Norway (NO)</option>
                                    <option value="PH">Philippines (PH)</option>
                                    <option value="PL">Poland (PL)</option>
                                    <option value="PT">Portugal (PT)</option>
                                    <option value="PR">Puerto Rico (PR)</option>
                                    <option value="QA">Qatar (QA)</option>
                                    <option value="RO">Romania (RO)</option>
                                    <option value="SA">Saudi Arabia (SA)</option>
                                    <option value="SG">Singapore (SG)</option>
                                    <option value="SK">Slovakia (SK)</option>
                                    <option value="SI">Slovenia (SI)</option>
                                    <option value="KR">South Korea (KR)</option>
                                    <option value="ES">Spain (ES)</option>
                                    <option value="SE">Sweden (SE)</option>
                                    <option value="CH">Switzerland (CH)</option>
                                    <option value="TW">Taiwan (TW)</option>
                                    <option value="TH">Thailand (TH)</option>
                                    <option value="TR">Turkey (TR)</option>
                                    <option value="UA">Ukraine (UA)</option>
                                    <option value="AE">United Arab Emirates (AE)</option>
                                    <option value="VN">Vietnam (VN)</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Included Documents</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <FileText className="w-4 h-4 text-green-500" />
                            <span><strong>Docs:</strong> AWE2M8 Company Registration.pdf</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <FileText className="w-4 h-4 text-green-500" />
                            <span><strong>Docs:</strong> AWE2M8 Business Address.pdf</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="font-bold mb-1">Error</div>
                                <div className="text-sm">{error}</div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />}
                        {loading ? (status || 'Processing...') : 'Generate Standard Bundle'}
                    </button>
                </form>
            </div>
        </div>
    );
};
