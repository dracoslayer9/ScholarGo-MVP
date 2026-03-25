import React, { useState } from 'react';
import { Award, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';

const AnalysisResultView = ({ result, onLineClick }) => {
    const [expandedIndices, setExpandedIndices] = useState({});

    if (!result) return null;
    // If this is a dummy result for Chat/Research mode, do not render the Analysis Dashboard.
    if (result.globalSummary === "Research / Chat Session Active" || result.globalSummary === "General Chat Session Started.") {
        return null;
    }

    const toggleExpand = (idx) => {
        setExpandedIndices(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };
    return (
        <div className="space-y-6 animate-fadeIn pb-2 text-oxford-blue">
            {/* Structural Analysis breakdown */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-oxford-blue/60 mb-4">Anatomi Struktur per Paragraf</h3>
                <div className="space-y-4">
                    {Array.isArray(result.paragraphBreakdown) ? (
                        result.paragraphBreakdown.map((item, idx) => {
                            // Ensure "null" string or actual null falls back to main idea
                            const fallbackTitle = item.main_idea || `Bagian ${idx + 1}`;
                            const rawTitle = item.detected_subtitle || item.section_label || item.section;
                            const title = (rawTitle && String(rawTitle).toLowerCase() !== "null") ? rawTitle : fallbackTitle;

                            return (
                                <div key={idx} className="bg-white border border-oxford-blue/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                    {/* Header / Toggle */}
                                    <div 
                                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-oxford-blue/[0.02] transition-colors ${expandedIndices[idx] ? 'bg-oxford-blue/[0.03] border-b border-oxford-blue/5' : ''}`}
                                        onClick={() => toggleExpand(idx)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-bronze uppercase tracking-widest leading-none mb-1">
                                                    {item.paragraph_number ? `Para ${item.paragraph_number}` : `Bagian ${idx+1}`}
                                                </span>
                                                <h4 className="font-bold text-oxford-blue text-sm md:text-base leading-tight">
                                                    {title}
                                                </h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {expandedIndices[idx] ? <ChevronDown className="w-4 h-4 text-oxford-blue/40" /> : <ChevronRight className="w-4 h-4 text-oxford-blue/40" />}
                                        </div>
                                    </div>

                                    {/* Details (Collapsible) */}
                                    {expandedIndices[idx] && (
                                        <div className="p-4 pt-2 space-y-4 animate-slideDown">
                                            {(item.analysis_current || item.purpose) && (
                                                <div className="bg-green-50/30 p-3 rounded-lg border border-green-100/50">
                                                    <p className="text-[10px] font-bold text-green-700/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <Award className="w-3 h-3" />
                                                        Fungsi Paragraf
                                                    </p>
                                                    <p className="text-sm text-oxford-blue/90 leading-relaxed font-medium">{item.analysis_current || item.purpose}</p>
                                                </div>
                                            )}

                                            {item.main_idea && (
                                                <div className="px-1">
                                                    <p className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-widest mb-1">Gagasan Utama</p>
                                                    <p className="text-sm text-oxford-blue/90 leading-relaxed">{item.main_idea}</p>
                                                </div>
                                            )}

                                            {item.evidence_quote && (
                                                <div
                                                    className="mt-2 bg-oxford-blue/5 px-4 py-3 rounded-xl cursor-pointer hover:bg-oxford-blue/10 transition-all border border-transparent hover:border-bronze/20 active:scale-[0.98]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onLineClick && onLineClick(item.evidence_quote, item.evidence_location);
                                                    }}
                                                >
                                                    <p className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-widest mb-2 flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <MessageSquare className="w-3 h-3" />
                                                            Kutipan Esai (Ketuk untuk Fokus)
                                                        </span>
                                                        {item.evidence_location && (
                                                            <span className="normal-case bg-white px-2 py-0.5 rounded-full shadow-sm text-bronze font-extrabold text-[9px]">
                                                                Baris: {item.evidence_location.replace('Lines', '')}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-oxford-blue/70 italic font-serif leading-relaxed line-clamp-3 hover:line-clamp-none whitespace-pre-wrap transition-all">
                                                        "{item.evidence_quote}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                            <p>Struktur analisis belum lengkap.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysisResultView;
