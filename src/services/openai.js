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

            // 2. Split into paragraphs (using double newline as primary separator)
            let rawParagraphs = normalized.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

            // 3. Fallback: if very few paragraphs were found but text is long, use single newline
            if (rawParagraphs.length < 3 && normalized.split('\n').filter(l => l.trim()).length > 5) {
                rawParagraphs = normalized.split('\n').map(p => p.trim()).filter(p => p.length > 0);
            }

            const totalParagraphCount = rawParagraphs.length;
            console.log(`[Analysis] Pre-segmented into ${totalParagraphCount} paragraphs.`);

            const textWithParagraphMarkers = rawParagraphs.map((p, i) => {
                // Add internal line numbers for reference within the paragraph
                const markedLines = p.split('\n').map((line, li) => `L${li + 1}: ${line}`).join('\n');
                return `### PARAGRAPH ${i + 1} ###\n${markedLines}`;
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
                  "reasoning": "Brief explanation.",
                  "confidence": "High | Medium | Low"
                },
                "deepAnalysis": {
                  "overallAssessment": "High-level summary.",
                  "strategicImprovements": ["${type === 'Awardee Sample' ? 'Takeaway 1' : 'Imp 1'}", "..."]
                },
                "globalSummary": "A brief summary.",
                "paragraphBreakdown": [
                { 
                    "paragraph_number": 1,
                    "functional_label": "e.g. Hook",
                    "analysis_current": "What this paragraph does.",
                    "main_idea": "Summary of this paragraph.",
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
    model = "gpt-4o" // Add model param
) => {
    // FALLBACK: Client-Side Execution for Local Development
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY && model !== 'perplexity') {
        try {
            console.log(`Running Local Chat Message with ${model}...`);
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            let systemPrompt = `You are an elite Scholarship Consultant for Scholarstory. Your goal is to guide the user to write a "Gold Standard" essay using the **Scholarstory Master Framework**.
            
            **CRITICAL ASSUMPTION**:
            - ALWAYS assume the user is applying for a Master's degree (S2) or a tertiary scholarship.
            - EVERY response you provide MUST incorporate strong **academic values** (e.g., research potential, advanced theoretical application, academic contribution) to strengthen their scholarship application.

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

            **YOUR ROLE**:
            - Analyze the user's text against this framework.
            - **Critique** heavily if they are generic.
            - **Suggest** specific structural pivots (e.g., "Shift this to Phase 2").
            - **Validation**: Check if they pass the "Specificity Test" (Can anyone else write this?).

            **Interaction Mode**:
            - If the user asks for feedback, refer to the "Phase" they are in.
            - Be direct, professional, yet encouraging.
            - If they provide text, identify which Phase it belongs to and score it against the Pillars.

            **SPECIAL INSTRUCTION: OUTLINE GENERATION**:
            If the user asks for an outline, structure, or "kerangka" (especially for scholarships like LPDP), you MUST generate it using the **4 Phases** of the Master Framework defined above.
            **Format your response using Markdown headers**:
            ## Phase 1: [Phase Name]
            ...
            ## Phase 2: [Phase Name]
            ...
            (and so on).
            Do not deviate from this structure for outlines.

            Document Content:
            ---
            ${documentContent || '(Empty)'}
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

    // SERVER-SIDE Execution (Production)
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, documentContent, model }),
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

            **Constraint**: Keep it concise. No preamble.
            
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
