import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Activity,
  Award,
  ChevronRight,
  Sparkles,
  Layout,
  List,
  CheckSquare,
  Plus,
  Bot,
  Zap,
  ChevronDown,
  Send,
  Brain,

  MessageSquare,
  X,

  Menu,
  Settings,
  LogOut
} from 'lucide-react';

import { runAnalysis } from './services/analysis';

// --- Analysis Logic (Hybrid: Real + Mock Fallback) ---
const analyzeEssay = async (text, model, instruction, context) => {
  let fallbackReason = "Unknown";

  // 1. Try Real Gemini API first
  try {
    const realResult = await runAnalysis(text, model, "Student Draft", instruction, context);
    if (realResult) {
      // Add the detected type and model prefix to the real result
      const isAwardee = text.toLowerCase().includes("award") || text.toLowerCase().includes("winner");
      const detectedType = isAwardee ? "Awardee Sample" : "Student Draft";

      return {
        ...realResult,
        detectedType,
        globalSummary: `✨ [AI Analysis] ${realResult.globalSummary}`
      };
    } else {
      fallbackReason = "API Key Missing";
    }
  } catch (error) {
    console.warn("Falling back to mock analysis due to API error:", error);
    fallbackReason = `API Error: ${error.message || error.toString()}`;
  }

  // 2. Fallback to Mock Data (if no key or error)
  await new Promise(resolve => setTimeout(resolve, 1500));

  const snippet = text.slice(0, 50) + (text.length > 50 ? "..." : "");
  const modelPrefix = `⚡ [Demo Mode: ${fallbackReason}]`;

  // Mock Auto-Detection
  const isAwardee = text.toLowerCase().includes("award") || text.toLowerCase().includes("winner");
  const detectedType = isAwardee ? "Awardee Sample" : "Student Draft";

  return {
    detectedType,
    globalSummary: `${modelPrefix} Analysis of ${detectedType}. The essay starts with "${snippet}". ${isAwardee ? "This piece exhibits strong narrative control and clear thematic progression." : "This draft shows promise but requires stronger connections between personal experience and future goals."}`,
    paragraphBreakdown: [
      {
        section: "Introduction",
        role: "Context",
        main_idea: "Establishes the applicant's background and sets the stage for the challenge.",
        strength: "Clear context setting.",
        status: isAwardee ? "strong" : "needs_improvement"
      },
      {
        section: "Body Paragraph 1",
        role: "Action",
        main_idea: "Demonstrates leadership through specific actions taken during the event.",
        strength: "Strong verb usage.",
        status: "strong"
      },
      {
        section: "Body Paragraph 2",
        role: "Reflection",
        main_idea: "Connects the challenge faced to future academic goals.",
        strength: "Insightful connection.",
        status: isAwardee ? "strong" : "neutral"
      },
      {
        section: "Conclusion",
        role: "Outcome",
        main_idea: "Summarizes the journey and provides a forward-looking statement.",
        strength: "Inspiring closing.",
        status: "strong"
      }
    ]
  };
};

function App() {
  const [essayText, setEssayText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeView, setActiveView] = useState('summary'); // Kept for backwards compatibility if needed, but unused for switching

  // New State for Reader Mode & Chat
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai');
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  // Text Selection State
  const [selectionPopup, setSelectionPopup] = useState({ show: false, x: 0, y: 0, text: '' });
  const [contextText, setContextText] = useState(null);

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);


  const performAnalysis = async () => {
    if (!essayText.trim()) return;
    setIsAnalyzing(true);
    try {
      console.log(`Analyzing with model: ${selectedModel}`);
      const result = await analyzeEssay(essayText, selectedModel, chatInput, contextText);
      setAnalysisResult(result);
      setIsAnalyzed(true);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setFileType(file.type);
    setIsAnalyzed(true);

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEssayText(event.target.result);
      };
      reader.readAsText(file);
    } else {
      setEssayText(`[Analysis performed on uploaded ${file.type === 'application/pdf' ? 'PDF' : 'Document'}]`);
    }
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim() && !essayText.trim()) return;

    console.log("Chat submitted:", chatInput, "Context:", contextText);

    // If there is contextText, we should include it in the analysis request implicitly or explicitly
    // For now, we proceed with standard analysis, assuming the backend or prompts will handle instructions 

    if (!analysisResult) {
      performAnalysis();
    }

    setChatInput('');
    setContextText(null);
  };

  // Text Selection Handler
  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = e.currentTarget.getBoundingClientRect();

      const relativeX = rect.left - containerRect.left + (rect.width / 2);
      const relativeY = rect.top - containerRect.top;

      setSelectionPopup({
        show: true,
        x: relativeX,
        y: relativeY - 40,
        text: selection.toString()
      });
    } else {
      // Don't hide immediately on click inside the popover, but here we assume click is on text
      setSelectionPopup({ ...selectionPopup, show: false });
    }
  };

  const handleSelectionChat = (e) => {
    e.stopPropagation(); // Prevent clearing selection immediately
    setContextText(selectionPopup.text);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const handleQuickAnalyze = (e) => {
    e.stopPropagation();
    const text = selectionPopup.text;
    setContextText(text);
    setSelectionPopup({ ...selectionPopup, show: false });

    // Trigger analysis specifically for this section
    // We set a specific instruction for this action
    const instruction = "Analyze this specific section based on the role, main idea, and strength format.";

    console.log("Quick analyzing section:", text);
    // We can either set the chat input and submit, or call analyze directly.
    // Setting chat input visualizes it for the user.
    setChatInput(instruction);

    // We need to wait for state update or call function with new values. 
    // Since setState is async, we'll verify in a use effect or just call analyzeEssay directly here if we refactor performAnalysis to accept args.
    // For now, let's update chat input and let user confirm or auto-submit logic if we had it.
    // But user asked for "Analyze this section" action.
    // Let's force a call:
    setIsAnalyzing(true);
    analyzeEssay(essayText, selectedModel, instruction, text).then(result => {
      setAnalysisResult(result);
      setIsAnalyzed(true);
      setIsAnalyzing(false);
      setChatInput(''); // clear after
      setContextText(null);
    });
  };

  return (
    <div className="flex h-screen bg-paper overflow-hidden font-sans selection:bg-bronze/30 selection:text-oxford-blue">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'} bg-oxford-blue text-white transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0`}>
        <div className="p-4">
          <button
            onClick={() => {
              setEssayText('');
              setAnalysisResult(null);
              setIsAnalyzed(false);
              setFileUrl(null);
              setContextText(null);
            }}
            className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-colors border border-white/5 shadow-sm"
          >
            <Plus size={20} />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
          {/* History removed to focus on analysis */}
        </div>

        <div className="p-4 border-t border-white/10 bg-oxford-blue">
          <button className="w-full flex items-center gap-3 px-2 py-2 text-left text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bronze to-amber-600 flex items-center justify-center text-white shadow-md">
              <span className="font-serif font-bold text-xs">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">John Doe</p>
              <p className="text-xs text-white/40 truncate">Pro Plan</p>
            </div>
            <Settings size={16} className="text-white/40" />
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-oxford-blue/10 shrink-0 z-10">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 -ml-2 text-oxford-blue/60 hover:text-oxford-blue hover:bg-oxford-blue/5 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
              {!sidebarOpen && (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <div className="w-8 h-8 bg-oxford-blue rounded-lg flex items-center justify-center text-paper shadow-lg shadow-oxford-blue/20">
                    <BookOpen size={18} />
                  </div>
                  <h1 className="text-xl font-serif font-bold tracking-tight text-oxford-blue">
                    ScholarGo
                  </h1>
                </div>
              )}
            </div>
            {/* Navigation removed as per user request to focus on document analysis */}
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full flex flex-col">

            {/* Hero Section */}
            {/* Hero Section */}
            <div className="text-center mb-12 max-w-3xl mx-auto animate-fadeIn pt-10">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-oxford-blue mb-6 leading-tight">
                Understand How Winners Think
              </h1>
              <p className="text-lg md:text-xl text-oxford-blue/70 leading-relaxed font-light">
                ScholarGo analyzes real awardee essays, portfolios, and study plans—transforming them into clear patterns, paragraph insights, and storytelling frameworks.
              </p>
            </div>

            <div className={`grid lg:grid-cols-2 gap-8 ${isAnalyzed ? 'h-full' : 'h-[600px]'}`}>

              {/* Left Column: Input OR Reader View */}
              <div className="flex flex-col gap-4 h-full min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
                    <FileText className="text-bronze" size={20} />
                    {isAnalyzed ? 'Document Reader' : 'Upload Document'}
                  </h2>
                  {isAnalyzed ? (
                    <button
                      onClick={() => {
                        setIsAnalyzed(false);
                        setFileUrl(null);
                        setFileType(null);
                        setEssayText(''); // Clear essay text when uploading new
                        setAnalysisResult(null); // Clear analysis result
                        setContextText(null);
                      }}
                      className="text-xs font-medium px-3 py-1 bg-oxford-blue/5 text-oxford-blue/60 rounded-full hover:bg-oxford-blue/10 transition-colors"
                    >
                      Upload New
                    </button>
                  ) : (
                    <span className="text-xs font-medium px-3 py-1 bg-oxford-blue/5 text-oxford-blue/60 rounded-full">
                      {essayText.split(/\s+/).filter(w => w.length > 0).length} words
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-4 relative min-h-0">
                  {/* Document Display Area */}
                  <div className="flex-1 bg-white rounded-xl border border-oxford-blue/10 shadow-sm overflow-hidden relative group">
                    {/* Text Selection Popup */}
                    {selectionPopup.show && (
                      <div
                        className="absolute z-50 bg-oxford-blue text-white rounded-lg shadow-xl transform -translate-x-1/2 flex items-center overflow-hidden animate-fadeIn divide-x divide-white/10"
                        style={{ left: selectionPopup.x, top: selectionPopup.y }}
                      >
                        <button
                          onClick={handleQuickAnalyze}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors text-xs font-medium"
                        >
                          <Sparkles size={14} className="text-bronze" />
                          Analyze
                        </button>
                        <button
                          onClick={handleSelectionChat}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors text-xs font-medium"
                        >
                          <MessageSquare size={14} />
                          Chat
                        </button>
                      </div>
                    )}

                    {isAnalyzed ? (
                      <div
                        className="w-full h-full bg-oxford-blue/5 relative"
                        onMouseUp={handleTextSelection}
                      >
                        {fileType === 'application/pdf' ? (
                          <iframe
                            src={fileUrl}
                            className="w-full h-full border-none"
                            title="Document Viewer"
                          />
                        ) : (
                          <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar font-serif text-lg leading-loose text-oxford-blue/90 whitespace-pre-wrap bg-white">
                            {essayText}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center text-oxford-blue/40 p-8 text-center cursor-pointer hover:bg-oxford-blue/5 transition-colors"
                      >
                        <div className="w-16 h-16 bg-oxford-blue/5 rounded-full flex items-center justify-center mb-4">
                          <Upload size={24} />
                        </div>
                        <p className="font-medium">Upload a document to get started</p>
                        <p className="text-sm mt-2 max-w-xs">Click here to upload your essay (PDF, DOCX, TXT)</p>
                      </div>
                    )}
                  </div>

                  {/* Chat / Input Interface */}
                  <div className="bg-paper rounded-2xl p-2 border border-oxford-blue/10 shadow-sm shrink-0 flex flex-col">
                    {/* Context Indicator */}
                    {contextText && (
                      <div className="mx-2 mt-1 mb-1 px-3 py-1.5 bg-oxford-blue/10 rounded-lg flex items-center justify-between text-xs text-oxford-blue/80 border border-oxford-blue/5">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-bold shrink-0">Selected:</span>
                          <span className="truncate italic max-w-[200px] opacity-70">"{contextText}"</span>
                        </div>
                        <button onClick={() => setContextText(null)} className="hover:bg-oxford-blue/10 rounded p-0.5">
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 px-2 pt-1">
                        <input
                          ref={chatInputRef}
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={contextText ? "Enter instructions for the selected text..." : "Ask anything (e.g., 'Summarize key points')..."}
                          className="flex-1 bg-transparent border-none focus:ring-0 text-oxford-blue placeholder:text-oxford-blue/40 text-sm py-2"
                          onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1 pb-1 mt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-oxford-blue/5 text-oxford-blue/60 transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.docx,.txt"
                        />
                      </div>

                      <div className="flex items-center gap-2">

                        {/* Model Badge (Static OpenAI) */}
                        <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center gap-1 shadow-sm opacity-90 cursor-default">
                          <Bot size={10} />
                          <span>OpenAI</span>
                        </div>

                        <button
                          onClick={handleChatSubmit}
                          disabled={isAnalyzing || (!chatInput.trim() && !essayText.trim())}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${chatInput.trim() || essayText.trim() ? 'bg-oxford-blue text-white shadow-md hover:bg-oxford-blue/90' : 'bg-oxford-blue/20 text-oxford-blue/40 cursor-not-allowed'}`}
                        >
                          {isAnalyzing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Brain size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Analysis Dashboard */}
              <div className="bg-white rounded-2xl border border-oxford-blue/10 shadow-xl shadow-oxford-blue/5 overflow-hidden flex flex-col h-full min-h-0">
                {!analysisResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-oxford-blue/40">
                    <div className="w-24 h-24 bg-oxford-blue/5 rounded-full flex items-center justify-center mb-6">
                      <Activity size={40} />
                    </div>
                    <h3 className="text-xl font-serif font-medium text-oxford-blue mb-2">Ready to Analyze</h3>
                    <p className="max-w-xs">Paste your essay and click generate to receive comprehensive feedback.</p>
                  </div>
                ) : (
                  <>
                    {/* Header (No Dropdown) */}
                    <div className="p-6 border-b border-oxford-blue/10 flex items-center justify-between bg-oxford-blue/5 shrink-0">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-bronze mb-1">Analysis Result</h3>
                        <p className="text-xs text-oxford-blue/60 font-medium">{analysisResult.detectedType}</p>
                      </div>
                      <div className="bg-white border border-oxford-blue/10 px-3 py-1 rounded-full text-xs font-medium text-oxford-blue/60 shadow-sm">
                        Structure & Summary
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                      {/* View: Smart Summaries */}
                      <div className="space-y-8 animate-fadeIn">
                        <div className="bg-gradient-to-br from-paper to-white p-6 rounded-xl border border-oxford-blue/10 shadow-sm">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-bronze mb-3 flex items-center gap-2">
                            <Award size={16} /> Global Summary
                          </h3>
                          <p className="text-oxford-blue/80 leading-relaxed font-serif text-lg break-words">
                            {analysisResult.globalSummary}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-oxford-blue/40 mb-4">Paragraph Breakdown</h3>
                          <div className="space-y-4">
                            {analysisResult.paragraphBreakdown.map((item, idx) => (
                              <div key={idx} className="flex gap-4 p-4 rounded-lg bg-white border border-oxford-blue/10 hover:border-bronze/30 transition-all shadow-sm">
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.status === 'strong' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-oxford-blue text-sm">{item.section}</h4>
                                    {item.role && (
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-bronze bg-bronze/10 px-2 py-0.5 rounded-full">
                                        {item.role}
                                      </span>
                                    )}
                                  </div>

                                  {item.main_idea && (
                                    <p className="text-sm text-oxford-blue/80 leading-relaxed">
                                      <span className="font-semibold text-oxford-blue/60 text-xs uppercase tracking-wide mr-1">Main Idea:</span>
                                      {item.main_idea}
                                    </p>
                                  )}

                                  {item.strength && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <CheckCircle size={12} className="text-green-600" />
                                      <p className="text-xs font-medium text-green-700">
                                        {item.strength}
                                      </p>
                                    </div>
                                  )}

                                  {/* Fallback for legacy summary if main_idea is missing */}
                                  {!item.main_idea && item.summary && (
                                    <p className="text-sm text-oxford-blue/70 leading-relaxed break-words">{item.summary}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
