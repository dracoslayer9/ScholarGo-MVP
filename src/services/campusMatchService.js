import { supabase } from '../lib/supabaseClient';

/**
 * Perform a vector search against the university_knowledge_base
 * @param {string} userBackground - The background text input by the user (max 75 words limit handled in UI)
 * @returns {Promise<Array>} List of matched universities with AI reasoning
 */
export const matchWithUniversities = async (userBackground) => {
    try {
        console.log("1. Generating embedding for user query...");

        // We reuse the analyzeParagraphInsight function or similar to fetch from our proxy,
        // or we need a new Edge Function to securely generate the search embedding.
        // Let's create a Supabase Edge Function `campus-match` that handles both
        // embedding generation and Supabase RPC matching so we don't expose OpenAI keys.

        const { data, error } = await supabase.functions.invoke('campus-match', {
            body: { query: userBackground }
        });

        if (error) {
            console.error("Error invoking campus-match function:", error);
            throw error;
        }

        if (!data || !data.matches) {
            throw new Error("No matches returned from the server.");
        }

        return data.matches;

    } catch (err) {
        console.error("Campus Match Service Error:", err);
        throw err;
    }
};
