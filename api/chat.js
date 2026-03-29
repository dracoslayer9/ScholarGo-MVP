/* eslint-env node */
/* global process */
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Client initialization moved down to check model


    try {
        const { message, history = [], documentContent = "", model = "gpt-4o" } = req.body;
        console.log(`[Chat API] Processing request with model: ${model}`);

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        let resolvedModel = model;

        // Auto-Routing: Classify user intent
        if (model === "auto") {
            try {
                const classifierClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const classifierResponse = await classifierClient.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are an intent router for a scholarship application assistant. Classify the user's message into 'RESEARCH' or 'WRITE'.\n\n'RESEARCH': Use this for ANY factual query, including:\n- Searching for or verifying university names, rankings, or locations.\n- Checking if a specific major, program, or MSc/PhD degree exists.\n- Looking for program modules, credits, fees, or duration.\n- Checking scholarship deadlines, requirements, or external facts from the live web.\n- If the user mentions a specific university name or a specific degree title, lean heavily towards RESEARCH.\n\n'WRITE': Use this ONLY if the user is asking to:\n- Review, edit, or critique their current essay draft.\n- Draft, rewrite, or translate specific sentences or paragraphs.\n- Brainstorm creative story hooks or personal narratives.\n- Organize an outline for their document.\n\nReply ONLY with the word RESEARCH or WRITE." },
                        { role: "user", content: message }
                    ],
                    temperature: 0,
                    max_tokens: 10
                });

                const intent = classifierResponse.choices[0].message.content.trim().toUpperCase();
                console.log(`Auto-Router classified intent as: ${intent}`);

                if (intent.includes("RESEARCH")) {
                    resolvedModel = "perplexity";
                } else {
                    resolvedModel = "openai";
                }
            } catch (err) {
                console.error("Auto-Router failed, defaulting to openai:", err);
                resolvedModel = "openai";
            }
        }

        let openaiClient;
        let requestModel = "gpt-4o";

        if (resolvedModel === "perplexity") {
            if (!process.env.PERPLEXITY_API_KEY) {
                return res.status(500).json({ error: 'Missing PERPLEXITY_API_KEY in server environment variables.' });
            }
            openaiClient = new OpenAI({
                apiKey: process.env.PERPLEXITY_API_KEY,
                baseURL: "https://api.perplexity.ai",
            });
            requestModel = "sonar-pro";
        } else {
            if (!process.env.OPENAI_API_KEY) {
                return res.status(500).json({ error: 'Missing OPENAI_API_KEY in server environment variables.' });
            }
            openaiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            // TPM GUARD: GPT-4o is the default for high-quality writing assistance
            requestModel = resolvedModel === "openai" ? "gpt-4o" : resolvedModel;
        }

        // TPM GUARD: Truncate document content on server as well
        const safeDocumentContent = (documentContent || '').length > 50000 
            ? (documentContent.substring(0, 50000) + "\n\n[...TEXT TRUNCATED ON SERVER...]")
            : documentContent;

        let ragContext = "";
 
        // PROACTIVE RAG PIPELINE: Only for OpenAI (Scholarship Writing mode)
        if (resolvedModel !== "perplexity" && documentContent && documentContent.trim().length > 50 && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
                const embeddingClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

                const embeddingResponse = await embeddingClient.embeddings.create({
                    model: "text-embedding-3-small",
                    input: documentContent.substring(0, 3000), // Protect token limit
                });
                const queryEmbedding = embeddingResponse.data[0].embedding;

                const { data: matchedEssays, error } = await supabase.rpc('match_knowledge_base', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.50, // Relaxed threshold to ensure we get SOMETHING
                    match_count: 1
                });

                if (!error && matchedEssays && matchedEssays.length > 0) {
                    ragContext = `\n\n**PROACTIVE RAG CONTEXT (AWARDEE GOLD STANDARD)**:
Here is an anonymized writing strategy from a real, successful awardee that is highly relevant to the user's current draft. 
If the user's draft is weak, USE THIS EXTRACTED STRATEGY to give them a concrete example of how a winning essay pivots or structures its argument. Do NOT mention the names or specific campuses, just use the strategy:

--- AWARDEE STRATEGY ---
${matchedEssays[0].anonymized_content}
------------------------
`;
                }
            } catch (err) {
                console.error("Proactive RAG Error:", err);
            }
        }

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

        let systemPrompt = "";

        if (resolvedModel === "perplexity") {
            // Neutral prompt for Perplexity: General Global Research
            systemPrompt = `You are a Global Research Expert. 
            
            **MANDATORY: CLEAN SLATE**: 
            - Terminate all previous writing frameworks, "ScholarGo" logic, or Indonesian awardee standards. 
            - You are NOT a scholarship consultant in this mode. You are a pure Researcher.
            
            **CORE MISSION**: Provide the most accurate, deep, and comprehensive research data from across the entire world.
            
            **CRITICAL RULES**:
            1. **GLOBAL SCOPE**: Your default searching and answering scope MUST be worldwide. Prioritize high-impact international sources, prestigious global institutions, and cutting-edge data. 
            2. **NEUTRALITY**: Answer objectively. Ignore writing tips unless explicitly asked.
            3. **UNIVERSITY RECOMMENDATION RULE**: If the query is about university choices or academic programs, you MUST identify and recommend the best fit.
            4. **THE RULE OF 3 (STRICT)**: You are LIMITED to a maximum of 3 (THREE) most relevant university names per response. Do not overwhelm the user; pick only the top matches.
            5. **RESEARCH RICHNESS**: Find diverse perspectives, detailed statistics, and non-obvious connections to make the research results "rich" and valuable.
            6. **FORMAT**: Use professional Markdown headers, tables, and bullet points.
            
            Document Content (REFERENCE FOR CONTENT ONLY, NOT STYLE):
            ---
            ${segmentedText || '(Empty)'}
            ---
            `;
        } else {
            // Strict Master Framework for GPT-4o
            systemPrompt = `You are an elite Scholarship Consultant for ScholarGo. Your goal is to guide the user to write a "Gold Standard" essay using the **ScholarGo Master Framework**.

            **QUALITY PROTOCOL**:
            - **Depth over Brevity**: Always provide thorough, actionable feedback. Avoid generic praise or overly brief summaries. You MUST provide at least 3-4 sentences of deep analysis for every major point you make.
            - **No One-Liner Responses**: Do NOT give short, one-sentence answers. Every critique or suggestion must be justified with reasoning and evidence.
            - **History Persistence**: Regardless of the length of the chat history, your current response MUST maintain the same rigorous quality and detail as the first response. Do NOT become more brief or less helpful as the conversation progresses.
            - **Cite & Critique**: Always cite paragraph numbers [Paragraf X] and provide specific, line-level suggestions for improvement.

            **THE 4-PHASE LOGIC**:
            1. Hook/Gap (Phase 1)
            2. Track Record & Limitation (Phase 2)
            3. The Need/Strategic Gap (Phase 3)
            4. Vision & Concrete Contribution (Phase 4)

            **PARAGRAPH INDEXING RULE**:
            - THE DOCUMENT IS PROVIDED WITH ### PARAGRAPH X ### MARKERS.
            - Short lines without terminal punctuation (e.g. "Opening") are labeled as [HEADER] and are NOT standalone paragraphs. 
            - ALWAYS refer to the ### PARAGRAPH X ### markers for accurate feedback.

            **THE MASTER FRAMEWORKS**:
            You must adapt your framework based on whether the user is writing a **Personal Statement (PS)** or a **Contribution Essay (Esai Kontribusi)**:

            1. **PERSONAL STATEMENT (PS) FRAMEWORK**:
               Focuses on personal narrative, academic track record, and individual vision.
               * **Phase 1: Narrative Background (The Hook & Micro)** - Start with a personal challenge/story that shaped their values.
               * **Phase 2: Academic & Professional Track Record (The Bridge)** - Concrete data, GPA, specific projects, and overcoming blockers.
               * **Phase 3: The Knowledge Gap (The Need)** - Why do they need THIS specific Master's program NOW?
               * **Phase 4: Individual Vision (The Future)** - How this degree helps them achieve their specific career/social goals.

            2. **CONTRIBUTION ESSAY (ESAI KONTRIBUSI) FRAMEWORK**:
               Focuses on societal problems, past community projects, and future national impact.
               * **Phase 1: The Societal Problem (The Gap)** - Start with a specific, observed societal problem -> Connect to national urgency (e.g., Kampus Merdeka, SDG).
               * **Phase 2: Past Community Actions (The Bridge)** - What has the applicant ALREADY done to solve this locally? (e.g., founded an NGO, created a program).
               * **Phase 3: The Strategic Need (The Study Plan)** - Why do they need this specific degree to scale their impact?
               * **Phase 4: The Concrete Contribution (The Vision)** - Realistic, localized, and measurable ROI upon returning to Indonesia.

            **THE 3 PILLARS OF AUTHENTICITY**:
            Evaluate all text against these:
            *   **A. Narrative Authenticity**: "Show, Don't Tell". Vulnerability as strength.
            *   **B. Structure & Flow**: Logical threading (Causality, not Chronology).
            *   **C. Value Alignment**: National Interest & Service over Self.

            **YOUR ROLE**:
            - Analyze the user's text against the appropriate framework. If it's unclear what the user is writing, ask them to clarify if it is a PS or a Contribution Essay.
            - **Critique** heavily if they are generic.
            - **Suggest** specific structural pivots.
            - **Validation**: Check if they pass the "Specificity Test" (Can anyone else write this?).

            **Interaction Mode**:
            - **LANGUAGE**: DETECT the language of the user's input and document. **ALWAYS REPLY IN THE SAME LANGUAGE** as the user's input/document.
            - If the user asks for feedback, refer to the "Phase" they are in based on the correct framework.
            - Be direct, professional, yet encouraging.
            - If they provide text, identify which Phase it belongs to and score it against the Pillars.

            **SPECIAL INSTRUCTION: OUTLINE GENERATION**:
            If the user asks for an outline, structure, or "kerangka", you MUST generate it using the 4 Phases of the corresponding framework (PS or Kontribusi).
            **Format your response using Markdown headers**:
            ## Phase 1: [Phase Name]
            ...
            ## Phase 2: [Phase Name]
            ...
            (and so on).
            Do not deviate from this structure for outlines.

            **KNOWLEDGE LIMITATION & RESEARCH ROUTING**:
            - **Knowledge Cutoff**: You are aware that your internal knowledge has a cutoff (Oct 2023). 
            - **Factual Verification**: If the user asks for specific, factual, or current data about a university, program, or requirement that you are unsure of (especially if it seems newer than 2023), YOU MUST:
                1. Acknowledge your 2023 knowledge cutoff.
                2. Suggest that the user switch to **"Research"** mode (which uses Perplexity with live web access) for the most accurate and up-to-date verification.
                3. Do NOT definitively state a program "does not exist" if your only source is your internal training data. Be conservative and suggest research.
            
            **SELF-REFINE & ANTI-HALLUCINATION (CRITICAL RULE)**:
            Before you output your final response, internally check: "Does this answer EXACTLY what the user asked?"
            1. **DO NOT give unsolicited university recommendations** (like Monash, NUS, etc.) unless the user EXPLICITLY asks for "Campus Match" or "Rekomendasi Kampus". If they just ask for a review, ONLY give a review.
            2. **DO NOT invent examples** that stray far from the user's text unless explaining a specific writing tactic.
            3. If the user asks for a review/feedback on a draft, provide ONLY the critique based on the 3 Pillars and Framework Phases. DO NOT add extra unrelated sections.

            **Document Content (Source of Truth with Paragraph Markers)**:
            ---
            ${segmentedText || '(Empty document provided. Please ask the user to provide their draft.)'}
            ---
            
            **CRITICAL**: If the Document Content above is NOT empty, you MUST focus your primary analysis on it. If it IS empty, you MUST ask the user to provide their essay draft/paragraph before you can give specific feedback.
            
            ${ragContext}
            `;
        }

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

        // 4. Ensure the sequence ends with 'user'
        if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role !== 'user') {
            // Rather than dropping the assistant's previous answer, append a dummy user continuation 
            // if absolutely necessary, but usually the last appended thing is the new `message` anyway.
            // This is a safety catch.
            if (rawMessages[rawMessages.length - 1].role !== 'user') {
                sanitizedHistory.push({ role: 'user', content: 'Continue' });
            }
        }

        // PERPLEXITY ISOLATION INJECTOR: Hard purge of scholarship context from history
        if (resolvedModel === "perplexity" && sanitizedHistory.length > 1) {
            const lastUserMessage = sanitizedHistory.pop();
            sanitizedHistory.push({
                role: "user",
                content: "[SYSTEM NOTIFICATION: The user has switched to GLOBAL RESEARCH MODE. Disregard all previous writing advice, phases, and scholarship frameworks from the history above. Focus purely on the NEW research query below.]"
            });
            sanitizedHistory.push({ role: "assistant", content: "Understood. I have cleared the previous writing persona and am now ready for unbiased global research. What can I help you find today?" });
            sanitizedHistory.push(lastUserMessage);
        }

        const messages = [
            { role: "system", content: systemPrompt },
            ...sanitizedHistory
        ];

        const completion = await openaiClient.chat.completions.create({
            model: requestModel,
            messages: messages,
            temperature: 0.7,
        });

        let result = completion.choices[0].message.content;

        // Post-process Perplexity Citations
        if (resolvedModel === "perplexity" && completion.citations && completion.citations.length > 0) {
            console.log(`Embedding ${completion.citations.length} citations into response`);
            completion.citations.forEach((url, index) => {
                const citeNum = index + 1;
                // Replace [n] or [^n] with [n](url)
                const citeRegex = new RegExp(`\\[\\^?${citeNum}\\]`, 'g');
                result = result.replace(citeRegex, `[${citeNum}](${url})`);
            });
            
            // Optionally append a source list if not already present
            if (!result.includes('Sources') && !result.includes('Referensi')) {
                const sourceList = "\n\n**Sources:**\n" + completion.citations.map((url, i) => {
                    try {
                        const hostname = new URL(url).hostname;
                        return `${i + 1}. [${hostname}](${url})`;
                    } catch (e) {
                        return `${i + 1}. [Source](${url})`;
                    }
                }).join('\n');
                result += sourceList;
            }
        }

        return res.status(200).json({ result });

    } catch (error) {
        console.error("Server Chat Failed:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
