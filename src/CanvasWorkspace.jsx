
import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Extension, InputRule } from '@tiptap/core';
import { Markdown } from 'tiptap-markdown';

// Define the custom AutoCapitalize Extension to securely enforce capital letters on all devices
const AutoCapitalize = Extension.create({
    name: 'autoCapitalize',
    addInputRules() {
        return [
            new InputRule({
                find: /(?:^|[\n.!?]\s+)([a-z])$/,
                handler: ({ state, range, match }) => {
                    const { tr } = state;
                    const uppercaseLetter = match[1].toUpperCase();
                    const replacement = match[0].slice(0, -1) + uppercaseLetter;
                    tr.insertText(replacement, range.from, range.to);
                },
            }),
        ];
    },
});
import {
    Save,
    Settings,
    Send,
    Loader,
    Bot,
    Sparkle,
    Rocket,
    Menu,
    ChevronLeft,
    Layout,
    Plus,
    Command,
    Sparkles,
    Bold,
    Italic,
    AlignCenter,
    AlignLeft,
    AlignRight,
    AlignJustify,
    Eye,
    Type,
    Underline,
    Link,
    Image,
    Quote,
    Undo,
    Redo,
    Wand2,
    BookOpen,
    Share,
    History,
    ChevronUp,
    MoveVertical
} from 'lucide-react';
import { sendChatMessage, runRealAnalysis } from './services/analysis';
import { createChat, saveMessage, updateChatTitle, getUserChats, getChatMessages, updateChatPayload, deleteChat } from './services/chatService';
import { Trash2, MessageSquare, Edit2, Check, X, ListChecks, MessageCircle, FileText, PenLine, ClipboardCheck, GraduationCap } from 'lucide-react';
import { generateSmartTitle } from './utils/chatUtils';
import { extractTextFromFile } from './utils/fileUtils';
import { PDFViewer } from './components/PDFViewer';
import ChatMessagesList from './components/ChatMessagesList';
import AnalysisResultView from './components/AnalysisResultView';
import UpgradeModal from './components/UpgradeModal';
import QuotaDisplay from './components/QuotaDisplay';
import { checkUsageQuota, incrementUsage } from './services/subscriptionService';



const CanvasWorkspace = ({ onBack, onRequireAuth, user, onSignOut, onOpenSettings, onCampusMatch, initialContent = '', initialFileName = '', initialFileUrl = null, initialFileType = null, initialFileContext = '' }) => {
    // --- State ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const [essayContent, setEssayContent] = useState(initialContent || '');
    const [isAlignMenuOpen, setIsAlignMenuOpen] = useState(false);
    const alignMenuRef = useRef(null);
    const [lineSpacing, setLineSpacing] = useState('1.5');
    const [isSpacingMenuOpen, setIsSpacingMenuOpen] = useState(false);
    const spacingMenuRef = useRef(null);

    // --- Version State ---
    const [versions, setVersions] = useState([{ id: 1, content: initialContent || '', title: 'Version 1' }]);
    const [currentVersionId, setCurrentVersionId] = useState(1);
    const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
    const versionMenuRef = useRef(null);

    // Sync essayContent from current version when version changes
    useEffect(() => {
        const currentVersion = versions.find(v => v.id === currentVersionId);
        if (currentVersion) {
            setEssayContent(currentVersion.content);
        }
    }, [currentVersionId]); // intentionally omitting versions dependency to prevent infinite loop on typing

    // Sync essayContent to current version when typing
    useEffect(() => {
        setVersions(prev => prev.map(v => v.id === currentVersionId ? { ...v, content: essayContent } : v));
    }, [essayContent]);



    // Delete Version
    const handleDeleteVersion = (e, id) => {
        e.stopPropagation();
        if (versions.length <= 1) return; // Cannot delete the last version

        const confirmDelete = window.confirm("Are you sure you want to delete this version?");
        if (confirmDelete) {
            const updatedVersions = versions.filter(v => v.id !== id);
            setVersions(updatedVersions);

            // If deleting the current version, fallback to the last available version
            if (currentVersionId === id) {
                setCurrentVersionId(updatedVersions[updatedVersions.length - 1].id);
            }
        }
    };

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (alignMenuRef.current && !alignMenuRef.current.contains(event.target)) {
                setIsAlignMenuOpen(false);
            }
            if (spacingMenuRef.current && !spacingMenuRef.current.contains(event.target)) {
                setIsSpacingMenuOpen(false);
            }
            if (versionMenuRef.current && !versionMenuRef.current.contains(event.target)) {
                setIsVersionMenuOpen(false);
            }
            if (chatModeMenuRef.current && !chatModeMenuRef.current.contains(event.target)) {
                setIsChatModeMenuOpen(false);
            }
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target)) {
                setIsModelMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isResearchMode, setIsResearchMode] = useState(false); // New State for Research Mode
    const [isChatModeMenuOpen, setIsChatModeMenuOpen] = useState(false); // Dropdown State
    const chatModeMenuRef = useRef(null);
    const [selectedModel, setSelectedModel] = useState('auto'); // 'auto', 'openai', or 'perplexity'

    // File Upload State for Canvas Chat
    const [fileUrl, setFileUrl] = useState(initialFileUrl || null);
    const [fileType, setFileType] = useState(initialFileType || null);
    const [fileName, setFileName] = useState(initialFileName || '');
    const [fileContext, setFileContext] = useState(initialFileContext || '');
    const [analyzedFile, setAnalyzedFile] = useState(null); // Stores file for preview history
    const [isFileParsing, setIsFileParsing] = useState(false);
    const [showDocumentPreview, setShowDocumentPreview] = useState(false);

    // Analysis State
    const [analysisResult, setAnalysisResult] = useState(null);

    const [currentChatId, setCurrentChatId] = useState(null); // Canvas Chat Persistence
    const [savedChats, setSavedChats] = useState([]); // History List

    // In-Chat History Navigator
    const [showInChatHistory, setShowInChatHistory] = useState(false);

    // Application State
    const [essayTitle, setEssayTitle] = useState(initialFileName || 'Untitled Essay');

    // History Management State
    const [editingChatId, setEditingChatId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");

    // Subscription State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeFeature, setUpgradeFeature] = useState('');

    // Refs
    // const textareaRef = useRef(null); // Deprecated by Tiptap
    const chatInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const blockAutoSaveRef = useRef(false); // Mutex lock to prevent cross-session overwrite during load

    // Advanced State Sync Refs
    const currentChatIdRef = useRef(currentChatId);
    useEffect(() => {
        currentChatIdRef.current = currentChatId;
    }, [currentChatId]);
    const isCreatingChatRef = useRef(false);

    // --- TIPTAP EDITOR INIT ---
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing or paste your essay here...',
            }),
            Markdown,
            AutoCapitalize,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: initialContent || '',
        editorProps: {
            attributes: {
                class: 'prose prose-lg prose-oxford-blue max-w-none focus:outline-none min-h-screen whitespace-pre-wrap break-words text-oxford-blue font-serif px-16 py-12',
                spellcheck: 'true',
                autocapitalize: 'sentences'
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (html !== '<p></p>') {
                setEssayContent(html);
            } else {
                setEssayContent('');
            }
        },
        onBlur: ({ editor }) => {
            // Eagerly snap the content state when clicking outside the editor
            const html = editor.getHTML();
            const contentToSave = html === '<p></p>' ? '' : html;
            if (currentChatIdRef.current && contentToSave) {
                updateChatPayload(currentChatIdRef.current, { essayContent: contentToSave }).catch(console.error);
            }
        }
    });

    // Sync line spacing dynamically using inline styles
    useEffect(() => {
        // Ensure the editor and its underlying view/DOM are fully mounted
        if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
            const el = editor.view.dom;
            el.style.lineHeight = lineSpacing;
        }
    }, [editor, lineSpacing]);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    // Auto-save logic
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (blockAutoSaveRef.current) return; // Prevent overwriting history during load

            const activeId = currentChatIdRef.current;

            // Bypass React stale closures! Pull synchronously from the editor
            let currentEssay = essayContent;
            if (editor) {
                const html = editor.getHTML();
                currentEssay = html === '<p></p>' ? '' : html;
            }

            if (currentEssay) {
                if (activeId) {
                    try {
                        // Optimistically update local state immediately so it's not lost
                        setSavedChats(prev => prev.map(c => c.id === activeId ? {
                            ...c,
                            payload: { ...(c.payload || {}), essayContent: currentEssay }
                        } : c));
                        // Fire network request
                        await updateChatPayload(activeId, { essayContent: currentEssay });
                    } catch (err) {
                        console.error("Auto-save Error:", err);
                    }
                } else if (!isCreatingChatRef.current && user) {
                    // Automatically create a new chat session if none exists and user starts typing
                    isCreatingChatRef.current = true;
                    try {
                        const newBlankChat = await createChat(user.id, "Canvas: Untitled Essay");
                        setCurrentChatId(newBlankChat.id);
                        // Inject Payload locally to prevent blank wipe on subsequent load
                        newBlankChat.payload = { ...(newBlankChat.payload || {}), essayContent: currentEssay };
                        setSavedChats(prev => [newBlankChat, ...prev]);
                        await updateChatPayload(newBlankChat.id, { essayContent: currentEssay });
                        setEssayTitle("Untitled Essay");
                    } catch (err) {
                        console.error("Auto-create Error:", err);
                    } finally {
                        isCreatingChatRef.current = false;
                    }
                }
            }
        }, 1000); // 1-second debounce
        return () => clearTimeout(timeoutId);
    }, [essayContent, user]);

    // Auto-resize chat input
    useEffect(() => {
        if (chatInputRef.current) {
            chatInputRef.current.style.height = 'auto'; // Reset
            chatInputRef.current.style.height = Math.min(chatInputRef.current.scrollHeight, 160) + 'px'; // Max height
        }
    }, [chatInput]);

    const handleFormat = (formatType) => {
        if (!editor) return;

        // Handle alignment via Tiptap TextAlign extension
        if (formatType === 'align-left') return editor.chain().focus().setTextAlign('left').run();
        if (formatType === 'align-center') return editor.chain().focus().setTextAlign('center').run();
        if (formatType === 'align-right') return editor.chain().focus().setTextAlign('right').run();
        if (formatType === 'align-justify') return editor.chain().focus().setTextAlign('justify').run();

        // Handle inline markdown formatting via Tiptap
        editor.chain().focus();
        if (formatType === 'bold') editor.chain().focus().toggleBold().run();
        if (formatType === 'italic') editor.chain().focus().toggleItalic().run();
        if (formatType === 'quote') editor.chain().focus().toggleBlockquote().run();
    };

    // --- Load History ---
    useEffect(() => {
        if (user) {
            loadCanvasChats();
        }
    }, [user]);

    const loadCanvasChats = async () => {
        if (!user) return;
        try {
            const allChats = await getUserChats(user.id);
            // Filter only Canvas chats
            const canvasChats = allChats.filter(c => c.title && c.title.startsWith("Canvas:"));
            setSavedChats(canvasChats);
        } catch (err) {
            console.error("Failed to load canvas chats:", err);
        }
    };

    // --- Version Helpers ---
    const handleCreateVersion = () => {
        const newId = versions.length + 1;
        const newVersion = { id: newId, content: essayContent, title: `Version ${newId}` };
        setVersions([...versions, newVersion]);
        setCurrentVersionId(newId);
        setIsVersionMenuOpen(false);
    };

    // --- Handlers ---

    const abortControllerRef = useRef(null);

    const stopAnalysis = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            // Optional: setIsAnalyzing(false); // handleChatSubmit catch block handles this
        }
    };
    const handleAnalyzeDocument = async () => {
        if (onRequireAuth && onRequireAuth()) return;
        if (isAnalyzing) return;

        // PRIORITIZE: File Content > Editor Content
        // Use analyzedFile.content as a fallback if fileContext was already cleared (e.g. from history preview)
        const hasFile = !!(fileUrl || analyzedFile?.url);
        const fileContent = fileContext || analyzedFile?.content || '';
        const contentToAnalyze = hasFile ? fileContent : essayContent;

        console.log("[Dissect] Analysis Triggered:", {
            hasFile,
            contentSource: hasFile ? "File" : "Canvas",
            contentLength: contentToAnalyze?.length || 0,
            fileName: fileName || analyzedFile?.name,
            fileType: fileType || analyzedFile?.type,
            hasContent: !!contentToAnalyze?.trim()
        });

        if (!contentToAnalyze?.trim()) {
            if (hasFile) alert("Dokumen kosong atau teks tidak terbaca. Harap tunggu hingga proses 'Menyiapkan' selesai.");
            return;
        }

        // CHECK QUOTA: PDF Analysis
        if (user) {
            try {
                const { allowed } = await checkUsageQuota(user.id, 'pdf_analysis');
                if (!allowed) {
                    setUpgradeFeature('Essay Analysis');
                    setShowUpgradeModal(true);
                    return;
                }
            } catch (err) {
                console.error("Quota error", err);
            }
            incrementUsage(user.id, 'pdf_analysis').catch(err => console.error("Increment failed", err));
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsAnalyzing(true);
        setShowDocumentPreview(false); // Close preview
        if (!isChatOpen) setIsChatOpen(true);

        // Check if document is an awardee sample before sending to get specific dissection
        const isAwardee =
            (fileName && (fileName.toLowerCase().includes("award") || fileName.toLowerCase().includes("winner") || fileName.toLowerCase().includes("lpdp"))) ||
            (analyzedFile?.name && (analyzedFile.name.toLowerCase().includes("award") || analyzedFile.name.toLowerCase().includes("winner") || analyzedFile.name.toLowerCase().includes("lpdp"))) ||
            (contentToAnalyze.toLowerCase().includes("award") || contentToAnalyze.toLowerCase().includes("winner") || contentToAnalyze.toLowerCase().includes("lpdp"));
        const detectedType = isAwardee ? "Awardee Sample" : "Student Draft";

        // Add a "dummy" message to show intent in history
        const actionVerb = isAwardee ? "Dissect" : "Analyze";
        const userMsg = { role: 'user', content: `${actionVerb} this document completely.` };
        setChatHistory(prev => [...prev, userMsg]);

        // Preserve file info for preview modal before clearing attachment indicator
        setAnalyzedFile({
            url: fileUrl || analyzedFile?.url,
            name: fileName || analyzedFile?.name,
            type: fileType || analyzedFile?.type,
            content: fileContext || analyzedFile?.content
        });

        setFileContext('');
        setFileUrl(null);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            // Pass the detected type to the backend so it knows whether to dissect or critique
            const result = await runRealAnalysis(contentToAnalyze, detectedType, null, null, controller.signal);
            if (result) {
                // Determine headers based on document type
                const strengthHeader = isAwardee ? "Strategi Sukses" : "Kekuatan Utama";
                const weaknessHeader = isAwardee ? "Anatomi Struktur" : "Area Perbaikan";
                const suggestionHeader = isAwardee ? "Pelajaran untuk Esaimu" : "Saran Strategis";

                // Map data from actual API JSON response
                const strengths = [];
                if (result.deepAnalysis?.authenticity?.strengths) strengths.push(result.deepAnalysis.authenticity.strengths);
                if (result.deepAnalysis?.values?.detectedValues) strengths.push("Nilai Utama: " + result.deepAnalysis.values.detectedValues);

                const weaknesses = [];
                if (result.documentClassification?.structuralSignals?.length) {
                    weaknesses.push(...result.documentClassification.structuralSignals);
                } else if (result.deepAnalysis?.structure?.flow) {
                    weaknesses.push(result.deepAnalysis.structure.flow);
                }

                const suggestions = result.deepAnalysis?.strategicImprovements || [];

                const markdownResponse = `**Tipe Dokumen:** ${detectedType}
${result.deepAnalysis?.overallAssessment ? `\n*${result.deepAnalysis.overallAssessment}*\n` : ''}

**${strengthHeader}**
${strengths.length > 0 ? strengths.map(s => `- ${s}`).join('\n') : '- Belum ditemukan kekuatan yang menonjol.'}

**${weaknessHeader}**
${weaknesses.length > 0 ? weaknesses.map(w => `- ${w}`).join('\n') : '- Tidak ada catatan spesifik.'}

**${suggestionHeader}**
${suggestions.length > 0 ? suggestions.map(s => `- ${s}`).join('\n') : '-'}

---
*${result.feedback || (isAwardee ? 'Pelajari dan terapkan strategi ini di esaimu!' : 'Terus semangat merevisi esaimu!')}*`;

                setAnalysisResult({ ...result, detectedType });

                // Keep the flow continuous without wiping the document by piping the analysis into the chat
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    content: markdownResponse,
                    analysisData: { ...result, detectedType }
                }]);

                if (currentChatIdRef.current) {
                    saveMessage(currentChatIdRef.current, 'assistant', markdownResponse).catch(err => console.error("Save Msg Error:", err));
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Analysis Failed:", error);
                alert(`Analysis Failed: ${error.message}`);
                setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
            }
        } finally {
            setIsAnalyzing(false);
            abortControllerRef.current = null;
        }
    };

    const handleSuggestedAction = async (type) => {
        if (onRequireAuth && onRequireAuth()) return;
        if (isAnalyzing) return;

        // HARDEN: Pull directly from editor source of truth
        let currentContent = essayContent;
        if (editor) {
            const html = editor.getHTML();
            currentContent = html === '<p></p>' ? '' : html;
        }

        if (user) {
            const { allowed } = await checkUsageQuota(user.id, 'chat');
            if (!allowed) {
                setUpgradeFeature('Chat Messages');
                setShowUpgradeModal(true);
                return;
            }
            incrementUsage(user.id, 'chat').catch(err => console.error("Increment failed", err));
        }

        let userMessage = "";
        let assistantMessage = "";

        if (type === 'structure') {
            userMessage = "Help me structure an outline for my scholarship essay.";
            assistantMessage = "Which one are we tackling now? (e.g., LPDP Essay or Fulbright Study objective?)";
        } else if (type === 'hook') {
            userMessage = "Can you help me draft a strong hook for my introduction?";
            assistantMessage = "Do you want to start with your 'Aha!' moment, or should we build a hook based on your resume?";
        } else if (type === 'review') {
            if (!currentContent && !fileContext) {
                alert("Waduh! Tempel draf Anda terlebih dahulu atau unggah file untuk ditinjau.");
                return;
            }
            handleChatSubmit("Gunakan Master Framework untuk review esai saya ini secara mendalam dan berikan saran strategis.");
            return;
        }

        if (!userMessage) return;

        const context = fileContext ? `[Attached Document Content]\n${fileContext}\n\n[Current Essay Content]\n${currentContent}` : currentContent;

        setChatHistory(prev => [
            ...prev,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: assistantMessage }
        ]);
        if (!isChatOpen) setIsChatOpen(true);

        let activeChatId = currentChatId;
        if (!activeChatId && user) {
            try {
                const newChat = await createChat(user.id, "Canvas Chat");
                activeChatId = newChat.id;
                setCurrentChatId(activeChatId);
            } catch (err) {
                console.error("Failed to lazy-create canvas chat:", err);
            }
        }

        if (activeChatId) {
            saveMessage(activeChatId, 'user', userMessage).catch(err => console.error("Save Msg Error:", err));
            saveMessage(activeChatId, 'assistant', assistantMessage).catch(err => console.error("Save Msg Error:", err));

            if (chatHistory.length === 0) {
                const smartTitle = generateSmartTitle(userMessage);
                const finalTitle = `Canvas: ${smartTitle}`;
                updateChatTitle(activeChatId, finalTitle);
                setSavedChats(prev => prev.map(c => c.id === activeChatId ? { ...c, title: finalTitle } : c));
            }

            updateChatPayload(activeChatId, { essayContent: context }).catch(err => console.error("Payload Save Error:", err));
        }
    };

    const groupChatsByTime = (chats) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const groups = [
            { label: 'Hari Ini', chats: [] },
            { label: 'Kemarin', chats: [] },
            { label: '7 Hari Terakhir', chats: [] },
            { label: 'Lebih Lama', chats: [] }
        ];

        chats.forEach(chat => {
            const chatDate = new Date(chat.created_at || Date.now());
            if (chatDate >= today) groups[0].chats.push(chat);
            else if (chatDate >= yesterday) groups[1].chats.push(chat);
            else if (chatDate >= sevenDaysAgo) groups[2].chats.push(chat);
            else groups[3].chats.push(chat);
        });

        return groups.filter(g => g.chats.length > 0);
    };

    const generateSmartTitleLLM = async (userMessage) => {
        const prompt = `Buatlah judul chat history yang singkat (maksimal 3 kata), profesional, dan mencerminkan 'Awardee Logic' berdasarkan input berikut. Jika input tentang beasiswa spesifik, sebutkan nama beasiswanya (misal: 'Esai LPDP UCL', 'Motlet Chevening'). Hanya balas dengan judulnya saja tanpa tanda kutip. Input:\n"${userMessage}"`;
        try {
            const response = await sendChatMessage(prompt, [], "", selectedModel, null);
            return response.trim().replace(/^"|"$/g, '');
        } catch (e) {
            console.error("LLM Title Error:", e);
            return generateSmartTitle(userMessage); // Fallback
        }
    };

    const handleChatSubmit = async (overrideMessage = null) => {
        // Auth Check
        if (onRequireAuth && onRequireAuth()) return;

        let inputToUse = typeof overrideMessage === 'string' ? overrideMessage : chatInput;

        // Command Intercept: Detect manual "Review" or "Reviu"
        const cleanInput = inputToUse.trim().toLowerCase();
        if (cleanInput === 'review' || cleanInput === 'reviu') {
            inputToUse = "Gunakan Master Framework untuk review esai saya ini secara mendalam dan berikan saran strategis.";
        }

        // 1. HARDEN: Capture current context securely from Tiptap source of truth
        let currentEssay = essayContent;
        if (editor) {
            const html = editor.getHTML();
            currentEssay = html === '<p></p>' ? '' : html;
        }

        if ((!inputToUse.trim() && !currentEssay.trim() && !fileContext) || isAnalyzing) return;

        // CHECK QUOTA: Chat
        if (user) {
            const { allowed } = await checkUsageQuota(user.id, 'chat');
            if (!allowed) {
                setUpgradeFeature('Chat Messages');
                setShowUpgradeModal(true);
                return;
            }
            incrementUsage(user.id, 'chat').catch(err => console.error("Increment failed", err));
        }

        const baseUserMessage = inputToUse.trim() || "Analyze this essay";
        // Apply Research Mode prompt wrapping if active (Neutralized per user request)
        const userMessage = isResearchMode
            ? `[RESEARCH MODE ACTIVATE]\nPlease act as an objective research assistant. Search for external data to provide a comprehensive answer to the following query. IMPORTANT: Do not assume this is localized to Indonesia or any specific country unless explicitly stated in the query. Provide global answers.\n\nUSER PROMPT:\n${baseUserMessage}`
            : baseUserMessage;

        // precise context: The essay content combined with any uploaded file context
        const context = fileContext ? `[Attached Document Content]\n${fileContext}\n\n[Current Essay Content]\n${currentEssay}` : currentEssay;

        // Add User Message (Display the original short message in UI, not the huge prompt)
        const displayMessage = { role: 'user', content: baseUserMessage };
        setChatHistory(prev => [...prev, displayMessage]);
        setChatInput('');
        setIsAnalyzing(true);
        if (!isChatOpen) setIsChatOpen(true); // Auto-open chat when submitting

        // 1. LAZY CREATE CHAT SESSION
        let activeChatId = currentChatId;
        if (!activeChatId && user) {
            try {
                // Create Session for first message
                // Prefix with "Canvas" as requested
                const newChat = await createChat(user.id, "Canvas: Untitled Essay");
                activeChatId = newChat.id;
                setCurrentChatId(activeChatId);
                setSavedChats(prev => [newChat, ...prev]);
            } catch (err) {
                console.error("Failed to lazy-create canvas chat:", err);
            }
        }

        // 2. SAVE USER MESSAGE
        if (activeChatId) {
            saveMessage(activeChatId, 'user', baseUserMessage).catch(err => console.error("Save Msg Error:", err));

            if (chatHistory.length === 0) {
                // Background async task so UI unblocks instantly
                generateSmartTitleLLM(baseUserMessage).then(smartTitle => {
                    const finalTitle = `Canvas: ${smartTitle}`;
                    updateChatTitle(activeChatId, finalTitle).catch(console.error);

                    setSavedChats(prev => prev.map(c => c.id === activeChatId ? { ...c, title: finalTitle } : c));

                    // Conditionally update active essay header if they haven't manually modified it
                    setEssayTitle(curr => curr === "Untitled Essay" || curr.startsWith("Untitled") ? smartTitle : curr);
                });
            }

            // AUTO-SAVE ESSAY CONTENT (Persistence)
            // Every time we chat, we snapshot the essay content to the payload
            updateChatPayload(activeChatId, { essayContent: context }).catch(err => console.error("Payload Save Error:", err));
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
                selectedModel, // Provider
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setFileUrl(url);

        let detectedType = file.type;
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.pdf')) detectedType = 'application/pdf';
        else if (lowerName.endsWith('.docx')) detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        setFileType(detectedType);
        setFileName(file.name);
        setIsFileParsing(true);

        if (detectedType === "text/plain" || lowerName.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFileContext(event.target.result);
                setIsFileParsing(false);
            };
            reader.readAsText(file);
        }
        else if (detectedType === "application/pdf" || detectedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || lowerName.endsWith(".docx") || lowerName.endsWith(".pdf")) {
            extractTextFromFile(file)
                .then(text => {
                    setFileContext(text);
                    setIsFileParsing(false);
                    console.log(`[Canvas] Extraction success. Text length: ${text?.length || 0}`);
                })
                .catch(err => {
                    console.error("Extraction error:", err);
                    setIsFileParsing(false);
                    alert("Gagal mengekstrak teks dari file ini.");
                });
        }
        else {
            setIsFileParsing(false);
        }
    };

    // Manual Save Handler
    const handleSaveChat = async (silent = false) => {
        if (!user) return;

        try {
            let activeChatId = currentChatId;

            // If no active session, create one explicitly
            if (!activeChatId) {
                const title = essayTitle.trim() || "Untitled Canvas Session";
                const newChat = await createChat(user.id, `Canvas: ${title}`);
                activeChatId = newChat.id;
                setCurrentChatId(activeChatId);
                // Add to list
                setSavedChats(prev => [newChat, ...prev]);
            }

            if (activeChatId) {
                // Update title
                const currentTitle = essayTitle.trim() || "Untitled Canvas Essay";
                const finalTitle = currentTitle.startsWith("Canvas:") ? currentTitle : `Canvas: ${currentTitle}`;

                await updateChatTitle(activeChatId, finalTitle);

                // CRITICAL: Save Essay Content to Payload
                await updateChatPayload(activeChatId, { essayContent: essayContent });

                // Update local list without triggering a network fetch race condition
                setSavedChats(prev => prev.map(c => c.id === activeChatId ? {
                    ...c,
                    title: finalTitle,
                    payload: { ...(c.payload || {}), essayContent }
                } : c));

                if (!silent) alert("Canvas Session & Essay Saved!");
            }

        } catch (error) {
            console.error("Save Error:", error);
            if (!silent) alert("Failed to save session.");
        }
    };

    const handleNewChat = async (forceBlank = false) => {
        if (isCreatingChatRef.current) return;

        // 1. Capture current context securely from Tiptap source of truth
        let previousEssay = essayContent;
        if (editor) {
            const html = editor.getHTML();
            previousEssay = html === '<p></p>' ? '' : html;
        }
        const previousChatId = currentChatIdRef.current;

        // 2. Lock UI to prevent spam clicking
        isCreatingChatRef.current = true;

        try {
            // 3. Eagerly generate the new UI chat row to guarantee it exists before wiping state
            let newBlankChat = null;
            if (!forceBlank && user) {
                newBlankChat = await createChat(user.id, "Canvas: Untitled Essay");
            }

            // 4. Safely archive the previous session
            if ((previousEssay.trim() || chatHistory.length > 0) && previousChatId) {
                updateChatPayload(previousChatId, { essayContent: previousEssay }).catch(err => console.error(err));
                setSavedChats(prev => prev.map(c => c.id === previousChatId ? {
                    ...c,
                    payload: { ...(c.payload || {}), essayContent: previousEssay }
                } : c));
            }

            // 5. Instantly transition UI visually AFTER network is secured
            setChatHistory([]);
            setChatInput('');
            setEssayContent('');
            if (editor) {
                editor.commands.setContent('');
            }
            setEssayTitle('Untitled Essay');

            // Render the new sidebar row gracefully
            if (newBlankChat) {
                setCurrentChatId(newBlankChat.id);
                setSavedChats(prev => [newBlankChat, ...prev]);
            } else {
                setCurrentChatId(null);
            }

        } catch (err) {
            console.error("Failed to generate new chat session:", err);
            // On failure, DO NOT wipe their canvas text! Leave it exactly as it was.
            alert("Gagal membuat sesi baru. Silakan periksa koneksi internet.");
        } finally {
            isCreatingChatRef.current = false;
        }
    };

    // --- History Management Handlers ---

    const handleRenameChat = async (e, chatId) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            if (editingTitle.trim()) {
                try {
                    const finalTitle = editingTitle.startsWith("Canvas:") ? editingTitle : `Canvas: ${editingTitle}`;
                    await updateChatTitle(chatId, finalTitle);
                    setSavedChats(prev => prev.map(ch => ch.id === chatId ? { ...ch, title: finalTitle } : ch));

                    // Keep active session title perfectly synced with Sidebar renaming
                    if (currentChatId === chatId) {
                        setEssayTitle(finalTitle.replace("Canvas: ", ""));
                    }
                } catch (err) {
                    console.error("Rename failed", err);
                }
            }
            setEditingChatId(null);
        } else if (e.key === 'Escape') {
            setEditingChatId(null);
        }
    };

    const handleDeleteChat = async (e, chatId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this session?")) {
            try {
                // Delete from Backend in the background
                deleteChat(chatId).catch(err => console.error("Network Delete failed", err));

                // Optimistically update the UI sidebar
                const updatedList = savedChats.filter(ch => ch.id !== chatId);
                setSavedChats(updatedList);

                // If we are deleting the CURRENT active session...
                if (currentChatId === chatId) {
                    if (updatedList.length > 0) {
                        // Smart Fallback: automatically load the next most recent session
                        handleLoadChat(updatedList[0].id);
                    } else {
                        // Complete wipe ONLY if it was the absolute last session left
                        handleNewChat(true); // pass true flag to force blank without generating network row
                    }
                }
            } catch (err) {
                console.error("Delete failed", err);
            }
        }
    };



    const handleLoadChat = async (chatId) => {
        if (currentChatId === chatId) return; // Prevent redundant loading
        console.log("Loading chat session:", chatId);
        blockAutoSaveRef.current = true; // Lock auto-save
        setChatHistory([]); // Clear current history to avoid flickering stale content

        // Clear file attachments from previous session to ensure isolation
        setFileUrl(null);
        setFileName('');
        setFileType(null);
        setFileContext('');
        setIsFileParsing(false);
        setAnalyzedFile(null);

        try {
            // 0. Eagerly Auto-Save the CURRENT session before switching away!
            let activeEssay = essayContent;
            if (editor) {
                const html = editor.getHTML();
                activeEssay = html === '<p></p>' ? '' : html;
            }
            if (currentChatId && (activeEssay.trim() || chatHistory.length > 0)) {
                updateChatPayload(currentChatId, { essayContent: activeEssay }).catch(console.error);
                setSavedChats(prev => prev.map(c => c.id === currentChatId ? {
                    ...c,
                    payload: { ...(c.payload || {}), essayContent: activeEssay }
                } : c));
            }

            // 1. Get Target Session Data (from local list)
            const session = savedChats.find(c => c.id === chatId);
            if (!session) return;

            setCurrentChatId(chatId);
            setEssayTitle(session.title.replace("Canvas: ", ""));

            // 2. Restore Target Essay Content from Payload
            if (session.payload && typeof session.payload.essayContent === 'string') {
                setEssayContent(session.payload.essayContent);
                if (editor) {
                    editor.commands.setContent(session.payload.essayContent);
                }
            } else {
                // If it's explicitly broken, don't wipe it completely if we already have text,
                // just safely set it to empty. 
                setEssayContent('');
                if (editor) {
                    editor.commands.setContent('');
                }
            }

            // 3. Load Messages
            const messages = await getChatMessages(chatId);
            setChatHistory(messages.map(m => ({ role: m.role, content: m.content })));

            // Close Sidebar on mobile (optional)
        } catch (err) {
            console.error("Load Chat Error:", err);
        } finally {
            // Unlock auto-save after React finishes state flush
            setTimeout(() => {
                blockAutoSaveRef.current = false;
            }, 1500);
        }
    };


    // Word and Page Count (Approx 250 words per page for standard 12pt Times)
    const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).length : 0;
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 250));

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

                    <div className="pt-4 pb-2">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center gap-3 bg-white border border-oxford-blue/10 hover:border-bronze/50 text-oxford-blue px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md group"
                        >
                            <div className="w-8 h-8 rounded-full bg-oxford-blue/5 flex items-center justify-center group-hover:bg-bronze/10 group-hover:text-bronze transition-colors">
                                <Plus size={16} />
                            </div>
                            <span className="font-bold text-sm">New Chat</span>
                        </button>
                    </div>

                    {/* HISTORY LIST */}
                    <div className="flex-1 overflow-y-auto px-1 space-y-1 custom-scrollbar max-h-[calc(100vh-320px)]">
                        {savedChats.length === 0 && (
                            <div className="text-center py-4 text-xs text-oxford-blue/40 italic">
                                No canvas history yet.
                            </div>
                        )}
                        {groupChatsByTime(savedChats).map(group => (
                            <div key={group.label} className="mb-6 last:mb-0 space-y-1">
                                <div className="px-4 py-2 text-xs font-bold text-oxford-blue/40 uppercase tracking-wider">
                                    {group.label}
                                </div>
                                {group.chats.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => handleLoadChat(chat.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm truncate flex items-center gap-3 group cursor-pointer ${currentChatId === chat.id
                                            ? 'bg-oxford-blue/5 text-oxford-blue font-medium'
                                            : 'text-oxford-blue/60 hover:bg-white hover:shadow-sm'
                                            }`}
                                    >
                                        <MessageSquare size={16} className={`shrink-0 ${currentChatId === chat.id ? 'text-bronze' : 'opacity-50'}`} />

                                        {editingChatId === chat.id ? (
                                            <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                                                <input
                                                    autoFocus
                                                    className="w-full bg-white border border-oxford-blue/20 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-bronze"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onKeyDown={(e) => handleRenameChat(e, chat.id)}
                                                    onBlur={(e) => handleRenameChat(e, chat.id)}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <span className="truncate flex-1">{chat.title.replace("Canvas: ", "")}</span>

                                                {/* Action Buttons (Visible on Group Hover) */}
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                    <button
                                                        className="p-1 hover:bg-oxford-blue/10 rounded text-oxford-blue/40 hover:text-oxford-blue transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingChatId(chat.id);
                                                            setEditingTitle(chat.title.replace("Canvas: ", "") || "");
                                                        }}
                                                        title="Rename"
                                                    >
                                                        <div className="w-4 h-4">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    <button
                                                        className="p-1 hover:bg-red-100 rounded text-oxford-blue/40 hover:text-red-500 transition-all"
                                                        onClick={(e) => handleDeleteChat(e, chat.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>


                <div className="flex-1" />

                {/* User Profile */}
                <div className="p-4 border-t border-oxford-blue/5 relative">
                    <button
                        onClick={onOpenSettings}
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
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
                    {/* Left: Menu */}
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <Menu size={18} />
                        </button>
                    </div>

                    {/* Center: Formatting Toolbar */}
                    <div className="flex items-center gap-0.5 flex-1 justify-center">
                        <div className="relative" ref={alignMenuRef}>
                            <button onClick={() => setIsAlignMenuOpen(!isAlignMenuOpen)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-1" title="Align Text">
                                {(!editor?.isActive({ textAlign: 'center' }) && !editor?.isActive({ textAlign: 'right' }) && !editor?.isActive({ textAlign: 'justify' })) && <AlignLeft size={16} />}
                                {editor?.isActive({ textAlign: 'center' }) && <AlignCenter size={16} />}
                                {editor?.isActive({ textAlign: 'right' }) && <AlignRight size={16} />}
                                {editor?.isActive({ textAlign: 'justify' }) && <AlignJustify size={16} />}
                            </button>
                            {isAlignMenuOpen && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md p-1 z-50 flex gap-0.5">
                                    <button onClick={() => { handleFormat('align-left'); setIsAlignMenuOpen(false); }} className={`p-1.5 rounded transition-colors ${editor?.isActive({ textAlign: 'left' }) || (!editor?.isActive({ textAlign: 'center' }) && !editor?.isActive({ textAlign: 'right' }) && !editor?.isActive({ textAlign: 'justify' })) ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`} title="Align Left">
                                        <AlignLeft size={16} />
                                    </button>
                                    <button onClick={() => { handleFormat('align-center'); setIsAlignMenuOpen(false); }} className={`p-1.5 rounded transition-colors ${editor?.isActive({ textAlign: 'center' }) ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`} title="Align Center">
                                        <AlignCenter size={16} />
                                    </button>
                                    <button onClick={() => { handleFormat('align-right'); setIsAlignMenuOpen(false); }} className={`p-1.5 rounded transition-colors ${editor?.isActive({ textAlign: 'right' }) ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`} title="Align Right">
                                        <AlignRight size={16} />
                                    </button>
                                    <button onClick={() => { handleFormat('align-justify'); setIsAlignMenuOpen(false); }} className={`p-1.5 rounded transition-colors ${editor?.isActive({ textAlign: 'justify' }) ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`} title="Justify">
                                        <AlignJustify size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={spacingMenuRef}>
                            <button onClick={() => setIsSpacingMenuOpen(!isSpacingMenuOpen)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-1" title="Line Spacing">
                                <MoveVertical size={16} />
                            </button>
                            {isSpacingMenuOpen && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md py-1 z-50 w-[100px] flex flex-col">
                                    {[
                                        { label: '1,0', value: '1.0' },
                                        { label: '1,15', value: '1.15' },
                                        { label: '1,5', value: '1.5' },
                                        { label: '2,0', value: '2.0' },
                                        { label: '2,5', value: '2.5' },
                                        { label: '3,0', value: '3.0' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setLineSpacing(opt.value); setIsSpacingMenuOpen(false); }}
                                            className={`relative w-full py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center ${lineSpacing === opt.value ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-600'}`}
                                        >
                                            <div className="w-8 flex justify-center shrink-0">
                                                {lineSpacing === opt.value && <Check strokeWidth={2.5} className="text-gray-900" size={14} />}
                                            </div>
                                            <span className="flex-1">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>

                        <button onClick={() => handleFormat('bold')} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Bold">
                            <Bold size={16} />
                        </button>
                        <button onClick={() => handleFormat('italic')} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Italic">
                            <Italic size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Link">
                            <Link size={16} />
                        </button>
                        <button onClick={() => handleFormat('quote')} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Quote">
                            <Quote size={16} />
                        </button>

                        <div className="w-px h-4 bg-gray-200 mx-1"></div>

                        <button
                            onClick={() => {
                                if (onRequireAuth && onRequireAuth()) return;
                                if (onCampusMatch) onCampusMatch();
                            }}
                            className="p-1.5 text-gray-400 hover:text-bronze hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                            title="Campus Match"
                        >
                            <GraduationCap size={16} />
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end gap-2 flex-1">

                        <button
                            onClick={() => {
                                setUpgradeFeature(null);
                                setShowUpgradeModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-semibold hover:bg-blue-600 transition-colors shadow-[0_2px_4px_rgba(59,130,246,0.2)]"
                        >
                            <Rocket size={12} />
                            Upgrade
                        </button>
                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`p-1.5 rounded transition-colors ml-1 ${isChatOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                            title="Toggle AI Chat"
                        >
                            <Sparkle size={18} />
                        </button>

                        {/* Essential Features Control */}
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    </div>
                </div>

                {/* Editor Area (Google Docs Style) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F1F3F4] relative flex flex-col items-center">

                    {/* Version & Review Changes Header (Above the paper) */}
                    <div className="w-full max-w-[816px] flex items-center justify-between mt-6 px-4">
                        <div className="relative" ref={versionMenuRef}>
                            <button
                                onClick={() => setIsVersionMenuOpen(!isVersionMenuOpen)}
                                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-200/50 text-oxford-blue/60 hover:text-oxford-blue font-semibold text-sm rounded-lg transition-colors"
                            >
                                <span>Version {currentVersionId}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isVersionMenuOpen ? 'rotate-180' : ''}`}>
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            {isVersionMenuOpen && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-xl py-2 z-50 animate-fadeIn">
                                    {versions.length < 2 && (
                                        <div className="px-3 pb-2 mb-2 border-b border-gray-100">
                                            <button
                                                onClick={handleCreateVersion}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-oxford-blue hover:text-bronze hover:bg-bronze/5 rounded-md transition-colors"
                                            >
                                                <Plus size={14} />
                                                New Version
                                            </button>
                                        </div>
                                    )}
                                    <div className="max-h-48 overflow-y-auto">
                                        {versions.map(v => (
                                            <div
                                                key={v.id}
                                                className={`w-full group px-2 py-1 flex items-center justify-between transition-colors ${currentVersionId === v.id ? 'bg-blue-50 relative' : 'hover:bg-gray-50'}`}
                                            >
                                                <button
                                                    onClick={() => { setCurrentVersionId(v.id); setIsVersionMenuOpen(false); }}
                                                    className={`flex-1 text-left px-3 py-1.5 text-sm transition-colors flex items-center justify-between ${currentVersionId === v.id ? 'text-blue-600 font-bold' : 'text-oxford-blue/80'}`}
                                                >
                                                    <span>{v.title}</span>
                                                    {currentVersionId === v.id && <Check size={14} className="mr-2" />}
                                                </button>
                                                {versions.length > 1 && (
                                                    <button
                                                        onClick={(e) => handleDeleteVersion(e, v.id)}
                                                        className="p-1.5 text-oxford-blue/30 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all absolute right-2"
                                                        title="Delete Version"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {currentVersionId > 1 && (
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-200/50 hover:bg-gray-200 text-oxford-blue/60 hover:text-oxford-blue font-medium text-sm rounded-lg transition-colors animate-fadeIn">
                                <ListChecks size={16} />
                                Review Changes
                            </button>
                        )}
                    </div>

                    <div className="w-full max-w-[816px] bg-white min-h-[1056px] shadow-sm border border-gray-200 mt-2 mb-12 px-16 py-12 relative flex-shrink-0">

                        {/* TIPTAP EDITOR LAYER */}
                        <div
                            className="absolute inset-0 z-10 custom-tiptap-editor"
                        >
                            <EditorContent editor={editor} className="h-full w-full outline-none" />
                        </div>
                    </div>
                </div>

                {/* Status Bar (Word & Page Count) */}
                <div className="h-8 bg-gray-100 border-t border-gray-200 flex items-center justify-start px-4 shrink-0 shadow-[0_-1px_2px_rgba(0,0,0,0.02)] z-10">
                    <div className="flex items-center gap-6 text-xs text-gray-500 font-medium">
                        <span>Page 1 of {estimatedPages}</span>
                        <span>{wordCount} words</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: AI ASSISTANT CHAT */}
            {isChatOpen && (
                <div className="w-[400px] flex flex-col bg-white h-full shadow-xl shadow-oxford-blue/5 z-20 border-l border-oxford-blue/10 shrink-0">
                    {/* Header / Quota Indicator */}
                    <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
                        <QuotaDisplay userId={user?.id} visibleQuotas={['chat', 'deep_review']} minimal={true} />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowInChatHistory(true)}
                                className="p-1.5 text-oxford-blue/40 hover:text-oxford-blue hover:bg-oxford-blue/5 rounded transition-colors"
                                title="In-Chat History"
                            >
                                <History size={16} />
                            </button>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="p-1.5 text-oxford-blue/40 hover:text-oxford-blue hover:bg-oxford-blue/5 rounded transition-colors"
                                title="Close Chat"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Chat History & Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC] custom-scrollbar">
                        {/* Welcome Message */}
                        {chatHistory.length === 0 && (
                            <div className="py-12 flex flex-col items-start px-2">
                                <h3 className="font-serif font-bold text-2xl text-oxford-blue mb-8">
                                    Hi Scholar, how can I help you today? &gt;&lt;
                                </h3>

                                {/* Suggested Actions */}
                                <div className="flex flex-col gap-1 w-full max-w-[280px]">
                                    <p className="text-xs font-semibold text-oxford-blue/40 tracking-wider mb-2 text-left">Suggested</p>
                                    <button
                                        onClick={() => handleSuggestedAction('structure')}
                                        className="w-full flex items-center gap-3 text-left py-1.5 text-sm font-medium text-oxford-blue/80 hover:text-blue-600 transition-colors group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-gray-100/50 text-oxford-blue/40 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <FileText size={16} />
                                        </div>
                                        Structure outline
                                    </button>
                                    <button
                                        onClick={() => handleSuggestedAction('hook')}
                                        className="w-full flex items-center gap-3 text-left py-1.5 text-sm font-medium text-oxford-blue/80 hover:text-blue-600 transition-colors group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-gray-100/50 text-oxford-blue/40 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <PenLine size={16} />
                                        </div>
                                        Draft hook
                                    </button>
                                    <button
                                        onClick={() => handleSuggestedAction('review')}
                                        className="w-full flex items-center gap-3 text-left py-1.5 text-sm font-medium text-oxford-blue/80 hover:text-blue-600 transition-colors group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-gray-100/50 text-oxford-blue/40 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <ClipboardCheck size={16} />
                                        </div>
                                        Review
                                    </button>
                                </div>
                            </div>
                        )}
                        {(() => {
                            const handleLineClick = (quote) => {
                                if (!editor || !quote) return;
                                const text = editor.getText();
                                const index = text.indexOf(quote);
                                if (index !== -1) {
                                    editor.commands.focus();
                                    editor.commands.setTextSelection({ from: index + 1, to: index + quote.length + 1 });
                                    // Scroll into view
                                    const element = editor.view.dom.querySelector('.ProseMirror-selectednode') || editor.view.dom;
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            };

                            const handleReferenceClick = (label) => {
                                console.log("Reference clicked:", label);
                                // For numeric references, we could scroll to the bottom of the current message where sources are usually listed
                            };

                            return (
                                <ChatMessagesList
                                    messages={chatHistory}
                                    fileName={fileName}
                                    onOpenFile={() => setShowDocumentPreview(true)}
                                    onLineClick={handleLineClick}
                                    onReferenceClick={handleReferenceClick}
                                />
                            );
                        })()}

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

                    {showInChatHistory && (
                        <div className="absolute top-14 right-0 w-full md:w-80 bg-white border border-gray-200 shadow-xl rounded-bl-2xl z-50 animate-fadeIn h-auto max-h-[60vh] flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <h4 className="font-bold text-oxford-blue text-sm flex items-center gap-2">
                                    <History size={14} className="text-bronze" />
                                    Session History
                                </h4>
                                <button onClick={() => setShowInChatHistory(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {chatHistory.filter(msg => msg.role === 'user').length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">No topics discussed yet.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {chatHistory.map((msg, idx) => {
                                            if (msg.role !== 'user') return null;

                                            // Create a short topic summary
                                            const isAnalysis = msg.content === "Analyze this document completely.";
                                            const topic = isAnalysis ? "Document Analysis" : msg.content.substring(0, 40) + (msg.content.length > 40 ? "..." : "");

                                            return (
                                                <button
                                                    key={`history-nav-${idx}`}
                                                    onClick={() => {
                                                        // Scroll to element with this ID
                                                        const el = document.getElementById(`chat-msg-${idx}`);
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                        setShowInChatHistory(false);
                                                    }}
                                                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-start gap-3 transition-colors group"
                                                >
                                                    <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isAnalysis ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {isAnalysis ? <BookOpen size={12} /> : <MessageCircle size={12} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-oxford-blue group-hover:text-bronze transition-colors truncate">
                                                            {topic}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">Interaction {Math.floor(idx / 2) + 1}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Document Preview Modal */}
                    {showDocumentPreview && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-oxford-blue/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowDocumentPreview(false)}>
                            <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[95vh] max-w-6xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-oxford-blue/10 bg-gray-50/50 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <BookOpen size={20} />
                                        </div>
                                        <h3 className="font-semibold text-oxford-blue truncate max-w-2xl">{fileName || analyzedFile?.name}</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowDocumentPreview(false)}
                                        className="p-2 text-oxford-blue/40 hover:text-oxford-blue hover:bg-oxford-blue/5 rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-0 overflow-hidden bg-white flex-1 flex flex-col relative">
                                    {(fileType || analyzedFile?.type) === 'application/pdf' && (fileUrl || analyzedFile?.url) ? (
                                        <div className="absolute inset-0 w-full h-full bg-gray-100">
                                            <PDFViewer key={fileUrl || analyzedFile?.url} url={fileUrl || analyzedFile?.url} />
                                        </div>
                                    ) : (fileType || analyzedFile?.type)?.startsWith('image/') && (fileUrl || analyzedFile?.url) ? (
                                        <div className="w-full h-full flex items-center justify-center p-8 bg-gray-50 overflow-y-auto flex-1">
                                            <img
                                                src={fileUrl || analyzedFile?.url}
                                                alt="Document"
                                                className="max-w-full max-h-full object-contain drop-shadow-md rounded-lg"
                                                style={{ imageOrientation: 'from-image' }}
                                            />
                                        </div>
                                    ) : isFileParsing ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4 flex-1">
                                            <Loader className="animate-spin text-bronze" size={32} />
                                            <p className="text-oxford-blue/60 font-medium">Membaca dokumen...</p>
                                        </div>
                                    ) : (fileContext || analyzedFile?.content) ? (
                                        <div className="font-serif text-oxford-blue leading-relaxed whitespace-pre-wrap text-base md:text-lg overflow-y-auto p-8 md:p-12 w-full h-full flex-1">
                                            {fileContext || analyzedFile?.content}
                                        </div>
                                    ) : (
                                        <div className="text-center text-oxford-blue/50 py-20 font-serif flex-1 flex items-center justify-center flex-1">
                                            Preview not available for this file type.
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions - Analyze Button */}
                                {(fileUrl || analyzedFile) && (
                                    <div className="px-6 py-4 border-t border-oxford-blue/10 bg-gray-50/50 shrink-0 flex justify-end">
                                        <button
                                            onClick={handleAnalyzeDocument}
                                            disabled={isAnalyzing || isFileParsing}
                                            className={`px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${(isAnalyzing || isFileParsing) ? 'bg-gray-200 text-gray-400' : 'bg-bronze text-white hover:brightness-90 hover:scale-[1.02] shadow-bronze/20'}`}
                                        >
                                            {(isAnalyzing || isFileParsing) ? (
                                                <Loader size={18} className="animate-spin" />
                                            ) : (
                                                <Sparkles size={18} />
                                            )}
                                            {isAnalyzing ? "Membedah..." : isFileParsing ? "Menyiapkan..." : "Dissect Document"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Area (Unified Style) */}
                    <div className="p-3 bg-[#F8FAFC] shrink-0">
                        <div className="bg-gray-50 border border-oxford-blue/10 rounded-xl p-3 focus-within:ring-2 focus-within:ring-bronze/10 focus-within:border-bronze/30 transition-all shadow-sm">

                            {/* File Attachment Preview */}
                            {fileUrl && fileName && (
                                <div
                                    onClick={() => setShowDocumentPreview(true)}
                                    className="group flex items-center gap-2 mb-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-oxford-blue/10 rounded-full w-fit max-w-full shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <BookOpen size={12} />
                                    </div>
                                    <span className="text-xs font-semibold text-oxford-blue truncate max-w-[150px]">
                                        1 File Attached
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFileUrl(null);
                                            setFileName('');
                                            setFileContext('');
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="ml-1 p-0.5 text-oxford-blue/40 hover:text-red-500 rounded-full hover:bg-oxford-blue/5 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            <textarea
                                ref={chatInputRef}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isAnalyzing ? "Thinking..." : (fileName ? "Analyze this..." : "Ask Scholarstory...")}
                                className="w-full bg-transparent border-none px-2 py-1 text-sm text-oxford-blue outline-none resize-none custom-scrollbar disabled:opacity-50 placeholder-oxford-blue/40"
                                rows={1}
                                style={{ minHeight: '28px', maxHeight: '200px' }}
                                disabled={isAnalyzing}
                            />

                            {/* Internal Toolbar */}
                            <div className="flex items-center justify-between px-1 mt-2">
                                <div className="flex items-center gap-3">
                                    {/* Add Document Button */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-1 rounded-full text-oxford-blue/40 hover:text-bronze hover:bg-oxford-blue/10 transition-colors"
                                        title="Lampirkan File"
                                    >
                                        <Plus size={18} strokeWidth={2.5} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleFileUpload}
                                    />

                                    {/* Mode Indicator / Dropdown Toggle */}
                                    <div className="relative" ref={chatModeMenuRef}>
                                        <button
                                            onClick={() => setIsChatModeMenuOpen(!isChatModeMenuOpen)}
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-oxford-blue/60 hover:bg-gray-100 hover:text-oxford-blue transition-colors font-medium"
                                            title="Select Chat Mode"
                                        >
                                            <ChevronUp size={16} className="text-oxford-blue/40" />
                                            {selectedModel === 'auto' ? 'Auto' : selectedModel === 'openai' ? 'GPT-4o' : 'Perplexity Pro'}
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isChatModeMenuOpen && (
                                            <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-100 shadow-xl rounded-xl z-50 overflow-hidden py-1 animate-fadeIn">
                                                <button
                                                    onClick={() => { setSelectedModel('auto'); setIsChatModeMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-oxford-blue hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                                >
                                                    <span className={selectedModel === 'auto' ? "font-bold text-oxford-blue block mb-0.5" : "block mb-0.5"}>Auto</span>
                                                    {selectedModel === 'auto' && <Check size={14} className="text-bronze shrink-0" />}
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedModel('openai'); setIsChatModeMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-oxford-blue hover:bg-gray-50 flex items-start justify-between group transition-colors"
                                                >
                                                    <div className="pr-4">
                                                        <span className={selectedModel === 'openai' ? "font-bold text-oxford-blue block mb-0.5" : "block mb-0.5"}>GPT-4o</span>
                                                    </div>
                                                    {selectedModel === 'openai' && <Check size={14} className="text-bronze mt-1 shrink-0" />}
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedModel('perplexity'); setIsChatModeMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-oxford-blue hover:bg-gray-50 flex items-start justify-between group transition-colors"
                                                >
                                                    <div className="pr-4">
                                                        <span className={selectedModel === 'perplexity' ? "font-bold text-oxford-blue block mb-0.5" : "block mb-0.5"}>Perplexity Pro</span>
                                                    </div>
                                                    {selectedModel === 'perplexity' && <Check size={14} className="text-bronze mt-1 shrink-0" />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Send / Stop Button */}
                                <div className="flex items-center gap-2">
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
            )}
            <UpgradeModal
                open={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName={upgradeFeature}
                session={user ? { user } : null}
                onLogin={onRequireAuth}
            />

        </div>
    );
};


export default CanvasWorkspace;
