
import React from 'react';
import { Globe, Link as LinkIcon, CheckCircle, Sparkles } from 'lucide-react';

const MessageContent = ({ content }) => {
    // Standard Text: Enhanced Line-based Parser
    // User requested "no cards", just clear text structure.

    // We can keep the helper to format bold/links
    const formatLine = (text) => {
        // Handle bold and links within a line
        const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
        const parts = text.split(regex);

        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="text-oxford-blue font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) return <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{linkMatch[1]}</a>;
            }
            return part;
        });
    };

    const safeContent = typeof content === 'string' ? content : String(content || '');

    return (
        <div className="space-y-1.5 leading-relaxed text-sm text-oxford-blue/90">
            {safeContent.split('\n').map((line, idx) => {
                const trimmed = line.trim();

                // Headers (### Phase 1: ...)
                if (trimmed.startsWith('###')) {
                    const headerText = trimmed.replace(/^###\s*/, '');
                    return (
                        <div key={idx} className="mt-4 mb-2">
                            {/* Optional Divider before header if not first item */}
                            {idx > 0 && <div className="h-px bg-gray-100 my-3 w-full" />}
                            <h3 className="text-blue-600 font-bold text-sm uppercase tracking-wider">
                                {formatLine(headerText)}
                            </h3>
                        </div>
                    );
                }

                // Headers (## or #)
                if (trimmed.startsWith('#')) {
                    const level = trimmed.match(/^#+/)[0].length;
                    const headerText = trimmed.replace(/^#+\s*/, '');

                    if (level === 1) {
                        return (
                            <h1 key={idx} className="text-oxford-blue font-bold text-xl mt-6 mb-3 border-b border-gray-100 pb-2">
                                {formatLine(headerText)}
                            </h1>
                        );
                    }
                    if (level === 2) {
                        return (
                            <h2 key={idx} className="text-oxford-blue font-bold text-lg mt-5 mb-2">
                                {formatLine(headerText)}
                            </h2>
                        );
                    }
                    return (
                        <h3 key={idx} className="text-oxford-blue font-bold text-base mt-4 mb-1">
                            {formatLine(headerText)}
                        </h3>
                    );
                }

                // Horizontal Rule
                if (trimmed === '---' || trimmed === '***') {
                    return <hr key={idx} className="my-4 border-gray-200" />;
                }

                // Lists
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                    return (
                        <div key={idx} className="flex gap-2 pl-2">
                            <span className="text-blue-400 font-bold">•</span>
                            <div>{formatLine(trimmed.substring(2))}</div>
                        </div>
                    );
                }
                if (/^\d+\.\s/.test(trimmed)) {
                    const numberFn = trimmed.match(/^\d+\./)[0];
                    const contentFn = trimmed.replace(/^\d+\.\s/, '');
                    return (
                        <div key={idx} className="flex gap-2 pl-2">
                            <span className="text-blue-600 font-serif font-bold min-w-[1.2rem]">{numberFn}</span>
                            <div>{formatLine(contentFn)}</div>
                        </div>
                    );
                }

                // Empty lines (spacing)
                if (!trimmed) {
                    return <div key={idx} className="h-2"></div>;
                }

                // Standard Paragraph
                return <div key={idx} className="min-h-[1.2em]">{formatLine(line)}</div>;
            })}
        </div>
    );
};

export default MessageContent;
