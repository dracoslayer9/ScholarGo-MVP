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

        // DEBUG: Check Config and Session (Restored for Localhost Debugging)
        // Using console.error to ensure it's visible even with error filters
        console.error("Transaction Debug [Build " + new Date().toISOString() + "]:", {
            url: import.meta.env.VITE_SUPABASE_URL,
            keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 5),
            hasSession: !!session,
            tokenPrefix: session?.access_token?.substring(0, 5),
            user: session?.user?.id
        });

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

        // REMOVED: Auto-logout on 401/JWT error per user request.
        // We now just throw the error so the UI can show a specific message.
        /* 
        if (error.code === '401' || (error.message && error.message.includes('JWT'))) {
            await supabase.auth.signOut();
            window.location.reload(); 
        }
        */
        throw error;
    }
};
