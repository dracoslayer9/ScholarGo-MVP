/* eslint-env node */
/* global process */
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const systemPrompt = `You are an expert writing analyst.
            
    **TASK**: Analyze the selected text snippet using the "Insight Card" format.
    **FORMAT STRICTLY**:
    1. **Main Idea**: [What is this text saying?]
    2. **Approach**: [What writing technique is used?]
    3. **Implication**: [What does this suggest about the writer?]

    **Constraint**: Keep it concise. No preamble.
    
    Selected Text:
    "${text}"
    `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze this paragraph: \n"${text}"` }
            ],
            temperature: 0.5,
        });

        const result = completion.choices[0].message.content;
        return res.status(200).json({ result });

    } catch (error) {
        console.error("Server Insight Failed:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
