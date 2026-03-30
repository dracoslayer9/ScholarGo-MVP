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
            <div className="w-full max-w-md space-y-4 pt-4">
                {steps.map((s, idx) => {
                    const Icon = s.icon;
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;

                    return (
                        <div 
                            key={s.id} 
                            className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${isActive ? 'bg-bronze/5 scale-105 shadow-sm border border-bronze/10' : 'opacity-40'}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-100 text-green-600' : isActive ? 'bg-bronze text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} className={isActive ? 'animate-pulse' : ''} />}
                            </div>
                            <span className={`text-sm font-medium ${isActive ? 'text-oxford-blue' : 'text-oxford-blue/60'}`}>
                                {s.label}
                            </span>
                            {isActive && (
                                <div className="ml-auto flex gap-1">
                                    <div className="w-1 h-1 bg-bronze rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-bronze rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1 h-1 bg-bronze rounded-full animate-bounce [animation-delay:-0.3s]"></div>
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
