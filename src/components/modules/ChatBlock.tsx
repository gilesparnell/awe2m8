import React from 'react';
import { ModuleData } from '@/types';

export const ChatBlock: React.FC<{ data: ModuleData }> = ({ data }) => {
    return (
        <section className="py-32 px-6 bg-stone-50 border-t border-stone-200">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Chat Demo */}
                    <div className="order-2 lg:order-1 border border-stone-200 bg-stone-100 aspect-square flex items-center justify-center relative overflow-hidden">
                        {data.config?.url ? (
                            data.config.url.includes('<script') ? (
                                <iframe
                                    srcDoc={`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <style>
                                                body { margin: 0; padding: 0; background: transparent; height: 100vh; width: 100vw; overflow: hidden; }
                                                /* Force widget to be visible if needed */
                                            </style>
                                        </head>
                                        <body>
                                            ${data.config.url}
                                        </body>
                                        </html>
                                    `}
                                    className="w-full h-full border-0"
                                    allow="microphone; camera; autoplay; encrypted-media; fullscreen"
                                    allowFullScreen
                                />
                            ) : (
                                <iframe
                                    src={data.config.url}
                                    className="w-full h-full"
                                    allow="microphone; camera; autoplay; encrypted-media; fullscreen"
                                    allowFullScreen
                                />
                            )
                        ) : (
                            <div className="text-center p-12">
                                <div className="w-20 h-20 border-2 border-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Chat Interface</p>
                            </div>
                        )}
                    </div>
                    {/* Content */}
                    <div className="order-1 lg:order-2 lg:sticky lg:top-32">
                        <div className="inline-block px-3 py-1 border border-stone-300 text-stone-700 text-xs font-medium uppercase tracking-wider mb-6">
                            24/7 Support
                        </div>
                        <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">{data.title}</h2>
                        <p className="text-xl text-gray-600 leading-relaxed font-light">{data.content}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
