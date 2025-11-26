'use client';

import React from 'react';
import { ModuleData } from '@/types';

export const HeroBlock: React.FC<{ data: ModuleData }> = ({ data }) => {
    return (
        <section className="relative w-full min-h-[85vh] flex items-center justify-center bg-stone-50 px-6 py-24">
            <div className="max-w-7xl w-full">
                <div className="max-w-5xl">
                    <h1 className="text-[clamp(3rem,8vw,7rem)] font-bold leading-[0.95] tracking-tight text-slate-900 mb-8">
                        {data.title || "AI Automation Solutions"}
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl font-light">
                        {data.content}
                    </p>
                </div>
            </div>

            {/* Subtle bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-stone-200" />
        </section>
    );
};
