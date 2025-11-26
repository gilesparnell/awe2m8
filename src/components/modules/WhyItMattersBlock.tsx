'use client';

import React from 'react';
import { ModuleData } from '@/types';

export const WhyItMattersBlock: React.FC<{ data: ModuleData }> = ({ data }) => {
    return (
        <section className="py-32 px-6 bg-black text-white border-t border-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-20">
                    <div className="inline-block px-3 py-1 border border-gray-700 text-gray-400 text-xs font-medium uppercase tracking-wider mb-6">
                        Impact Metrics
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">{data.title || "Why It Matters"}</h2>
                </div>

                {/* Metrics Grid */}
                <div
                    className="grid md:grid-cols-2 gap-px bg-gray-800 border border-gray-800 [&>div]:bg-black [&>div]:p-12 [&_strong]:text-white [&_strong]:text-3xl [&_strong]:md:text-4xl [&_strong]:font-bold [&_strong]:block [&_strong]:mb-4 [&_strong]:leading-tight [&>div]:text-gray-400 [&>div]:text-lg [&>div]:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: data.content || '' }}
                />
            </div>
        </section>
    );
};
