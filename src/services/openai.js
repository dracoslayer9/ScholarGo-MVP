// Initialize the API with the key from environment variables
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const runRealAnalysis = async (text, type = "General Essay", instruction = null, context = null) => {
    // Check key validity
    if (!API_KEY) {
        console.warn("OpenAI API Key is missing. Using mock data.");
        return null;
    }

    try {
        console.log("Preparing OpenAI Request (Fetch)...", { type, instructionPresent: !!instruction, contextPresent: !!context });

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

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Cost-effective and capable model
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7,
            })
        });

        const duration = Date.now() - start;
        console.log(`OpenAI Request completed in ${duration}ms`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const status = response.status;

            console.error(`OpenAI API Error [${status}]:`, errorData);

            if (status === 401) {
                throw new Error("Invalid OpenAI API Key. Please check your configuration.");
            } else if (status === 429) {
                throw new Error("OpenAI Quota Exceeded. Please check your billing details.");
            } else if (status >= 500) {
                throw new Error("OpenAI Service is currently unavailable. Please try again later.");
            }
            throw new Error(errorData.error?.message || `OpenAI Request Failed with status ${status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (!content) {
            throw new Error("Received empty response from OpenAI.");
        }

        try {
            return JSON.parse(content);
        } catch {
            console.error("JSON Parse Error on OpenAI Response:", content);
            throw new Error("Failed to parse analysis results. Please try again.");
        }

    } catch (error) {
        // Log unexpected errors
        console.error("Error in OpenAI Service:", error);
        throw error;
    }
};
