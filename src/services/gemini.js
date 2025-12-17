import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the key from environment variables
// You need to create a .env file in the root directory and add: VITE_GEMINI_API_KEY=your_key_here
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
  console.log("Gemini API Key found (starts with):", API_KEY.substring(0, 4) + "...");
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
  console.error("Gemini API Key is MISSING in src/services/gemini.js");
  console.log("Current Environment Variables:", import.meta.env);
}

export const runRealAnalysis = async (text, type = "General Essay", instruction = null, context = null) => {
  if (!model) {
    console.warn("Gemini API Key is missing. Using mock data.");
    return null; // Signal to fallback to mock
  }

  try {
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

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await result.response;
    const textResponse = response.text();

    // Clean up markdown code blocks if present to parse JSON
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Gemini response:", textResponse);
      throw e;
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
