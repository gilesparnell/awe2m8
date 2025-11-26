import React from 'react';
import { ModuleData } from '@/types';

export const VoiceAIBlock: React.FC<{ data: ModuleData }> = ({ data }) => {
    return (
        <section className="py-32 px-6 bg-stone-50 border-t border-stone-200">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Content */}
                    <div className="lg:sticky lg:top-32">
                        <div className="inline-block px-3 py-1 border border-stone-300 text-stone-700 text-xs font-medium uppercase tracking-wider mb-6">
                            Voice Intelligence
                        </div>
                        <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">{data.title}</h2>
                        <p className="text-xl text-gray-600 leading-relaxed font-light">{data.content}</p>
                    </div>

                    {/* Demo */}
                    <div className="border border-stone-200 bg-stone-100 aspect-[4/3] flex items-center justify-center">
                        {data.config?.iframeUrl ? (
                            <iframe
                                src={data.config.iframeUrl}
                                className="w-full h-full"
                                allow="microphone; camera; autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                            />
                        ) : (
                            <div className="text-center p-12">
                                <div className="w-16 h-16 border-2 border-gray-300 rounded-full mx-auto mb-4" />
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Voice AI Demo</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
