
import React from 'react';
import { Sparkles, Pencil, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import MessageContent from './MessageContent';
import AnalysisResultView from './AnalysisResultView';

const ContextCard = ({ context }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    if (!context || !context.text) return null;

    return (
        <div className="mb-3 border border-oxford-blue/10 rounded-2xl overflow-hidden bg-white/40 shadow-sm transition-all hover:border-bronze/20 max-w-full">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 hover:bg-bronze/5 transition-colors text-left group"
            >
                <div className="flex flex-col gap-0.5">
                    <span className="text-bronze font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={10} /> Konteks Fokus: Paragraf {context.number}
                    </span>
                    {!isExpanded && (
                        <span className="text-oxford-blue/50 text-[12px] line-clamp-1 italic font-medium">
                            {context.text.substring(0, 60)}{context.text.length > 60 ? '...' : ''}
                        </span>
                    )}
                </div>
                <span className="text-oxford-blue/30 group-hover:text-bronze transition-colors flex items-center gap-2 text-[11px] font-bold uppercase">
                    {isExpanded ? "Sembunyikan" : "Lihat Detail"}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
            </button>

            {isExpanded && (
                <div className="px-5 py-4 text-oxford-blue/80 text-[13px] leading-relaxed border-t border-gray-100 bg-white/80 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex gap-4">
                        <div className="w-1 h-auto bg-bronze/20 rounded-full my-1 shrink-0"></div>
                        <p className="italic">"{context.text}"</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper: Chat Messages List
// Pure list component, specific styling for User vs AI
const ChatMessagesList = ({ messages, onEdit, onOpenFile, fileName, onReferenceClick, onLineClick, editingIndex, editingText, setEditingText, onSave, onCancel }) => {
    const safeMessages = Array.isArray(messages) ? messages : [];

    return (
        <div className="space-y-6">
            {safeMessages.map((msg, idx) => {
                const isEditing = editingIndex === idx;

                return (
                    <div key={idx} id={`chat-msg-${idx}`} className={`flex w-full group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                        {/* Edit Button (User Only) - Hide if already editing */}
                        {msg.role === 'user' && onEdit && !isEditing && (
                            <button
                                onClick={() => onEdit(idx)}
                                className="mr-2 text-oxford-blue/20 hover:text-bronze opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-oxford-blue/5 self-center"
                                title="Edit this command"
                            >
                                <Pencil size={14} />
                            </button>
                        )}

                        <div className={`max-w-[90%] ${msg.role === 'user'
                            ? (msg.content === "Analyze this document completely." || msg.content === "Dissect this document completely." ? 'bg-transparent text-oxford-blue' : 'bg-gray-100 text-oxford-blue rounded-3xl rounded-br-sm px-6 py-4') // User: Gray Box or Transparent for file icon
                            : 'bg-transparent text-oxford-blue px-2' // AI: Plain Text
                            } ${isEditing ? 'w-full max-w-full !bg-transparent !p-0' : ''}`}>

                            {isEditing ? (
                                <div className="flex flex-col gap-4 w-full">
                                    <div className="w-full border-2 border-oxford-blue/10 focus-within:border-blue-500/50 rounded-[28px] px-6 py-4 transition-all bg-white relative overflow-hidden">
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="w-full bg-transparent border-0 focus:border-0 focus:ring-0 outline-none text-sm py-1 resize-none min-h-[60px] text-oxford-blue font-medium placeholder-gray-400 shadow-none border-none"
                                            autoFocus
                                            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                                        />
                                    </div>
                                    <div className="flex justify-start gap-4 items-center">
                                        <button
                                            onClick={onCancel}
                                            className="text-sm font-bold text-oxford-blue/60 hover:text-red-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => onSave(idx, editingText)}
                                            disabled={!editingText.trim()}
                                            className="px-6 py-2 bg-oxford-blue/5 hover:bg-oxford-blue/10 text-oxford-blue text-sm font-bold rounded-full transition-all disabled:opacity-30"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                (msg.role === 'user' && (msg.content === "Analyze this document completely." || msg.content === "Dissect this document completely.")) ? (
                                    <div
                                        onClick={() => onOpenFile && onOpenFile()}
                                        className="flex items-center gap-3 px-4 py-3 bg-white border border-oxford-blue/10 rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 hover:border-bronze/30 transition-all select-none"
                                    >
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                            <BookOpen size={20} strokeWidth={2} />
                                        </div>
                                        <div className="flex flex-col text-left mr-4">
                                            <span className="font-semibold text-oxford-blue text-sm truncate max-w-[200px]">{fileName || "Document Analyzed"}</span>
                                            <span className="text-xs text-oxford-blue/50">Click to view context</span>
                                        </div>
                                    </div>
                                ) : (
                                    msg.analysisData ? (
                                        <AnalysisResultView result={msg.analysisData} onLineClick={onLineClick} />
                                    ) : (
                                        <>
                                            {msg.focusedContext && <ContextCard context={msg.focusedContext} />}
                                            <MessageContent content={msg.content} onReferenceClick={onReferenceClick} />
                                        </>
                                    )
                                )
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatMessagesList;
