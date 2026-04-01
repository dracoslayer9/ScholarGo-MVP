
import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Extension, InputRule, Mark, mergeAttributes } from '@tiptap/core';
import { Markdown } from 'tiptap-markdown';
import Highlight from '@tiptap/extension-highlight';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

// Define the custom AutoCapitalize Extension to securely enforce capital letters on all devices
const AutoCapitalize = Extension.create({
    name: 'autoCapitalize',
    addInputRules() {
        return [
            new InputRule({
                find: /(?:^|[\n.!?]\s+)([a-z])$/,
                handler: ({ state, range, match }) => {
                    const { tr, doc } = state;
                    const textBefore = doc.textBetween(Math.max(0, range.from - 5), range.from, "\n");
                    if (/\d\.$/.test(textBefore)) return null; 
                    const uppercaseLetter = match[1].toUpperCase();
                    const replacement = match[0].slice(0, -1) + uppercaseLetter;
                    tr.insertText(replacement, range.from, range.to);
                },
            }),
        ];
    },
});

const FontSize = Mark.create({
    name: 'fontSize',
    addAttributes() {
        return {
            size: {
                default: null,
                parseHTML: element => element.style.fontSize?.replace('pt', ''),
                renderHTML: attributes => {
                    if (!attributes.size) return {};
                    return { style: `font-size: ${attributes.size}pt` };
                },
            },
        };
    },
    parseHTML() {
        return [{ tag: 'span[style*=font-size]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes), 0];
    },
    addCommands() {
        return {
            setFontSize: size => ({ commands }) => {
                return commands.setMark(this.name, { size });
            },
            unsetFontSize: () => ({ commands }) => {
                return commands.unsetMark(this.name);
            },
        };
    },
});

const FontFamily = Mark.create({
    name: 'fontFamily',
    addAttributes() {
        return {
            family: {
                default: null,
                parseHTML: element => element.style.fontFamily,
                renderHTML: attributes => {
                    if (!attributes.family) return {};
                    let familyStyle = attributes.family;
                    if (familyStyle === 'times') familyStyle = '"Times New Roman", Times, serif';
                    if (familyStyle === 'poppins') familyStyle = '"Poppins", sans-serif';
                    if (familyStyle === 'arial') familyStyle = 'Arial, Helvetica, sans-serif';
                    return { style: `font-family: ${familyStyle}` };
                },
            },
        };
    },
    parseHTML() {
        return [{ tag: 'span[style*=font-family]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes), 0];
    },
    addCommands() {
        return {
            setFontFamily: family => ({ commands }) => {
                return commands.setMark(this.name, { family });
            },
            unsetFontFamily: () => ({ commands }) => {
                return commands.unsetMark(this.name);
            },
        };
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
    MoveVertical,
    CheckCircle2,
    MessageSquareMore,
    AlertCircle,
    RotateCw,
    SpellCheck,
    Languages,
    Minus,
    Zap,
    ChevronDown
} from 'lucide-react';
import { sendChatMessage, runRealAnalysis, summarizeChatHistory } from './services/analysis';
import { createChat, saveMessage, updateChatTitle, getUserChats, getChatMessages, updateChatPayload, deleteChat, deleteMessagesAfter } from './services/chatService';
import { Trash2, MessageSquare, Edit2, Check, X, ListChecks, MessageCircle, FileText, PenLine, ClipboardCheck } from 'lucide-react';
import { generateSmartTitle } from './utils/chatUtils';
import { extractTextFromFile } from './utils/fileUtils';
import { PDFViewer } from './components/PDFViewer';
import ChatMessagesList from './components/ChatMessagesList';
import AnalysisResultView from './components/AnalysisResultView';
import UpgradeModal from './components/UpgradeModal';
import QuotaDisplay from './components/QuotaDisplay';
import { checkUsageQuota, incrementUsage } from './services/subscriptionService';
import { extractResumeText, parseResumeWithAI } from './services/resumeService';
import DiscoveryThinkingState from './components/DiscoveryThinkingState';



const CanvasWorkspace = ({ onBack, onRequireAuth, user, onSignOut, onOpenSettings, initialContent = '', initialFileName = '', initialFileUrl = null, initialFileType = null, initialFileContext = '' }) => {
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

    // --- Settings & Font State ---
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsMenuRef = useRef(null);
    const [activeFont, setActiveFont] = useState('times'); // 'times', 'poppins', 'arial'
    const [baseFontSize, setBaseFontSize] = useState(12); // Default to standard 12pt
    const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
    const fontDropdownRef = useRef(null);

    // Click Outside Handlers
    useEffect(() => {
        function handleClickOutside(event) {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
                setIsSettingsOpen(false);
                setIsFontDropdownOpen(false);
            }
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target)) {
                setIsFontDropdownOpen(false);
            }
            if (versionMenuRef.current && !versionMenuRef.current.contains(event.target)) {
                setIsVersionMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync essayContent to current version when typing
    useEffect(() => {
        if (!currentVersionId) return;
        setVersions(prev => prev.map(v => String(v.id) === String(currentVersionId) ? { ...v, content: essayContent } : v));
    }, [essayContent, currentVersionId]);



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
                const nextVersion = updatedVersions[updatedVersions.length - 1];
                setCurrentVersionId(nextVersion.id);
                // The useEffect will handle updating the editor content
            }
        }
    };


    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isResearchMode, setIsResearchMode] = useState(false);
    const [isChatModeMenuOpen, setIsChatModeMenuOpen] = useState(false);
    const chatModeMenuRef = useRef(null);

    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const modelMenuRef = useRef(null);
    const [selectedModel, setSelectedModel] = useState('auto'); // 'auto', 'openai', or 'perplexity'

    const [fileUrl, setFileUrl] = useState(initialFileUrl || null);
    const [fileType, setFileType] = useState(initialFileType || null);
    const [fileName, setFileName] = useState(initialFileName || '');
    const [fileContext, setFileContext] = useState(initialFileContext || '');
    const [analyzedFile, setAnalyzedFile] = useState(null); // Stores file for preview history
    const [isFileParsing, setIsFileParsing] = useState(false);
    const [showDocumentPreview, setShowDocumentPreview] = useState(false);

    // --- Selection and Comments State ---
    const [comments, setComments] = useState([]);
    const [selectionRange, setSelectionRange] = useState(null);
    const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    // Close menu on click outside - MOVED DOWN after all refs are defined
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

    // Analysis State
    const [analysisResult, setAnalysisResult] = useState(null);

    const [currentChatId, setCurrentChatId] = useState(null); // Canvas Chat Persistence
    const [chatSummary, setChatSummary] = useState(""); // Long-term memory summary
    const [savedChats, setSavedChats] = useState([]); // History List

    // In-Chat History Navigator
    const [showInChatHistory, setShowInChatHistory] = useState(false);
    const [collapsedHistoryGroups, setCollapsedHistoryGroups] = useState({});

    // Application State
    const [essayTitle, setEssayTitle] = useState(initialFileName || 'Untitled Essay');

    // History Management State
    const [editingChatId, setEditingChatId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");

    // Subscription State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeFeature, setUpgradeFeature] = useState('');

    // Chat Editing State
    const [editingMessageIndex, setEditingMessageIndex] = useState(null);
    const [editingMessageText, setEditingMessageText] = useState("");

    // --- Discovery Mode State ---
    const [discoveryStep, setDiscoveryStep] = useState(null); // null, 'upload', 'thinking', 'interview'
    const [discoveryData, setDiscoveryData] = useState(null);
    const [discoveryLoadingStep, setDiscoveryLoadingStep] = useState('parsing'); // 'parsing', 'matching', 'planning', 'generating'
    const [discoveryFile, setDiscoveryFile] = useState(null);

    // Refs
    // const textareaRef = useRef(null); // Deprecated by Tiptap
    const chatInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const lastChatHistoryLength = useRef(0);
    const chatContainerRef = useRef(null);
    const historyListRef = useRef(null);
    const fileInputRef = useRef(null);
    const blockAutoSaveRef = useRef(false); // Mutex lock to prevent cross-session overwrite during load

    // Advanced State Sync Refs
    const currentChatIdRef = useRef(currentChatId);
    const versionsRef = useRef(versions);
    const currentVersionIdRef = useRef(currentVersionId);
    const isCreatingChatRef = useRef(false);

    useEffect(() => {
        currentChatIdRef.current = currentChatId;
        versionsRef.current = versions;
        currentVersionIdRef.current = currentVersionId;
    }, [currentChatId, versions, currentVersionId]);

    // --- TIPTAP EDITOR INIT ---
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Placeholder.configure({
                placeholder: 'Start writing or paste your essay here...',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight.configure({
                multicolor: true,
            }),
            FontSize,
            FontFamily,
            AutoCapitalize,
            Markdown,
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
            // Robust check for empty content
            const isEmpty = html === '<p></p>' || html === '<p><br></p>' || !html;
            const contentToSet = isEmpty ? '' : html;
            setEssayContent(contentToSet);
        },
        onSelectionUpdate: ({ editor }) => {
            const { selection } = editor.state;
            const isTextSelected = !selection.empty && editor.isFocused;

            if (isTextSelected) {
                const { from, to } = selection;
                setSelectionRange({ from, to });

                // Get absolute position of the selection to place the vertical menu
                const { view } = editor;
                const start = view.coordsAtPos(from);
                const end = view.coordsAtPos(to);

                // Fixed vertical position relative to the editor container
                const editorRect = view.dom.getBoundingClientRect();
                const top = start.top - editorRect.top + 48; // +48px to account for paper's py-12 padding

                setMenuPosition({ top, left: editorRect.width + 10 }); // 10px to the right of the editor
                setIsFloatingMenuOpen(true);
            } else {
                setIsFloatingMenuOpen(false);
                setSelectionRange(null);
            }
        },
        onBlur: ({ editor }) => {
            // Eagerly snap the content state when clicking outside the editor
            const html = editor.getHTML();
            const contentToSave = html === '<p></p>' ? '' : html;

            // Sync to version state immediately even if no chatId (for local session feel)
            if (currentVersionIdRef.current) {
                setVersions(prev => prev.map(v =>
                    String(v.id) === String(currentVersionIdRef.current) ? { ...v, content: contentToSave } : v
                ));
            }

            if (currentChatIdRef.current && contentToSave) {
                // Correctly save versions and content separately from AI context
                updateChatPayload(currentChatIdRef.current, {
                    essayContent: contentToSave,
                    versions: versionsRef.current.map(v =>
                        String(v.id) === String(currentVersionIdRef.current) ? { ...v, content: contentToSave } : v
                    ),
                    currentVersionId: currentVersionIdRef.current
                }).catch(console.error);
            }
        }
    });

    // Sync essayContent AND Tiptap editor from current version when version changes
    useEffect(() => {
        const currentVersion = versions.find(v => String(v.id) === String(currentVersionId));
        if (currentVersion && editor) {
            // Update the React state first
            setEssayContent(currentVersion.content);

            // Only update Tiptap if the content is different to avoid cursor reset
            const currentEditorHTML = editor.getHTML();
            const versionHTML = currentVersion.content || '';

            if (currentEditorHTML !== versionHTML) {
                // Safety check: if currentVersion.content is empty/null, set it to empty string or <p></p>
                editor.commands.setContent(versionHTML || '');
            }
        }
    }, [currentVersionId, editor]); // Add editor to dependency array

    useEffect(() => {
        // Ensure the editor and its underlying view/DOM are fully mounted
        if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
            const el = editor.view.dom;
            el.style.lineHeight = lineSpacing;
        }
    }, [editor, lineSpacing]);

    // Initial-only auto-scroll: Snap to bottom when opening chat or changing history item.
    // Streaming and new messages are now 100% manual per user request for reading focus.
    useEffect(() => {
        if (isChatOpen && chatContainerRef.current) {
            const container = chatContainerRef.current;
            const scrollToBottom = () => {
                container.scrollTop = container.scrollHeight;
                messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
            };

            // Instant snap
            scrollToBottom();
            // Buffer for content rendering shifts
            const t = setTimeout(scrollToBottom, 50);
            return () => clearTimeout(t);
        }
    }, [isChatOpen, currentChatId]);

    // Prompt-Locked Scroll: When a message is sent, snap to that prompt at the top.
    // This provides focus and prevents wild jumps during long AI streaming.
    useEffect(() => {
        if (isChatOpen && isAnalyzing && chatHistory.length > lastChatHistoryLength.current && lastChatHistoryLength.current > 0) {
            const userMsgIndex = chatHistory.findLastIndex(m => m.role === 'user');
            if (userMsgIndex !== -1) {
                // Buffer to allow DOM to catch up with the new list items
                const t = setTimeout(() => {
                    const el = document.getElementById(`chat-msg-${userMsgIndex}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
                return () => clearTimeout(t);
            }
        }
        lastChatHistoryLength.current = chatHistory.length;
    }, [chatHistory.length, isChatOpen, isAnalyzing]);

    // Auto-scroll session history to bottom when opened or when history updates while open
    useEffect(() => {
        if (showInChatHistory && historyListRef.current) {
            const container = historyListRef.current;
            const scrollToBottom = () => {
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            };

            // Initial scroll
            scrollToBottom();

            // Handle layout shifts with animation frames and multiple buffers
            const rafId = requestAnimationFrame(() => {
                scrollToBottom();
                const t1 = setTimeout(scrollToBottom, 50);
                const t2 = setTimeout(scrollToBottom, 250);
                return () => {
                    clearTimeout(t1);
                    clearTimeout(t2);
                };
            });

            return () => cancelAnimationFrame(rafId);
        }
    }, [showInChatHistory, chatHistory]);

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
                        await updateChatPayload(activeId, {
                            essayContent: currentEssay,
                            versions: versions.map(v => String(v.id) === String(currentVersionId) ? { ...v, content: currentEssay } : v),
                            currentVersionId
                        });
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
                        await updateChatPayload(newBlankChat.id, {
                            essayContent: currentEssay,
                            versions: versions.map(v => String(v.id) === String(currentVersionId) ? { ...v, content: currentEssay } : v),
                            currentVersionId
                        });
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
        const newId = versions.length > 0 ? Math.max(...versions.map(v => v.id)) + 1 : 1;
        // User said: "Jika versi 2 kosong, display kosong".
        // We'll create it with empty content if the user wants to start fresh,
        // or copy current content? The user said "jika versi 2 kosong display kosong".
        // Let's make it start fresh (empty) to satisfy the "display kosong" requirement.
        const newVersion = { id: newId, content: '', title: `Version ${newId}` };
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
                    saveMessage(currentChatIdRef.current, 'assistant', markdownResponse, { ...result, detectedType }).catch(err => console.error("Save Msg Error:", err));
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

    // --- Discovery Mode Handlers ---
    const handleStartDiscovery = () => {
        setDiscoveryStep('upload');
        setChatHistory([]); // Clear chat for fresh discovery
    };

    const handleDiscoveryFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setDiscoveryFile(file);
        setDiscoveryStep('thinking');
        setDiscoveryLoadingStep('parsing');

        try {
            // 1. Text Extraction
            const text = await extractResumeText(file);
            
            // 2. AI Parsing (Semantic ATS Alignment)
            setDiscoveryLoadingStep('matching');
            const parsedData = await parseResumeWithAI(text);
            setDiscoveryData(parsedData);

            // 3. Planning & Loop Gap Analysis
            setDiscoveryLoadingStep('planning');
            // Give a bit of "magical" feel even if fast
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 4. Move to Interview
            setDiscoveryStep('interview');
            
            // Simplified Agentic Message focusing only on the 3-bullet question
            const systemQuestion = parsedData.suggested_bridge_question || "Ceritakan motivasi terbesar Anda di balik pencapaian ini.";

            const initialMsg = {
                role: 'assistant',
                content: `Halo ${parsedData.full_name?.split(' ')[0] || ''}! Saya sudah membedah resume Anda dan melihat potensi besar Anda sebagai **${parsedData.ai_identity}**.\n\nAgar draf esai ini memiliki "jiwa" yang kuat, mohon jawab poin-poin berikut:\n\n**${systemQuestion}**`,
                isDiscovery: true
            };
            setChatHistory([initialMsg]);
            if (!isChatOpen) setIsChatOpen(true);

        } catch (err) {
            console.error("Discovery Error:", err);
            alert(`Gagal memproses resume: ${err.message}`);
            setDiscoveryStep(null);
        }
    };

    const handleGenerateDiscoveryDraft = async (userNarrative) => {
        setDiscoveryStep('thinking');
        setDiscoveryLoadingStep('generating');

        try {
            const prompt = `
Berdasarkan data Resume, Riset Universitas, dan Wawancara berikut, buatlah draf esai beasiswa yang LENGKAP dan MANDIRI dalam bahasa yang sama dengan input user menggunakan **4-Phase Master Framework**.

TARGET PANJANG: Minimal 1000-1500 kata (sesuai standar LPDP). Jangan terpaku hanya pada 4 paragraf. Setiap fase dapat memiliki beberapa paragraf detail.

DATA RESUME & RISET:
${JSON.stringify(discoveryData, null, 2)}

JAWABAN NARASI USER (Termasuk Pilihan Jurusan/Visi):
${userNarrative}

INSTRUKSI AGENTIC (STRICT):
1. PRIORITASKAN NARASI USER: Ikuti secara ketat visi, jurusan, dan motivasi yang diberikan user dalam jawaban narasi mereka.
2. KURASI PORTFOLIO: Masukkan hanya pengalaman/skill dari resume yang RELEVAN dan MENDUKUNG visi user. SISISIHKAN atau jangan masukkan pengalaman yang tidak penting atau tidak nyambung dengan narasi baru user.
3. DETAIL NARRATIVE: Jabarkan setiap poin secara naratif dan emosional (Target minimal 1000-1500 kata).
4. STRUKTUR: Tetap gunakan 4-Phase Framework sebagai kerangka besar.

FORMAT ESASI (Gunakan Markdown):
- Phase 1: Hook & Background (Multiple Paragraphs)
- Phase 2: Track Record & Achievements (Multiple Paragraphs)
- Phase 3: Strategic Gap (Why this campus/major?)
- Phase 4: Vision & Impact (Long-term Contribution)

Berikan draf lengkap tanpa penjelasan tambahan.
            `;

            const draft = await sendChatMessage(prompt, [], "", null, "gpt-4o");
            
            // Apply to editor
            editor.commands.setContent(draft);
            setEssayContent(draft);
            
            // Initiation of Interactive Review (Adaptive)
            setDiscoveryStep(null); // Complete discovery UI
            
            const followUpMsg = {
                role: 'assistant',
                content: `Draf "Draf 0" Anda sudah siap di editor! ✨\n\nUntuk mendapatkan hasil 1500 kata yang sempurna, mari kita bedah dan perkuat paragraf demi paragraf. \n\n**Mari kita mulai dengan Paragraf Pertama (Hook):** Apakah pembukaan ini sudah cukup mewakili "Jiwa" dan keresahan terdalam Anda, atau ada momen spesifik lain yang ingin kita jadikan *Opening*?`,
                isDiscovery: false
            };
            
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Draf berhasil dibuat. Mari kita mulai proses review interaktif.' }, followUpMsg]);
            
            // Update title
            const newTitle = `Discovery: ${discoveryData.full_name || 'My Essay'}`;
            setEssayTitle(newTitle);
            
            if (user) {
                const newChat = await createChat(user.id, `Canvas: ${newTitle}`);
                setCurrentChatId(newChat.id);
                setSavedChats(prev => [newChat, ...prev]);
                await updateChatPayload(newChat.id, { essayContent: draft, discoveryData });
            }

        } catch (err) {
            console.error("Draft Generation Error:", err);
            alert("Gagal membuat draf. Silakan coba lagi.");
            setDiscoveryStep('interview');
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
            const quotaType = type === 'review' ? 'deep_review' : 'chat';
            const { allowed } = await checkUsageQuota(user.id, quotaType);
            if (!allowed) {
                setUpgradeFeature(quotaType === 'deep_review' ? 'Deep Review' : 'Chat Messages');
                setShowUpgradeModal(true);
                return;
            }
            incrementUsage(user.id, quotaType).catch(err => console.error("Increment failed", err));
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

        // Sort chats by recency (Newest first)
        const sortedChats = [...chats].sort((a, b) => {
            const dateA = new Date(a.created_at || Date.now());
            const dateB = new Date(b.created_at || Date.now());
            return dateB - dateA;
        });

        // Grouping order: Newest to Oldest
        const groups = [
            { label: 'Hari Ini', chats: [] },
            { label: 'Kemarin', chats: [] },
            { label: '7 Hari Terakhir', chats: [] },
            { label: 'Lebih Lama', chats: [] }
        ];

        sortedChats.forEach(chat => {
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

    // --- Polish & Grammar Actions ---
    const handlePerformAction = async (actionType) => {
        if (!editor || !selectionRange || isProcessingAction) return;

        const { from, to } = selectionRange;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');

        if (!selectedText.trim()) return;

        setIsProcessingAction(true);
        setIsFloatingMenuOpen(false);

        try {
            // Get parent paragraph context for logic awareness
            const { $from } = editor.state.selection;
            const parentParagraph = $from.parent.textContent;

            // Get global context (limited for speed, but covers the essence)
            const globalContext = preprocessContextForAI(editor.getHTML(), analysisResult);

            // Apply a temporary highlight color while processing
            editor.commands.setHighlight({ color: '#fef3c7' }); // Lighter yellow

            const prompt = actionType === 'polish'
                ? `You are an elite academic editor trained in "Awardee Logic" for top scholarships. 
                   
                   **STRICT GOAL**: Polish and professionalize the SELECTED TEXT to meet "Gold Standard" scholarship criteria (authentic, specific, and impactful).
                   
                   **LANGUAGE RULE**: Polish the text in its ORIGINAL LANGUAGE. If the input is Indonesian, the output MUST be Indonesian. If the input is English, the output MUST be English. NEVER TRANSLATE THE TEXT.
                   
                   **CONTEXTUAL RULES**:
                   1. Maintain the flow of the PARENT PARAGRAPH.
                   2. Ensure the tone aligns with the GLOBAL DOCUMENT CONTEXT provided below.
                   3. If the document is an "Awardee Sample" (${analysisResult?.detectedType === 'Awardee Sample' ? 'YES' : 'NO'}), maintain its winning sophistication.
                   
                   **FORMAT**: RETURN ONLY THE POLISHED VERSION OF THE SELECTED TEXT. NO PREAMBLE.
                   
                   GLOBAL DOCUMENT CONTEXT:
                   """
                   ${globalContext}
                   """
                   
                   PARENT PARAGRAPH CONTEXT: "${parentParagraph}"
                   
                   SELECTED TEXT TO POLISH: "${selectedText}"`
                : `You are an expert grammarian and translator. Analyze the SELECTED TEXT below.
                   
                   1. If it's Indonesian, provide a grammar-corrected Indonesian version AND an academic English translation.
                   2. If it's English, provide ONLY a grammar-corrected English version.
                   
                   Return your response strictly as a JSON object with this format:
                   {
                     "correction": "the grammar corrected text",
                     "englishTranslate": "the english translation (only if original was Indonesian, otherwise null)",
                     "status": "suggested" or "correct" (if no changes were needed in original language)
                   }
                   
                   Ensure the academic level is "Scholarship Standard".
                   
                   PARENT PARAGRAPH CONTEXT: "${parentParagraph}"
                   SELECTED TEXT TO CHECK: "${selectedText}"`;


            // Force high-quality model (GPT-4o) for linguistic tasks when 'auto' is selected
            const modelToUse = (selectedModel === 'auto' || !selectedModel) ? 'gpt-4o' : selectedModel;

            // Use the existing sendChatMessage
            const response = await sendChatMessage(prompt, [], "", modelToUse);

            const aiResult = typeof response === 'string' ? response : (response.result || response.content);

            let aiData = { correction: aiResult, englishTranslate: null, status: 'suggested' };

            if (actionType === 'grammar') {
                try {
                    // Try to extract JSON from the response
                    const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        aiData = JSON.parse(jsonMatch[0]);
                    } else if (aiResult.includes("No grammar errors found")) {
                        aiData = { correction: selectedText, englishTranslate: null, status: 'correct' };
                    }
                } catch (e) {
                    console.warn("Could not parse AI JSON response, falling back to plain text.");
                }
            }

            const isCorrect = aiData.status === 'correct';

            const newComment = {
                id: Date.now(),
                original: selectedText,
                suggestion: aiData.correction || aiResult,
                englishTranslate: aiData.englishTranslate,
                type: actionType,
                status: isCorrect ? 'correct' : 'suggested',
                from,
                to,
                topOffset: menuPosition.top, // Store current selection offset
                createdAt: new Date().toISOString()
            };

            setComments(prev => [...prev, newComment]);

            // Clear the temporary highlight for the specific range
            editor.commands.unsetHighlight({ from, to });

        } catch (err) {
            console.error(`Action ${actionType} failed:`, err);
            editor.commands.unsetHighlight();
        } finally {
            setIsProcessingAction(false);
        }
    };

    // Helper to render text with internal underlines for changed words
    const renderDiffText = (original, suggestion) => {
        if (!original || !suggestion) return suggestion;

        const origWords = original.split(/\s+/);
        const suggWords = suggestion.split(/\s+/);

        return suggWords.map((word, i) => {
            // Very simple diff: if word at same index is different, underline it
            // or if it's beyond the original length
            const cleanWord = (w) => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            const isDifferent = i >= origWords.length || cleanWord(word) !== cleanWord(origWords[i]);

            return (
                <React.Fragment key={i}>
                    <span className={isDifferent ? "border-b-2 border-blue-500 pb-0.5" : ""}>
                        {word}
                    </span>
                    {i < suggWords.length - 1 ? ' ' : ''}
                </React.Fragment>
            );
        });
    };

    const handleApplySuggestion = (commentId, customValue = null) => {
        const comment = comments.find(c => c.id === commentId);
        if (!comment || !editor) return;

        const textToInsert = customValue || comment.suggestion;

        // NUCLEAR CLEANUP: We search for the exact text and markers to clear highlights
        // This is more robust than fixed indices
        editor.chain()
            .focus()
            .setTextSelection({ from: Math.max(0, comment.from - 5), to: Math.min(editor.state.doc.content.size, comment.to + 5) })
            .unsetHighlight()
            .setTextSelection({ from: comment.from, to: comment.to })
            .insertContent(textToInsert)
            .unsetHighlight() // Failsafe cleanup
            .run();

        // Remove the comment after applying
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    const handleDismissComment = (commentId) => {
        const comment = comments.find(c => c.id === commentId);
        if (editor && comment) {
            // Aggressive failsafe cleanup for the range
            editor.chain()
                .focus()
                .setTextSelection({ from: Math.max(0, comment.from - 10), to: Math.min(editor.state.doc.content.size, comment.to + 10) })
                .unsetHighlight()
                .setTextSelection(comment.from)
                .run();
        }
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    // Helper to strip HTML and index paragraphs for better AI context awareness
    const preprocessContextForAI = (htmlContent, analysisData = null) => {
        if (!htmlContent) return '(Draft Empty)';

        // 1. Convert <p>, <h1>, etc into distinct sections
        // We replace closing tags with double newlines to maintain structure
        let text = htmlContent
            .replace(/<\/p>/g, '\n\n')
            .replace(/<\/h[1-6]>/g, '\n\n')
            .replace(/<br\s*\/?>/g, '\n');

        // 2. Strip all remaining HTML tags
        text = text.replace(/<[^>]*>?/gm, '');

        // 3. Split into paragraphs and index them
        const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

        // 4. Map functional labels from analysisData if available
        const paragraphBreakdown = analysisData?.paragraphBreakdown || [];

        return paragraphs.map((p, i) => {
            const label = paragraphBreakdown[i]?.functional_label || paragraphBreakdown[i]?.section_label || 'Text';
            const subtitle = paragraphBreakdown[i]?.detected_subtitle ? ` (${paragraphBreakdown[i].detected_subtitle})` : '';
            // TOKEN SAVER: Use shorter headers
            return `[P${i + 1} - ${label}${subtitle}]\n${p}`;
        }).join('\n\n');
    };

    const handleChatSubmit = async (overrideMessage = null, historyOverride = null) => {
        // Auth Check
        if (onRequireAuth && onRequireAuth()) return;

        let activeChatId = currentChatId;
        let inputToUse = typeof overrideMessage === 'string' ? overrideMessage : chatInput;

        // Command Intercept: Detect manual "Review" or "Comparison"
        const cleanInput = inputToUse.trim().toLowerCase();
        const isComparisonRequest =
            cleanInput.includes('compare') ||
            cleanInput.includes('bandingkan') ||
            cleanInput.includes('komparasi') ||
            cleanInput.includes('versi') ||
            cleanInput.includes('lebih baik');

        if (cleanInput === 'review' || cleanInput === 'reviu') {
            inputToUse = "Gunakan Master Framework untuk review esai saya ini secara mendalam dan berikan saran strategis.";
        }

        // 1. NUCLEAR FIX: Capture context directly from Tiptap instance (source of truth)
        let currentEssay = '';
        if (editor) {
            const html = editor.getHTML();
            // Detect all variants of empty paragraph
            const isEmpty = !html || html === '<p></p>' || html === '<p><br></p>' || html === '<p> </p>';
            currentEssay = isEmpty ? '' : html;
        } else {
            currentEssay = essayContent; // Fallback to state
        }

        try {
            if (discoveryStep === 'interview') {
                const userMsg = { role: 'user', content: inputToUse.trim() };
                setChatHistory(prev => [...prev, userMsg]);
                setChatInput('');
                handleGenerateDiscoveryDraft(inputToUse.trim());
                return;
            }

            if ((!inputToUse.trim() && !currentEssay.trim() && !fileContext) || isAnalyzing) return;

        // CHECK QUOTA: Deep Review vs Chat
        if (user) {
            const isReviewAction = cleanInput.includes('review') || cleanInput.includes('reviu') || cleanInput.includes('evaluasi') || cleanInput.includes('periksa');
            const quotaType = isReviewAction ? 'deep_review' : 'chat';
            
            const { allowed } = await checkUsageQuota(user.id, quotaType);
            if (!allowed) {
                setUpgradeFeature(quotaType === 'deep_review' ? 'Deep Review' : 'Chat Messages');
                setShowUpgradeModal(true);
                return;
            }
            incrementUsage(user.id, quotaType).catch(err => console.error("Increment failed", err));
        }

        const baseUserMessage = inputToUse.trim() || "Analyze this essay";

        // 2. FORCED ATTENTION: If user asks for a review, inject a reminder and context into the user prompt itself
        let augmentedUserMessage = baseUserMessage;
        if (cleanInput.includes('review') || cleanInput.includes('reviu') || cleanInput.includes('periksa') || cleanInput.includes('evaluasi')) {
            augmentedUserMessage = `[CRITICAL ACTION: DEEP REVIEW REQUESTED]\n\nUSER QUESTION: ${baseUserMessage}\n\n(Please analyze the Document Content provided in the system context below with maximum rigor.)`;
        }

        // Paragraph Focus Detection: Detect if user is asking about a specific paragraph number
        const paraMatch = cleanInput.match(/paragraf\s*(\d+)/i) || cleanInput.match(/paragraph\s*(\d+)/i);
        let focusTag = "";
        let focusedContext = null;

        if (paraMatch && editor) {
            const paraNum = parseInt(paraMatch[1], 10);
            // Extract the actual text from Tiptap doc
            // Tiptap paragraphs are usually top-level nodes
            const json = editor.getJSON();
            const paragraphs = json.content?.filter(node => node.type === 'paragraph') || [];
            
            if (paragraphs[paraNum - 1]) {
                // Crude but effective text extraction from Tiptap node
                const extractText = (node) => {
                    if (node.text) return node.text;
                    if (node.content) return node.content.map(extractText).join('');
                    return '';
                };
                const targetText = extractText(paragraphs[paraNum - 1]);
                
                if (targetText.trim()) {
                    focusTag = `\n\n[MANDATORY FOCUS: TARGET PARAGRAPH TEXT]\nParagraph ${paraNum}: "${targetText}"\n\nCRITICAL: You MUST analyze and address the specific text above. Do not ignore it for general framework advice.`;
                    focusedContext = { type: 'paragraph', number: paraNum, text: targetText };
                } else {
                    focusTag = `\n[FOCUS PARAGRAPH: ${paraNum}]\nUser is specifically asking about Paragraph ${paraNum}. Please prioritize this block while maintaining overall flow.`;
                }
            } else {
                focusTag = `\n[FOCUS PARAGRAPH: ${paraNum}]\nUser is specifically asking about Paragraph ${paraNum}. Please prioritize this block while maintaining overall flow.`;
            }
        }

        const userMessage = isResearchMode
            ? `[RESEARCH MODE ACTIVATE]\nPlease act as an objective research assistant. Search for external data to provide a comprehensive answer to the following query. IMPORTANT: Do not assume this is localized to Indonesia or any specific country unless explicitly stated in the query. Provide global answers.\n\nUSER PROMPT:\n${augmentedUserMessage}${focusTag}`
            : `${augmentedUserMessage}${focusTag}`;

        // TOKEN SAVER: Version Trimming
        // If not a comparison request, only send the current draft.
        // If comparison, limit to top 3 recent versions inclusive of current.
        const filteredVersions = isComparisonRequest 
            ? versions.slice(-3) 
            : versions.filter(v => String(v.id) === String(currentVersionId));

        let versionsContext = filteredVersions.map(v => {
            const contentToUse = String(v.id) === String(currentVersionId) ? currentEssay : v.content;
            const isCurrent = String(v.id) === String(currentVersionId);
            return `### [${v.title}]\n${preprocessContextForAI(contentToUse, isCurrent ? analysisResult : null)}`;
        }).join('\n\n---\n\n');

        if (!versionsContext.trim() && currentEssay.trim()) {
            versionsContext = `### [Current Draft]\n${preprocessContextForAI(currentEssay, analysisResult)}`;
        }

        // 3. SMART COMPARISON & IDEA DEVELOPMENT: When user asks to compare/better, inject specific logic requirements
        const interactivityInstructions = `
[PROACTIVE GUIDANCE: ALWAYS MAINTAIN INTERACTION]
1. Setiap kali Anda selesai memberikan saran atau revisi, Anda WAJIB menutup respon dengan pertanyaan lanjutan yang strategis untuk menjaga momentum.
2. Contoh: "Apakah Anda ingin memperhalus kalimat terakhir ini lagi agar lebih emosional, atau kita lanjut ke paragraf berikutnya?"
3. Jadilah konsultan proaktif: Jangan biarkan diskusi berhenti begitu saja. Selalu tawarkan langkah konkret selanjutnya.
`;

        let customInstructions = interactivityInstructions;
        if (isComparisonRequest) {
            customInstructions += `
[SPECIAL INSTRUCTION: VERSION COMPARISON & IDEA DEVELOPMENT]
User is asking for a comparison or seeking the "better" version.
1. COMPARE all provided versions (### [Version Title]) objectively based on ScholarGo Master Framework.
2. IDENTIFY "Floating Ideas" (Ide Mengambang): Sections that are too vague, generic, or lack concrete evidence.
3. PROVIDE "Idea Development" (Pengembangan Ide): Specific, proactive suggestions to expand on vague points to reach "Gold Standard" specificity.
4. FORMAT: Use clear headers:
   ## COMPARISON OF VERSIONS
   ## IDEA DEVELOPMENT (POTENTIAL UPGRADES)
   (Ensure you use Indonesian if the user/document is in Indonesian).
`;
        }

        const docMetadata = fileName ? `[Filename: ${fileName}]\n` : '';
        const context = fileContext
            ? `${docMetadata}[Attached Document Content]\n${fileContext}\n\n${customInstructions}\n\n${versionsContext}`
            : `${docMetadata}${customInstructions}\n\n${versionsContext}`;
        console.log("Context sent to AI:", context);

        // Add User Message (Display the original short message in UI, not the huge prompt)
        const displayMessage = { 
            role: 'user', 
            content: baseUserMessage,
            focusedContext // Attach the context for the UI to display as a "Card"
        };
        let finalUserMessage = displayMessage;

        // 2. SAVE USER MESSAGE EARLY if session exists
        if (activeChatId) {
            try {
                const saved = await saveMessage(activeChatId, 'user', baseUserMessage);
                if (saved) finalUserMessage = saved;
            } catch (err) {
                console.error("Save Msg Error:", err);
            }
        }

        setChatHistory(prev => [...prev, finalUserMessage]);
        setChatInput('');
        setIsAnalyzing(true);
        if (!isChatOpen) setIsChatOpen(true);

        // 1. LAZY CREATE CHAT SESSION
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
            // saveMessage(activeChatId, 'user', baseUserMessage).catch(err => console.error("Save Msg Error:", err));
            // ^ Moved up to get ID/timestamp

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
            // CRITICAL: Save the actual essay content and versions, NOT the AI context string
            updateChatPayload(activeChatId, {
                essayContent: currentEssay,
                versions: versions.map(v => String(v.id) === String(currentVersionId) ? { ...v, content: currentEssay } : v),
                currentVersionId
            }).catch(err => console.error("Payload Save Error:", err));
        }

        // Create AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // 5. LONG MEMORY: Inject Summary if exists
        const memoryContext = chatSummary ? `\n[CONVERSATION SUMMARY (PAST MEMORY)]: ${chatSummary}\n` : "";
        const historyToUseRaw = historyOverride || chatHistory;
        
        // 6. TOKEN SAVER: Limit visible history to 10 mesages if we have a summary
        const historyToUse = chatSummary 
            ? historyToUseRaw.slice(-10) 
            : historyToUseRaw;

            // Push an initial empty assistant message to chatHistory for streaming
            const tempAiId = Date.now() + "-ai";
            const initialAiMessage = { role: 'assistant', content: '', id: tempAiId, streaming: true };
            setChatHistory(prev => [...prev, initialAiMessage]);

            let accumulatedText = "";

            const aiResponse = await sendChatMessage(
                userMessage,
                historyToUse.map(m => ({ role: m.role, content: m.content })),
                `${memoryContext}${context}`,
                selectedModel,
                controller.signal,
                (chunkText) => {
                    accumulatedText = chunkText;
                    setChatHistory(prev => prev.map(msg => 
                        msg.id === tempAiId ? { ...msg, content: chunkText } : msg
                    ));
                }
            );

            if (activeChatId) {
                const savedAi = await saveMessage(activeChatId, 'assistant', aiResponse);
                setChatHistory(prev => prev.map(msg => 
                    msg.id === tempAiId ? { ...savedAi, streaming: false } : msg
                ));
            } else {
                setChatHistory(prev => prev.map(msg => 
                    msg.id === tempAiId ? { ...msg, content: aiResponse, streaming: false } : msg
                ));
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

        // 7. BACKGROUND SUMMARIZATION: If history is long
        if (activeChatId && historyToUseRaw.length > 10) {
            // Async background task
            summarizeChatHistory(historyToUseRaw, selectedModel).then(newSummary => {
                if (newSummary) {
                    setChatSummary(newSummary);
                    updateChatPayload(activeChatId, { chatSummary: newSummary }).catch(console.error);
                }
            }).catch(err => console.log("Summarization Background Err:", err));
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

    // --- Message Editing Handlers ---
    const handleEditMessage = (index) => {
        setEditingMessageIndex(index);
        setEditingMessageText(chatHistory[index].content);
    };

    const handleCancelEdit = () => {
        setEditingMessageIndex(null);
        setEditingMessageText("");
    };

    const handleSaveEdit = async (index, newText) => {
        if (!newText.trim()) return;

        const targetMessage = chatHistory[index];

        // 1. Truncate database if session active
        if (currentChatId && targetMessage.created_at) {
            try {
                await deleteMessagesAfter(currentChatId, targetMessage.created_at);
            } catch (err) {
                console.error("Failed to truncate DB history:", err);
            }
        }

        // 2. Truncate history after the edited message in UI
        const newHistory = chatHistory.slice(0, index);
        setChatHistory(newHistory);
        setEditingMessageIndex(null);
        setEditingMessageText("");

        // 3. Trigger new submit with the updated text and TRUNCATED history
        handleChatSubmit(newText, newHistory);
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
        console.log(`[Canvas] Uploading file: ${file.name}, type: ${detectedType}`);

        const safetyTimer = setTimeout(() => {
            if (isFileParsing) {
                console.warn(`[Canvas] Safety timeout reached! Forcing loading state off.`);
                cleanup();
            }
        }, 60000);

        const cleanup = () => {
            clearTimeout(safetyTimer);
            setIsFileParsing(false);
        };

        if (detectedType === "text/plain" || lowerName.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFileContext(event.target.result);
                cleanup();
            };
            reader.onerror = () => cleanup();
            reader.readAsText(file);
        }
        else if (detectedType === "application/pdf" || detectedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || lowerName.endsWith(".docx") || lowerName.endsWith(".pdf")) {
            extractTextFromFile(file)
                .then(text => {
                    setFileContext(text);
                    console.log(`[Canvas] Extraction success. Text length: ${text?.length || 0}`);
                })
                .catch(err => {
                    console.error("[Canvas] Extraction error:", err);
                    alert(`Gagal mengekstrak teks: ${err.message || 'Error tidak dikenal'}`);
                })
                .finally(() => {
                    cleanup();
                });
        }
        else {
            cleanup();
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
                await updateChatPayload(activeChatId, {
                    essayContent: essayContent,
                    versions: versions.map(v => String(v.id) === String(currentVersionId) ? { ...v, content: essayContent } : v),
                    currentVersionId
                });

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
                updateChatPayload(previousChatId, {
                    essayContent: previousEssay,
                    versions: versions.map(v => String(v.id) === String(currentVersionId) ? { ...v, content: previousEssay } : v),
                    currentVersionId,
                    chatSummary
                }).catch(err => console.error(err));
                setSavedChats(prev => prev.map(c => c.id === previousChatId ? {
                    ...c,
                    payload: { ...(c.payload || {}), essayContent: previousEssay }
                } : c));
            }

            // 5. Instantly transition UI visually AFTER network is secured
            setChatHistory([]);
            setChatSummary("");
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
                const payloadToSave = {
                    essayContent: activeEssay,
                    versions: versions.map(v => String(v.id) === String(currentVersionId) ? { ...v, content: activeEssay } : v),
                    currentVersionId,
                    chatSummary
                };
                updateChatPayload(currentChatId, payloadToSave).catch(console.error);
                setSavedChats(prev => prev.map(c => c.id === currentChatId ? {
                    ...c,
                    payload: payloadToSave
                } : c));
            }

            // 1. Get Target Session Data (from local list)
            const session = savedChats.find(c => c.id === chatId);
            if (!session) return;

            setCurrentChatId(chatId);
            setEssayTitle(session.title.replace("Canvas: ", ""));
            
            // Restore context summary if it exists
            if (session.payload && session.payload.chatSummary) {
                setChatSummary(session.payload.chatSummary);
            } else {
                setChatSummary("");
            }

            // 2. Restore Target Essay Content and Versions from Payload
            if (session.payload && session.payload.versions && Array.isArray(session.payload.versions)) {
                // RESTORE VERSIONS
                setVersions(session.payload.versions);
                // Ensure restored ID is cast correctly if it's a number-like string
                const restoredVersionIdRaw = session.payload.currentVersionId || 1;
                const restoredVersionId = isNaN(Number(restoredVersionIdRaw)) ? restoredVersionIdRaw : Number(restoredVersionIdRaw);
                setCurrentVersionId(restoredVersionId);

                // Find content of that active version
                const activeVer = session.payload.versions.find(v => String(v.id) === String(restoredVersionId)) || session.payload.versions[0];
                const contentToSet = activeVer.content || '';
                setEssayContent(contentToSet);
                if (editor) {
                    editor.commands.setContent(contentToSet);
                }
            } else if (session.payload && typeof session.payload.essayContent === 'string') {
                // FALLBACK: Older chats without multiple versions
                setEssayContent(session.payload.essayContent);
                setVersions([{ id: 1, content: session.payload.essayContent, title: 'Version 1' }]);
                setCurrentVersionId(1);
                if (editor) {
                    editor.commands.setContent(session.payload.essayContent);
                }
            } else {
                // If it's explicitly broken
                setEssayContent('');
                setVersions([{ id: 1, content: '', title: 'Version 1' }]);
                setCurrentVersionId(1);
                if (editor) {
                    editor.commands.setContent('');
                }
            }

            // 3. Load Messages
            const messages = await getChatMessages(chatId);
            setChatHistory(messages); // Store full objects (role, content, payload, created_at, etc)

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
    const wordCount = essayContent.replace(/<[^>]*>?/gm, ' ').trim().split(/\s+/).filter(Boolean).length;
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 250));

    // --- Export Handlers ---
    const handleExportPDF = () => {
        const doc = new jsPDF({
            format: 'a4',
            unit: 'mm'
        });
        
        // Simple extraction of text
        const content = editor?.getText() || essayContent.replace(/<[^>]*>?/gm, '');
        const lines = doc.splitTextToSize(content, 170); // 170mm width for A4
        
        // Map font family for jspdf
        let pdfFont = "times";
        if (activeFont === 'arial') pdfFont = "helvetica";
        
        doc.setFont(pdfFont, "normal");
        doc.setFontSize(baseFontSize); // Uses the pt value directly
        doc.text(lines, 20, 20); // 20mm margin
        
        const fileNameToUse = (essayTitle || 'ScholarGo_Essay').replace(/\s+/g, '_');
        doc.save(`${fileNameToUse}.pdf`);
        setIsSettingsOpen(false);
    };

    const handleExportWord = () => {
        const content = editor?.getHTML() || essayContent;
        
        // Map font family for Word
        const fontMap = {
            'times': "'Times New Roman', serif",
            'poppins': "'Poppins', sans-serif",
            'arial': 'Arial, sans-serif'
        };
        const activeFontFamily = fontMap[activeFont] || fontMap['times'];

        // Simple HTML to Word blob approach with styles
        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Export Word</title>
                <style>
                    body { 
                        font-family: ${activeFontFamily}; 
                        font-size: ${baseFontSize}pt; 
                        line-height: 1.5;
                    }
                </style>
            </head>
            <body>`;
        const footer = "</body></html>";
        const sourceHTML = header + content + footer;
        
        const blob = new Blob(['\ufeff', sourceHTML], {
            type: 'application/msword'
        });
        
        const fileNameToUse = (essayTitle || 'ScholarGo_Essay').replace(/\s+/g, '_');
        saveAs(blob, `${fileNameToUse}.doc`);
        setIsSettingsOpen(false);
    };

    const getFontStyles = () => {
        if (activeFont === 'times') return 'font-serif';
        if (activeFont === 'poppins') return 'font-sans'; // Assuming font-sans is Poppins via tailwind
        if (activeFont === 'arial') return 'font-sans italic'; // or just use inline style below
        return 'font-serif';
    };

    const handleFontSizeChange = (increase = true) => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        const currentSizeFromMark = editor.getAttributes('fontSize').size;
        const currentEffectiveSize = currentSizeFromMark ? parseInt(currentSizeFromMark) : baseFontSize;
        
        const newSize = increase ? currentEffectiveSize + 1 : Math.max(8, currentEffectiveSize - 1);

        if (hasSelection) {
            // Selective: Only apply to highlighted text
            editor.commands.setFontSize(newSize);
        } else {
            // Global: Update base size for the whole doc
            setBaseFontSize(newSize);
            // Also update any existing fontSize marks to match if user wants global change
            // (Optional: usually global change shouldn't override specific manual overrides, 
            // but for simple UX we just update the base container style)
        }
    };

    const handleFontFamilyChange = (newFamily) => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (hasSelection) {
            editor.commands.setFontFamily(newFamily);
        } else {
            setActiveFont(newFamily);
        }
        setIsFontDropdownOpen(false);
    };

    // Helper to get current active font/size for UI display
    const getCurrentUISize = () => {
        if (!editor) return baseFontSize;
        const markSize = editor.getAttributes('fontSize').size;
        return markSize ? parseInt(markSize) : baseFontSize;
    };

    const getCurrentUIFont = () => {
        if (!editor) return activeFont;
        const markFont = editor.getAttributes('fontFamily').family;
        return markFont || activeFont;
    };

    const getInlineFontStyle = () => {
        // We use pt for font size to align with Word/PDF, 
        // but it will automatically be handled by the browser correctly
        const style = { fontSize: `${baseFontSize}pt` };
        if (activeFont === 'times') return { ...style, fontFamily: '"Times New Roman", Times, serif' };
        if (activeFont === 'poppins') return { ...style, fontFamily: '"Poppins", sans-serif' };
        if (activeFont === 'arial') return { ...style, fontFamily: 'Arial, Helvetica, sans-serif' };
        return style;
    };

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

                        {/* Settings Gear Dropdown */}
                        <div className="relative ml-1" ref={settingsMenuRef}>
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={`p-1.5 rounded transition-colors ${isSettingsOpen ? 'text-oxford-blue bg-gray-100' : 'text-gray-400 hover:text-oxford-blue hover:bg-gray-100'}`}
                                title="Settings & Extract"
                            >
                                <Settings size={18} />
                            </button>

                            {isSettingsOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 shadow-2xl rounded-xl py-4 z-50 animate-fadeIn overflow-visible">
                                    <div className="px-5 pb-3">
                                        <h3 className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-widest mb-4">Typography</h3>
                                        
                                        {/* Base Font Size */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-oxford-blue/70">Base font size</span>
                                                <span className="text-[10px] text-oxford-blue/30 -mt-1">Standard 12pt</span>
                                            </div>
                                            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg overflow-hidden h-9">
                                                <button 
                                                    onClick={() => handleFontSizeChange(false)}
                                                    className="w-9 h-full flex items-center justify-center hover:bg-gray-100 transition-colors text-oxford-blue/40 hover:text-oxford-blue"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <div className="w-12 h-full flex items-center justify-center text-sm font-semibold border-x border-gray-100 text-oxford-blue">
                                                    {getCurrentUISize()}<span className="text-[10px] ml-0.5 font-normal text-oxford-blue/40">pt</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleFontSizeChange(true)}
                                                    className="w-9 h-full flex items-center justify-center hover:bg-gray-100 transition-colors text-oxford-blue/40 hover:text-oxford-blue"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Font Family Dropdown */}
                                        <div className="flex items-center justify-between relative" ref={fontDropdownRef}>
                                            <span className="text-sm text-oxford-blue/70">Font family</span>
                                            <button 
                                                onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-oxford-blue hover:bg-gray-100 transition-colors"
                                            >
                                                <span className="capitalize">{getCurrentUIFont()}</span>
                                                <ChevronDown size={14} className={`transition-transform duration-200 ${isFontDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isFontDropdownOpen && (
                                                <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-[60] animate-fadeIn">
                                                    <div className="py-1">
                                                        {[
                                                            { id: 'times', label: 'Times New Roman', desc: 'Serif (Academic Standard)' },
                                                            { id: 'poppins', label: 'Poppins', desc: 'Sans-serif (Modern)' },
                                                            { id: 'arial', label: 'Arial', desc: 'Sans-serif (Universal)' }
                                                        ].map((font) => (
                                                            <button
                                                                key={font.id}
                                                                onClick={() => handleFontFamilyChange(font.id)}
                                                                className={`w-full flex flex-col items-start px-4 py-2 hover:bg-blue-50/50 transition-colors ${getCurrentUIFont() === font.id ? 'bg-blue-50/30' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between w-full">
                                                                    <span className={`text-sm ${font.id === 'times' ? 'font-serif' : 'font-sans'} text-oxford-blue`}>{font.label}</span>
                                                                    {getCurrentUIFont() === font.id && <Check size={14} className="text-blue-600" />}
                                                                </div>
                                                                <span className="text-[10px] text-oxford-blue/30 leading-none mt-0.5">{font.desc}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-50 my-2"></div>

                                    <div className="px-5 pt-2">
                                        <h3 className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-widest mb-3">File export</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={handleExportPDF}
                                                className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-red-50/50 border border-gray-100 rounded-xl transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="text-[10px] font-bold text-oxford-blue/60 group-hover:text-oxford-blue">PDF</span>
                                            </button>
                                            <button
                                                onClick={handleExportWord}
                                                className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-blue-50/50 border border-gray-100 rounded-xl transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="text-[10px] font-bold text-oxford-blue/60 group-hover:text-oxford-blue">Word</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

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


                    </div>

                    <div className="relative flex justify-center w-full">
                        <div
                            onClick={() => editor?.commands.focus()}
                            className={`w-full max-w-[816px] bg-white min-h-[1056px] shadow-sm border border-gray-200 mt-2 mb-12 px-12 py-10 relative flex-shrink-0 cursor-text ${getFontStyles()}`}
                            style={{ ...getInlineFontStyle() }}
                        >

                            {/* TIPTAP EDITOR LAYER - Anchoring Discovery Mode to paper div (line 2386) */}
                            <div className="z-10 custom-tiptap-editor w-full h-auto">
                                {!essayContent && !discoveryStep && (
                                    <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center pt-32 bg-white z-20 animate-fadeIn overflow-hidden">
                                        <div className="text-center space-y-8 max-w-sm px-6">
                                            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-[2.5rem] relative mb-4">
                                                <Sparkle size={48} className="text-blue-600 animate-pulse" />
                                                <Plus size={20} className="absolute top-4 right-4 text-blue-400" />
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-3xl font-serif font-bold text-oxford-blue tracking-tight">Mulai Esai dari 0?</h3>
                                                <p className="text-base text-oxford-blue/60 leading-relaxed">
                                                    Biarkan Agen AI kami membedah Resume Anda dan menenun draf pertama yang memukau.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleStartDiscovery}
                                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-serif text-xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                                            >
                                                <Zap size={22} className="text-white fill-white group-hover:animate-pulse" />
                                                Gunakan Agentic Mode
                                            </button>
                                            <p className="text-xs text-oxford-blue/40 font-medium italic">
                                                Cukup upload Resume, jawab 1 pertanyaan, dan draf esai siap.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {discoveryStep === 'upload' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white z-20 animate-fadeIn">
                                        <div className="text-center space-y-6 max-w-sm w-full px-6">
                                            <div className="relative group border-2 border-dashed border-gray-200 rounded-3xl p-12 hover:border-bronze/50 hover:bg-bronze/5 transition-all cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.docx,.txt"
                                                    onChange={handleDiscoveryFileUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-bronze transition-colors">
                                                        <FileText size={28} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-oxford-blue">Unggah Resume / CV</p>
                                                        <p className="text-xs text-oxford-blue/40">PDF, DOCX, atau TXT (Max 10MB)</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setDiscoveryStep(null)}
                                                className="text-xs text-oxford-blue/40 hover:text-oxford-blue font-medium transition-colors"
                                            >
                                                Batal, saya ingin tulis manual
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {discoveryStep === 'thinking' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white z-30 animate-fadeIn">
                                        <DiscoveryThinkingState step={discoveryLoadingStep} />
                                    </div>
                                )}

                                <EditorContent editor={editor} className="outline-none" />
                            </div>

                            {/* Floating Selection Menu (Vertical Icons) - Positioned in the right margin */}
                            {isFloatingMenuOpen && editor && (
                                <div
                                    className="absolute z-50 flex flex-col gap-1 p-1 bg-white border border-gray-200 shadow-xl rounded-xl transition-all duration-200 ease-out animate-in fade-in zoom-in-95 overflow-hidden"
                                    style={{
                                        top: `${menuPosition.top}px`,
                                        right: isChatOpen ? '-30px' : '-65px', // Shift closer if chat is open
                                        transform: 'translateY(-50%)'
                                    }}
                                >
                                    <button
                                        onClick={() => handlePerformAction('polish')}
                                        disabled={isProcessingAction}
                                        className={`p-2.5 transition-colors group relative rounded-lg ${isProcessingAction ? 'opacity-50 cursor-not-allowed bg-blue-50 text-blue-600' : 'text-oxford-blue/40 hover:text-blue-600 hover:bg-blue-50'}`}
                                        title="Polish Content"
                                    >
                                        {isProcessingAction ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                        <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-[60]">Polish</span>
                                    </button>
                                    <div className="h-px bg-gray-100 mx-2"></div>
                                    <button
                                        onClick={() => handlePerformAction('grammar')}
                                        disabled={isProcessingAction}
                                        className={`p-2.5 transition-colors group relative rounded-lg ${isProcessingAction ? 'opacity-50 cursor-not-allowed bg-blue-50 text-blue-600' : 'text-oxford-blue/40 hover:text-blue-600 hover:bg-blue-50'}`}
                                        title="Grammar Check"
                                    >
                                        {isProcessingAction ? <Loader size={18} className="animate-spin" /> : <Languages size={18} />}
                                        <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-[60]">Grammar</span>
                                    </button>
                                </div>
                            )}

                            {/* Comments Side Panel - Individual Absolute Positioning */}
                            {comments.length > 0 && (
                                <div
                                    className="absolute top-0 w-80 pointer-events-none transition-all duration-300 h-full"
                                    style={{
                                        right: isChatOpen ? '-320px' : '-380px', // Shift left when chat is open
                                        zIndex: 40
                                    }}
                                >
                                    {comments.map(comment => (
                                        <div
                                            key={comment.id}
                                            className="absolute w-full p-5 bg-white border border-gray-100 shadow-xl rounded-2xl transition-all hover:shadow-2xl animate-slideInRight pointer-events-auto"
                                            style={{
                                                top: `${comment.topOffset}px`,
                                                transform: 'translateY(-50%)' // Center card on the selection line
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {comment.status === 'correct' ? (
                                                        <CheckCircle2 size={14} className="text-green-500" />
                                                    ) : (
                                                        comment.type === 'polish' ? <Sparkles size={14} className="text-blue-500" /> : <Languages size={14} className="text-blue-500" />
                                                    )}
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                        {comment.status === 'correct' ? 'Perfect' : `AI ${comment.type === 'polish' ? 'Polish' : 'Grammar'}`}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDismissComment(comment.id)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            <p className="text-[10px] text-gray-400 italic mb-3 line-clamp-1 opacity-60">Selection: "{comment.original}"</p>

                                            {/* Scrollable Suggestion Area */}
                                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar-mini px-1 mb-4">
                                                {/* Correction Block */}
                                                <div className={`p-4 bg-white border rounded-2xl shadow-inner-sm transition-all ${comment.status === 'correct' ? 'border-green-100 bg-green-50/10' : 'border-blue-100'}`}>
                                                    {comment.status !== 'correct' && (
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">Suggestion</p>
                                                    )}
                                                    <p className="text-sm text-oxford-blue leading-relaxed font-medium">
                                                        {comment.status === 'correct' ? (
                                                            <span className="text-green-600">Excellent! No improvements needed.</span>
                                                        ) : (
                                                            renderDiffText(comment.original, comment.suggestion)
                                                        )}
                                                    </p>
                                                </div>

                                                {/* English Translation Block */}
                                                {comment.englishTranslate && (
                                                    <div className="mt-3 p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl shadow-inner-sm animate-fadeIn">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500/60 mb-2">English Translation</p>
                                                        <p className="text-sm text-oxford-blue leading-relaxed font-medium italic">
                                                            {comment.englishTranslate}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    {(comment.status === 'correct' && !comment.englishTranslate) ? (
                                                        <button
                                                            onClick={() => handleDismissComment(comment.id)}
                                                            className="flex-1 py-2.5 px-4 rounded-full text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition-all shadow-md shadow-green-100"
                                                        >
                                                            Awesome
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleDismissComment(comment.id)}
                                                                className="py-2.5 px-6 rounded-full text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all border border-transparent whitespace-nowrap"
                                                            >
                                                                Ok
                                                            </button>
                                                            <button
                                                                onClick={() => handleApplySuggestion(comment.id)}
                                                                className="flex-1 py-2.5 px-4 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                                                            >
                                                                {comment.status === 'correct' ? 'Keep Original' : 'Replace'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                {comment.englishTranslate && (
                                                    <button
                                                        onClick={() => handleApplySuggestion(comment.id, comment.englishTranslate)}
                                                        className="w-full py-2.5 px-4 rounded-full text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100 flex items-center justify-center gap-2"
                                                    >
                                                        <Languages size={14} />
                                                        Replace with English
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                <div className="w-[500px] flex flex-col bg-white h-full shadow-xl shadow-oxford-blue/5 z-20 border-l border-oxford-blue/10 shrink-0">

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
                    <div 
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC] custom-scrollbar"
                    >
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
                                    onEdit={handleEditMessage}
                                    onOpenFile={() => setShowDocumentPreview(true)}
                                    fileName={fileName || analyzedFile?.name}
                                    onReferenceClick={handleReferenceClick}
                                    onLineClick={handleLineClick}
                                    editingIndex={editingMessageIndex}
                                    editingText={editingMessageText}
                                    setEditingText={setEditingMessageText}
                                    onSave={handleSaveEdit}
                                    onCancel={handleCancelEdit}
                                    // Discovery Mode Props
                                    discoveryStep={discoveryStep}
                                    onGenerateDiscovery={handleGenerateDiscoveryDraft}
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
                            <div ref={historyListRef} className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {chatHistory.filter(msg => msg.role === 'user').length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">No topics discussed yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {(() => {
                                            // Enhanced Grouping Logic for Session History
                                            const grouped = groupChatsByTime(chatHistory.filter(msg => msg.role === 'user').map((msg, idx) => ({
                                                ...msg,
                                                id: idx, // Assign temporary ID based on index for mapping back
                                                originalIndex: chatHistory.indexOf(msg)
                                            })));

                                            return grouped.map((group) => (
                                                <div key={group.label} className="space-y-1">
                                                    <button
                                                        onClick={() => setCollapsedHistoryGroups(prev => ({ ...prev, [group.label]: !prev[group.label] }))}
                                                        className="w-full flex items-center justify-between px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-oxford-blue/40 uppercase tracking-wider hover:bg-gray-100 transition-colors"
                                                    >
                                                        <span>{group.label}</span>
                                                        <ChevronUp size={12} className={`transition-transform duration-200 ${collapsedHistoryGroups[group.label] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    
                                                    {!collapsedHistoryGroups[group.label] && (
                                                        <div className="space-y-1 animate-fadeIn">
                                                            {group.chats.map((msg) => {
                                                                const isAnalysis = msg.content && (msg.content.includes("Analyze this document completely.") || msg.content.includes("Dissect this document completely."));
                                                                const topic = isAnalysis ? "Document Analysis" : (msg.content || "").substring(0, 40) + ((msg.content || "").length > 40 ? "..." : "");

                                                                return (
                                                                    <button
                                                                        key={`history-nav-${msg.originalIndex}`}
                                                                        onClick={() => {
                                                                            const el = document.getElementById(`chat-msg-${msg.originalIndex}`);
                                                                            if (el) {
                                                                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                            }
                                                                            setShowInChatHistory(false);
                                                                        }}
                                                                        className="w-full text-left p-2.5 rounded-lg hover:bg-oxford-blue/5 flex items-start gap-3 transition-colors group"
                                                                    >
                                                                        <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isAnalysis ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                            {isAnalysis ? <BookOpen size={12} /> : <MessageCircle size={12} />}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium text-oxford-blue group-hover:text-bronze transition-colors truncate">
                                                                                {topic}
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-400 mt-0.5">Interaction {Math.floor(msg.originalIndex / 2) + 1}</p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ));
                                        })()}
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
                                placeholder={isAnalyzing ? "Thinking..." : (fileName ? "Analyze this..." : "Ask ScholarGo...")}
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
