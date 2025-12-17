import OpenAI from 'openai';

// Initialize the API with the key from environment variables
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

console.log("Initializing OpenAI Client...");

// Directly initialize. If key is missing, OpenAI will throw on the first call which is fine.
const openai = new OpenAI({
    apiKey: API_KEY || "dummy", // Prevent crash on init if key missing, will fail on call
    dangerouslyAllowBrowser: true
});

export const runRealAnalysis = async (text, type = "General Essay", instruction = null, context = null) => {
    // OpenAI client is always initialized now, but we check key validity via API call or prior check
    if (!API_KEY) {
        console.warn("OpenAI API Key is missing. Using mock data.");
        return null;
    }

    try {
        console.log("Preparing OpenAI Request...", { type, instructionPresent: !!instruction, contextPresent: !!context });

        let systemPrompt = `You are an expert academic scholarship consultant. Analyze the following ${type}.`;

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
        "globalSummary": "A 2-3 sentence high-level summary of the essay's strength and main theme.",
        "paragraphBreakdown": [
          { 
            "section": "Introduction", 
            "role": "one word role (e.g. hook, context)",
            "main_idea": "one sentence main idea",
            "strength": "one short phrase strength",
            "status": "strong" 
          },
          { 
            "section": "Body Paragraph 1", 
            "role": "one word role",
            "main_idea": "one sentence main idea",
            "strength": "one short phrase strength",
            "status": "strong" 
          }
        ]
      }

      Essay Content:
      "${text}"
    `;

        const start = Date.now();
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini", // Cost-effective and capable model
            response_format: { type: "json_object" },
            temperature: 0.7, // Add temperature for consistent creativity
        });
        const duration = Date.now() - start;
        console.log(`OpenAI Request completed in ${duration}ms`);

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("Received empty response from OpenAI.");
        }

        try {
            return JSON.parse(content);
        } catch (jsonError) {
            console.error("JSON Parse Error on OpenAI Response:", content);
            throw new Error("Failed to parse analysis results. Please try again.");
        }

    } catch (error) {
        // Semantic Error Handling
        if (error instanceof OpenAI.APIError) {
            console.error(`OpenAI API Error [${error.status}]: ${error.code} - ${error.message}`);

            if (error.status === 401) {
                throw new Error("Invalid OpenAI API Key. Please check your configuration.");
            } else if (error.status === 429) {
                // Rate limit or Quota exceeded
                throw new Error("OpenAI Quota Exceeded. Please check your billing details.");
            } else if (error.status >= 500) {
                throw new Error("OpenAI Service is currently unavailable. Please try again later.");
            }
        } else {
            // Network errors or other issues
            console.error("Unexpected Error in OpenAI Service:", error);
        }

        // Re-throw to let the app handle the UI feedback
        throw error;
    }
};
