import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const r = await client.responses.create({
      model: "gpt-4o-mini",
      input: "Say OK"
    });

    return res.status(200).json({ result: r.output_text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
