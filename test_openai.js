const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.VITE_OPENAI_API_KEY,
});

async function main() {
    try {
        console.log("Testing OpenAI API Key...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Hello, reply with just 'OK'" }],
        });
        console.log("Success! Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("API Error:");
        console.error("Status:", error.status);
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Type:", error.type);
    }
}

main();
