'use client';

import React, { useState, useEffect } from 'react';
import { ModuleData } from '@/types';

interface DemoNavigationProps {
    modules: ModuleData[];
}

export const DemoNavigation: React.FC<DemoNavigationProps> = ({ modules }) => {
    const [activeSection, setActiveSection] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);

            // Detect active section
            const sections = modules.map(m => document.getElementById(m.type));
            const scrollPosition = window.scrollY + 200;

            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                if (section && section.offsetTop <= scrollPosition) {
                    setActiveSection(modules[i].type);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [modules]);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 80; // Account for sticky nav height
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    };

    const getModuleLabel = (type: string): string => {
        const labels: Record<string, string> = {
            hero: 'Overview',
            voice_ai: 'Voice AI',
            sms_agent: 'SMS Agent',
            chat_bot: 'Chat Bot',
            why_it_matters: 'ROI'
        };
        return labels[type] || type;
    };

    // Don't show nav for hero-only pages
    if (modules.length <= 1) return null;

    return (
        <nav
            className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-stone-50/95 backdrop-blur-md border-b border-stone-200 shadow-sm'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-center gap-1">
                    {modules.map((module) => (
                        <button
                            key={module.type}
                            onClick={() => scrollToSection(module.type)}
                            className={`px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all rounded-lg ${activeSection === module.type
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                                }`}
                        >
                            {getModuleLabel(module.type)}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};
