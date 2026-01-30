
import React from 'react';
import { Award } from 'lucide-react';

const AnalysisResultView = ({ result }) => {
    if (!result) return null;
    // If this is a dummy result for Chat/Research mode, do not render the Analysis Dashboard.
    if (result.globalSummary === "Research / Chat Session Active" || result.globalSummary === "General Chat Session Started.") {
        return null;
    }
    return (
        <div className="space-y-8 animate-fadeIn pb-6 border-b border-oxford-blue/10">
            {/* Header: Document Classification */}
            <div className="p-6 border border-oxford-blue/10 bg-oxford-blue/5 rounded-xl">
                {result.documentClassification ? (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-oxford-blue">
                                    {result.documentClassification.primaryType}
                                </h3>
                                {/* Evaluation Badge */}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${result.documentClassification.confidence === 'High'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                    }`}>
                                    {result.documentClassification.confidence} Confidence
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>Analysis Result</div>
                )}
            </div>

            {/* Global Summary */}
            <div className="bg-gradient-to-br from-paper to-white p-6 rounded-xl border border-oxford-blue/10 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-bronze mb-3 flex items-center gap-2">
                    <Award size={16} /> Global Summary
                </h3>
                <p className="text-oxford-blue/80 leading-relaxed font-serif text-lg break-words">
                    {result.globalSummary}
                </p>
            </div>

            {/* Deep Analysis */}
            {result.deepAnalysis && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="bg-oxford-blue/5 p-4 rounded-lg border border-oxford-blue/10">
                        <p className="text-oxford-blue font-serif italic text-center">"{result.deepAnalysis.overallAssessment}"</p>
                    </div>
                </div>
            )}

            {/* Structural Analysis breakdown */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-oxford-blue/40 mb-4">Structural Analysis</h3>
                <div className="space-y-6">
                    {result.paragraphBreakdown.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-oxford-blue/5 shadow-sm p-6 hover:shadow-md transition-all group">
                            <div className="flex items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-oxford-blue/30 uppercase tracking-widest">{item.paragraph_number ? `Para ${item.paragraph_number}` : ''}</span>
                                    <h4 className="font-serif font-bold text-oxford-blue text-lg">{item.detected_subtitle || item.section_label || item.section}</h4>
                                </div>
                            </div>
                            {(item.analysis_current || item.purpose) && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-oxford-blue/30 uppercase tracking-widest mb-1">Current Structure</p>
                                    <p className="text-sm font-medium text-oxford-blue/80">{item.analysis_current || item.purpose}</p>
                                </div>
                            )}
                            <div className="space-y-4">
                                {item.main_idea && (
                                    <div>
                                        <p className="text-[10px] font-bold text-oxford-blue/20 uppercase tracking-widest mb-1">Main Idea</p>
                                        <p className="text-sm md:text-base text-oxford-blue leading-relaxed font-medium">{item.main_idea}</p>
                                    </div>
                                )}
                                {item.evidence_quote && (
                                    <div className="pl-4 border-l-2 border-bronze/30">
                                        <p className="text-[10px] font-bold text-bronze/50 uppercase tracking-widest mb-1">
                                            Evidence {item.evidence_location && <span className="ml-2 text-oxford-blue/30 text-[9px] normal-case bg-oxford-blue/5 px-1.5 py-0.5 rounded">Re: {item.evidence_location}</span>}
                                        </p>
                                        <p className="text-sm text-oxford-blue/60 italic font-serif leading-relaxed">"{item.evidence_quote}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalysisResultView;
