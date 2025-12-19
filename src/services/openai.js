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

            let systemPrompt = `You are an elite academic scholarship consultant (like a Harvard admissions officer). Analyze the following ${type}.
            
            Evaluate the writing based on strict analysis rules:
            1. **Subtitle Extraction**: If a paragraph contains a clear subtitle or heading, extract it EXACTLY as written.
            2. **Functional Labeling**: If no subtitle exists, infer and assign a concise FUNCTIONAL label (e.g. Introduction, Motivation, Academic Background, Leadership Experience, Career Goals, Conclusion).
            3. **No Invented Subtitles**: Do NOT invent subtitles that sound like essay content. Labels must describe function, not rewrite the text.
            4. **Independent Analysis**: Analyze every paragraph independently, even if ideas overlap.
            5. **Tone**: Be neutral, precise, and reviewer-oriented — avoid motivational or generic feedback.
            6. **Fidelity Check**: Double-check that any extracted quotes exist EXACTLY in the provided text. Do not hallucinate words.
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
                "globalSummary": "A 2-3 sentence high-level summary of the essay's core strength, main theme, and one key area for improvement.",
                "paragraphBreakdown": [
                { 
                    "section": "Introduction/Hook", 
                    "role": "one word role (e.g. Hook, Context, Thesis)",
                    "purpose": "A strategic sentence explaining the narrative purpose of this paragraph",
                    "main_idea": "Summary of the content",
                    "evidence_quote": "Exact verbatim quote from the paragraph that best supports the main idea",
                    "strength": "What is working well here",
                    "status": "strong" 
                },
                { 
                    "section": "Body Paragraph 1", 
                    "role": "one word role (e.g. Argument, Evidence, Story)",
                    "purpose": "A strategic sentence explaining the narrative purpose",
                    "main_idea": "Summary of the content",
                    "evidence_quote": "Exact verbatim quote from the paragraph that best supports the main idea",
                    "strength": "What is working well here",
                    "status": "strong" 
                },
                {
                    "section": "Conclusion", 
                    "role": "Conclusion",
                    "purpose": "How this resolves the narrative arc",
                    "main_idea": "Summary of final thoughts",
                    "evidence_quote": "Exact verbatim quote from the paragraph that best supports the main idea",
                    "strength": "What is working well here",
                    "status": "strong" 
                }
                ]
            }

            IMPORTANT: You MUST analyze EVERY single paragraph in the essay, from the very first to the very last. 
            - Do not skip any paragraphs.
            - First paragraph is usually the Hook/Introduction.
            - Last paragraph is the Conclusion.
            - Label them sequentially (Introduction, Body Paragraph 1, Body Paragraph 2... Conclusion).

            Essay Content:
            "${text || ''}"
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
