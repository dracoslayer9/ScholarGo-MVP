import * as OpenAI from './openai';
import * as Gemini from './gemini';

// Facade for Analysis
export const runRealAnalysis = async (text, provider = "openai", instruction, context, signal = null) => {
    console.log(`[Analysis] Using provider: ${provider}`);
    if (provider === 'gemini') {
        return await Gemini.runRealAnalysis(text, instruction, context, signal);
    }
    // Default to OpenAI
    return await OpenAI.runRealAnalysis(text, "General Essay", instruction, context, signal);
};

// Facade for Chat
export const sendChatMessage = async (message, history, documentContent, provider = "openai", signal = null) => {
    console.log(`[Chat] Using provider: ${provider}`);
    if (provider === 'gemini') {
        return await Gemini.sendChatMessage(message, history, documentContent, signal); // Assuming Gemini is updated similarly
    }
    return await OpenAI.sendChatMessage(message, history, documentContent, signal);
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
export const runAnalysis = async (text, preferredModel = 'openai', instruction = null, context = null) => {
    return await runRealAnalysis(text, preferredModel, instruction, context);
};
