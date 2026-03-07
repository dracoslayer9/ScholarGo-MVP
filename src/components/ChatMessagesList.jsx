
import React from 'react';
import { Sparkles, Pencil, BookOpen } from 'lucide-react';
import MessageContent from './MessageContent';
import AnalysisResultView from './AnalysisResultView';

// Helper: Chat Messages List
// Pure list component, specific styling for User vs AI
const ChatMessagesList = ({ messages, onEdit, onOpenFile, fileName }) => {
    const safeMessages = Array.isArray(messages) ? messages : [];

    return (
        <div className="space-y-6">
            {safeMessages.map((msg, idx) => (
                <div key={idx} id={`chat-msg-${idx}`} className={`flex w-full group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                    {/* Edit Button (User Only) */}
                    {msg.role === 'user' && onEdit && (
                        <button
                            onClick={() => onEdit(idx)}
                            className="mr-2 text-oxford-blue/20 hover:text-bronze opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-oxford-blue/5 self-center"
                            title="Edit this command"
                        >
                            <Pencil size={14} />
                        </button>
                    )}

                    <div className={`max-w-[90%] ${msg.role === 'user'
                        ? (msg.content === "Analyze this document completely." ? 'bg-transparent text-oxford-blue' : 'bg-gray-100 text-oxford-blue rounded-3xl rounded-br-sm px-6 py-4') // User: Gray Box or Transparent for file icon
                        : 'bg-transparent text-oxford-blue px-2' // AI: Plain Text
                        }`}>

                        {/* Only show "Scholarstory AI" header if it's the very first message or if previous was user? 
                            For now, keep it simple as requested: "Structure text" */}
                        {/* Removed AI Logo per user request */}

                        {(msg.role === 'user' && (msg.content === "Analyze this document completely." || msg.content === "Dissect this document completely.")) ? (
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
                                <AnalysisResultView result={msg.analysisData} />
                            ) : (
                                <MessageContent content={msg.content} />
                            )
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatMessagesList;
