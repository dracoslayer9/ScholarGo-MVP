
import React from 'react';
import { Globe, Link as LinkIcon, CheckCircle, Sparkles } from 'lucide-react';

const MessageContent = ({ content }) => {
    // Standard Text: Enhanced Line-based Parser with Table Detection

    const formatLine = (text) => {
        // Handle bold, links, and loose citations like [1] or [^1]
        const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\)|\[\^?\d+\])/g;
        const parts = text.split(regex);

        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="text-oxford-blue font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) {
                    const label = linkMatch[1];
                    const url = linkMatch[2];
                    const isCitation = /^(\^?\d+)$/.test(label.trim());
                    if (isCitation) {
                        return (
                            <a key={index} href={url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 mx-1 text-[11px] font-bold text-white bg-blue-600 border border-blue-500 rounded-full hover:bg-blue-700 hover:-translate-y-0.5 transition-all align-top shadow-sm cursor-pointer"
                                title={`Source ${label.replace('^', '')}`}>
                                {label.replace('^', '')}
                            </a>
                        );
                    }
                    return <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">{label}</a>;
                }
            }
            if (part.match(/^\[\^?\d+\]$/)) {
                // Loose citation without a link 
                const label = part.replace(/[\[\]\^]/g, '');
                return (
                    <span key={index} className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 mx-1 text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-full align-top shadow-sm cursor-default">
                        {label}
                    </span>
                );
            }
            return part;
        });
    };

    const safeContent = typeof content === 'string' ? content : String(content || '');

    // Pre-process lines to group markdown tables
    const blocks = [];
    let currentTable = null;

    safeContent.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            if (!currentTable) {
                currentTable = [];
                blocks.push({ type: 'table', rows: currentTable });
            }
            currentTable.push(trimmed);
        } else {
            if (currentTable) {
                currentTable = null;
            }
            blocks.push({ type: 'line', content: line, trimmed });
        }
    });

    return (
        <div className="space-y-3 leading-[1.8] text-[15px] text-oxford-blue/90">
            {blocks.map((block, idx) => {
                if (block.type === 'table') {
                    // Render Table as a Custom Card Layout
                    const rows = block.rows.filter(r => !r.replace(/\|/g, '').replace(/-/g, '').trim().length === 0); // Remove purely separator rows
                    if (rows.length < 2) return null; // Fallback or invalid table

                    const headers = rows[0].split('|').map(h => h.trim()).filter(Boolean);
                    const bodyRows = rows.slice(1).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

                    return (
                        <div key={idx} className="my-6 overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[400px]">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            {headers.map((h, i) => (
                                                <th key={i} className="px-5 py-4 font-bold text-oxford-blue text-sm uppercase tracking-wider">{formatLine(h)}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {bodyRows.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-blue-50/30 transition-colors">
                                                {headers.map((_, cellIndex) => (
                                                    <td key={cellIndex} className="px-5 py-4 text-[15px] text-gray-700 align-top">
                                                        {formatLine(row[cellIndex] || '')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                }

                // Standard Line Block
                const { line, trimmed } = block;

                // Headers (### Phase 1: ...)
                if (trimmed.startsWith('###')) {
                    const headerText = trimmed.replace(/^###\s*/, '');
                    return (
                        <div key={idx} className="mt-6 mb-3">
                            {/* Divider before header if not first item */}
                            {idx > 0 && <div className="h-px bg-gray-100 my-4 w-full" />}
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
                            <h1 key={idx} className="text-oxford-blue font-bold text-2xl mt-8 mb-4 border-b border-gray-100 pb-3">
                                {formatLine(headerText)}
                            </h1>
                        );
                    }
                    if (level === 2) {
                        return (
                            <h2 key={idx} className="text-oxford-blue font-bold text-xl mt-7 mb-3">
                                {formatLine(headerText)}
                            </h2>
                        );
                    }
                    return (
                        <h3 key={idx} className="text-oxford-blue font-bold text-lg mt-5 mb-2">
                            {formatLine(headerText)}
                        </h3>
                    );
                }

                // Horizontal Rule (Section Separator)
                if (trimmed === '---' || trimmed === '***') {
                    return (
                        <div key={idx} className="my-8 flex items-center justify-center">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        </div>
                    );
                }

                // Lists
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                    return (
                        <div key={idx} className="flex gap-3 pl-2 my-1">
                            <span className="text-blue-500 font-bold text-lg leading-none mt-1">•</span>
                            <div className="flex-1">{formatLine(trimmed.substring(2))}</div>
                        </div>
                    );
                }
                if (/^\d+\.\s/.test(trimmed)) {
                    const numberFn = trimmed.match(/^\d+\./)[0];
                    const contentFn = trimmed.replace(/^\d+\.\s/, '');
                    return (
                        <div key={idx} className="flex gap-3 pl-2 my-1">
                            <span className="text-blue-600 font-bold min-w-[1.5rem] mt-0.5">{numberFn}</span>
                            <div className="flex-1">{formatLine(contentFn)}</div>
                        </div>
                    );
                }

                // Empty lines (spacing)
                if (!trimmed) {
                    return <div key={idx} className="h-3"></div>;
                }

                // Standard Paragraph
                return <div key={idx} className="min-h-[1.5em]">{formatLine(block.content)}</div>;
            })}
        </div>
    );
};

export default MessageContent;
