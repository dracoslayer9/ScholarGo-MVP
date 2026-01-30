
import React from 'react';
import { Sparkles, Pencil } from 'lucide-react';
import MessageContent from './MessageContent';

// Helper: Chat Messages List
// Pure list component, specific styling for User vs AI
const ChatMessagesList = ({ messages, onEdit }) => {
    const safeMessages = Array.isArray(messages) ? messages : [];

    return (
        <div className="space-y-6">
            {safeMessages.map((msg, idx) => (
                <div key={idx} className={`flex w-full group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

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
                        ? 'bg-gray-100 text-oxford-blue rounded-3xl rounded-br-sm px-6 py-4' // User: Gray Box
                        : 'bg-transparent text-oxford-blue px-2' // AI: Plain Text
                        }`}>

                        {/* Only show "ScholarGo AI" header if it's the very first message or if previous was user? 
                            For now, keep it simple as requested: "Structure text" */}
                        {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-full bg-bronze/10 flex items-center justify-center text-bronze">
                                    <Sparkles size={10} />
                                </div>
                                <span className="text-xs font-bold text-bronze uppercase tracking-wider">ScholarGo AI</span>
                            </div>
                        )}

                        <MessageContent content={msg.content} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatMessagesList;
