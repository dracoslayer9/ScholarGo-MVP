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
  Link as LinkIcon
} from 'lucide-react';

import { runAnalysis } from './services/analysis';
import { runRealAnalysis, sendChatMessage, analyzeParagraphInsight } from './services/analysis';


// --- Analysis Logic ---
const AnalysisResultView = ({ result }) => {
  if (!result) return null;
  // If this is a dummy result for Chat/Research mode, do not render the Analysis Dashboard.
  if (result.globalSummary === "Research / Chat Session Active" || result.globalSummary === "General Chat Session Started.") {
    return null;
  }
  return (
    <div className="space-y-8 animate-fadeIn pb-6 border-b border-oxford-blue/10">
      {/* Header: Document Classification */}
      <div className="p-6 border border-oxford-blue/10 bg-oxford-blue/5 rounded-xl">
        {result.documentClassification ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-oxford-blue">
                  {result.documentClassification.primaryType}
                </h3>
                {/* Evaluation Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${result.documentClassification.confidence === 'High'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                  {result.documentClassification.confidence} Confidence
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div>Analysis Result</div>
        )}
      </div>

      {/* Global Summary */}
      <div className="bg-gradient-to-br from-paper to-white p-6 rounded-xl border border-oxford-blue/10 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-bronze mb-3 flex items-center gap-2">
          <Award size={16} /> Global Summary
        </h3>
        <p className="text-oxford-blue/80 leading-relaxed font-serif text-lg break-words">
          {result.globalSummary}
        </p>
      </div>

      {/* Deep Analysis */}
      {result.deepAnalysis && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-oxford-blue/5 p-4 rounded-lg border border-oxford-blue/10">
            <p className="text-oxford-blue font-serif italic text-center">"{result.deepAnalysis.overallAssessment}"</p>
          </div>
        </div>
      )}

      {/* Structural Analysis breakdown */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-oxford-blue/40 mb-4">Structural Analysis</h3>
        <div className="space-y-6">
          {result.paragraphBreakdown.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-oxford-blue/5 shadow-sm p-6 hover:shadow-md transition-all group">
              <div className="flex items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-oxford-blue/30 uppercase tracking-widest">{item.paragraph_number ? `Para ${item.paragraph_number}` : ''}</span>
                  <h4 className="font-serif font-bold text-oxford-blue text-lg">{item.detected_subtitle || item.section_label || item.section}</h4>
                </div>
              </div>
              {(item.analysis_current || item.purpose) && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-oxford-blue/30 uppercase tracking-widest mb-1">Current Structure</p>
                  <p className="text-sm font-medium text-oxford-blue/80">{item.analysis_current || item.purpose}</p>
                </div>
              )}
              <div className="space-y-4">
                {item.main_idea && (
                  <div>
                    <p className="text-[10px] font-bold text-oxford-blue/20 uppercase tracking-widest mb-1">Main Idea</p>
                    <p className="text-sm md:text-base text-oxford-blue leading-relaxed font-medium">{item.main_idea}</p>
                  </div>
                )}
                {item.evidence_quote && (
                  <div className="pl-4 border-l-2 border-bronze/30">
                    <p className="text-[10px] font-bold text-bronze/50 uppercase tracking-widest mb-1">
                      Evidence {item.evidence_location && <span className="ml-2 text-oxford-blue/30 text-[9px] normal-case bg-oxford-blue/5 px-1.5 py-0.5 rounded">Re: {item.evidence_location}</span>}
                    </p>
                    <p className="text-sm text-oxford-blue/60 italic font-serif leading-relaxed">"{item.evidence_quote}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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

const MessageContent = ({ content }) => {
  // --- DETECT RESEARCH INSIGHT CARD ---
  // Pattern: "Research Insight" followed by "1. **Validation Summary**"
  // We check for the specific keys requested by the user.
  const isResearchInsight = /Research Insight/i.test(content) && /1\.\s*\*\*Validation Summary\*\*/i.test(content);

  if (isResearchInsight) {
    const validation = content.match(/1\.\s*\*\*Validation Summary\*\*[:\s](.*?)(?=(2\.|$))/s)?.[1]?.trim();
    const background = content.match(/2\.\s*\*\*Background Info\*\*[:\s](.*?)(?=(3\.|$))/s)?.[1]?.trim();
    const references = content.match(/3\.\s*\*\*References\*\*[:\s](.*?)(?=$)/s)?.[1]?.trim();

    if (validation) {
      return (
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn mb-4">
          {/* Header: Validation Summary */}
          <div className="bg-blue-50/50 p-4 border-b border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Globe size={14} />
              </div>
              <span className="font-serif font-bold text-oxford-blue text-sm">Research Insight</span>
            </div>
            <p className="font-bold text-oxford-blue text-md leading-relaxed">{validation}</p>
          </div>

          {/* Body: Background Info */}
          <div className="p-4 space-y-2">
            <p className="text-xs font-bold text-oxford-blue/40 uppercase tracking-wider mb-1">Background Context</p>
            <div className="text-sm text-oxford-blue/80 leading-relaxed whitespace-pre-wrap pl-1">
              {background}
            </div>
          </div>

          {/* Footer: References */}
          {references && (
            <div className="bg-oxford-blue/5 p-3 border-t border-oxford-blue/10">
              <p className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                <LinkIcon size={10} /> Validated Sources
              </p>
              <div className="text-xs text-blue-600 flex flex-col gap-1">
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                  __html: references.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline decoration-blue-200 hover:text-blue-800">$1</a>')
                }} />
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  // --- DETECT INDONESIAN ANALYSIS FORMAT (Multi-Card Support) ---
  const isIndonesianAnalysis = /1\.\s*\*\*Gagasan Utama\*\*/i.test(content) && /Paragraf\s+\d+/i.test(content);

  if (isIndonesianAnalysis) {
    // Split content by "Paragraf [Number]" to handle multiple cards
    // This regex splits but captures the delimiter (Paragraf N) so we can reconstruct or ignore.
    const blocks = content.split(/(?=Paragraf\s+\d+)/i).filter(block => block.trim().length > 0);

    return (
      <div className="flex flex-col gap-4 w-full animate-fadeIn">
        {blocks.map((block, idx) => {
          // Extract Header
          const headerMatch = block.match(/Paragraf\s+(\d+)/i);
          const paragraphNum = headerMatch ? headerMatch[1] : `?`;

          // Extract Fields
          const mainIdea = block.match(/1\.\s*\*\*Gagasan Utama\*\*[:\s]+(.*?)(?=(2\.|$))/s)?.[1]?.trim();
          const development = block.match(/2\.\s*\**(?:Pengembangan Ide|Cara Penulis Menuangkan Ide)\*\*[:\s]+(.*?)(?=(3\.|$))/s)?.[1]?.trim();
          const evidence = block.match(/3\.\s*\*\*Bukti Kalimat\*\*[:\s]+(.*?)(?=$)/s)?.[1]?.trim();

          // Only render if we have at least the main idea
          if (!mainIdea) return <div key={idx} className="whitespace-pre-wrap">{block}</div>;

          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-1 last:mb-0">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-oxford-blue/5 flex items-center justify-center text-oxford-blue font-serif font-bold text-xs">
                  {paragraphNum}
                </div>
                <span className="font-bold text-oxford-blue text-sm">Paragraf {paragraphNum}</span>
              </div>

              <div className="space-y-3">
                {/* Gagasan Utama */}
                <div>
                  <p className="text-xs font-bold text-oxford-blue/60 mb-1 uppercase tracking-wider">Gagasan Utama</p>
                  <p className="text-sm text-oxford-blue font-medium leading-relaxed">{mainIdea}</p>
                </div>

                {/* Pengembangan Ide */}
                {development && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-bold text-oxford-blue/60 mb-1 uppercase tracking-wider">Pengembangan Ide</p>
                    <p className="text-sm text-oxford-blue leading-relaxed">{development}</p>
                  </div>
                )}

                {/* Bukti Kalimat */}
                {evidence && (
                  <div>
                    <p className="text-xs font-bold text-oxford-blue/60 mb-1 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle size={10} /> Bukti Kalimat
                    </p>
                    <p className="text-sm text-oxford-blue/70 italic font-serif border-l-2 border-bronze/30 pl-3 leading-relaxed">
                      {evidence.replace(/^"|"$/g, '')} {/* Remove surrounding quotes if captured */}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --- LEGACY INSIGHT FORMAT (Context Menu) ---
  const insightRegex = /1\.\s*\*\*Main Idea\*\*[:\s]/i;
  // Fallthrough if it doesn't match the others
  const isLegacy = insightRegex.test(content) && !isIndonesianAnalysis && !isResearchInsight;

  if (isLegacy) {
    const mainIdea = content.match(/1\.\s*\*\*Main Idea\*\*[:\s](.*?)(?=(2\.|$))/s)?.[1]?.trim() || "";
    const approach = content.match(/2\.\s*\*\*Approach\*\*[:\s](.*?)(?=(3\.|$))/s)?.[1]?.trim() || "";
    const implication = content.match(/3\.\s*\*\*Implication\*\*[:\s](.*?)(?=$)/s)?.[1]?.trim() || "";

    if (mainIdea) {
      return (
        <div className="flex flex-col gap-3 min-w-[250px] bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-1">
            <span className="text-bronze"><Sparkles size={16} /></span>
            <span className="font-serif font-bold text-oxford-blue text-sm">Analysis Insight</span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-oxford-blue/50 mb-1">Main Idea</p>
              <p className="text-sm text-oxford-blue leading-normal">{mainIdea}</p>
            </div>
            <div className="bg-oxford-blue/5 p-3 rounded-lg border border-oxford-blue/5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-oxford-blue/50 mb-1">Writer's Approach</p>
              <p className="text-sm text-oxford-blue leading-normal">{approach}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-oxford-blue/50 mb-1">Implication</p>
              <p className="text-sm text-oxford-blue italic text-oxford-blue/80">"{implication}"</p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Default Text: Simple Markdown Formatter (Bold Support)
  // Default Text: Simple Markdown Formatter (Bold & Link Support)
  const formatText = (text) => {
    // Regex matches:
    // 1. **bold**
    // 2. [link text](url)
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Bold Match
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      // Link Match
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <a
              key={index}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              {linkMatch[1]}
            </a>
          );
        }
      }
      // Plain Text
      return part;
    });
  };

  return <div className="whitespace-pre-wrap leading-relaxed">{formatText(content)}</div>;
};

// --- Landing Page Integration ---
import LandingPage from './LandingPage';
import SelectionPage from './SelectionPage';
import CanvasWorkspace from './CanvasWorkspace';

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

  if (appMode === 'canvas') {
    return (
      <div className="relative">
        <button
          onClick={() => setAppMode('selection')}
          className="absolute top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm border border-oxford-blue/10 hover:bg-oxford-blue/5 text-oxford-blue/60"
        >
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <CanvasWorkspace />
      </div>
    )
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
                <div
                  className="flex items-center gap-2 animate-fadeIn cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setAppMode('landing')}
                >
                  <div className="w-8 h-8 bg-oxford-blue rounded-lg flex items-center justify-center text-paper shadow-lg shadow-oxford-blue/20">
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

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full flex flex-col">

            {/* Hero Section - Hide if we have analysis OR chat history */}
            {(!analysisResult && chatHistory.length === 0) && (
              <div className="text-center mb-12 max-w-3xl mx-auto animate-fadeIn pt-10">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-oxford-blue mb-6 leading-tight">
                  AI Scholarship Assistant for Winning Applications
                </h1>
                <p className="text-lg md:text-xl text-oxford-blue/70 leading-relaxed font-light">
                  ScholarGo analyzes real awardee essays, portfolios, and study plans—transforming them into clear patterns, paragraph insights, and storytelling frameworks.
                </p>
              </div>
            )}

            <div className={`grid lg:grid-cols-[65%_35%] gap-8 ${isAnalyzed || chatHistory.length > 0 ? 'h-full' : 'h-[600px]'}`}>

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
                        setEssayText('');
                        setAnalysisResult(null);
                        setContextText(null);
                        setChatHistory([]);
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
                  <div id="document-viewer-container" className="flex-1 bg-white rounded-xl border border-oxford-blue/10 shadow-sm overflow-hidden relative group">
                    {isAnalyzed ? (
                      <div className="w-full h-full relative overflow-hidden">
                        {fileType === 'application/pdf' ? (
                          <PDFViewer key={fileUrl} url={fileUrl} />
                        ) : fileType?.startsWith('image/') ? (
                          /* Image Viewer: Fit Width & Auto-Rotate compatible */
                          <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar bg-oxford-blue/5 flex flex-col items-center">
                            <img
                              src={fileUrl}
                              alt="Document"
                              className="w-full h-auto object-contain shadow-md rounded-md bg-white"
                              style={{ imageOrientation: 'from-image' }} // Respect EXIF rotation
                            />
                          </div>
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
                </div>
              </div>

              {/* Right Column: Unified Analysis & Chat Stream */}
              <div className="bg-white rounded-2xl border border-oxford-blue/10 shadow-xl shadow-oxford-blue/5 overflow-hidden flex flex-col h-full min-h-0">
                {error ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-red-600 animate-fadeIn">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle size={40} />
                    </div>
                    <h3 className="text-xl font-serif font-medium mb-2">Analysis Error</h3>
                    <p className="max-w-xs opacity-80 mb-6">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors border border-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (!analysisResult && chatHistory.length === 0) ? (
                  // Empty State / Ready
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-oxford-blue/40 animate-fadeIn">
                    <div className="w-24 h-24 bg-oxford-blue/5 rounded-full flex items-center justify-center mb-6">
                      <Activity size={40} />
                    </div>
                    <h3 className="text-xl font-serif font-medium text-oxford-blue mb-2">Ready to Analyze</h3>
                    <p className="max-w-xs mb-8">Paste your essay or ask a question to get started.</p>

                    {/* Quick Prompts */}
                    <div className="flex flex-col gap-3 w-full max-w-sm">
                      {(essayText || fileUrl) ? (
                        // Case A: Document Uploaded -> Show "Analyze All"
                        <button
                          onClick={() => handleChatSubmit("Analyze all paragraphs with format: Main Idea, Idea Development, and Sentence Evidence")}
                          className="flex items-center gap-3 p-4 bg-white border border-oxford-blue/10 rounded-xl shadow-sm hover:shadow-md hover:border-bronze/30 transition-all group text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-oxford-blue/5 flex items-center justify-center text-oxford-blue/60 group-hover:bg-bronze/10 group-hover:text-bronze transition-colors">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-oxford-blue text-sm group-hover:text-bronze transition-colors">Analyze All</p>
                            <p className="text-xs text-oxford-blue/50">Get a complete breakdown of the document structure</p>
                          </div>
                        </button>
                      ) : (
                        // Case B: No Document -> Show "Don't know where to start?"
                        <button
                          className="flex items-center gap-3 p-4 bg-white border border-oxford-blue/10 rounded-xl shadow-sm hover:shadow-md hover:border-bronze/30 transition-all group text-left cursor-default"
                        >
                          <div className="w-8 h-8 rounded-full bg-oxford-blue/5 flex items-center justify-center text-oxford-blue/60">
                            <span className="font-serif font-bold italic">?</span>
                          </div>
                          <div>
                            <p className="font-bold text-oxford-blue text-sm">Don't know where to start?</p>
                            <p className="text-xs text-oxford-blue/50">Upload a document to unlock deep insights</p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  // UNIFIED VIEW: Analysis Dashboard + Chat History in ONE scrollable stream
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    <div className="max-w-3xl mx-auto space-y-8">
                      {/* 1. Analysis Result (if present) - Acts as the "First Message" / Context */}
                      {analysisResult && (
                        <AnalysisResultView result={analysisResult} />
                      )}

                      {/* 2. Chat History (Subsequent conversation) */}
                      {chatHistory.length > 0 && (
                        <ChatMessagesList messages={chatHistory} />
                      )}

                      {/* Spacer & Scroll Anchor */}
                      <div ref={messagesEndRef} className="h-4" />
                    </div>
                  </div>
                )}

                <div className="border-t border-oxford-blue/10 bg-white p-3 shrink-0 z-10">
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

                    {/* Chat History REMOVED from footer - now in main view */}

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
                        <div className="relative">
                          <button
                            onClick={() => setProviderMenuOpen(!providerMenuOpen)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-oxford-blue/5 transition-colors group"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedProvider === 'openai' ? 'bg-green-500' : 'bg-blue-500'}`} />
                            <span className="text-[10px] font-bold text-oxford-blue/60 uppercase tracking-wider group-hover:text-oxford-blue transition-colors">
                              {selectedProvider === 'openai' ? 'GPT-4o' : 'Gemini 1.5'}
                            </span>
                            <ChevronDown size={10} className="text-oxford-blue/40 group-hover:text-oxford-blue" />
                          </button>

                          {/* Dropdown Menu */}
                          {providerMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-[100]"
                                onClick={() => setProviderMenuOpen(false)}
                              />
                              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-oxford-blue/10 overflow-hidden z-[101] animate-fadeIn py-1">
                                <div className="px-3 py-2 text-xs font-bold text-oxford-blue/40 uppercase tracking-wider">
                                  Model
                                </div>
                                <button
                                  onClick={() => { setSelectedProvider('openai'); setProviderMenuOpen(false); }}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${selectedProvider === 'openai' ? 'bg-black/5 font-medium text-oxford-blue' : 'text-oxford-blue/80 hover:bg-black/5'}`}
                                >
                                  OpenAI GPT-4o
                                </button>
                                <button
                                  onClick={() => { setSelectedProvider('gemini'); setProviderMenuOpen(false); }}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${selectedProvider === 'gemini' ? 'bg-black/5 font-medium text-oxford-blue' : 'text-oxford-blue/80 hover:bg-black/5'}`}
                                >
                                  Google Gemini 1.5
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleChatSubmit}
                          disabled={isAnalyzing || (!chatInput.trim() && !essayText.trim())}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${chatInput.trim() || essayText.trim() ? 'bg-oxford-blue text-white shadow-md hover:bg-oxford-blue/90' : 'bg-oxford-blue/20 text-oxford-blue/40 cursor-not-allowed'}`}
                        >
                          {isAnalyzing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
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
