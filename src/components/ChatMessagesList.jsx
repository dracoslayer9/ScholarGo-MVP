
import React from 'react';
import { Sparkles } from 'lucide-react';
import MessageContent from './MessageContent';

// Helper: Chat Messages List
// Pure list component, specific styling for User vs AI
const ChatMessagesList = ({ messages }) => {
    return (
        <div className="space-y-6">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[95%] rounded-2xl shadow-sm overflow-hidden ${msg.role === 'user'
                        ? 'bg-gray-100 text-oxford-blue rounded-br-sm px-5 py-3'
                        : 'bg-white border border-oxford-blue/10 text-oxford-blue rounded-bl-sm'
                        }`}>
                        {msg.role === 'assistant' && (
                            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                        )}
                        <div className={msg.role === 'assistant' ? 'p-5' : ''}>
                            {/* Avatar/Header for AI */}
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Sparkles size={10} />
                                    </div>
                                    <span className="text-xs font-bold text-oxford-blue/60 uppercase tracking-wider">ScholarGo AI</span>
                                </div>
                            )}
                            <MessageContent content={msg.content} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatMessagesList;
