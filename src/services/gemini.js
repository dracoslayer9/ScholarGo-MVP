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
    type = "General Essay",
    instruction = null,
    context = null
) => {
    try {
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
    documentContent = ""
) => {
    try {
        console.log("Running Gemini Chat...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let systemPrompt = `You are a Senior Reviewer Beasiswa (Scholarship Reviewer). Your task is to analyze the document paragraph by paragraph objectively and professionally.
            
        **CONTEXT**:
        The user is looking at a breakdown of their essay into "cards" with:
        - Paragraph Number
        - Current Approach
        - Main Idea
        - Evidence

        **GUIDELINES**:
        1. **Interaction Mode**: Answer questions by referencing specific cards.
        2. **References**: Always cite the Paragraph Number.
        3. **Concise and Clear**: Keep PURELY informational/fact-based answers concise.
        4. **MANDATORY CARD FORMAT**: If the user asks for analysis (e.g., "Analisis semua"), YOU MUST use this specific format for EACH paragraph. **Separate each paragraph card clearly**.

           **Paragraf [Nomor]**
           1. **Gagasan Utama**: [Ide pokok dalam 1 kalimat padat]
           2. **Pengembangan Ide**: [Penjelasan teknik penulisan: Naratif/Data/Rencana Aksi]
           3. **Bukti Kalimat**: "[Kutipan teks asli]"

        5. **RESEARCH MODE**: If the user asks for "Research" or "Riset" (verification):
           - **MANDATORY CARD FORMAT**: You MUST output the research result in this specific "Research Insight" card format:
             
             **Research Insight**
             1. **Validation Summary**: [Bold Header: Summary of claim validity or news context]
             2. **Background Info**: [Bullet points of relevant background info]
             3. **References**: [List of 2-3 links: [Source Name](URL)]

           - **Logic**: Identify claims -> Simulate/Connect to external knowledge -> Verify validity.

        **Document Content**:
        "${documentContent}"
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
