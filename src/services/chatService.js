import { supabase } from '../lib/supabaseClient';

/**
 * Creates a new chat session in the 'chats' table.
 * @param {string} userId - The UUID of the authenticated user.
 * @param {string} title - Title of the chat (default "New Chat").
 * @returns {Promise<Object>} - The created chat object.
 */
export const createChat = async (userId, title = "New Chat") => {
    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert([{ user_id: userId, title: title, payload: {} }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error creating chat:", error);
        throw error;
    }
};

/**
 * Fetches all chat sessions for a specific user, ordered by newest first.
 * @param {string} userId 
 * @returns {Promise<Array>} - List of chat objects.
 */
export const getUserChats = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching chats:", error);
        return [];
    }
};

/**
 * Fetches all messages for a specific chat session.
 * @param {string} chatId 
 * @returns {Promise<Array>} - List of message objects.
 */
/**
 * Fetches all messages for a specific chat session.
 * @param {string} chatId 
 * @returns {Promise<Array>} - List of message objects.
 */
export const getChatMessages = async (chatId) => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', chatId) // FIX: Changed from chat_id to session_id
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
};

/**
 * Saves a new message to the 'messages' table.
 * @param {string} chatId 
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content 
 * @returns {Promise<Object>} - The created message object.
 */
export const saveMessage = async (chatId, role, content) => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert([{ session_id: chatId, role, content }]) // FIX: Changed from chat_id to session_id
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error saving message:", error);
        // We don't throw here to avoid blocking the UI if persistence fails,
        // but depending on verify requirements we might want to alert.
        return null;
    }
};

/**
 * Updates the title of a chat (e.g., auto-generated from first message).
 * @param {string} chatId 
 * @param {string} title 
 * @returns {Promise<void>}
 */
export const updateChatTitle = async (chatId, title) => {
    try {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', chatId);

        if (error) throw error;
    } catch (error) {
        console.error("Error updating chat title:", error);
    }
};

/**
 * Deletes a chat session and its messages (via cascade).
 * @param {string} chatId 
 */
export const deleteChat = async (chatId) => {
    try {
        // Delete the session (Cascade will handle messages)
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', chatId);

        if (error) throw error;
    } catch (error) {
        console.error("Error deleting chat:", error);
        throw error;
    }
};
