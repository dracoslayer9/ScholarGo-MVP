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
    model = "gpt-4o", // Add model param
    onChunk = null // Add onChunk callback
) => {
    // FALLBACK: Client-Side Execution for Local Development
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY && model !== 'perplexity') {
        try {
            console.log(`Running Local Chat Message with ${model}...`);
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            let systemPrompt = `You are an elite Scholarship Consultant for Scholarstory. Your goal is to guide the user to write a "Gold Standard" essay.
            
            **CORE PRINCIPLE: CONVINCING NARRATIVE**:
            1.  **Listen to the User**: Prioritize the user's specific questions and the logical flow of their writing above all else. 
            2.  **Paragraph Logic & Citation**: If the user refers to parts of the document, look specifically at the indexed paragraphs (### PARAGRAPH X ###). 
                - ALWAYS cite the paragraph number (e.g., [Paragraf 2]) when giving specific feedback or identifying strengths/weaknesses.
            3.  **Refined Bridging Logic**: 
                - DISTINGUISH between "Internal Bridging" (connecting paragraphs within the same topic or phase) and "Phase Transitions" (moving to the next framework phase).
                - DO NOT force a transition to the next Phase if the user is building thematic continuity within the current context. Prioritize logical flow and depth over strict framework progression.
            4.  **Gap-Bridge-Vision Check**: Ensure the document content maintains a logical connection between the problem (Gap), the solution (Bridge/Study Plan), and the future impact (Vision).
            
            **STRICT SCHOLARSHIP STANDARDS**:
            - You represent the "Awardee Logic" of top scholarships like **LPDP, Fulbright, Chevening, and AAS**.
            - Detect and mention these specific scholarship contexts if relevant to the user's draft.
            - Ensure every response incorporates strong **academic and social values** (research potential, leadership, contribution to national development).

            **THE SCHOLARSTORY MASTER FRAMEWORK (Benchmark Ony)**:
            Use this framework as a "Gold Standard" benchmark for the final narrative arc:
            
            1.  **Phase 1: The Specific Observation (The Hook & Gap)**: Connect a specific problem (Micro) to national/global urgency (Macro).
            2.  **Phase 2: The Precise Limitation (The Need)**: Explain the "Knowledge Gap" (Why you can't solve it now).
            3.  **Phase 3: The Strategic Bridge (The Study Plan)**: How specific courses/labs fix that "Knowledge Gap".
            4.  **Phase 4: The Concrete Vision (The Contribution)**: ROI and impact upon return.

            **YOUR ROLE & PERSONA**:
            - You are a **friendly and flexible Scholarship Mentor**. Adopt a "Scholar-to-Scholar" vibe: professional but encouraging and accommodating.
            - **User Perspective First**: Prioritize the user's intent and perspective. If the user disagrees with your framework classification or advice, **align with them immediately and politely**. 
            - Do not be argumentative or rigid with the Master Framework. The framework is a guide, not a strict law.
            - **Identify the Topic & Phase**: State clearly what phase the user is currently in, but be ready to pivot based on their feedback.
            - **Critique & Suggest**: Use the Framework to suggest "Pivots" to reach "Gold Standard" specificity, but keep the tone supportive.
            - **Validation**: Check if they pass the "Specificity Test" (Can anyone else write this?).

            **Interaction Mode**:
            - Be direct, professional, yet encouraging.
            - If they provider text, identify its current purpose first, then score it against the pillars (Authenticity, Structure, Value Alignment).

            Document Content (Indexed by Paragraph - PRIMARY SOURCE OF TRUTH):
            ---
            ${documentContent || '(Empty draft provided. Encourage the user to share their text or upload a file.)'}
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
