import React, { useState, useEffect } from 'react';
import { Loader2, Search, Zap, Target, BookOpen, CheckCircle2 } from 'lucide-react';

const DiscoveryThinkingState = ({ step }) => {
    const steps = [
        { id: 'parsing', label: 'Membaca Resume & Transkrip...', icon: Search },
        { id: 'matching', label: 'Menyelaraskan dengan Kriteria Beasiswa...', icon: Target },
        { id: 'planning', label: 'Menyusun Struktur 4-Phase Master Framework...', icon: Zap },
        { id: 'generating', label: 'Menenun Narasi Personalisasi...', icon: BookOpen },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-8 animate-fadeIn">
            {/* Main Brain Icon Container */}
            <div className="relative">
                <div className="w-24 h-24 bg-bronze/5 rounded-full flex items-center justify-center relative z-10">
                    <Loader2 size={48} className="text-bronze animate-spin-slow" />
                </div>
                {/* Pulsing rings */}
                <div className="absolute inset-0 w-24 h-24 bg-bronze/20 rounded-full animate-ping opacity-20"></div>
                <div className="absolute -inset-4 w-32 h-32 bg-bronze/10 rounded-full animate-pulse opacity-10"></div>
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-xl font-serif font-bold text-oxford-blue">Agentic Mode Aktif</h3>
                <p className="text-sm text-oxford-blue/60 max-w-xs mx-auto">
                    AI sedang memproses data untuk menciptakan draf esai kelas dunia untuk Anda.
                </p>
            </div>

            {/* Stepper Logic */}
            <div className="w-full max-w-sm space-y-5 pt-4">
                {steps.map((s, idx) => {
                    const Icon = s.icon;
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;

                    return (
                        <div 
                            key={s.id} 
                            className={`flex items-center gap-4 p-4 rounded-3xl transition-all duration-700 ${isActive ? 'bg-white shadow-[0_10px_40px_rgba(139,115,85,0.1)] border border-bronze/10 scale-105 z-10' : 'opacity-30 scale-95'}`}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${isCompleted ? 'bg-green-50 text-green-600' : isActive ? 'bg-bronze text-white rotate-6' : 'bg-gray-50 text-gray-400'}`}>
                                {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} className={isActive ? 'animate-pulse' : ''} />}
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className={`text-[13px] font-bold tracking-tight transition-colors duration-500 ${isActive ? 'text-oxford-blue' : 'text-oxford-blue/60'}`}>
                                    {isActive ? s.label : s.label.replace('...', '')}
                                </span>
                                {isActive && (
                                    <span className="text-[10px] text-bronze font-medium animate-pulse">Sedang bekerja...</span>
                                )}
                            </div>
                            {isActive && (
                                <div className="flex gap-1.5 px-2">
                                    <div className="w-1.5 h-1.5 bg-bronze rounded-full animate-bounce [animation-duration:0.8s]"></div>
                                    <div className="w-1.5 h-1.5 bg-bronze rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:-0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-bronze rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:-0.4s]"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DiscoveryThinkingState;
