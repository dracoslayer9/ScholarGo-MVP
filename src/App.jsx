
import React, { useState, useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import {
  Upload,

  ChevronRight,
  Sparkles,
  Layout,
  Plus,
  Bot,
  Send,
  MessageSquare,
  X,
  Menu,
  Settings,
  Loader,
  Trash2
} from 'lucide-react';

import { runRealAnalysis, sendChatMessage, analyzeParagraphInsight } from './services/analysis';
import { supabase } from './lib/supabaseClient';
import { createChat, getUserChats, getChatMessages, saveMessage, updateChatTitle, deleteChat } from './services/chatService';
import { generateSmartTitle } from './utils/chatUtils';

import LoginPage from './LoginPage';



import AnalysisResultView from './components/AnalysisResultView';
import ChatMessagesList from './components/ChatMessagesList';
import LandingPage from './LandingPage';
import SelectionPage from './SelectionPage';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import CanvasWorkspace from './CanvasWorkspace';
import SettingsModal from './components/SettingsModal';
// ... (lines 48-670 unchanged) ... 
// Jumping to render logic below ... 


// --- Analysis Logic ---

const analyzeEssay = async (text, model, instruction, context, signal) => {
  try {
    const realResult = await runRealAnalysis(text, model, instruction, context, signal); // Direct usage
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
        if (!window.pdfjsLib) return;
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
      className="flex flex-col items-center gap-6 bg-white p-8 overflow-y-auto w-full h-full custom-scrollbar"
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
      className="relative bg-white selection:bg-yellow-400 selection:text-transparent"
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
  const [appMode, setAppMode] = useState(() => localStorage.getItem('scholarGo_appMode') || 'landing');

  // Persist App Mode
  useEffect(() => {
    localStorage.setItem('scholarGo_appMode', appMode);
    // Track Page View
    posthog.capture('$pageview', {
      app_mode: appMode // detailed tracking
    });
  }, [appMode]);

  // Auth State
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // App State
  const [essayText, setEssayText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // New State for Reader Mode & Chat
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // New Chat History State
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedProvider] = useState('openai'); // 'openai' or 'gemini'

  // --- SUPABASE CHAT STATE ---
  const [savedChats, setSavedChats] = useState([]); // List of {id, title}
  const [currentChatId, setCurrentChatId] = useState(null); // Active DB Session ID
  // ---------------------------

  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const abortControllerRef = useRef(null);

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Chat Renaming State
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");



  const handleRenameChat = async (e, chatId) => {
    e.stopPropagation(); // Prevent loadChat trigger
    if (e.key === 'Enter' || e.type === 'blur') {
      if (editingTitle.trim()) {
        await updateChatTitle(chatId, editingTitle.trim());
        setSavedChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editingTitle.trim() } : c));
      }
      setEditingChatId(null);
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteChat(chatId);
        setSavedChats(prev => prev.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
          handleNewChat(); // Reset to new chat if current is deleted
        }
      } catch (err) {
        alert("Failed to delete chat: " + err.message);
      }
    }
  };

  // --- Auth Effect & Chat Loading ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingAuth(false);
      // Load chats if session exists
      if (session?.user) {
        loadUserChats(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      // Auto-redirect logic: Only redirect if currently on login page
      if (event === 'SIGNED_IN') {
        if (session?.user) loadUserChats(session.user.id);

        setAppMode((prevMode) => {
          if (prevMode === 'login') {
            return 'selection';
          }
          return prevMode;
        });
      }

      if (event === 'SIGNED_OUT') {
        setAppMode('landing');
        setSavedChats([]);
        setCurrentChatId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserChats = async (userId) => {
    try {
      const chats = await getUserChats(userId);
      setSavedChats(chats || []);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  };

  const handleStart = () => {
    // Lazy Auth: Always go to selection, check auth later on action
    setAppMode('selection');
  };


  // --- NEW CHAT HANDLER (DB SYNC) ---
  const handleNewChat = async () => {
    console.log("Resetting to New Chat (Local)...");
    posthog.capture('new_chat_clicked');

    // 1. Reset UI State
    setEssayText('');
    setAnalysisResult(null);
    setIsAnalyzed(false);
    setFileUrl(null);
    setContextText(null);
    setChatHistory([]);

    // 2. Clear Active Chat ID (Lazy Creation: Will be created on first message)
    setCurrentChatId(null);
  };

  // --- LOAD CHAT HANDLER ---
  const handleLoadChat = async (chatId) => {
    console.log("Loading Chat ID:", chatId);
    try {
      // 1. Fetch messages
      const messages = await getChatMessages(chatId);
      console.log("Loaded Messages:", messages?.length);

      // 2. Map DB messages to UI format
      const history = (messages || []).map(m => ({ role: m.role, content: m.content }));

      // 3. Set State
      setChatHistory(history);
      setCurrentChatId(chatId);

      // Clear analysis context for clean switch
      setEssayText('');
      setAnalysisResult(null);
      setIsAnalyzed(false); // Maybe true if we want to show chat view immediately?
      // Actually, if we load simple chat history, we should probably be in a "Chat View" mode.
      // For now, staying in 'upload' mode (default) but with history visible is fine.

    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };





  const performAnalysis = async () => {
    if (!essayText.trim()) return;

    // Create AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    try {
      console.log(`Analyzing essay...`);
      const result = await analyzeEssay(essayText, selectedProvider, chatInput, contextText, controller.signal);
      setAnalysisResult(result);
      setIsAnalyzed(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Analysis aborted');
      } else {
        console.error("Narrative analysis failed", error);
      }
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    // Normalize file type based on extension if MIME type is missing or generic
    let detectedType = file.type;
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.pdf')) detectedType = 'application/pdf';
    else if (lowerName.endsWith('.docx')) detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    posthog.capture('file_uploaded', { file_type: detectedType }); // Track Upload

    setFileType(detectedType);
    setFileName(file.name);
    setIsAnalyzed(true);

    if (detectedType === "text/plain" || lowerName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => setEssayText(event.target.result);
      reader.readAsText(file);
    }
    else if (detectedType === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!window.pdfjsLib) throw new Error("PDF Library not loaded");
          const loadingTask = window.pdfjsLib.getDocument(event.target.result);
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
    else if (detectedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || lowerName.endsWith(".docx")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!window.mammoth) throw new Error("Mammoth Library not loaded");
          const arrayBuffer = event.target.result;
          const result = await window.mammoth.extractRawText({ arrayBuffer });
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
      // Fallback: If it's an image, we don't extract text
      if (!detectedType.startsWith('image/')) {
        setEssayText('');
        console.warn("Unsupported file type for text extraction:", detectedType);
      }
    }
  };

  const handleChatSubmit = async (manualMessage = null, forceChat = false) => {
    // FIX: If manualMessage is an event object (from onClick), ignore it and use chatInput
    const rawMessage = (manualMessage && typeof manualMessage === 'string') ? manualMessage : chatInput;

    if ((!rawMessage.trim() && !essayText.trim()) || isAnalyzing) return;

    // CHECK AUTH: Enforce login if guest tries to send/analyze
    if (!session) {
      setAppMode('login');
      return;
    }

    // Determine message to send
    const messageToSend = rawMessage.trim();
    setChatInput(''); // Clear input

    posthog.capture('chat_message_sent', { length: messageToSend.length }); // Track Message

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
      // Create AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsAnalyzing(true);
      const userMsg = { role: 'user', content: messageToSend };
      // Optimistic Update
      const newHistory = [...chatHistory, userMsg];
      setChatHistory(newHistory);

      // SAVE TO DB (User Message)
      // SAVE TO DB (User Message) - Lazy Create Logic
      let activeChatId = currentChatId;

      if (!activeChatId && session?.user) {
        try {
          // Create Session for first message
          const newChat = await createChat(session.user.id, "New Chat");
          activeChatId = newChat.id;
          setCurrentChatId(activeChatId);
          setSavedChats(prev => [newChat, ...prev]);
        } catch (err) {
          console.error("Failed to lazy-create chat:", err);
        }
      }

      if (activeChatId) {
        saveMessage(activeChatId, 'user', messageToSend).catch(err => console.error("Save Msg Error:", err));

        // AUTO-TITLE: If first message, generate "3 kata utama unik"
        if (chatHistory.length === 0) {
          const smartTitle = generateSmartTitle(messageToSend);
          const finalTitle = `Upload: ${smartTitle}`; // Distinguishable prefix
          updateChatTitle(activeChatId, finalTitle);
          setSavedChats(prev => prev.map(c => c.id === activeChatId ? { ...c, title: finalTitle } : c));
        }
      }

      try {
        // If no analysis result yet, set a dummy one to ensure UI unlocks
        if (!analysisResult) {
          setAnalysisResult({ globalSummary: "Research / Chat Session Active", paragraphBreakdown: [] });
          setIsAnalyzed(true);
        }

        const aiResponse = await sendChatMessage(messageToSend, newHistory, essayText, selectedProvider, controller.signal);
        setChatHistory(prev => [...prev, { role: "assistant", content: aiResponse }]);

        // SAVE TO DB (AI Message)
        if (activeChatId) {
          saveMessage(activeChatId, 'assistant', aiResponse).catch(err => console.error("Save Msg Error:", err));
        }

      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Chat aborted');
          // setChatHistory(prev => [...prev, { role: "assistant", content: "[Request cancelled]" }]); // Optional
        } else {
          console.error("Chat Failed:", err);
        }
      } finally {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
      return;
    }

    // --- ANALYSIS MODE ---
    console.log("Starting Initial Analysis...");
    posthog.capture('analysis_started', { provider: selectedProvider });

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

    try {
      const userMsg = `Analyze this section:\n"${textToAnalyze.substring(0, 50)}..."`;
      const newHistory = [...chatHistory, { role: "user", content: userMsg }];
      setChatHistory(newHistory);

      const aiResponse = await analyzeParagraphInsight(textToAnalyze, selectedProvider);

      setChatHistory([...newHistory, { role: "assistant", content: aiResponse }]);

    } catch (err) {
      console.error("Insight Failed", err);
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
  }, [currentChatId]); // Added dep


  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
        <Loader className="animate-spin text-oxford-blue/40" size={32} />
      </div>
    );
  }

  if (appMode === 'landing') {
    return <LandingPage onStart={handleStart} onPrivacy={() => setAppMode('privacy')} onTerms={() => setAppMode('terms')} onLogin={() => setAppMode('login')} />;
  }

  if (appMode === 'login') {
    return <LoginPage onBack={() => setAppMode('landing')} />;
  }

  if (appMode === 'selection') {
    return <SelectionPage onSelect={(mode) => setAppMode(mode)} user={session?.user} />;
  }

  if (appMode === 'privacy') {
    return <PrivacyPolicy onBack={() => setAppMode('landing')} />;
  }

  if (appMode === 'terms') {
    return <TermsOfService onBack={() => setAppMode('landing')} />;
  }

  if (appMode === 'canvas') {
    return (
      <CanvasWorkspace
        onToggleSidebar={() => setAppMode('selection')}
        onRequireAuth={() => {
          if (!session) {
            setAppMode('login');
            return true;
          }
          return false;
        }}
        user={session?.user}
      />
    );
  }


  // Default: 'upload' mode (Main App)


  return (
    <div className="flex h-screen bg-paper overflow-hidden font-sans selection:bg-bronze/30 selection:text-oxford-blue">

      {/* Sidebar ... */}
      {/* Sidebar ... */}
      {/* Sidebar ... */}
      <aside className={`${sidebarOpen ? 'w-64 translate-x-0 overflow-visible' : 'w-0 -translate-x-full overflow-hidden'} bg-white border-r border-gray-200 text-oxford-blue transition-all duration-300 ease-in-out flex flex-col shrink-0 z-20`}>
        {/* ... Sidebar Content ... */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => setAppMode('landing')}
            className="w-full flex items-center gap-2 text-oxford-blue/60 hover:text-oxford-blue px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back to Home
          </button>
          <button
            onClick={() => setAppMode('selection')}
            className="w-full flex items-center gap-2 text-oxford-blue/60 hover:text-oxford-blue px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium"
          >
            <Layout size={16} />
            Switch Mode
          </button>
          <button
            onClick={handleNewChat} // UPDATED to use DB Handler
            className="w-full flex items-center gap-2 bg-white border border-oxford-blue/10 hover:border-bronze/30 hover:shadow-md text-oxford-blue px-4 py-3 rounded-xl transition-all shadow-sm group"
          >
            <div className="w-5 h-5 rounded-full bg-oxford-blue/5 flex items-center justify-center group-hover:bg-bronze group-hover:text-white transition-colors">
              <Plus size={14} />
            </div>
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar space-y-1">
          {savedChats.map(chat => (
            <div
              key={chat.id}
              className={`w-full group px-4 py-3 rounded-xl transition-colors text-sm flex items-center gap-3 cursor-pointer ${currentChatId === chat.id
                ? 'bg-oxford-blue/5 text-oxford-blue font-medium'
                : 'text-oxford-blue/60 hover:bg-gray-50'
                }`}
              onClick={() => handleLoadChat(chat.id)}
            >
              <MessageSquare size={16} className="shrink-0 opacity-50" />

              {editingChatId === chat.id ? (
                <div className="flex-1 min-w-0">
                  <input
                    autoFocus
                    className="w-full bg-white border border-oxford-blue/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-bronze"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => handleRenameChat(e, chat.id)}
                    onBlur={(e) => handleRenameChat(e, chat.id)}
                    onClick={(e) => e.stopPropagation()} // Prevent accidental load
                  />
                </div>
              ) : (
                <>
                  <span className="truncate flex-1">{chat.title || "Untitled Chat"}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1 hover:bg-black/5 rounded text-oxford-blue/40 hover:text-oxford-blue transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingChatId(chat.id);
                        setEditingTitle(chat.title || "");
                      }}
                      title="Rename"
                    >
                      <div className="w-4 h-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </div>
                    </button>
                    <button
                      className="p-1 hover:bg-red-100 rounded text-oxford-blue/40 hover:text-red-500 transition-all"
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white relative">
          {showUserMenu && (
            <div className="fixed bottom-20 left-4 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn z-50">
              {/* Email Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs text-oxford-blue/60 truncate font-medium">
                  {session?.user?.email}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button className="w-full text-left px-4 py-2.5 text-sm text-oxford-blue hover:bg-gray-50 transition-colors">
                  Upgrade your plan
                </button>
                <button
                  onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-oxford-blue hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  Settings
                  <span className="text-xs text-oxford-blue/40">⌘ ,</span>
                </button>
              </div>

              <div className="h-px bg-gray-100 my-1" />

              <div className="py-1">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setSession(null);
                    setAppMode('landing');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-2 py-2 text-left text-sm text-oxford-blue hover:bg-gray-50 rounded-lg transition-colors relative"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <span className="font-serif font-bold text-xs">
                {session?.user?.user_metadata?.full_name ?
                  session.user.user_metadata.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  : "SC"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-oxford-blue">
                {session?.user?.user_metadata?.full_name || "Scholar"}
              </p>
              <p className="text-xs text-oxford-blue/40 truncate">Free Plan</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {appMode === 'canvas' && (
          <CanvasWorkspace
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onRequireAuth={() => {
              if (!session) {
                setAppMode('login');
                return true; // Auth required
              }
              return false;
            }}
          />
        )}
        {appMode !== 'canvas' && (
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
              <div className="flex-1 bg-white flex flex-col relative min-w-0 overflow-y-auto custom-scrollbar scroll-smooth">
                <div className="flex-1 w-full max-w-4xl mx-auto px-12 py-8 min-h-full flex flex-col">

                  {/* Document Header (Meta Only - Simplified) */}
                  {(isAnalyzed || essayText) && (
                    <div className="mb-6 animate-fadeIn shrink-0">
                      <div className="flex items-center gap-3 text-sm text-oxford-blue/60">
                        <span className="font-medium text-oxford-blue">{fileName || "Untitled Essay"}</span>
                        <span className="text-oxford-blue/20">•</span>
                        <span className="opacity-70">{essayText.split(/\s+/).filter(w => w.length > 0).length} words</span>
                      </div>
                    </div>
                  )}

                  {/* Document Canvas */}
                  <div id="document-viewer-container" className="relative transition-all duration-300 flex-1">
                    {isAnalyzed ? (
                      <div className="w-full relative min-h-[80vh]">
                        {fileType === 'application/pdf' ? (
                          <div className="w-full overflow-hidden">
                            <PDFViewer key={fileUrl} url={fileUrl} />
                          </div>
                        ) : fileType?.startsWith('image/') ? (
                          <div className="w-full flex flex-col items-center p-4">
                            <img
                              src={fileUrl}
                              alt="Document"
                              className="w-full h-auto object-contain"
                              style={{ imageOrientation: 'from-image' }}
                            />
                          </div>
                        ) : (
                          /* Text Editor Look - Matching CanvasWorkspace */
                          <div
                            className="w-full min-h-[80vh] outline-none text-lg leading-loose font-serif text-oxford-blue whitespace-pre-wrap break-words selection:bg-yellow-200/50"
                            contentEditable={false} // Read only
                          >
                            {essayText || <span className="text-oxford-blue/50 italic">Reading document...</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Empty State / Upload Trigger - Matching Canvas aesthetic */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group w-full h-full min-h-[80vh] flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                      >
                        <div className="rounded-2xl p-12 hover:bg-oxford-blue/0 transition-all group-hover:scale-[1.01]">
                          <div className="w-16 h-16 bg-oxford-blue/5 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-bronze group-hover:text-white transition-colors">
                            <Upload size={24} className="text-oxford-blue/40 group-hover:text-white transition-colors" />
                          </div>
                          <h3 className="text-xl font-serif font-bold text-oxford-blue mb-3">Unggah dokumen</h3>
                          <p className="text-oxford-blue/50 max-w-sm mx-auto font-serif text-lg leading-relaxed">
                            Ketuk buat cari file PDF atau Docx.<br />
                            <span className="text-sm opacity-60 font-sans">AI bedah dalam sekejap</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Action for Empty State - if needed */}
              </div>


              {/* RIGHT PANEL: AI Assistant Sidebar */}
              <div className="w-full lg:w-[480px] lg:h-full h-[500px] bg-white border-t lg:border-t-0 border-oxford-blue/10 flex flex-col shrink-0 z-20 shadow-xl shadow-oxford-blue/5">

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
                      <p className="text-sm font-medium text-oxford-blue">Udah siap analisis, nih..</p>

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
                          <Plus size={14} /> Dokumen
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.docx,.txt"
                        />

                        {/* Model Indicator (Static) */}
                        <div className="flex items-center gap-1.5 text-oxford-blue/40 text-xs font-medium cursor-default">
                          GPT-4o
                        </div>
                      </div>

                      {/* Send Button */}
                      <button
                        onClick={() => isAnalyzing ? abortControllerRef.current?.abort() : handleChatSubmit()}
                        disabled={!chatInput.trim() && !essayText.trim() && !isAnalyzing}
                        className={`p-2 rounded-lg transition-all flex items-center justify-center ${isAnalyzing
                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-bronze text-white hover:bg-bronze/90 shadow-md shadow-bronze/20 disabled:opacity-30 disabled:bg-oxford-blue/50"}`}
                      >
                        {isAnalyzing ? (
                          <div className="w-3 h-3 bg-current rounded-sm" />
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
      {/* GLOBAL PORTAL: Settings Modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        user={session?.user}
        onSignOut={async () => {
          await supabase.auth.signOut();
          setSession(null);
          setAppMode('landing');
          setShowSettings(false);
          setShowUserMenu(false);
        }}
        onOpenPrivacy={() => {
          // Placeholder or actual logic for Privacy Policy
          console.log("Open Privacy Policy");
        }}
      />

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
