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
  LogOut,
  Globe,
  Link as LinkIcon,
  Loader
} from 'lucide-react';

import { runAnalysis } from './services/analysis';
import { runRealAnalysis, sendChatMessage, analyzeParagraphInsight } from './services/analysis';


import AnalysisResultView from './components/AnalysisResultView';
import ChatMessagesList from './components/ChatMessagesList';
import LandingPage from './LandingPage';
import SelectionPage from './SelectionPage';
import CanvasWorkspace from './CanvasWorkspace';

// --- Analysis Logic ---

const analyzeEssay = async (text, model, instruction, context) => {
  try {
    const realResult = await runRealAnalysis(text, model, instruction, context); // Direct usage
    if (!realResult) {
      throw new Error("Analysis failed to return results");
    }

    const isAwardee = text.toLowerCase().includes("award") || text.toLowerCase().includes("winner");
    const detectedType = isAwardee ? "Awardee Sample" : "Student Draft";

    return {
      ...realResult,
      detectedType,
    };
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

// PDF Viewer Component (Moved outside to prevent re-renders)
const PDFViewer = ({ url }) => {
  const [pdf, setPdf] = useState(null);
  const [pages, setPages] = useState([]);
  const [scale, setScale] = useState(1.2);
  const containerRef = useRef(null);

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      if (!url) return;
      try {
        const loadingTask = window.pdfjsLib.getDocument(url);
        const loadedPdf = await loadingTask.promise;
        setPdf(loadedPdf);
        setPages(Array.from({ length: loadedPdf.numPages }, (_, i) => i + 1));
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };
    loadPdf();
  }, [url]);

  // Handle Resize & Scale - Strict "Fit Width"
  useEffect(() => {
    if (!pdf || !containerRef.current) return;

    const updateScale = () => {
      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth === 0) return;

      pdf.getPage(1).then(page => {
        // Get viewport at scale 1 to determine base dimensions
        const viewport = page.getViewport({ scale: 1.0 });

        // Calculate strictly to fit width (-64px for p-8 padding)
        // If the page is "misaligned" (Landscape but typically documents are portrait), 
        // fitting to width ensures it is legible.
        const availableWidth = containerWidth - 64;
        const fitWidthScale = availableWidth / viewport.width;

        // Force scale to width (Fit Width)
        setScale(fitWidthScale);
      });
    };

    // Initial calculation
    updateScale();

    // Responsive Listener
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateScale);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [pdf]);

  if (!pdf) return <div className="text-center p-8 text-oxford-blue/50 font-serif">Loading Document...</div>;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-6 bg-oxford-blue/5 p-8 overflow-y-auto w-full h-full custom-scrollbar"
    >
      {pages.map(pageNum => (
        <PDFPage key={pageNum} pdf={pdf} pageNum={pageNum} scale={scale} />
      ))}
    </div>
  );
};

const PDFPage = ({ pdf, pageNum, scale }) => {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);

  useEffect(() => {
    const renderPage = async () => {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: scale });

      // Support HiDPI-screens (Retina)
      const outputScale = window.devicePixelRatio || 1;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform = outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null;

      const renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Text Layer
      const textContent = await page.getTextContent();
      const textLayerDiv = textLayerRef.current;
      if (textLayerDiv) {
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.setProperty('--scale-factor', scale);

        await window.pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: []
        }).promise;
      }
    };
    renderPage();
  }, [pdf, pageNum, scale]);

  return (
    <div
      className="relative shadow-xl ring-1 ring-black/5 bg-white transition-shadow hover:shadow-2xl selection:bg-yellow-400 selection:text-transparent"
      style={{ width: 'fit-content', height: 'fit-content' }}
    >
      <canvas ref={canvasRef} className="block" />
      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0"
      ></div>
    </div>
  );
};


function App() {
  // App Mode: 'landing' | 'selection' | 'upload' | 'canvas'
  const [appMode, setAppMode] = useState('landing');

  // App State
  const [essayText, setEssayText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeView, setActiveView] = useState('summary'); // Kept for backwards compatibility if needed, but unused for switching

  // New State for Reader Mode & Chat
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // New Chat History State
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai'); // 'openai' or 'gemini'
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  /* Removed selectedModel state as we're enforcing server-side logic now */
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  // Scroll Ref for Unified View
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of Unified View when content changes
  useEffect(() => {
    // Only scroll if we have new chat messages OR a new analysis result came in
    if (analysisResult || chatHistory.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [analysisResult, chatHistory]);

  // Text Selection State
  const [selectionPopup, setSelectionPopup] = useState({ show: false, x: 0, y: 0, text: '' });
  const [contextText, setContextText] = useState(null);
  const [floatingChat, setFloatingChat] = useState({ show: false, x: 0, y: 0, context: '' });

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);


  const [error, setError] = useState(null);



  const performAnalysis = async () => {
    if (!essayText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      console.log(`Analyzing essay...`);
      const result = await analyzeEssay(essayText, selectedProvider, chatInput, contextText);
      setAnalysisResult(result);
      setIsAnalyzed(true);
    } catch (error) {
      console.error("Analysis failed", error);
      setError(error.message || "An unexpected error occurred.");
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
    setFileName(file.name);
    setIsAnalyzed(true);

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => setEssayText(event.target.result);
      reader.readAsText(file);
    }
    else if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const loadingTask = pdfjsLib.getDocument(event.target.result);
          const pdf = await loadingTask.promise;
          let fullText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `Page ${i}:\n${pageText}\n\n`;
          }
          console.log("PDF Parsed:", fullText.substring(0, 100) + "...");
          setEssayText(fullText);
        } catch (err) {
          console.error("PDF Parse Error:", err);
          setEssayText("Error reading PDF content. Please try converting to text.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
    else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          console.log("DOCX Parsed:", result.value.substring(0, 100) + "...");
          setEssayText(result.value);
        } catch (err) {
          console.error("DOCX Parse Error:", err);
          setEssayText("Error reading DOCX content.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
    else {
      setEssayText('');
      console.warn("Unsupported file type for text extraction:", file.type);
    }
  };

  const handleChatSubmit = async (manualMessage = null, forceChat = false) => {
    // FIX: If manualMessage is an event object (from onClick), ignore it and use chatInput
    const isEvent = manualMessage && typeof manualMessage === 'object' && manualMessage._reactName;
    const rawMessage = (manualMessage && typeof manualMessage === 'string') ? manualMessage : chatInput;

    if ((!rawMessage.trim() && !essayText.trim()) || isAnalyzing) return;

    // Determine message to send
    const messageToSend = rawMessage.trim();
    setChatInput(''); // Clear input

    // DETERMINE MODE: Analysis vs Chat
    // We treat it as Chat if:
    // 1. Analysis already exists (Follow-up)
    // 2. forceChat is true (Explicit Research/Question)
    // 3. No essay text (General Chat)
    // 4. We want to treat ALL text input as Chat if we decide to separate "Analyze" button from "Send" button, 
    //    but for now we stick to "Empty Analysis + Essay = Initial Analysis".

    // Exception: If messageToSend is empty and we have essay, it's definitely Analysis ("Analyze" button with empty input)
    const isAnalysisCmd = !analysisResult && essayText.trim() && !messageToSend && !forceChat;

    if (!isAnalysisCmd) {
      // --- CHAT MODE ---
      setIsAnalyzing(true);
      setError(null);

      const userMsg = { role: 'user', content: messageToSend };
      // Optimistic Update
      const newHistory = [...chatHistory, userMsg];
      setChatHistory(newHistory);

      try {
        // If no analysis result yet, set a dummy one to ensure UI unlocks
        if (!analysisResult) {
          setAnalysisResult({ globalSummary: "Research / Chat Session Active", paragraphBreakdown: [] });
          setIsAnalyzed(true);
        }

        const aiResponse = await sendChatMessage(messageToSend, newHistory, essayText, selectedProvider);
        setChatHistory(prev => [...prev, { role: "assistant", content: aiResponse }]);

      } catch (err) {
        console.error("Chat Failed:", err);
        setError("Failed to get response.");
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    // --- ANALYSIS MODE ---
    console.log("Starting Initial Analysis...");
    setContextText(null); // Clear context for global analysis unless specified
    if (essayText.trim()) {
      performAnalysis();
    }
  };

  // Insight Handler
  const handleInsightClick = async () => {
    const textToAnalyze = selectionPopup.text;
    setSelectionPopup({ ...selectionPopup, show: false });

    setIsAnalyzing(true);
    setError(null);

    try {
      const userMsg = `Analyze this section:\n"${textToAnalyze.substring(0, 50)}..."`;
      const newHistory = [...chatHistory, { role: "user", content: userMsg }];
      setChatHistory(newHistory);

      const aiResponse = await analyzeParagraphInsight(textToAnalyze, selectedProvider);

      setChatHistory([...newHistory, { role: "assistant", content: aiResponse }]);

    } catch (err) {
      console.error("Insight Failed", err);
      setError("Failed to generate insight.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Global Selection Listener
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      // Safety check for text nodes
      const target = e.target.nodeType === 3 ? e.target.parentElement : e.target;
      if (!target) return;

      // Don't trigger if clicking inside the popup or floating chat
      if (target.closest('#selection-popup') || target.closest('#floating-chat')) return;

      // NEW CHECK: Ensure we are inside the document
      if (!target.closest('#document-viewer-container')) return;

      // DELAY: Wait 10ms for selection to finalize (fixes inconsistency)
      setTimeout(() => {
        const selection = window.getSelection();

        if (selection && selection.toString().trim().length > 0) {
          // Ignore if inside an input field
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Ensure valid coordinates
          if (rect.width === 0 && rect.height === 0) return;

          const GAP = 12;
          const MIN_POPUP_WIDTH = 180; // Approximate width of the popup
          const viewportWidth = window.innerWidth;

          // Horizontal Clamp: Ensure it doesn't go off-screen
          let x = rect.left + (rect.width / 2);
          x = Math.max(MIN_POPUP_WIDTH / 2 + 10, Math.min(x, viewportWidth - MIN_POPUP_WIDTH / 2 - 10));

          // Vertical Logic: Flip if too close to top
          const isTopSpaceAvailable = rect.top > 80; // Header(64) + Gap/Popup buffer
          const placement = isTopSpaceAvailable ? 'top' : 'bottom';
          const y = isTopSpaceAvailable ? rect.top - GAP : rect.bottom + GAP;

          setSelectionPopup(prev => ({
            ...prev,
            show: true,
            x,
            y,
            placement,
            text: selection.toString()
          }));
        } else {
          // No text selected -> Hide Popup
          setSelectionPopup(prev => ({ ...prev, show: false }));
        }
      }, 10);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);


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
    analyzeEssay(essayText, 'openai', instruction, text).then(result => {
      setAnalysisResult(result);
      setIsAnalyzed(true);
      setIsAnalyzing(false);
      setChatInput(''); // clear after
      setContextText(null);
    });
  };




  if (appMode === 'landing') {
    return <LandingPage onStart={() => setAppMode('selection')} />;
  }

  if (appMode === 'selection') {
    return <SelectionPage onSelect={(mode) => setAppMode(mode)} />;
  }


  // Default: 'upload' mode (Main App)


  return (
    <div className="flex h-screen bg-paper overflow-hidden font-sans selection:bg-bronze/30 selection:text-oxford-blue">

      {/* Sidebar ... */}
      <aside className={`${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'} bg-oxford-blue text-white transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0`}>
        {/* ... Sidebar Content ... */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => setAppMode('landing')}
            className="w-full flex items-center gap-2 text-white/60 hover:text-white px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back to Home
          </button>
          <button
            onClick={() => setAppMode('selection')}
            className="w-full flex items-center gap-2 text-white/60 hover:text-white px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
          >
            <Layout size={16} />
            Switch Mode
          </button>
          <button
            onClick={() => {
              setEssayText('');
              setAnalysisResult(null);
              setIsAnalyzed(false);
              setFileUrl(null);
              setContextText(null);
              setChatHistory([]); // Clear chat too
            }}
            className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-colors border border-white/5 shadow-sm"
          >
            <Plus size={20} />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar"></div>
        <div className="p-4 border-t border-white/10 bg-oxford-blue">
          <button className="w-full flex items-center gap-3 px-2 py-2 text-left text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
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

        {appMode === 'canvas' ? (
          <CanvasWorkspace
            onBack={() => setAppMode('selection')}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        ) : (
          <>
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-oxford-blue/10 shrink-0 z-10">
              <div className="w-full px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 -ml-2 text-oxford-blue/60 hover:text-oxford-blue hover:bg-oxford-blue/5 rounded-lg transition-colors"
                  >
                    <Menu size={24} />
                  </button>
                  {!sidebarOpen && (
                    <div
                      className="flex items-center gap-2 animate-fadeIn cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setAppMode('landing')}
                    >
                      <div className="w-8 h-8 bg-bronze rounded-lg flex items-center justify-center text-paper shadow-lg shadow-bronze/20">
                        <BookOpen size={18} />
                      </div>
                      <h1 className="text-xl font-serif font-bold tracking-tight text-oxford-blue">
                        ScholarGo
                      </h1>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Scrollable Main Content Wrapper */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

              {/* LEFT PANEL: Document Workspace */}
              <div className="flex-1 bg-gray-50/50 flex flex-col relative min-w-0 overflow-y-auto custom-scrollbar scroll-smooth">
                <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-8 min-h-full">

                  {/* Document Header (Meta Only - Simplified) */}
                  {(isAnalyzed || essayText) && (
                    <div className="mb-6 animate-fadeIn">
                      <div className="flex items-center gap-3 text-sm text-oxford-blue/60">
                        <span className="font-medium text-oxford-blue">{fileName || "Untitled Essay"}</span>
                        <span className="text-oxford-blue/20">•</span>
                        <span className="opacity-70">{essayText.split(/\s+/).filter(w => w.length > 0).length} words</span>
                      </div>
                    </div>
                  )}

                  {/* Document Canvas */}
                  <div id="document-viewer-container" className="relative transition-all duration-300">
                    {isAnalyzed ? (
                      <div className="w-full relative min-h-[500px]">
                        {fileType === 'application/pdf' ? (
                          <div className="border border-oxford-blue/10 rounded-xl overflow-hidden shadow-sm bg-white">
                            <PDFViewer key={fileUrl} url={fileUrl} />
                          </div>
                        ) : fileType?.startsWith('image/') ? (
                          <div className="w-full flex flex-col items-center bg-white rounded-xl shadow-sm border border-oxford-blue/10 p-4">
                            <img
                              src={fileUrl}
                              alt="Document"
                              className="w-full h-auto object-contain"
                              style={{ imageOrientation: 'from-image' }}
                            />
                          </div>
                        ) : (
                          /* Text Editor Look */
                          <div
                            className="prose prose-lg max-w-none font-serif text-oxford-blue/90 leading-loose outline-none whitespace-pre-wrap selection:bg-yellow-200/50"
                            contentEditable={false} // Read only for now
                          >
                            {essayText}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Empty State / Upload Trigger */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group border-2 border-dashed border-oxford-blue/10 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-bronze/30 hover:bg-bronze/5 transition-all min-h-[400px]"
                      >
                        <div className="w-16 h-16 bg-oxford-blue/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Upload size={24} className="text-oxford-blue/40 group-hover:text-bronze" />
                        </div>
                        <h3 className="text-xl font-medium text-oxford-blue mb-2">Upload your essay</h3>
                        <p className="text-oxford-blue/50 max-w-sm mx-auto">
                          Drag and drop or click to upload PDF, DOCX, or clear text.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Action for Empty State - if needed */}
              </div>


              {/* RIGHT PANEL: AI Assistant Sidebar */}
              <div className="w-full lg:w-[480px] lg:h-full h-[500px] bg-white border-t lg:border-t-0 lg:border-l border-oxford-blue/10 flex flex-col shrink-0 z-20 shadow-xl shadow-oxford-blue/5">

                {/* Sidebar Header */}
                <div className="h-14 px-4 border-b border-oxford-blue/5 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-oxford-blue">
                    <Sparkles size={16} className="text-bronze" />
                    <span className="font-bold text-sm tracking-wide">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-oxford-blue/40 hover:text-red-500 transition-colors">
                      <X size={16} onClick={() => {/* Maybe toggle sidebar visibility context */ }} />
                    </button>
                  </div>
                </div>

                {/* Chat Stream */}
                <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-6">
                  {/* Empty State in Sidebar */}
                  {(!analysisResult && chatHistory.length === 0) && (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 bg-oxford-blue/5 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bot size={20} className="text-oxford-blue/60" />
                      </div>
                      <p className="text-sm font-medium text-oxford-blue">I'm ready to analyze.</p>
                      <p className="text-xs mt-1 text-oxford-blue/50 mb-6">Select text or type below.</p>

                      {(essayText || fileUrl) && (
                        <button
                          onClick={() => handleChatSubmit("Analyze all paragraphs with format: Main Idea, Idea Development, and Sentence Evidence")}
                          className="w-full flex items-center gap-3 p-3 bg-white border border-oxford-blue/10 rounded-xl shadow-sm hover:shadow-md hover:border-bronze/30 transition-all group text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-oxford-blue/5 flex items-center justify-center text-oxford-blue/60 group-hover:bg-bronze/10 group-hover:text-bronze transition-colors">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-oxford-blue text-xs group-hover:text-bronze transition-colors">Analyze All</p>
                            <p className="text-[10px] text-oxford-blue/50">Full structure breakdown</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Analysis Result */}
                  {analysisResult && (
                    <AnalysisResultView result={analysisResult} />
                  )}

                  {/* Chat History */}
                  {chatHistory.length > 0 && (
                    <ChatMessagesList messages={chatHistory} />
                  )}

                  <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Input Area (Fixed Bottom - Gemini Style) */}
                <div className="p-4 bg-white border-t border-oxford-blue/5">

                  {/* Context Indicator (if selected) */}
                  {contextText && (
                    <div className="mb-2 px-3 py-2 bg-oxford-blue/5 rounded-lg flex items-center justify-between text-xs text-oxford-blue/70 border border-oxford-blue/5">
                      <span className="truncate italic max-w-[280px]">"{contextText}"</span>
                      <button onClick={() => setContextText(null)} className="hover:text-red-500"><X size={12} /></button>
                    </div>
                  )}

                  {/* Unified Input Box */}
                  <div className="bg-gray-50 border border-oxford-blue/10 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-bronze/10 focus-within:border-bronze/30 transition-all shadow-sm">

                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      disabled={isAnalyzing}
                      placeholder={isAnalyzing ? "ScholarGo is thinking..." : (contextText ? "Ask about selected text..." : "Ask ScholarGo...")}
                      className="w-full bg-transparent border-none px-4 py-3 text-sm text-oxford-blue outline-none resize-none custom-scrollbar disabled:opacity-50 placeholder:text-oxford-blue/40"
                      rows={1}
                      style={{ minHeight: '60px', maxHeight: '200px' }}
                    />

                    {/* Internal Toolbar */}
                    <div className="flex items-center justify-between px-2 pb-1 mt-1">
                      <div className="flex items-center gap-2">
                        {/* Add Document Button */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-oxford-blue/10 text-oxford-blue/60 transition-colors text-xs font-medium"
                        >
                          <Plus size={14} /> Add Document
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.docx,.txt"
                        />

                        {/* Model Switcher */}
                        <div className="relative">
                          <button
                            onClick={() => setProviderMenuOpen(!providerMenuOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-oxford-blue/10 text-oxford-blue/60 transition-colors text-xs font-medium"
                          >
                            {selectedProvider === 'openai' ? 'GPT-4o' : 'Gemini 1.5'}
                            <ChevronDown size={12} />
                          </button>
                          {providerMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-[100]"
                                onClick={() => setProviderMenuOpen(false)}
                              />
                              <div className="absolute bottom-10 left-0 w-40 bg-white rounded-lg shadow-xl border border-oxford-blue/10 overflow-hidden z-[101] py-1">
                                <button
                                  onClick={() => { setSelectedProvider('openai'); setProviderMenuOpen(false); }}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-black/5 ${selectedProvider === 'openai' ? 'font-bold' : ''}`}
                                >
                                  OpenAI GPT-4o
                                </button>
                                <button
                                  onClick={() => { setSelectedProvider('gemini'); setProviderMenuOpen(false); }}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-black/5 ${selectedProvider === 'gemini' ? 'font-bold' : ''}`}
                                >
                                  Google Gemini 1.5
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Send Button */}
                      <button
                        onClick={() => handleChatSubmit()}
                        disabled={!chatInput.trim() && !essayText.trim() && !isAnalyzing}
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
                </div>

              </div>


            </main>
          </>
        )}
      </div>
      {/* GLOBAL PORTAL: Selection Popup */}
      {selectionPopup.show && (
        <div
          id="selection-popup"
          className={`fixed z-[9999] bg-white text-oxford-blue rounded-lg shadow-xl border border-oxford-blue/10 transform -translate-x-1/2 flex items-center overflow-hidden animate-fadeIn divide-x divide-oxford-blue/10 transition-all ${selectionPopup.placement === 'bottom' ? 'translate-y-0' : '-translate-y-full'
            }`}
          style={{ left: selectionPopup.x, top: selectionPopup.y }}
        >
          <button
            onClick={handleInsightClick}
            className="flex items-center gap-2 px-3 py-2 hover:bg-oxford-blue/5 transition-colors text-xs font-bold text-bronze"
          >
            <Sparkles size={14} />
            Insight
          </button>
          <button
            onClick={() => {
              const text = selectionPopup.text;
              setContextText(text);
              setSelectionPopup({ ...selectionPopup, show: false });

              // Trigger Research Mode automatically via Chat
              // We send a specific directive that the AI will recognize
              const researchPrompt = `Lakukan riset verifikasi mendalam untuk teks ini: "${text}". Fokus pada validasi klaim, data, dan referensi.`;
              handleChatSubmit(researchPrompt, true);
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-oxford-blue/5 transition-colors text-xs font-medium"
          >
            <Globe size={14} />
            Research
          </button>
        </div>
      )}

      {/* GLOBAL PORTAL: Floating Chat Window */}
      {floatingChat.show && (
        <div
          id="floating-chat"
          className="fixed z-[10000] bg-white/90 backdrop-blur-xl border border-oxford-blue/10 rounded-xl shadow-2xl p-4 w-80 animate-fadeIn"
          style={{ left: floatingChat.x, top: floatingChat.y }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-oxford-blue text-white rounded-full flex items-center justify-center">
                <MessageSquare size={12} />
              </div>
              <span className="text-xs font-bold text-oxford-blue uppercase tracking-wider">Context Chat</span>
            </div>
            <button
              onClick={() => setFloatingChat({ ...floatingChat, show: false })}
              className="text-oxford-blue/40 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Context Snippet */}
          <div className="bg-oxford-blue/5 rounded-lg p-2 mb-3 border-l-2 border-bronze">
            <p className="text-[10px] text-oxford-blue/60 italic truncate">"{floatingChat.context}"</p>
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleChatSubmit();
                  setFloatingChat({ ...floatingChat, show: false });
                }
              }}
              placeholder="Ask or type @pattern..."
              className="flex-1 bg-white border border-oxford-blue/10 rounded-lg px-3 py-2 text-sm text-oxford-blue focus:ring-2 focus:ring-bronze/20 outline-none"
            />
            <button
              onClick={() => {
                handleChatSubmit();
                setFloatingChat({ ...floatingChat, show: false });
              }}
              className="bg-oxford-blue text-white p-2 rounded-lg hover:bg-oxford-blue/90 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
