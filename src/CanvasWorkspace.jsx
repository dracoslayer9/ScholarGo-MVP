
import React, { useState, useRef, useEffect } from 'react';
import {
    Save,
    Settings,
    Send,
    Loader,
    Bot,
    Sparkles,
    Menu,
    ChevronLeft,
    Layout,
    Plus,
    Command
} from 'lucide-react';
import { sendChatMessage } from './services/analysis';
import { createChat, saveMessage, updateChatTitle } from './services/chatService';
import { generateSmartTitle } from './utils/chatUtils';
import ChatMessagesList from './components/ChatMessagesList';

const CanvasWorkspace = ({ onSwitchMode, onBack, onRequireAuth, user, onSignOut, onOpenSettings }) => {
    // --- State ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Editor State
    const [essayTitle, setEssayTitle] = useState('Untitled Essay');
    const [essayContent, setEssayContent] = useState('');

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [currentChatId, setCurrentChatId] = useState(null); // Canvas Chat Persistence

    // Refs
    const textareaRef = useRef(null);
    const chatInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [essayContent]);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    // Auto-resize chat input
    useEffect(() => {
        if (chatInputRef.current) {
            chatInputRef.current.style.height = 'auto'; // Reset
            chatInputRef.current.style.height = Math.min(chatInputRef.current.scrollHeight, 160) + 'px'; // Max height
        }
    }, [chatInput]);

    // --- Handlers ---

    const abortControllerRef = useRef(null);

    const stopAnalysis = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            // Optional: setIsAnalyzing(false); // handleChatSubmit catch block handles this
        }
    };

    const handleChatSubmit = async () => {
        // Auth Check
        if (onRequireAuth && onRequireAuth()) return;

        if ((!chatInput.trim() && !essayContent.trim()) || isAnalyzing) return;

        const userMessage = chatInput.trim() || "Analyze this essay";
        // precise context: The essay content
        const context = essayContent;

        // Add User Message
        const newMessage = { role: 'user', content: userMessage };
        setChatHistory(prev => [...prev, newMessage]);
        setChatInput('');
        setIsAnalyzing(true);

        // 1. LAZY CREATE CHAT SESSION
        let activeChatId = currentChatId;
        if (!activeChatId && user) {
            try {
                // Create Session for first message
                // Prefix with "Canvas" as requested
                const newChat = await createChat(user.id, "Canvas Chat");
                activeChatId = newChat.id;
                setCurrentChatId(activeChatId);
            } catch (err) {
                console.error("Failed to lazy-create canvas chat:", err);
            }
        }

        // 2. SAVE USER MESSAGE
        if (activeChatId) {
            saveMessage(activeChatId, 'user', userMessage).catch(err => console.error("Save Msg Error:", err));

            // AUTO-TITLE: If first message
            if (chatHistory.length === 0) {
                const smartTitle = generateSmartTitle(userMessage);
                const finalTitle = `Canvas: ${smartTitle}`; // Distinguishable prefix
                updateChatTitle(activeChatId, finalTitle);
            }
        }

        // Create AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Call Chat Service (using sendChatMessage to leverage Master Framework)
            // sendChatMessage(message, history, documentContent, provider, signal)
            const aiResponse = await sendChatMessage(
                userMessage,
                chatHistory, // Pass history for context
                context,     // The essay content
                'openai',     // Provider
                controller.signal // Signal
            );

            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: aiResponse
            }]);

            // 3. SAVE AI MESSAGE
            if (activeChatId) {
                saveMessage(activeChatId, 'assistant', aiResponse).catch(err => console.error("Save Msg Error:", err));
            }

            // AUTO-OUTLINE FEATURE
            // Trigger if:
            // 1. Essay is empty
            // 2. AI provides ANY headers (indicating structure)
            // 3. User specifically asked for it (weak check) OR response is clearly an outline (strong check)
            if (!essayContent.trim()) {
                const lines = aiResponse.split('\n');
                const headers = lines.filter(line => line.trim().startsWith('#') || line.trim().startsWith('**Phase'));

                // Lower threshold if user asked for "outline", "structure", "kerangka"
                const userIntent = userMessage.toLowerCase().includes('outline') ||
                    userMessage.toLowerCase().includes('structure') ||
                    userMessage.toLowerCase().includes('kerangka');

                if (headers.length >= (userIntent ? 1 : 3)) {
                    const outlineText = headers.map(h => {
                        let line = h.trim();
                        // Ensure "tagar" (hashtags) for visual distinction as requested
                        if (!line.startsWith('#')) {
                            return `### ${line}`;
                        }
                        return line;
                    }).join('\n\n') + '\n\n';
                    setEssayContent(outlineText);
                }
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Request cancelled by user");
            } else {
                console.error("Chat Error:", error);
                setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
                alert(`Chat Failed: ${error.message}`);
            }
        } finally {
            setIsAnalyzing(false);
            abortControllerRef.current = null;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit();
        }
    };

    // Manual Save Handler
    const handleSaveChat = async () => {
        if (!user || chatHistory.length === 0) return;

        try {
            let activeChatId = currentChatId;

            // If no active session, create one explicitly
            if (!activeChatId) {
                const title = essayTitle.trim() || "Untitled Canvas Session";
                const newChat = await createChat(user.id, `Canvas: ${title}`);
                activeChatId = newChat.id;
                setCurrentChatId(activeChatId);
            }

            // Save messages that haven't been saved? 
            // actually chatService.saveMessage is individual. 
            // But if we want to "snapshot" the whole thing or ensure validation:
            // For now, simpler approach: The messages are saved one-by-one during chat. 
            // So "Save" here might be more about updating the Title or ensuring the Essay Content is saved (if we had a DB field for it).
            // Request says: "pastikan datanya tersimpan menjadi history chat khusus fitur canvas"

            // Since we already lazy-create chat on first message (lines 102-114), 
            // the chat might already be saved. 
            // If the user hasn't sent a message yet, but wants to save "work" (the essay), we don't have a backend for essay text yet (only chats).
            // So we will focus on ensuring the CHAT SESSION exists and has the correct title.

            if (activeChatId) {
                // Update title to match current essay title
                const currentTitle = essayTitle.trim() || "Untitled Canvas Essay";
                await updateChatTitle(activeChatId, `Canvas: ${currentTitle}`);
                alert("Canvas Session Saved!");
            }

        } catch (error) {
            console.error("Save Error:", error);
            alert("Failed to save session.");
        }
    };


    // Word Count
    const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).length : 0;

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden animate-fadeIn">

            {/* CANVAS SIDEBAR */}
            <aside className={`${isSidebarOpen ? 'w-64 translate-x-0 overflow-visible' : 'w-0 -translate-x-full overflow-hidden'} bg-white border-r border-oxford-blue/10 text-oxford-blue transition-all duration-300 ease-in-out flex flex-col shrink-0 z-30`}>
                <div className="p-4 space-y-2">
                    <button
                        onClick={onBack}
                        className="w-full flex items-center gap-3 text-oxford-blue/60 hover:text-oxford-blue px-4 py-3 hover:bg-oxford-blue/5 rounded-xl transition-colors text-sm font-medium"
                    >
                        <ChevronLeft size={18} />
                        Back to Home
                    </button>
                    <button
                        onClick={onSwitchMode}
                        className="w-full flex items-center gap-3 text-oxford-blue/60 hover:text-oxford-blue px-4 py-3 hover:bg-oxford-blue/5 rounded-xl transition-colors text-sm font-medium"
                    >
                        <Layout size={18} />
                        Switch Mode
                    </button>

                    <div className="pt-4 pb-2">
                        <button
                            onClick={() => {
                                setEssayContent('');
                                setEssayTitle('Untitled Essay');
                                setChatHistory([]);
                                setCurrentChatId(null);
                            }}
                            className="w-full flex items-center gap-3 bg-white border border-oxford-blue/10 hover:border-bronze/50 text-oxford-blue px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md group"
                        >
                            <div className="w-8 h-8 rounded-full bg-oxford-blue/5 flex items-center justify-center group-hover:bg-bronze/10 group-hover:text-bronze transition-colors">
                                <Plus size={16} />
                            </div>
                            <span className="font-bold text-sm">New Chat</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1" />

                {/* User Profile */}
                <div className="p-4 border-t border-oxford-blue/5 relative" ref={userMenuRef}>
                    {/* User Menu Popup */}
                    {isUserMenuOpen && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-oxford-blue/10 overflow-hidden animate-fadeIn flex flex-col z-50">
                            <button className="text-left px-4 py-3 hover:bg-oxford-blue/5 text-sm font-medium text-oxford-blue transition-colors">
                                Upgrade your plan
                            </button>
                            <button
                                onClick={() => {
                                    setIsUserMenuOpen(false);
                                    if (onOpenSettings) onOpenSettings();
                                }}
                                className="text-left px-4 py-3 hover:bg-oxford-blue/5 text-sm font-medium text-oxford-blue transition-colors flex justify-between items-center"
                            >
                                Settings
                                <span className="text-xs text-oxford-blue/40 flex items-center gap-1">
                                    <Command size={10} /> ,
                                </span>
                            </button>
                            <div className="h-px bg-oxford-blue/10 my-0"></div>
                            <button
                                onClick={() => {
                                    if (onSignOut) onSignOut();
                                }}
                                className="text-left px-4 py-3 hover:bg-red-50 text-sm font-bold text-red-500 transition-colors"
                            >
                                Log Out
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-full flex items-center gap-3 px-2 py-2 hover:bg-oxford-blue/5 rounded-xl transition-colors text-left"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                            {user?.email?.[0].toUpperCase() || 'S'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-oxford-blue truncate">
                                {user?.user_metadata?.full_name || 'Scholar'}
                            </p>
                            <p className="text-xs text-oxford-blue/40 truncate">Free Plan</p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* LEFT PANEL: WRITING CANVAS */}
            <div className="flex-1 flex flex-col border-r border-oxford-blue/10 h-full">
                {/* Header */}
                <div className="h-16 border-b border-oxford-blue/10 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Toggle Sidebar */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 rounded-lg text-oxford-blue/40 hover:text-bronze hover:bg-oxford-blue/5 transition-colors"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="flex flex-col flex-1 justify-center">
                            <input
                                type="text"
                                value={essayTitle}
                                onChange={(e) => setEssayTitle(e.target.value)}
                                className="text-lg font-serif font-bold text-oxford-blue bg-transparent border-none focus:ring-0 p-0 placeholder-oxford-blue/30 w-full h-6"
                                placeholder="Essay Title"
                            />
                            <span className="text-[10px] font-medium text-oxford-blue/40 leading-none mt-0.5">{wordCount} words</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSaveChat}
                            className="p-2 text-oxford-blue/40 hover:text-bronze transition-colors"
                            title="Save Session"
                        >
                            <Save size={18} />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
                    <div className="max-w-4xl mx-auto min-h-full px-12 py-8 relative">

                        {/* 1. BACKDROP LAYER: Renders the visual markdown */}
                        <div
                            className="absolute inset-0 px-12 py-8 pointer-events-none whitespace-pre-wrap break-words font-serif text-lg leading-relaxed text-oxford-blue z-0"
                            aria-hidden="true"
                        >
                            {essayContent.split('\n').map((line, i) => {
                                // Empty line check
                                if (line === '') return <br key={i} />;

                                // 1. Header Detection
                                let className = "block min-h-[1.5em]"; // Default block
                                let content = line;

                                if (line.startsWith('### ')) {
                                    className = "block font-bold text-lg text-black"; // Unified size, Black as requested
                                    content = line;
                                } else if (line.startsWith('## ')) {
                                    className = "block font-bold text-lg text-oxford-blue";
                                } else if (line.startsWith('# ')) {
                                    className = "block font-bold text-lg text-oxford-blue underline decoration-bronze/30 underline-offset-4";
                                }

                                // 2. Bold Parsing: **text**
                                const parts = content.split(/(\*\*.*?\*\*)/g);
                                return (
                                    <div key={i} className={className}>
                                        {parts.map((part, j) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <span key={j} className="font-bold">{part.slice(2, -2)}</span>;
                                            }
                                            return <span key={j}>{part}</span>;
                                        })}
                                    </div>
                                );
                            })}
                            {/* Trailing newline support */}
                            {essayContent.endsWith('\n') && <br />}
                        </div>

                        {/* 2. FOREGROUND LAYER: The actual input */}
                        {/* Text is transparent, Caret is visible. Matches backdrop metrics exactly. */}
                        <textarea
                            ref={textareaRef}
                            value={essayContent}
                            onChange={(e) => setEssayContent(e.target.value)}
                            placeholder="Start writing or paste your essay here..."
                            className="relative z-10 w-full min-h-[80vh] resize-none border-none focus:ring-0 outline-none text-lg leading-relaxed font-serif bg-transparent text-transparent selection:text-transparent selection:bg-blue-200 caret-oxford-blue placeholder-oxford-blue/20 p-0 whitespace-pre-wrap break-words"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: AI ASSISTANT CHAT */}
            <div className="w-[450px] flex flex-col bg-white h-full shadow-xl shadow-oxford-blue/5 z-20">
                {/* Header */}
                <div className="h-16 border-b border-oxford-blue/10 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Sparkles size={16} />
                        </div>
                        <span className="font-bold text-oxford-blue">ScholarGo AI</span>
                    </div>
                    <button className="p-2 hover:bg-oxford-blue/5 rounded-lg text-oxford-blue/40 transition-colors">
                        <Settings size={18} />
                    </button>
                </div>

                {/* Chat History & Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC] custom-scrollbar">
                    {/* Welcome Message */}
                    {chatHistory.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 border border-oxford-blue/5">
                                <Bot size={32} className="text-bronze" />
                            </div>
                            <h3 className="font-serif font-bold text-xl text-oxford-blue mb-2">Siap bantu reviu esai kamu sambil nulis.</h3>
                            <p className="text-oxford-blue/60 max-w-xs mx-auto text-sm">
                                Tanya apa pun soal struktur narasi biar esai kamu makin selaras dan sesuai standar awardee.
                            </p>
                        </div>
                    )}

                    <ChatMessagesList messages={chatHistory} />

                    {/* Loading State */}
                    {isAnalyzing && (
                        <div className="flex justify-start animate-fadeIn">
                            <div className="bg-white border border-oxford-blue/10 text-oxford-blue rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-3">
                                <Loader size={16} className="text-bronze animate-spin" />
                                <span className="text-sm font-medium text-oxford-blue/60">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area (Unified Style) */}
                <div className="p-4 bg-white shrink-0 border-t border-oxford-blue/5">
                    <div className="bg-gray-50 border border-oxford-blue/10 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-bronze/10 focus-within:border-bronze/30 transition-all shadow-sm">
                        <textarea
                            ref={chatInputRef}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isAnalyzing ? "Thinking..." : "Ask ScholarGo..."}
                            className="w-full bg-transparent border-none px-4 py-3 text-sm text-oxford-blue outline-none resize-none custom-scrollbar disabled:opacity-50 placeholder-oxford-blue/40"
                            rows={1}
                            style={{ minHeight: '60px', maxHeight: '200px' }}
                            disabled={isAnalyzing}
                        />

                        {/* Internal Toolbar */}
                        <div className="flex items-center justify-between px-2 pb-1 mt-1">
                            <div className="flex items-center gap-2">
                                {/* Model Indicator (Static - Text Only) */}
                                <div className="text-oxford-blue/40 text-xs font-medium cursor-default">
                                    GPT-4o
                                </div>
                            </div>

                            {/* Send / Stop Button */}
                            <button
                                onClick={isAnalyzing ? stopAnalysis : handleChatSubmit}
                                disabled={!chatInput.trim() && !isAnalyzing}
                                className={`p-2 rounded-xl shadow-lg transition-all ${isAnalyzing
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                                    : 'bg-bronze hover:bg-bronze/90 text-white shadow-bronze/20 disabled:opacity-50 disabled:shadow-none'
                                    }`}
                            >
                                {isAnalyzing ? (
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />
                                    </div>
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanvasWorkspace;
