import { supabase } from '../lib/supabaseClient';

/**
 * Creates a Xendit Invoice via Supabase Edge Function
 * @param {string} planType - 'plus'
 * @returns {Promise<{invoice_url: string, external_id: string}>}
 */
export const createTransaction = async (planType = 'plus') => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');

        // Call Supabase Edge Function 'create-xendit-invoice'
        const { data, error } = await supabase.functions.invoke('create-xendit-invoice', {
            body: {
                planType,
                userId: session.user.id,
                email: session.user.email
            }
        });

        if (error) throw error;
        if (!data.invoice_url) throw new Error('No invoice URL returned');

        return data;
    } catch (error) {
        console.error('Error creating transaction:', error);
        throw error;
    }
};
