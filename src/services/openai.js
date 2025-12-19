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
            
            Evaluate the writing based on high-level admissions criteria:
            1. **Narrative Arc**: Does the story have a clear beginning, inflection point, and growth?
            2. **"Show, Don't Tell"**: Does the author provide specific examples or just general statements?
            3. **Authenticity & Vulnerability**: Is the voice unique and honest?
            4. **Future Impact**: Does the essay clearly connect past experiences to future goals?
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
                    "strength": "What is working well here",
                    "critique": "Constructive feedback on what is missing or could be improved (be specific)",
                    "status": "strong" 
                },
                { 
                    "section": "Body Paragraph 1", 
                    "role": "one word role (e.g. Argument, Evidence, Story)",
                    "purpose": "A strategic sentence explaining the narrative purpose",
                    "main_idea": "Summary of the content",
                    "strength": "What is working well here",
                    "critique": "Constructive feedback on what is missing or could be improved (be specific)",
                    "status": "strong" 
                },
                {
                    "section": "Conclusion", 
                    "role": "Conclusion",
                    "purpose": "How this resolves the narrative arc",
                    "main_idea": "Summary of final thoughts",
                    "strength": "What is working well here",
                    "critique": "Constructive feedback on what is missing or could be improved (be specific)",
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
