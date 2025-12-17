import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text, instruction, context } = req.body || {};
    if (!text) return res.status(400).json({ error: "Missing 'text' in body" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are an expert scholarship application advisor.
Analyze the essay and return STRICT JSON with:
{
  "globalSummary": "...",
  "paragraphBreakdown": [
    { "section": "...", "role": "...", "main_idea": "...", "strength": "...", "status": "strong|needs_work" }
  ],
  "rewriteSuggestions": ["..."]
}

If context is provided, focus suggestions only on that part.

Instruction: ${instruction || "None"}
Context: ${context || "None"}

Essay:
${text}
`.trim();

    const r = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    return res.status(200).json({ result: r.output_text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
