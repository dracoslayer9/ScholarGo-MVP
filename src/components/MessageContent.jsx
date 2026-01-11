
import React from 'react';
import { Globe, Link as LinkIcon, CheckCircle, Sparkles } from 'lucide-react';

const MessageContent = ({ content }) => {
    // --- DETECT RESEARCH INSIGHT CARD ---
    // Pattern: "Research Insight" followed by "1. **Validation Summary**"
    // We check for the specific keys requested by the user.
    const isResearchInsight = /Research Insight/i.test(content) && /1\.\s*\*\*Validation Summary\*\*/i.test(content);

    if (isResearchInsight) {
        const validation = content.match(/1\.\s*\*\*Validation Summary\*\*[:\s](.*?)(?=(2\.|$))/s)?.[1]?.trim();
        const background = content.match(/2\.\s*\*\*Background Info\*\*[:\s](.*?)(?=(3\.|$))/s)?.[1]?.trim();
        const references = content.match(/3\.\s*\*\*References\*\*[:\s](.*?)(?=$)/s)?.[1]?.trim();

        if (validation) {
            return (
                <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn mb-4">
                    {/* Header: Validation Summary */}
                    <div className="bg-blue-50/50 p-4 border-b border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Globe size={14} />
                            </div>
                            <span className="font-serif font-bold text-oxford-blue text-sm">Research Insight</span>
                        </div>
                        <p className="font-bold text-oxford-blue text-md leading-relaxed">{validation}</p>
                    </div>

                    {/* Body: Background Info */}
                    <div className="p-4 space-y-2">
                        <p className="text-xs font-bold text-oxford-blue/40 uppercase tracking-wider mb-1">Background Context</p>
                        <div className="text-sm text-oxford-blue/80 leading-relaxed whitespace-pre-wrap pl-1">
                            {background}
                        </div>
                    </div>

                    {/* Footer: References */}
                    {references && (
                        <div className="bg-oxford-blue/5 p-3 border-t border-oxford-blue/10">
                            <p className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <LinkIcon size={10} /> Validated Sources
                            </p>
                            <div className="text-xs text-blue-600 flex flex-col gap-1">
                                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                                    __html: references.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline decoration-blue-200 hover:text-blue-800">$1</a>')
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    }

    // --- DETECT INDONESIAN ANALYSIS FORMAT (Multi-Card Support) ---
    const isIndonesianAnalysis = /1\.\s*\*\*Gagasan Utama\*\*/i.test(content) && /Paragraf\s+\d+/i.test(content);

    if (isIndonesianAnalysis) {
        // Split content by "Paragraf [Number]" to handle multiple cards
        // This regex splits but captures the delimiter (Paragraf N) so we can reconstruct or ignore.
        const blocks = content.split(/(?=Paragraf\s+\d+)/i).filter(block => block.trim().length > 0);

        return (
            <div className="flex flex-col gap-4 w-full animate-fadeIn">
                {blocks.map((block, idx) => {
                    // Extract Header
                    const headerMatch = block.match(/Paragraf\s+(\d+)/i);
                    const paragraphNum = headerMatch ? headerMatch[1] : `?`;

                    // Extract Fields
                    const mainIdea = block.match(/1\.\s*\*\*Gagasan Utama\*\*[:\s]+(.*?)(?=(2\.|$))/s)?.[1]?.trim();
                    const development = block.match(/2\.\s*\**(?:Pengembangan Ide|Cara Penulis Menuangkan Ide)\*\*[:\s]+(.*?)(?=(3\.|$))/s)?.[1]?.trim();
                    const evidence = block.match(/3\.\s*\*\*Bukti Kalimat\*\*[:\s]+(.*?)(?=$)/s)?.[1]?.trim();

                    // Only render if we have at least the main idea
                    if (!mainIdea) return <div key={idx} className="whitespace-pre-wrap">{block}</div>;

                    return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-1 last:mb-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-oxford-blue/5 flex items-center justify-center text-oxford-blue font-serif font-bold text-xs">
                                    {paragraphNum}
                                </div>
                                <span className="font-bold text-oxford-blue text-sm">Paragraf {paragraphNum}</span>
                            </div>

                            <div className="space-y-3">
                                {/* Gagasan Utama */}
                                <div>
                                    <p className="text-xs font-bold text-oxford-blue/60 mb-1 uppercase tracking-wider">Gagasan Utama</p>
                                    <p className="text-sm text-oxford-blue font-medium leading-relaxed">{mainIdea}</p>
                                </div>

                                {/* Pengembangan Ide */}
                                {development && (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-xs font-bold text-oxford-blue/60 mb-1 uppercase tracking-wider">Pengembangan Ide</p>
                                        <p className="text-sm text-oxford-blue leading-relaxed">{development}</p>
                                    </div>
                                )}

                                {/* Bukti Kalimat */}
                                {evidence && (
                                    <div>
                                        <p className="text-xs font-bold text-oxford-blue/60 mb-1 uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle size={10} /> Bukti Kalimat
                                        </p>
                                        <p className="text-sm text-oxford-blue/70 italic font-serif border-l-2 border-bronze/30 pl-3 leading-relaxed">
                                            {evidence.replace(/^"|"$/g, '')} {/* Remove surrounding quotes if captured */}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // --- LEGACY INSIGHT FORMAT (Context Menu) ---
    const insightRegex = /1\.\s*\*\*Main Idea\*\*[:\s]/i;
    // Fallthrough if it doesn't match the others
    const isLegacy = insightRegex.test(content) && !isIndonesianAnalysis && !isResearchInsight;

    if (isLegacy) {
        const mainIdea = content.match(/1\.\s*\*\*Main Idea\*\*[:\s](.*?)(?=(2\.|$))/s)?.[1]?.trim() || "";
        const approach = content.match(/2\.\s*\*\*Approach\*\*[:\s](.*?)(?=(3\.|$))/s)?.[1]?.trim() || "";
        const implication = content.match(/3\.\s*\*\*Implication\*\*[:\s](.*?)(?=$)/s)?.[1]?.trim() || "";

        if (mainIdea) {
            return (
                <div className="flex flex-col gap-3 min-w-[250px] bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-1">
                        <span className="text-bronze"><Sparkles size={16} /></span>
                        <span className="font-serif font-bold text-oxford-blue text-sm">Analysis Insight</span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-oxford-blue/50 mb-1">Main Idea</p>
                            <p className="text-sm text-oxford-blue leading-normal">{mainIdea}</p>
                        </div>
                        <div className="bg-oxford-blue/5 p-3 rounded-lg border border-oxford-blue/5">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-oxford-blue/50 mb-1">Writer's Approach</p>
                            <p className="text-sm text-oxford-blue leading-normal">{approach}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-oxford-blue/50 mb-1">Implication</p>
                            <p className="text-sm text-oxford-blue italic text-oxford-blue/80">"{implication}"</p>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // Default Text: Simple Markdown Formatter (Bold & Link Support)
    const formatText = (text) => {
        // Regex matches:
        // 1. **bold**
        // 2. [link text](url)
        const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
        const parts = text.split(regex);

        return parts.map((part, index) => {
            // Bold Match
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            // Link Match
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) {
                    return (
                        <a
                            key={index}
                            href={linkMatch[2]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            {linkMatch[1]}
                        </a>
                    );
                }
            }
            // Plain Text
            return part;
        });
    };

    return <div className="whitespace-pre-wrap leading-relaxed">{formatText(content)}</div>;
};

export default MessageContent;
