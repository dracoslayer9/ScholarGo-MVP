import { GoogleGenerativeAI } from "@google/generative-ai";

// HARDCODED KEY (Ideally move to .env)
const API_KEY = "AIzaSyC4JFkkTDnz6HAoN8xeTz3sAPJ9XPlij6E";

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Maps Gemini's text response to our expected JSON format.
 * Since Gemini outputs text, we often need to strip markdown JSON blocks.
 */
const parseJSON = (text) => {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        // Fallback or retry logic could go here
        return { globalSummary: text, paragraphBreakdown: [] };
    }
};

export const runRealAnalysis = async (
    text,
    instruction = null,
    context = null,
    signal = null
) => {
    try {
        if (signal?.aborted) {
            throw new Error("Aborted");
        }
        console.log("Running Gemini Pro Analysis...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const textWithLines = (text || '').split('\n').map((line, i) => `Line ${i + 1}: ${line}`).join('\n');

        let systemPrompt = `You are an elite academic scholarship consultant. Analyze the document structure.

        **TWO-PHASE PROTOCOL**:
        
        **PHASE 1: Paragraph Extraction**
        1. Read the document (Pay attention to the provided Line Numbers).
        2. Split it into paragraphs.
        3. Number each paragraph sequentially.
        4. Process ALL paragraphs.
        
        **PHASE 2: Paragraph Analysis**
        For EACH paragraph, provide:
        - **Paragraph Number**: Sequential integer.
        - **Detected Subtitle**: Exact subtitle if present, else null.
        - **Functional Label**: Infer role (e.g. Hook, Context, Challenge, Growth).
        - **Main Idea**: One sentence summary of content.
        - **Current Approach**: What is this paragraph trying to do structurally?
        - **Evidence Location**: The specific Line Numbers where this main idea is generated (e.g. "Lines 12-15").

        **STRICT DEPTH PROTOCOL**:
        - **NO BREVITY**: Do not provide one-sentence responses for structural analysis or main ideas.
        - **CRITICAL THINKING**: You MUST provide at least 3-4 sentences per paragraph for both 'analysis_current' and 'main_idea'.
        - **SUBSTANCE**: Explain the 'why' and the 'how'. If a paragraph is a hook, explain what kind of hook it is (sensory, thematic, question-based) and how it creates tension or curiosity.

        **Criteria**:
        1. Narrative Authenticity
        2. Structure & Flow
        3. Value Alignment
        `;

        if (instruction) {
            systemPrompt += `\n\nUser Instruction: ${instruction}`;
            if (context) {
                systemPrompt += `\n\nSpecific Context/Excerpt to Apply Instruction to: "${context}"`;
            }
        }

        const prompt = `
        ${systemPrompt}
        
            {
                "documentClassification": {
                    "primaryType": "Personal Statement | Study Plan | Portfolio",
                    "secondaryElements": ["e.g. Research Methodology"],
                    "reasoning": "Detailed explanation of why the document falls into this category, citing specific structural elements.",
                    "confidence": "High | Medium | Low",
                    "structuralSignals": ["signal 1", "signal 2"]
                },
                "deepAnalysis": {
                    "overallAssessment": "Comprehensive evaluation of the essay's strengths, weaknesses, and overall impact.",
                    "authenticity": { "strengths": "...", "evidence": "..." },
                    "structure": { "type": "...", "flow": "..." },
                    "values": { "detectedValues": "...", "alignment": "..." },
                    "strategicImprovements": ["Detailed improvement 1", "Detailed improvement 2", "Detailed improvement 3"]
                },
                "globalSummary": "A comprehensive 3-5 sentence global summary of the core narrative and potential of this draft.",
                "paragraphBreakdown": [
                { 
                    "paragraph_number": 1,
                    "detected_subtitle": "Introduction (or null)",
                    "functional_label": "e.g. Phase 1: Hook/Context",
                    "section_label": "e.g. Introduction/Hook",
                    "analysis_current": "Detailed 3-4 sentence structural analysis. Explaining how this paragraph functions as the [Hook/Context/Gap] and how it transitions to the next point.",
                    "main_idea": "A thorough 3-sentence summary that captures the nuance and specific evidence presented in this paragraph.",
                    "evidence_quote": "Exact verbatim quote.",
                    "evidence_location": "Lines 12-15",
                    "strength": "Detailed 2-sentence observation on why this paragraph is effective or what makes it a 'winning' element.",
                    "status": "strong" 
                }
                ]
            }

        IMPORTANT: Analyze EVERY paragraph.
        
        Essay Content with Line Numbers:
        "${textWithLines}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return parseJSON(response.text());

    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        throw error;
    }
};

export const sendChatMessage = async (
    message,
    history = [],
    documentContent = "",
    signal = null,
    onChunk = null
) => {
    try {
        if (signal?.aborted) {
            throw new Error("Aborted");
        }
        console.log("Running Gemini Chat...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let systemPrompt = `You are an elite Scholarship Consultant for ScholarGo. Your goal is to guide the user to write a "Gold Standard" essay using the **ScholarGo Master Framework**.
            
        **CORE PRINCIPLE: CONVINCING NARRATIVE**:
        1.  **Context First**: Prioritize the provided document content above all else.
        2.  **Paragraph Citation**: When giving feedback on specific parts of the draft, ALWAYS cite the paragraph number (e.g., [Paragraf 2]).
        3.  **Refined Bridging Logic**: 
            - DISTINGUISH between "Internal Bridging" (connecting paragraphs within the same topic or phase) and "Phase Transitions" (moving to the next framework phase).
            - DO NOT force a transition to the next Phase if the user is building thematic continuity within the current context. Prioritize logical flow and depth over strict framework progression.
        4.  **Gap-Bridge-Vision Check**: Ensure the document content maintains a logical connection between the problem (Gap), the solution (Bridge/Study Plan), and the future impact (Vision).

        **STRICT SCHOLARSHIP STANDARDS**:
        - You represent the "Awardee Logic" of top scholarships (LPDP, Fulbright, Chevening, AAS).
        - Detect and mention these specific scholarship contexts if relevant to the user's draft.
        - Ensure every response incorporates strong **academic and social values** (research potential, contribution to development).

        **THE MASTER FRAMEWORK**:
        Winning essays must follow this **"Gap-Bridge-Vision"** narrative arc:
        
        1.  **Phase 1: The Specific Observation (The Hook & Gap)**
            *   **Micro-Macro**: Start with a specific, observed problem (Micro) -> Connect to national urgency (Macro).
            *   **Identity**: Use a personal lens/experience.
            *   *Avoid*: Generic statements like "Education is important."

        2.  **Phase 2: The Precise Limitation (The Need)**
            *   **The Blocker**: Why can't you solve this *now*?
            *   **Knowledge Gap**: "I understand X, but lack technical skill Y."
        
        3.  **Phase 3: The Strategic Bridge (The Study Plan)**
            *   **Audit**: Cite specific courses/labs that fixed the "Knowledge Gap".
            *   **Message**: "I need this specific tool to fix that specific problem."

        4.  **Phase 4: The Concrete Vision (The Contribution)**
            *   **ROI**: Immediate action upon return.
            *   **Impact**: Localized and realistic.

        **THE 3 PILLARS OF AUTHENTICITY**:
        Evaluate all text against these:
        *   **A. Narrative Authenticity**: "Show, Don't Tell". Vulnerability as strength.
        *   **B. Structure & Flow**: Logical threading (Causality, not Chronology).
        *   **C. Value Alignment**: National Interest & Service over Self.

        **YOUR ROLE & PERSONA**:
        - You are a **friendly and supportive Scholarship Buddy (Awardee Partner)**. Adopt a "Scholar-to-Scholar" vibe. 
        - **Language Style**: Use natural, warm, and conversational Indonesian (e.g., "Sip, mari kita bedah...", "Keren nih draft-mu!", "Coba cek bagian ini ya..."). Avoid being overly academic or rigid.
        - **User Perspective First**: Prioritize the user's intent. If the user disagrees with your classification, **align with them immediately and politely**. 
        - Do not be argumentative or rigid with the Master Framework. It is a guide to help them win, not a strict law.
        - **Objective**: Be an encouraging mentor who makes the writing process feel collaborative and exciting.
        - **QUALITY PROTOCOL**:
            - **Depth over Brevity**: Always provide thorough, actionable feedback. Avoid generic praise or overly brief summaries.
            - **History Persistence**: Regardless of the length of the chat history, your current response MUST maintain the same rigorous quality and detail as the first response. Do NOT become more brief or less helpful as the conversation progresses.
            - **Cite & Critique**: Always cite paragraph numbers [Paragraf X] and provide specific, line-level suggestions for improvement.
        - **Identify the Topic & Phase**: State clearly what phase the user is currently in, but be ready to pivot based on their feedback.
        - **Suggest** specific structural pivots (e.g., "Shift this to Phase 2").
        - **Validation**: Check if they pass the "Specificity Test" (Can anyone else write this?).

        **Interaction Mode**:
        - If the user asks for feedback, refer to the "Phase" they are in.
        - Be direct, professional, yet encouraging.
        ## Phase 2: [Phase Name]
        ...
        (and so on).
        Do not deviate from this structure for outlines.

        Document Content (Indexed by Paragraph - ABSOLUTE PRIMARY SOURCE OF TRUTH):
        - The document is indexed using markers like '### PARAGRAPH X ###'.
        - **CRITICAL PROTOCOL**:
          1. If the "Document Content" below is NOT EMPTY (contains draf/text), you MUST FOCUS 100% on analyzing and improving that specific text. Do NOT provide general theory or framework advice if the user has already written something.
          2. If the user mentions a specific paragraph (e.g., "kembangkan paragraf 4"), you MUST cross-reference it with the markers below and focus your specific analysis and improvements on that block.
          3. **ONLY IF the "Document Content" below is EMPTY**, you should then act in "Outline Mode" and provide structure/suggestions based on the ScholarGo Master Framework.
        ---
        ${documentContent || '(Draft Empty - Provide framework-based outline suggestions to help the user get started.)'}
        ---
        
        CRITICAL: If the Document Content above is NOT empty, focus your analysis on it while maintaining understanding of the whole essay flow.
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

        // Gemini Chat History Format
        // History needs to be converted to { role: 'user' | 'model', parts: [{ text: ... }] }
        // OpenAI uses { role: 'user' | 'assistant', content: ... }
        const historyForGemini = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `System Instruction: ${systemPrompt}` }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to analyze as the Senior Reviewer." }]
                },
                ...historyForGemini
            ],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        if (onChunk) {
            const result = await chat.sendMessageStream(message);
            let fullText = "";
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;
                onChunk(fullText);
            }
            return fullText;
        }

        const result = await chat.sendMessage(message);
        return result.response.text();

    } catch (error) {
        console.error("Gemini Chat Failed:", error);
        throw error;
    }
};

export const analyzeParagraphInsight = async (paragraphText) => {
    try {
        console.log("Running Gemini Paragraph Insight...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const instruction = `You are an expert writing analyst.
        
        **TASK**: Analyze the selected text snippet using the "Insight Card" format.
        **FORMAT STRICTLY**:
        1. **Main Idea**: [What is this text saying?]
        2. **Approach**: [What writing technique is used?]
        3. **Implication**: [What does this suggest about the writer?]

        **Constraint**: Provide high-value, actionable insights. Do not be overly brief; explain the 'why' behind the observation.
        
        Selected Text:
        "${paragraphText}"
        `;

        const result = await model.generateContent(instruction);
        return result.response.text();

    } catch (error) {
        console.error("Gemini Insight Failed:", error);
        throw error;
    }
};

// Summarization Helper
export const summarizeChatHistory = async (history = []) => {
    if (history.length === 0) return "";
    try {
        console.log("Running Gemini Summarization...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        const prompt = `You are a helpful assistant that summarizes technical scholarship essay discussions. Create a concise summary (max 200 words) of the key points, decisions, and critiques made in this conversation. Focus on the narrative progress.\n\nHistory:\n${historyText}\n\nSummary:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (err) {
        console.error("Gemini Summarization Error:", err);
        return "";
    }
};
