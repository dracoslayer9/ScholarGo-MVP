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
