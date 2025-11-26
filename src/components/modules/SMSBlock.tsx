import React from 'react';
import { ModuleData } from '@/types';

export const SMSBlock: React.FC<{ data: ModuleData }> = ({ data }) => {
    return (
        <section className="py-32 px-6 bg-stone-100 border-t border-stone-200">
            <div className="max-w-4xl mx-auto text-center">
                <div className="inline-block px-3 py-1 border border-stone-300 text-stone-700 text-xs font-medium uppercase tracking-wider mb-6">
                    SMS Automation
                </div>
                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">{data.title}</h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-12 font-light max-w-2xl mx-auto">{data.content}</p>

                {data.config?.url && (
                    <a
                        href={data.config.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white text-sm font-medium uppercase tracking-wider hover:bg-slate-800 transition-colors"
                    >
                        Start SMS Demo
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                )}
            </div>
        </section>
    );
};
