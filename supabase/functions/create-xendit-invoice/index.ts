import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Request received");

        // 1. Parse Body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error("Failed to parse request body:", e);
            throw new Error("Invalid Request Body");
        }
        const { planType, userId, email } = body;
        console.log("Payload:", { planType, userId, email });

        // --- AUTH CHECK & DEBUG ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing Authorization Header', debug: { receivedTokenPrefix: 'NONE' } }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        // Create a client specifically to validate the user token
        const supabaseClient = createClient(
            supabaseUrl ?? '',
            supabaseAnonKey ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError) {
            console.error("User Auth Failed:", userError);
            return new Response(
                JSON.stringify({
                    error: "Auth Failed: " + userError.message,
                    debug: {
                        receivedTokenPrefix: authHeader?.replace('Bearer ', '').substring(0, 5),
                        serverAnonKeyPrefix: supabaseAnonKey?.substring(0, 5),
                        errorDetails: userError
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }
        // ---------------------------

        // 2. Check Configuration
        const xenditSecret = Deno.env.get('XENDIT_SECRET_KEY')
        if (!xenditSecret) {
            console.error("Missing XENDIT_SECRET_KEY");
            throw new Error('Server Key configuration missing')
        }

        // 3. Setup Supabase Admin
        // supabaseUrl already retrieved above
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("Missing Supabase Configuration (URL or Service Role Key)");
            throw new Error('Database configuration missing');
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 4. Create Xendit Invoice
        const externalId = `inv_${Date.now()}_${userId.substring(0, 8)}`
        const amount = 49000

        console.log("Creating Xendit Invoice...", { externalId, amount });

        const response = await fetch('https://api.xendit.co/v2/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(xenditSecret + ':')
            },
            body: JSON.stringify({
                external_id: externalId,
                amount: amount,
                payer_email: email,
                description: `Upgrade to ScholarGo ${planType}`,
                success_redirect_url: 'http://localhost:5173/?payment=success',
                failure_redirect_url: 'http://localhost:5173/?payment=failed'
            })
        })

        const invoice = await response.json()
        console.log("Xendit Response:", invoice);

        if (!invoice.invoice_url) {
            console.error('Xendit Logic Error:', invoice)
            // Throw full error object to see validation details (e.g. invalid email format)
            throw new Error('Xendit Failed: ' + JSON.stringify(invoice))
        }

        // 5. Save to Database
        console.log("Saving to DB...");

        // Verify table exists first (optional check)
        // const { error: tableCheck } = await supabaseAdmin.from('transactions').select('count').limit(1);
        // if (tableCheck) console.error("Table Check Error:", tableCheck);

        const { error: dbError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: userId,
                external_id: externalId,
                amount: amount,
                status: 'pending',
                payment_link: invoice.invoice_url
            })

        if (dbError) {
            console.error("DB Insert Error:", dbError);
            throw new Error("Database Write Failed: " + dbError.message);
        }

        console.log("Success!");

        return new Response(
            JSON.stringify({ invoice_url: invoice.invoice_url, external_id: externalId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('CRITICAL FUNCTION ERROR:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
