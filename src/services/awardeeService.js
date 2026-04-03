import OpenAI from 'openai';

/**
 * Analyzes an awardee's review of an essay to extract "Narrative DNA".
 * This DNA is used to refine the system's own advice and drafting logic.
 */
export const extractAwardeeDNA = async (reviewText) => {
    if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            });

            const systemPrompt = `
You are a "Narrative DNA" Architect. Your goal is to analyze a feedback/review written by a successful Scholarship Awardee and distill their "Winning Logic" into a structured format.

**TASK**:
Identify the specific, high-level patterns this awardee looks for.
1. **Stylistic DNA**: (e.g., Use of sensory metaphors, punchy endings, active voice).
2. **Structural DNA**: (e.g., Specific placement of the "Gap", how they bridge career to social impact).
3. **Redlines**: (What do they HATE or consider "Generic"?).
4. **Actionable Instructions**: Convert their feedback into 3-5 "Strict Rules" that our AI should follow.

**Output (JSON)**:
{
    "awardee_persona": "Description of the awardee's critique style",
    "stylistic_dna": ["trait 1", "trait 2"],
    "structural_dna": ["rule 1", "rule 2"],
    "forbidden_patterns": ["generic phrase to avoid", "cliché approach"],
    "system_prompt_injection": "A paragraph of instruction to be added to the AI's system prompt to mirror this style."
}
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Review Text to Analyze:\n"""\n${reviewText}\n"""` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error("Awardee DNA Extraction Failed:", error);
            throw error;
        }
    }
    return null;
};
