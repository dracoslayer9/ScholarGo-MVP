import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history = [], documentContent = "" } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        let systemPrompt = `You are a structural analysis assistant. You have defined a set of "Structural Cards" for the user's document.
            
    **CONTEXT**:
    The user is looking at a breakdown of their essay into "cards" with:
    - Paragraph Number
    - Current Approach
    - Main Idea
    - Evidence

    **GUIDELINES**:
    1. **Interaction Mode**: Answer questions by referencing specific cards.
    2. **References**: Always cite the Paragraph Number.
    3. **Concise and Clear**: Keep PURELY informational/fact-based answers concise.
    4. **MANDATORY CARD FORMAT**: If the user asks for analysis (e.g., "Analisis semua"), YOU MUST use this specific format for EACH paragraph. **Separate each paragraph card clearly**.

       **Paragraf [Nomor]**
       1. **Gagasan Utama**: [Ide pokok dalam 1 kalimat padat]
       2. **Pengembangan Ide**: [Penjelasan teknik penulisan: Naratif/Data/Rencana Aksi]
       3. **Bukti Kalimat**: "[Kutipan teks asli]"

    5. **RESEARCH MODE**: If the user asks for "Research" or "Riset" (verification):
       - **MANDATORY CARD FORMAT**: You MUST output the research result in this specific "Research Insight" card format:
         
         **Research Insight**
         1. **Validation Summary**: [Bold Header: Summary of claim validity or news context]
         2. **Background Info**: [Bullet points of relevant background info]
         3. **References**: [List of 2-3 links: [Source Name](URL)]

       - **Logic**: Identify claims -> Simulate/Connect to external knowledge -> Verify validity.

    **Document Content**:
    "${documentContent}"
    `;

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

        const messages = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
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
