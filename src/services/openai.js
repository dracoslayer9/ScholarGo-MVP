import OpenAI from 'openai';

export const runRealAnalysis = async (
    text,
    type = "General Essay",
    instruction = null,
    context = null,
    signal = null // Add signal param
) => {
    // FALLBACK: Client-Side Execution for Local Development
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            console.log("Running Local Client-Side Analysis...");
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            // --- IMPROVED PARAGRAPH SEGMENTATION ---
            // 1. Normalize line breaks
            const normalized = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // 2. Line-based robust splitting
            const lines = normalized.split('\n').map(l => l.trim());
            let segmentedParagraphs = [];
            let currentHeader = null;
            let pCount = 0;
            let currentParagraphLines = [];

            lines.forEach((line) => {
                if (!line) {
                    if (currentParagraphLines.length > 0) {
                        pCount++;
                        segmentedParagraphs.push({
                            index: pCount,
                            header: currentHeader,
                            content: currentParagraphLines.join('\n')
                        });
                        currentParagraphLines = [];
                        currentHeader = null;
                    }
                    return;
                }

                const looksLikeHeader = line.length < 60 && !/[.!?]$/.test(line) && line.split(' ').length < 10;

                if (looksLikeHeader && currentParagraphLines.length === 0) {
                    currentHeader = currentHeader ? `${currentHeader} / ${line}` : line;
                } else {
                    currentParagraphLines.push(line);
                }
            });

            if (currentParagraphLines.length > 0) {
                pCount++;
                segmentedParagraphs.push({ index: pCount, header: currentHeader, content: currentParagraphLines.join('\n') });
            } else if (currentHeader) {
                pCount++;
                segmentedParagraphs.push({ index: pCount, header: currentHeader, content: "" });
            }

            const totalParagraphCount = segmentedParagraphs.length;
            console.log(`[Analysis] Pre-segmented into ${totalParagraphCount} paragraphs (V2 splitter).`);

            const textWithParagraphMarkers = segmentedParagraphs.map((p) => {
                let s = `### PARAGRAPH ${p.index} ###\n`;
                if (p.header) s += `[HEADER/TITLE: ${p.header}]\n`;
                const markedLines = p.content.split('\n').map((line, li) => `L${li + 1}: ${line}`).join('\n');
                return s + (markedLines || "(No content paragraph)");
            }).join('\n\n');

            let systemPrompt = `You are an elite academic scholarship consultant. Analyze the document structure.
            You MUST analyze exactly ${totalParagraphCount} paragraphs.

            **LANGUAGE INSTRUCTION**:
            DETECT the language of the provided document or the user's instruction. You MUST provide your analysis in the **SAME LANGUAGE**. 
            - If the document/query is in **Indonesian**, the textual values of your JSON response MUST be in **Indonesian**.
            - If the document/query is in **English**, reply entirely in **English**.
            - CRITICAL: DO NOT translate the JSON keys. Only translate the string content values!
        
            ${type === "Awardee Sample" ? `
            **AWARDEE DISSECTION MODE**:
            This document is a SUCCESSFUL awardee essay. deconstruct its winning anatomy.
            1. Identify its "Hook, Gap, Vision" structure.
            2. Extract narrative strategies.
            3. Define Structural Anatomy and Key Takeaways.
            ` : `
            **CRITIQUE MODE**:
            This is a student draft. Analyze it rigorously for weaknesses in narrative, flow, and value alignment.
            `}

            **STRICT DEPTH PROTOCOL**:
            - **NO BREVITY**: Do not provide one-sentence responses for structural analysis or main ideas.
            - **CRITICAL THINKING**: You MUST provide at least 3-4 sentences per paragraph for both 'analysis_current' and 'main_idea'.
            - **SUBSTANCE**: Explain the 'why' and the 'how'. If a paragraph is a hook, explain what kind of hook it is (sensory, thematic, question-based) and how it creates tension or curiosity.

            **STRICT WORKFLOW**:
            - You are provided with ${totalParagraphCount} paragraphs, each marked with ### PARAGRAPH X ###.
            - You MUST return EXACTLY ${totalParagraphCount} objects in the "paragraphBreakdown" array.
            - One object per paragraph. DO NOT combine them.
            - Provide a real "evidence_quote" (verbatim) for EVERY paragraph.
            `;

            if (instruction) {
                systemPrompt += `\n\nUser Instruction: ${instruction}`;
            }

            const prompt = `
            ${systemPrompt}
            
            Return the response in this strict JSON format:
            {
                "documentClassification": {
                  "primaryType": "Personal Statement | Study Plan | Portfolio",
                  "reasoning": "Detailed explanation of why the document falls into this category, citing specific structural elements.",
                  "confidence": "High | Medium | Low"
                },
                "deepAnalysis": {
                  "overallAssessment": "Comprehensive evaluation of the essay's strengths, weaknesses, and overall impact.",
                  "strategicImprovements": ["Detailed improvement 1", "..."]
                },
                "globalSummary": "A comprehensive 3-4 sentence summary of the core narrative and potential of this draft.",
                "paragraphBreakdown": [
                { 
                    "paragraph_number": 1,
                    "functional_label": "e.g. Phase 1: Hook/Context",
                    "analysis_current": "Detailed 3-4 sentence structural analysis. Explaining how this paragraph functions as the [Hook/Context/Gap] and how it transitions to the next point.",
                    "main_idea": "A thorough 3-sentence summary that captures the nuance and specific evidence presented in this paragraph.",
                    "evidence_quote": "<VERBATIM_QUOTE>",
                    "status": "strong" 
                }
                ]
            }

            Essay Content with Paragraph Markers:
            "${textWithParagraphMarkers}"
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.3, // Lower temperature for better adherence
            }, { signal });

            const content = completion.choices[0].message.content;
            const parsed = JSON.parse(content);

            // Safety Check: If AI still truncated, log it
            if (parsed.paragraphBreakdown.length !== totalParagraphCount) {
                console.warn(`[Analysis] AI returned ${parsed.paragraphBreakdown.length} paragraphs but expected ${totalParagraphCount}.`);
            }

            return parsed;

        } catch (error) {
            console.error("Local Analysis Failed:", error);
            throw error;
        }
    }

    // SERVER-SIDE Execution (Production / When Proxy Available)
    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type, instruction, context }),
        signal // Pass signal
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    // If your backend returns { result: "OK" } or { result: "<json string>" }
    if (typeof data.result === "string") {
        try {
            return JSON.parse(data.result);
        } catch {
            // if backend returns plain text
            return { globalSummary: data.result, paragraphBreakdown: [] };
        }
    }

    // If backend already returns the JSON object
    return data;
};

/**
 * Handles conversational follow-up questions about the document.
 */
export const sendChatMessage = async (
    message,
    history = [],
    documentContent = "",
    signal = null, // Add signal param
    model = "gpt-4o", // Add model param
    onChunk = null // Add onChunk callback
) => {
    // FALLBACK: Client-Side Execution for Local Development
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            let resolvedModel = model;

            // --- IMPROVED AUTO-ROUTER (CLIENT-SIDE) ---
            if (model === "auto") {
                try {
                    const classifierClient = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
                    const classifierResponse = await classifierClient.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: "You are an intent router for a scholarship application assistant. Classify the user's message into 'RESEARCH' or 'WRITE'.\n\n'RESEARCH': Use this for ANY factual query, including university names, specific majors, program details, fees, or external facts from the web. If they mention a specific university or degree title, lean heavily towards RESEARCH.\n\n'WRITE': Use this ONLY for reviewing, editing, drafting, or brainstorming essay content.\n\nReply ONLY with the word RESEARCH or WRITE." },
                            { role: "user", content: message }
                        ],
                        temperature: 0,
                        max_tokens: 10
                    });

                    const intent = classifierResponse.choices[0].message.content.trim().toUpperCase();
                    console.log(`[Local Auto-Router] Classified intent as: ${intent}`);
                    resolvedModel = intent.includes("RESEARCH") ? "perplexity" : "openai";
                } catch (err) {
                    console.error("Local Auto-Router failed:", err);
                    resolvedModel = "openai";
                }
            }

            // If we resolved to perplexity, we must use the server as there's no client-side SDK for Sonar easily
            if (resolvedModel === 'perplexity') {
                throw new Error("RESEARCH_REDIRECT"); // Signal to caller to use server/perplexity mode
            }

            console.log(`Running Local Chat Message with ${resolvedModel}...`);
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            // --- IMPROVED PARAGRAPH EXTRACTION (V3 ROBUST) ---
            const lines = (documentContent || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim());
            let segmentedParagraphs = [];
            let currentHeader = null;
            let pCount = 0;
            let currentParagraphLines = [];

            const flushParagraph = () => {
                if (currentParagraphLines.length > 0) {
                    pCount++;
                    segmentedParagraphs.push({
                        index: pCount,
                        header: currentHeader,
                        content: currentParagraphLines.join('\n')
                    });
                    currentParagraphLines = [];
                    currentHeader = null;
                }
            };

            lines.forEach((line) => {
                if (!line) {
                    flushParagraph();
                    return;
                }

                const isMarkdownHeader = line.startsWith('#');
                const isBoldHeader = line.startsWith('**') && line.endsWith('**') && line.length < 100;
                const isAllCaps = line.length > 3 && line === line.toUpperCase() && !/[.!?]$/.test(line);
                const isShortLabel = line.length < 60 && !/[.!?]$/.test(line) && line.split(' ').length < 10;
                
                const looksLikeHeader = isMarkdownHeader || isBoldHeader || isAllCaps || isShortLabel;

                if (looksLikeHeader && currentParagraphLines.length === 0) {
                    currentHeader = currentHeader ? `${currentHeader} | ${line}` : line;
                } else {
                    currentParagraphLines.push(line);
                }
            });
            
            flushParagraph();

            if (currentHeader) {
                if (segmentedParagraphs.length > 0) {
                    segmentedParagraphs[segmentedParagraphs.length - 1].content += `\n\n[FOOTER/TITLE: ${currentHeader}]`;
                } else {
                    pCount++;
                    segmentedParagraphs.push({ index: pCount, header: currentHeader, content: "(No content provided)" });
                }
            }

            const segmentedText = segmentedParagraphs.map((p) => {
                let s = `### PARAGRAPH ${p.index} ###\n`;
                if (p.header) s += `[HEADER: ${p.header}]\n`;
                return s + (p.content || "");
            }).join('\n\n');

            let systemPrompt = `You are an elite Scholarship Consultant for ScholarGo.
            **CORE PRINCIPLE**:
            1. **Prioritize User**: Focus on their specific questions.
            2. **Paragraph Logic**: Cite paragraph numbers (e.g., [P2]) when giving feedback.
            3. **Indexing Rule**: A short line without terminal punctuation (e.g. "Opening") is a HEADER, not a paragraph. The text is provided with ### PARAGRAPH X ### markers for accuracy. ALWAYS follow these markers.
            4. **Bridging**: Distinguish between "Internal Bridging" (cohesion) and "Phase Transitions" (next step).
            5. **Gap-Bridge-Vision**: Ensure logical flow from problem to solution.
            
            **KNOWLEDGE LIMITATION & RESEARCH ROUTING**:
            - **Knowledge Cutoff**: You are aware that your internal knowledge has a cutoff (Oct 2023). 
            - **Factual Verification**: If the user asks for specific, factual, or current data about a university, program, or requirement that you are unsure of (especially if it seems newer than 2023), YOU MUST:
                1. Acknowledge your 2023 knowledge cutoff.
                2. Suggest that the user switch to **"Research"** mode (which uses Perplexity with live web access) for the most accurate and up-to-date verification.
                3. Do NOT definitively state a program "does not exist" if your only source is your internal training data. Be conservative and suggest research.

            **PERSONA**: Friendly Scholarship Buddy. natural, warm Indonesian (e.g., "Sip, mari kita poles..."). Align with user intent; don't be argumentative.
            **QUALITY PROTOCOL**:
            - **Depth over Brevity**: Always provide thorough, actionable feedback. Avoid generic praise.
            - **History Persistence**: Regardless of the length of the chat history, your current response MUST maintain the same rigorous quality and detail as the first response. Do NOT become more brief or less helpful as the conversation progresses.
            - **Cite & Critique**: Always cite paragraph numbers [PX] and provide specific, line-level suggestions for improvement.
            
            **PROTOCOL**:
            - If Doc Content is NOT EMPTY, focus 100% on analyzing that text. No generic theory.
            - If user refers to a specific paragraph, focus primary effort there.
            - If EMPTY, give framework-based roadmap.
            
            Document Content (Source of Truth with Paragraph Markers):
            ---
            ${segmentedText || '(Draft Empty - Provide framework-based outline suggestions to help the user get started.)'}
            ---
            `;

            // PATTERN COMMAND INTERCEPT
            if (message.includes("@pattern")) {
                console.log("Pattern Analysis Triggered");
                systemPrompt = `You are an expert in Awardee Narrative Patterns. Your goal is to map the user's paragraph to winning storytelling structures.

                **Context - Selected Paragraph**:
                "${documentContent}" (or specifically the focused section)

                **Your Task**:
                Analyze how this specific paragraph fits into "Awardee-Style" narrative patterns.
                
                **Look For**:
                - **Hero's Journey**: Call to Adventure, Crossing the Threshold, Ordeal, Return.
                - **Conflict-Resolution**: How tension is built and released.
                - **Value Anchoring**: How abstract values are grounded in concrete action.
                - **"Show, Don't Tell"**: Presence of sensory details.

                **Output**:
                - Identify the *primary* pattern used.
                - Explain *how* it is used effectively (or where it fails).
                - Cite the exact lines where the pattern emerges.
                `;
            }

            let rawMessages = [
                ...history,
                { role: "user", content: message }
            ];

            // STRICT ALTERNATING ROLE FILTERING (Required by some providers like Anthropic)
            // 1. Filter out empty messages
            rawMessages = rawMessages.filter(m => m.content && m.content.trim() !== "");

            // 2. Merge consecutive messages of the same role
            let sanitizedHistory = [];
            for (let i = 0; i < rawMessages.length; i++) {
                let msg = rawMessages[i];
                if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === msg.role) {
                    // Combine with previous message of same role
                    sanitizedHistory[sanitizedHistory.length - 1].content += "\n\n" + msg.content;
                } else {
                    sanitizedHistory.push({ role: msg.role, content: msg.content });
                }
            }

            // 3. Ensure the sequence starts with 'user' (after system)
            if (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== 'user') {
                sanitizedHistory.shift(); // Drop an orphaned assistant message at the start
            }

            if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role !== 'user') {
                sanitizedHistory.push({ role: 'user', content: 'Please continue based on the document provided.' });
            }

            const messages = [
                { role: "system", content: systemPrompt },
                ...sanitizedHistory
            ];

            if (onChunk) {
                const stream = await openai.chat.completions.create({
                    model: model,
                    messages: messages,
                    temperature: 0.7,
                    stream: true,
                }, { signal });

                let fullText = "";
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    fullText += content;
                    onChunk(fullText);
                }
                return fullText;
            }

            const completion = await openai.chat.completions.create({
                model: model,
                messages: messages,
                temperature: 0.7,
            }, { signal }); // Pass signal

            return completion.choices[0].message.content;

        } catch (error) {
            console.error("Local Chat Failed:", error);
            throw error;
        }
    }

    // TPM GUARD: Truncate documentContent on client before sending to server (Production)
    const safeDocumentContent = (documentContent || '').length > 50000 
        ? (documentContent.substring(0, 50000) + "\n\n[...TEXT TRUNCATED ON CLIENT...]")
        : documentContent;

    // SERVER-SIDE Execution (Production)
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, documentContent: safeDocumentContent, model }),
        signal // Pass signal
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data.result;
};

/**
 * Generates a quick "Insight" analysis for a specific paragraph.
 * Strictly explanatory: Main Idea, Approach, Evidence. No evaluation.
 */
export const analyzeParagraphInsight = async (paragraphText) => {
    // FALLBACK: Client-Side Execution for Local Development
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            console.log("Running Paragraph Insight...");
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            const systemPrompt = `You are an expert writing analyst.
            
            **TASK**: Analyze the selected text snippet using the "Insight Card" format.
            **FORMAT STRICTLY**:
            1. **Main Idea**: [What is this text saying?]
            2. **Approach**: [What writing technique is used?]
            3. **Implication**: [What does this suggest about the writer?]

            **Constraint**: Provide high-value, actionable insights. Do not be overly brief; explain the 'why' behind the observation.
            
            Selected Text:
            "${paragraphText}"
            `;


            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this paragraph: \n"${paragraphText}"` }
                ],
                temperature: 0.5,
            });

            return completion.choices[0].message.content;

        } catch (error) {
            console.error("Insight Analysis Failed:", error);
            throw error;
        }
    }

    // SERVER-SIDE Execution
    const response = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: paragraphText }),
    });

    const data = await response.json();
    return data.result;
};
// Summarization Helper
export const summarizeChatHistory = async (history = []) => {
    if (history.length === 0) return "";
    
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Use cheaper model for summarization
                messages: [
                    { role: "system", content: "You are a helpful assistant that summarizes technical scholarship essay discussions. Create a concise summary (max 200 words) of the key points, decisions, and critiques made in this conversation. Focus on the narrative progress." },
                    { role: "user", content: `History:\n${historyText}\n\nSummary:` }
                ]
            });

            return response.choices[0].message.content;
        } catch (err) {
            console.error("Summarization Error:", err);
        }
    }
    return "";
};
