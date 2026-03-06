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

        let openaiClient;
        let requestModel = "gpt-4o";

        if (model === "perplexity") {
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
            requestModel = "gpt-4o";
        }

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        let ragContext = "";

        // PROACTIVE RAG PIPELINE
        if (documentContent && documentContent.trim().length > 50 && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

        let systemPrompt = "";

        if (model === "perplexity") {
            // Neutral prompt for Perplexity comparison
            systemPrompt = `You are a helpful and objective research assistant.
            Answer the user's questions neutrally without enforcing any specific writing frameworks or structural rules.
            
            **CRITICAL INSTRUCTION**: 
            When asked for recommendations (e.g., universities, programs, or institutions), your default scope MUST always be **GLOBAL** (worldwide). Do not restrict your answers to the user's local region or country (e.g., Indonesia) unless the user specifically and explicitly requests it.
            
            Document Content:
            "${documentContent}"
            ${ragContext}
            `;
        } else {
            // Strict Master Framework for GPT-4o
            systemPrompt = `You are an elite Scholarship Consultant for Scholarstory. Your goal is to guide the user to write a "Gold Standard" essay using the **Scholarstory Master Framework**.
                
            **CRITICAL ASSUMPTION**:
            - ALWAYS assume the user is applying for a Master's degree (S2) or a tertiary scholarship.
            - EVERY response you provide MUST incorporate strong **academic values** (e.g., research potential, advanced theoretical application, academic contribution) to strengthen their scholarship application.

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

            **SELF-REFINE & ANTI-HALLUCINATION (CRITICAL RULE)**:
            Before you output your final response, internally check: "Does this answer EXACTLY what the user asked?"
            1. **DO NOT give unsolicited university recommendations** (like Monash, NUS, etc.) unless the user EXPLICITLY asks for "Campus Match" or "Rekomendasi Kampus". If they just ask for a review, ONLY give a review.
            2. **DO NOT invent examples** that stray far from the user's text unless explaining a specific writing tactic.
            3. If the user asks for a review/feedback on a draft, provide ONLY the critique based on the 3 Pillars and Framework Phases. DO NOT add extra unrelated sections.

            **Document Content**:
            "${documentContent}"
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

        const messages = [
            { role: "system", content: systemPrompt },
            ...sanitizedHistory
        ];

        const completion = await openaiClient.chat.completions.create({
            model: requestModel,
            messages: messages,
            temperature: 0.7,
        });

        const result = completion.choices[0].message.content;
        return res.status(200).json({ result });

    } catch (error) {
        console.error("Server Chat Failed:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
