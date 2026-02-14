import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        console.log('Midtrans Webhook:', payload)

        const { order_id, status_code, gross_amount, transaction_status, signature_key, fraud_status } = payload

        // 1. Verify Signature
        const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? '';
        const dataToSign = order_id + status_code + gross_amount + serverKey;

        // Compute SHA512
        const encoder = new TextEncoder();
        const data = encoder.encode(dataToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (computedSignature !== signature_key) {
            console.error("Signature Mismatch!", { computed: computedSignature, received: signature_key });
            throw new Error("Invalid Signature");
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Determine Success
        let isSuccess = false;
        if (transaction_status == 'capture') {
            if (fraud_status == 'challenge') {
                // Deny logic or pending? Usually pending.
                isSuccess = false;
            } else if (fraud_status == 'accept') {
                isSuccess = true;
            }
        } else if (transaction_status == 'settlement') {
            isSuccess = true;
        } else if (transaction_status == 'deny' || transaction_status == 'cancel' || transaction_status == 'expire') {
            isSuccess = false;
        } else if (transaction_status == 'pending') {
            isSuccess = false; // Wait for settlement
        }

        console.log(`Transaction ${order_id} status: ${transaction_status} (Success: ${isSuccess})`);

        // 3. Update Transaction Record
        // We find the transaction by 'external_id' which matches 'order_id'
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('transactions')
            .update({
                status: transaction_status,
                updated_at: new Date().toISOString()
            })
            .eq('external_id', order_id)
            .select()
            .single()

        if (txError) {
            console.error("Transaction update failed:", txError);
            throw txError;
        }

        if (!transaction) throw new Error('Transaction not found in DB');

        // 4. Update Profile if Success
        if (isSuccess) {
            // Calculate expiration (30 days)
            const validUntil = new Date()
            validUntil.setDate(validUntil.getDate() + 30)

            const { error: subError } = await supabaseAdmin
                .from('profiles')
                .update({
                    plan_type: 'plus',
                    valid_until: validUntil.toISOString()
                })
                .eq('id', transaction.user_id)

            if (subError) {
                console.error("Profile update failed:", subError);
                throw subError;
            }
            console.log(`User ${transaction.user_id} upgraded to PLUS.`);
        }

        return new Response(
            JSON.stringify({ message: 'OK' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Webhook Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
