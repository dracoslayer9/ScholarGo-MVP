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
        console.log("Running Gemini Analysis...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        
        Return the response in this strict JSON format:
        {
            "documentClassification": {
                "primaryType": "Personal Statement | Study Plan | Portfolio",
                "secondaryElements": ["e.g. Research Methodology"],
                "reasoning": "Brief explanation.",
                "confidence": "High | Medium | Low",
                "structuralSignals": ["signal 1", "signal 2"]
            },
            "deepAnalysis": {
                "overallAssessment": "High-level assessment.",
                "authenticity": { "strengths": "...", "evidence": "..." },
                "structure": { "type": "...", "flow": "..." },
                "values": { "detectedValues": "...", "alignment": "..." },
                "strategicImprovements": ["Imp 1", "Imp 2", "Imp 3"]
            },
            "globalSummary": "A 2-3 sentence global summary.",
            "paragraphBreakdown": [
            { 
                "paragraph_number": 1,
                "detected_subtitle": "Introduction (or null)",
                "functional_label": "Hook",
                "section_label": "Introduction/Hook",
                "analysis_current": "What the paragraph is currently trying to do (e.g. Introduce the candidate's background).",
                "main_idea": "Summary of content.",
                "evidence_quote": "Exact verbatim quote.",
                "evidence_location": "Lines 12-15",
                "strength": "What works well.",
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

        let systemPrompt = `You are an elite Scholarship Consultant for Scholarstory. Your goal is to guide the user to write a "Gold Standard" essay using the **Scholarstory Master Framework**.
            
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
        - You are a **friendly and flexible Scholarship Mentor**. Adopt a "Scholar-to-Scholar" vibe: professional but encouraging and accommodating.
        - **User Perspective First**: Prioritize the user's intent and perspective. If the user disagrees with your framework classification or advice, **align with them immediately and politely**. 
        - Do not be argumentative or rigid with the Master Framework. The framework is its guide, not a strict law.
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

        Document Content (THE SOURCE OF TRUTH):
        ---
        ${documentContent || '(Empty document provided. Please ask the user to share their draft.)'}
        ---

        CRITICAL: If the Document Content above is NOT empty, focus your analysis on it.
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

        **Constraint**: Keep it concise. No preamble.
        
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
