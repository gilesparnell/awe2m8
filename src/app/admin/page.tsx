'use client';

import React, { useState } from 'react';
import { ModuleType } from '@/types';
import { Loader2, Check, Sparkles, Globe, ArrowRight, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function AdminPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'input' | 'selection' | 'review' | 'preview'>('input');

    // Analysis Data
    const [clientName, setClientName] = useState('');
    const [niche, setNiche] = useState('');

    // Available modules
    const [selectedModules, setSelectedModules] = useState<ModuleType[]>(['hero', 'voice_ai', 'sms_agent', 'chat_bot', 'why_it_matters']);
    const [customInstructions, setCustomInstructions] = useState('');

    // Generated Content
    const [generatedModules, setGeneratedModules] = useState<any[]>([]);
    const [generatedPageId, setGeneratedPageId] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!res.ok) throw new Error('Analysis failed');

            const data = await res.json();
            setClientName(data.clientName);
            setNiche(data.niche);

            // Pre-select recommended modules if returned, otherwise keep defaults
            if (data.recommendedModules) {
                // Always keep Hero and WhyItMatters
                const recommended = new Set(['hero', 'why_it_matters', ...data.recommendedModules]);
                setSelectedModules(Array.from(recommended) as ModuleType[]);
            }

            setStep('selection');
        } catch (err) {
            setError('Failed to analyze website. Please check the URL and try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName,
                    niche,
                    url,
                    modules: selectedModules,
                    instructions: customInstructions // Pass custom instructions
                })
            });

            if (!res.ok) throw new Error('Generation failed');

            const data = await res.json();
            setGeneratedModules(data.modules);
            setStep('review'); // Go to review step instead of preview
        } catch (err) {
            setError('Failed to generate content. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Generate ID
            const pageId = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            setGeneratedPageId(pageId);

            // Save to Firestore
            await setDoc(doc(db, 'clients', pageId), {
                id: pageId,
                clientName,
                niche,
                modules: generatedModules,
                createdAt: Date.now()
            });

            setStep('preview');
        } catch (err) {
            setError('Failed to save page.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to update a specific module's content
    const updateModule = (index: number, field: string, value: string) => {
        const newModules = [...generatedModules];
        newModules[index] = { ...newModules[index], [field]: value };
        setGeneratedModules(newModules);
    };

    // Helper to update module config (for URLs)
    const updateModuleConfig = (index: number, configKey: string, value: string) => {
        const newModules = [...generatedModules];
        newModules[index] = {
            ...newModules[index],
            config: { ...newModules[index].config, [configKey]: value }
        };
        setGeneratedModules(newModules);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
                        Internal Tool
                    </div>
                    <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 tracking-tight">
                        AWE2M8 Sales Engine
                    </h1>
                    <p className="text-gray-400 mt-4 text-lg">Generate high-converting demo pages in seconds.</p>
                </header>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Step 1: Input */}
                {step === 'input' && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-10 max-w-2xl mx-auto backdrop-blur-sm shadow-2xl">
                        <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">Client Website URL</label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full bg-black border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={handleAnalyze}
                                disabled={!url || loading}
                                className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                Analyze
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mt-4">
                            The AI will scrape this site to understand their business model, tone, and pain points.
                        </p>
                    </div>
                )}

                {/* Step 2: Selection */}
                {step === 'selection' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Recommended Modules</h2>
                            <p className="text-gray-400">
                                Identified: <span className="text-white font-bold">{clientName}</span> ({niche})
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Checkboxes for modules */}
                            {['hero', 'voice_ai', 'sms_agent', 'chat_bot', 'why_it_matters'].map((mod) => (
                                <label key={mod} className={`group flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${selectedModules.includes(mod as ModuleType) ? 'bg-green-900/10 border-green-500/50 shadow-lg shadow-green-900/10' : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'}`}>
                                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${selectedModules.includes(mod as ModuleType) ? 'bg-green-500 border-green-500' : 'border-gray-600 bg-gray-800 group-hover:border-gray-500'}`}>
                                        {selectedModules.includes(mod as ModuleType) && <Check className="w-4 h-4 text-black" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedModules.includes(mod as ModuleType)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedModules([...selectedModules, mod as ModuleType]);
                                            else setSelectedModules(selectedModules.filter(m => m !== mod));
                                        }}
                                        className="hidden"
                                    />
                                    <span className="capitalize font-bold text-lg">{mod.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>

                        {/* Custom Instructions */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                Custom AI Instructions (Optional)
                            </label>
                            <p className="text-gray-500 text-sm mb-3 leading-relaxed">
                                Guide the AI's tone, style, and focus. Examples: "Make it more casual and friendly," "Emphasize cost savings and ROI," "Mention that we're better than [competitor]," or "Use sports metaphors."
                            </p>
                            <textarea
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                placeholder="e.g., Focus on time savings for busy gym owners, use an energetic tone, mention 24/7 availability prominently..."
                                className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all h-24 resize-none"
                            />
                        </div>
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-xl px-12 py-5 rounded-full font-bold shadow-xl shadow-green-900/30 transition-all hover:scale-105 flex items-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                                Generate Content
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Edit */}
                {step === 'review' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Review & Edit</h2>
                            <p className="text-gray-400">Review the generated content below. Edit anything you like before publishing.</p>
                        </div>

                        <div className="space-y-6">
                            {generatedModules.map((module, idx) => (
                                <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold uppercase text-green-400 bg-green-900/20 px-2 py-1 rounded">{module.type.replace('_', ' ')}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1 uppercase">Title</label>
                                            <input
                                                type="text"
                                                value={module.title}
                                                onChange={(e) => updateModule(idx, 'title', e.target.value)}
                                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white font-bold focus:border-green-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1 uppercase">Content</label>
                                            <textarea
                                                value={module.content}
                                                onChange={(e) => updateModule(idx, 'content', e.target.value)}
                                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-gray-300 focus:border-green-500 outline-none h-32"
                                            />
                                        </div>

                                        {/* URL Configuration for specific module types */}
                                        {module.type === 'voice_ai' && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1 uppercase">Voice AI Demo URL (iframe)</label>
                                                <input
                                                    type="url"
                                                    value={module.config?.iframeUrl || ''}
                                                    onChange={(e) => updateModuleConfig(idx, 'iframeUrl', e.target.value)}
                                                    placeholder="https://vapi.ai/embed/..."
                                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-sm focus:border-green-500 outline-none"
                                                />
                                            </div>
                                        )}

                                        {module.type === 'sms_agent' && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1 uppercase">SMS Demo Link URL</label>
                                                <input
                                                    type="url"
                                                    value={module.config?.url || ''}
                                                    onChange={(e) => updateModuleConfig(idx, 'url', e.target.value)}
                                                    placeholder="https://your-sms-demo.com"
                                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-sm focus:border-green-500 outline-none"
                                                />
                                            </div>
                                        )}

                                        {module.type === 'chat_bot' && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1 uppercase">Chat Bot Link URL</label>
                                                <input
                                                    type="url"
                                                    value={module.config?.url || ''}
                                                    onChange={(e) => updateModuleConfig(idx, 'url', e.target.value)}
                                                    placeholder="https://your-chatbot.com"
                                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-sm focus:border-green-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center gap-4 pt-8 pb-12">
                            <button
                                onClick={() => setStep('selection')}
                                className="px-8 py-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition-all font-bold text-gray-300"
                            >
                                Don't like this copy? Get AI to try again
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-white text-black text-xl px-12 py-5 rounded-full font-bold shadow-xl shadow-white/10 transition-all hover:scale-105 flex items-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Check className="w-6 h-6" />}
                                Save & Publish
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Preview */}
                {step === 'preview' && (
                    <div className="text-center space-y-8 animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400 border border-green-500/30">
                            <Check className="w-12 h-12" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-2">Content Generated!</h2>
                            <p className="text-gray-400 text-lg">Your demo page is ready to be viewed.</p>
                        </div>

                        <div className="bg-gray-900 rounded-xl p-6 max-w-md mx-auto border border-gray-800">
                            <p className="text-sm text-gray-500 mb-2 uppercase font-bold">Local Preview URL</p>
                            <a
                                href={`/${generatedPageId}`}
                                target="_blank"
                                className="flex items-center justify-center gap-2 text-green-400 font-mono bg-black p-3 rounded-lg hover:text-green-300 transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                localhost:3000/{generatedPageId}
                            </a>
                        </div>

                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={() => setStep('selection')} className="px-8 py-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition-all font-bold text-gray-300">Back</button>
                            <a
                                href={`/${generatedPageId}`}
                                target="_blank"
                                className="px-10 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10"
                            >
                                View Live Page <ArrowRight className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
