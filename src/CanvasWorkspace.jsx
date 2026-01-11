
import React, { useState, useRef, useEffect } from 'react';
import {
    Save,
    Settings,
    Play,
    Send,
    Loader,
    Plus,
    ChevronDown,
    Bot,
    Sparkles,
    X,
    Paperclip,
    FileText,
    Maximize2,
    CheckSquare,
    ChevronLeft,
    Menu
} from 'lucide-react';
import { runRealAnalysis } from './services/analysis';
import ChatMessagesList from './components/ChatMessagesList';
import AnalysisResultView from './components/AnalysisResultView';

const CanvasWorkspace = ({ onToggleSidebar }) => {
    // --- State ---
    // Editor State
    const [essayTitle, setEssayTitle] = useState('Untitled Essay');
    const [essayContent, setEssayContent] = useState('');

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Flash'); // Default
    const [showModelMenu, setShowModelMenu] = useState(false);

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

    const handleChatSubmit = async () => {
        if ((!chatInput.trim() && !essayContent.trim()) || isAnalyzing) return;

        const userMessage = chatInput.trim() || "Analyze this essay";

        // precise context: The essay content
        const context = essayContent;

        // Add User Message
        const newMessage = { role: 'user', content: userMessage };
        setChatHistory(prev => [...prev, newMessage]);
        setChatInput('');
        setIsAnalyzing(true);

        try {
            // Call Analysis Service
            // We use 'runRealAnalysis' which handles both chat and analysis
            // We pass the essay content as 'context' or 'text' depending on intent
            // Here, we treat the essay as the primary text to analyze if the user asks for it.

            const result = await runRealAnalysis(
                context, // The essay is the "text" being analyzed usually
                'gemini', // Provider (hardcoded to gemini/internal preference for now)
                userMessage, // Instruction/Query
                null // Context (can be null if text is passed as first arg)
            );

            // Access the text response.
            // runRealAnalysis returns an object with globalSummary, etc.
            // If it's a chat response, it might be in globalSummary or a specific field.
            // For now, let's assume globalSummary is the main response.

            const aiResponse = result.globalSummary || "I've analyzed your text.";

            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: aiResponse,
                // We can also attach the full result object if we want to show the dashboard
                analysisResult: result
            }]);

        } catch (error) {
            console.error("Chat Error:", error);
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit();
        }
    };

    // Word Count
    const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).length : 0;

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden animate-fadeIn">

            {/* LEFT PANEL: WRITING CANVAS */}
            <div className="flex-1 flex flex-col border-r border-oxford-blue/10 h-full">
                {/* Header */}
                <div className="h-16 border-b border-oxford-blue/10 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Toggle Sidebar */}
                        <button
                            onClick={onToggleSidebar}
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
                        <button className="p-2 text-oxford-blue/40 hover:text-bronze transition-colors">
                            <Save size={18} />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <div className="max-w-4xl mx-auto min-h-full px-12 py-8">
                        <textarea
                            ref={textareaRef}
                            value={essayContent}
                            onChange={(e) => setEssayContent(e.target.value)}
                            placeholder="Start writing or paste your essay here..."
                            className="w-full min-h-[80vh] resize-none border-none focus:ring-0 text-lg leading-loose text-oxford-blue font-serif bg-transparent placeholder-oxford-blue/20 p-0"
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
                            <h3 className="font-serif font-bold text-xl text-oxford-blue mb-2">Ready to assist</h3>
                            <p className="text-oxford-blue/60 max-w-xs mx-auto text-sm">
                                I can analyze your essay as you write. Ask for feedback on structure, tone, or grammar.
                            </p>
                        </div>
                    )}

                    <ChatMessagesList messages={chatHistory} />

                    {/* Loading State */}
                    {isAnalyzing && (
                        <div className="flex justify-start animate-fadeIn">
                            <div className="bg-white border border-oxford-blue/10 text-oxford-blue rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-3">
                                <Loader size={16} className="text-bronze animate-spin" />
                                <span className="text-sm font-medium text-oxford-blue/60">Analyzing your text...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area (Gemini Style) */}
                <div className="p-4 bg-white shrink-0">
                    <div className="relative bg-gray-50 hover:bg-white border border-transparent hover:border-oxford-blue/10 rounded-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-bronze/5 focus-within:border-bronze/20 focus-within:bg-white shadow-sm hover:shadow-md">
                        <textarea
                            ref={chatInputRef}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isAnalyzing ? "ScholarGo is thinking..." : "Ask me anything..."}
                            className="w-full bg-transparent border-none px-4 pt-4 pb-12 focus:ring-0 text-oxford-blue placeholder-oxford-blue/40 resize-none max-h-40 min-h-[60px] cursor-text"
                            rows={1}
                            disabled={isAnalyzing}
                        />

                        {/* Bottom Controls */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Add Document Button (Mock) */}
                                <button className="p-1.5 px-3 rounded-lg bg-oxford-blue/5 text-oxford-blue/60 hover:bg-oxford-blue/10 hover:text-oxford-blue transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                    <Plus size={12} />
                                    <span className="hidden sm:inline">Add Document</span>
                                </button>

                                {/* Model Switcher (Viz Only) */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowModelMenu(!showModelMenu)}
                                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-oxford-blue/5 text-[10px] font-bold text-oxford-blue/60 transition-colors"
                                    >
                                        <Sparkles size={10} className="text-bronze" />
                                        <span>{selectedModel}</span>
                                        <ChevronDown size={10} />
                                    </button>

                                    {/* Dropdown */}
                                    {showModelMenu && (
                                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-oxford-blue/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                                            {['Gemini 1.5 Flash', 'Gemini 1.5 Pro', 'GPT-4o'].map(model => (
                                                <button
                                                    key={model}
                                                    onClick={() => { setSelectedModel(model); setShowModelMenu(false); }}
                                                    className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-oxford-blue/5 transition-colors flex items-center justify-between ${selectedModel === model ? 'text-bronze bg-bronze/5' : 'text-oxford-blue/80'}`}
                                                >
                                                    {model}
                                                    {selectedModel === model && <CheckSquare size={12} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Send Button */}
                            <button
                                onClick={handleChatSubmit}
                                disabled={!chatInput.trim() && !essayContent.trim() && !isAnalyzing}
                                className="p-2 bg-bronze text-white rounded-lg hover:bg-bronze/90 transition-all disabled:opacity-30 disabled:bg-oxford-blue/50 flex items-center justify-center shadow-md shadow-bronze/20"
                            >
                                {isAnalyzing ? (
                                    <Loader size={16} className="animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-oxford-blue/30 font-medium">
                            AI can make mistakes. Please review generated results.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanvasWorkspace;
