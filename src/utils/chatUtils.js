/**
 * Generates a smart title from the initial message text.
 * @param {string} text - The message content.
 * @returns {string} - Generated title (3 keywords).
 */
export const generateSmartTitle = (text) => {
    // 1. Remove special chars & extra spaces
    const clean = text.replace(/[^\w\s]/gi, '').split(/\s+/);
    // 2. Filter distinct words, length > 2, max 3 words
    const unique = [...new Set(clean.filter(w => w.length > 2))].slice(0, 3);
    // 3. Join
    return unique.join(' ').replace(/\b\w/g, c => c.toUpperCase()) || "New Chat";
};

/**
 * Parses raw AI response to separate text and action chips.
 * Action chips format:
 * :::actions
 * [label](action_id) | [label](action_id)
 * :::
 * @param {string} rawText - Raw AI output.
 * @returns {object} - { text: string, actions: Array<{ label: string, actionId: string }> }
 */
export const parseAIResponse = (rawText) => {
    if (!rawText) return { text: "", actions: [] };

    const actionsRegex = /:::actions\s*([\s\S]*?)\s*:::/;
    const match = rawText.match(actionsRegex);

    if (!match) {
        return { text: rawText, actions: [] };
    }

    const cleanText = rawText.replace(actionsRegex, '').trim();
    const actionsString = match[1].trim();

    const actionParts = actionsString.split('|').map(part => part.trim()).filter(Boolean);
    const actions = actionParts.map(part => {
        const itemMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (itemMatch) {
            return {
                label: itemMatch[1].trim(),
                actionId: itemMatch[2].trim()
            };
        }
        return null;
    }).filter(Boolean);

    return { text: cleanText, actions };
};

