import OpenAI from 'openai';

export const runRealAnalysis = async (
    text,
    type = "General Essay",
    instruction = null,
    context = null
) => {
    // FALLBACK: Client-Side Execution for Local Development
    // This runs if we are in DEV mode AND we have a VITE_OPENAI_API_KEY.
    // This allows the app to work with `npm run dev` without a backend server.
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            console.log("Running Local Client-Side Analysis...");
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            // Pre-process text with line numbers for accurate citation
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


            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });


            const content = completion.choices[0].message.content;
            return JSON.parse(content);

        } catch (error) {
            console.error("Local Analysis Failed:", error);
            // Fall through to try server method or throw
            throw error;
        }
    }

    // SERVER-SIDE Execution (Production / When Proxy Available)
    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type, instruction, context }),
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
// ... existing runRealAnalysis code ...

/**
 * Handles conversational follow-up questions about the document.
 */
export const sendChatMessage = async (
    message,
    history = [],
    documentContent = ""
) => {
    // FALLBACK: Client-Side Execution for Local Development
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            console.log("Running Local Chat Message...");
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            let systemPrompt = `You are an elite academic scholarship consultant. 
            You have already analyzed the user's essay. Now, you are answering their follow-up questions to help them improve it.
            
            **Context - The User's Essay**:
            "${documentContent}"

            **Guidelines**:
            1. Be helpful, specific, and encouraging.
            2. Cite specific parts of the essay if relevant.
            3. Keep answers concise (under 3 paragraphs) unless asked for more.
            4. If the user asks for a rewrite, provide a high-quality example.
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

            const messages = [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ];

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: messages,
                temperature: 0.7,
            });

            return completion.choices[0].message.content;

        } catch (error) {
            console.error("Local Chat Failed:", error);
            throw error;
        }
    }

    // SERVER-SIDE Execution (Production)
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, documentContent }),
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

            const systemPrompt = `You are an expert writing analyst. Your goal is to help the user understand the selected paragraph quickly.

            **Tasks**:
            1. **Identify the Main Idea**: What is the core point?
            2. **Explain the Writer's Approach**: How are they conveying it? (e.g., storytelling, explanation, reflection, contrast).
            3. **Cite Evidence**: Quote exact phrases that support the main idea.

            **Rules**:
            - Focus ONLY on the provided text.
            - Be concise and explanatory.
            - DO NOT evaluate quality (good/bad).
            - DO NOT suggest improvements.
            - Format as a clean, easy-to-read list or short paragraphs.
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this paragraph:\n"${paragraphText}"` }
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
