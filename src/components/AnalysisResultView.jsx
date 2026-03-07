
import React from 'react';
import { Award } from 'lucide-react';

const AnalysisResultView = ({ result }) => {
    if (!result) return null;
    // If this is a dummy result for Chat/Research mode, do not render the Analysis Dashboard.
    if (result.globalSummary === "Research / Chat Session Active" || result.globalSummary === "General Chat Session Started.") {
        return null;
    }
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
                                <div key={idx} className="pl-4 border-l-2 border-oxford-blue/20 hover:border-bronze transition-colors py-1 group">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-oxford-blue/50 uppercase tracking-widest whitespace-nowrap">
                                            {item.paragraph_number ? `Para ${item.paragraph_number}` : ''}
                                        </span>
                                        <h4 className="font-bold text-oxford-blue text-sm md:text-base leading-tight">
                                            {title}
                                        </h4>
                                    </div>

                                    <div className="space-y-2 mt-2">
                                        {(item.analysis_current || item.purpose) && (
                                            <div>
                                                <p className="text-xs font-semibold text-oxford-blue/60 mb-0.5">Fungsi Paragraf:</p>
                                                <p className="text-sm text-oxford-blue/90">{item.analysis_current || item.purpose}</p>
                                            </div>
                                        )}

                                        {item.main_idea && (
                                            <div>
                                                <p className="text-xs font-semibold text-oxford-blue/60 mb-0.5">Gagasan Utama:</p>
                                                <p className="text-sm text-oxford-blue/90">{item.main_idea}</p>
                                            </div>
                                        )}

                                        {item.evidence_quote && (
                                            <div className="mt-2 bg-oxford-blue/5 px-3 py-2 rounded-lg inline-block w-full">
                                                <p className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                    <span>Kutipan Esai</span>
                                                    {item.evidence_location && <span className="normal-case bg-white px-1.5 py-0.5 rounded shadow-sm">Baris: {item.evidence_location.replace('Lines', '')}</span>}
                                                </p>
                                                <p className="text-sm text-oxford-blue/70 italic font-serif leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                                                    "{item.evidence_quote}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
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
