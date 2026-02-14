import { supabase } from '../lib/supabaseClient';

/**
 * Creates a Xendit Invoice via Supabase Edge Function
 * @param {string} planType - 'plus'
 * @returns {Promise<{invoice_url: string, external_id: string}>}
 */
export const createTransaction = async (planType = 'plus') => {
    // Capture session context early for debug use
    let sessionDebug = null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        sessionDebug = session;

        if (!session) throw new Error('User not authenticated');

        // Ensure email is valid or provide a fallback for Xendit
        const userEmail = session.user.email || `user_${session.user.id.substring(0, 8)}@placeholder.scholargo.com`;

        // Call Supabase Edge Function 'create-midtrans-token'
        const { data, error } = await supabase.functions.invoke('create-midtrans-token', {
            body: {
                planType,
                userId: session.user.id,
                email: userEmail
            }
        });

        if (error) {
            console.error('Edge Function Error:', error);
            let message = error.message || 'Unknown error';
            throw new Error(message);
        }

        if (!data || !data.token) {
            throw new Error('No Snap Token returned');
        }

        return data; // { token: "...", redirect_url: "..." }
    } catch (error) {
        console.error('Error creating transaction (Midtrans):', error);
        throw error;
    }
};
