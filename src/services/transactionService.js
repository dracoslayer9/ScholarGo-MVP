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

        // DEBUG: Check Config and Session (Restored for Localhost Debugging)
        // Using console.error to ensure it's visible even with error filters
        console.error("Transaction Debug [Build " + new Date().toISOString() + "]:", {
            url: import.meta.env.VITE_SUPABASE_URL,
            keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 5),
            hasSession: !!session,
            tokenPrefix: session?.access_token?.substring(0, 5),
            user: session?.user?.id
        });

        // Debug Context for UI
        const debugContext = {
            url: import.meta.env.VITE_SUPABASE_URL,
            keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 5),
            tokenPrefix: session?.access_token?.substring(0, 5)
        };

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
        console.error('Error creating transaction (SDK):', error);

        // FALLBACK: Try Direct Fetch to debug "Failed to send request" errors
        // This bypasses sdk wrappers that might hide the real response/status
        try {
            console.warn("Attempting Raw Fetch Fallback...");
            const currentSession = sessionDebug;

            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-xendit-invoice`;

            const rawResponse = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentSession?.access_token}`
                },
                body: JSON.stringify({
                    planType,
                    userId: currentSession?.user?.id,
                    email: currentSession?.user?.email
                })
            });

            const rawText = await rawResponse.text();
            console.log("Raw Fetch Response:", rawResponse.status, rawText);

            if (!rawResponse.ok) {
                // Throw a more descriptive error from the raw response
                const statusPrefix = `Raw Fetch Failed (${rawResponse.status})`;
                error.message = `${statusPrefix}: ${rawText.substring(0, 200)}`;
            } else {
                // If raw fetch succeeded (odd), return parsed
                const rawData = JSON.parse(rawText);
                if (rawData.invoice_url) return rawData;
            }

        } catch (fetchError) {
            console.error("Raw Fetch also failed:", fetchError);
            // Use the raw fetch error message if it's more descriptive
            if (fetchError.message && fetchError.message.includes('Raw Fetch Failed')) {
                error.message = fetchError.message;
            }
        }

        // Attach debug context if available
        error.debugContext = {
            url: import.meta.env.VITE_SUPABASE_URL,
            keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 5),
            tokenPrefix: sessionDebug?.access_token?.substring(0, 5) || 'NONE'
        };

        throw error;
    }
};
