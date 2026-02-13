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

        // Ensure email is valid or provide a fallback for Xendit
        const userEmail = session.user.email || `user_${session.user.id.substring(0, 8)}@placeholder.scholargo.com`;

        // Call Supabase Edge Function 'create-xendit-invoice'
        const { data, error } = await supabase.functions.invoke('create-xendit-invoice', {
            body: {
                planType,
                userId: session.user.id,
                email: userEmail
            }
        });

        if (error) {
            console.error('Edge Function Error:', error);

            let message = error.message || 'Unknown error';

            // Aggressive Error Extraction
            if (error.context) {
                try {
                    // Try to get text first (safer than json() if empty)
                    const rawText = await error.context.text();
                    console.log("Raw Edge Error Text:", rawText);

                    try {
                        const body = JSON.parse(rawText);
                        // If my Edge Function returns { error: "..." }
                        if (body.error) message = typeof body.error === 'object' ? JSON.stringify(body.error) : body.error;
                        // If my Edge Function returns { message: "..." }
                        else if (body.message) message = body.message;
                        else message = rawText;
                    } catch (jsonErr) {
                        // Not JSON, use raw text
                        if (rawText) message = rawText;
                    }
                } catch (e) {
                    console.error("Failed to read error context:", e);
                }
            }

            throw new Error(message);
        }

        if (!data || !data.invoice_url) {
            throw new Error(data?.error || 'No invoice URL returned');
        }

        return data;
    } catch (error) {
        console.error('Error creating transaction:', error);
        // AUTO-FIX: Invalid JWT / 401
        if (error.code === '401' || (error.message && error.message.includes('JWT'))) {
            await supabase.auth.signOut();
            window.location.reload(); // Hard reload to clear state
        }
        throw error;
    }
};
