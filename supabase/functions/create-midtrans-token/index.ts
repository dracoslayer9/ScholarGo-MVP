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
        // 1. Validate User (Supabase Auth)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            console.error("Auth Error:", userError);
            throw new Error('Unauthorized');
        }

        // 2. Parse Request Body
        const { planType, userId, email } = await req.json();

        // 3. Prepare Midtrans Payload
        // Generate a unique Order ID
        const orderId = `ORDER-${userId.substring(0, 8)}-${Date.now()}`;
        const amount = planType === 'plus' ? 49000 : 0;

        if (amount === 0) {
            throw new Error("Invalid plan type or amount");
        }

        const midtransPayload = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount
            },
            customer_details: {
                email: email,
                first_name: "ScholarGo",
                last_name: "User"
            },
            item_details: [
                {
                    id: planType,
                    price: amount,
                    quantity: 1,
                    name: "ScholarGo Plus Subscription"
                }
            ]
        };

        // 4. Call Midtrans Snap API
        // Production URL: https://app.midtrans.com/snap/v1/transactions
        // Sandbox URL: https://app.sandbox.midtrans.com/snap/v1/transactions
        // We use Production as per user keys
        const midtransUrl = "https://app.midtrans.com/snap/v1/transactions";
        const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') || '';

        // Basic Auth: base64(serverKey + ":")
        const authString = btoa(serverKey + ":");

        console.log("Calling Midtrans...", midtransUrl);

        const midtransResponse = await fetch(midtransUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authString}`
            },
            body: JSON.stringify(midtransPayload)
        });

        const midtransData = await midtransResponse.json();
        console.log("Midtrans Response:", midtransData);

        if (!midtransResponse.ok) {
            throw new Error(`Midtrans Error: ${JSON.stringify(midtransData)}`);
        }

        // 5. Store Transaction in Supabase (Pending)
        // We need to create a 'transactions' table entry to track this orderId
        // This allows the webhook to verify and update the correct user
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { error: dbError } = await supabaseAdmin
            .from('transactions')
            .insert([{
                user_id: userId,
                external_id: orderId, // We use external_id to store orderId
                amount: amount,
                status: 'pending',
                payment_method: 'midtrans', // differentiate
                plan_type: planType
            }]);

        if (dbError) {
            console.error("Failed to save transaction:", dbError);
            // We generally shouldn't fail the user flow if logging fails, but it's risky.
            // For now, logged error.
        }

        // 6. Return Token to Frontend
        return new Response(
            JSON.stringify({
                token: midtransData.token,
                redirect_url: midtransData.redirect_url
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
