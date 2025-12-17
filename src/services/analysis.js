import { runRealAnalysis as runGeminiAnalysis } from './gemini';
import { runRealAnalysis as runOpenAIAnalysis } from './openai';

export const runAnalysis = async (text, preferredModel = 'openai', type = "General Essay", instruction = null, context = null) => {
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Gemini temporarily removed from primary flow requirements

    // Helper to try OpenAI
    const tryOpenAI = async () => {
        // We let the OpenAI service handle the key missing check internally if we want, 
        // but here we check for the env var to be safe.
        // Actually, let's trust the service's robust handling we added earlier.
        console.log("Using OpenAI for analysis...");
        return await runOpenAIAnalysis(text, type, instruction, context);
    };

    // Helper to try Gemini (Disabled for now in primary logic unless explicitly requested and key exists)
    const tryGemini = async () => {
        // Placeholder for when we add Gemini back
        throw new Error("Gemini analysis is currently disabled to focus on OpenAI.");
    };

    try {
        // Enforce OpenAI for now regardless of preferredModel to debug
        return await tryOpenAI();
    } catch (error) {
        console.error(`${preferredModel} Analysis failed, attempting fallback...`, error);

        // Fallback logic
        try {
            if (preferredModel === 'openai') {
                // Fallback to Gemini
                if (geminiKey) return await tryGemini();
            } else {
                // Fallback to OpenAI
                if (openAIKey) return await tryOpenAI();
            }
        } catch (fallbackError) {
            console.error("Fallback Analysis failed:", fallbackError);
        }

        // If everything fails, throw the original error
        throw error;
    }
};
