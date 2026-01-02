import * as OpenAI from './openai';
import * as Gemini from './gemini';

// Facade for Analysis
export const runRealAnalysis = async (text, provider = "openai", instruction, context) => {
    console.log(`[Analysis] Using provider: ${provider}`);
    if (provider === 'gemini') {
        return await Gemini.runRealAnalysis(text, "General Essay", instruction, context);
    }
    // Default to OpenAI
    return await OpenAI.runRealAnalysis(text, "General Essay", instruction, context);
};

// Facade for Chat
export const sendChatMessage = async (message, history, documentContent, provider = "openai") => {
    console.log(`[Chat] Using provider: ${provider}`);
    if (provider === 'gemini') {
        return await Gemini.sendChatMessage(message, history, documentContent);
    }
    return await OpenAI.sendChatMessage(message, history, documentContent);
};

// Facade for Paragraph Insight (Context Menu)
export const analyzeParagraphInsight = async (paragraphText, provider = "openai") => {
    console.log(`[Insight] Using provider: ${provider}`);
    if (provider === 'gemini') {
        return await Gemini.analyzeParagraphInsight(paragraphText);
    }
    return await OpenAI.analyzeParagraphInsight(paragraphText);
};

// Legacy Wrapper (if used elsewhere)
export const runAnalysis = async (text, preferredModel = 'openai', type = "General Essay", instruction = null, context = null) => {
    return await runRealAnalysis(text, preferredModel, instruction, context);
};
