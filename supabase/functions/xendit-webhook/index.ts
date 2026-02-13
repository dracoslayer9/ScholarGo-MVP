import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

        // Xendit sends 'status' in the body
        const { status, external_id, paid_at } = payload

        console.log('Webhook received:', payload)

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Update Transaction Status
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('transactions')
            .update({
                status: status.toLowerCase(),
                updated_at: new Date().toISOString()
            })
            .eq('external_id', external_id)
            .select()
            .single()

        if (txError) throw txError
        if (!transaction) throw new Error('Transaction not found')

        // 2. If PAID, update User Subscription
        if (status === 'PAID') {
            // Calculate expiration (e.g., 30 days from now)
            const validUntil = new Date()
            validUntil.setDate(validUntil.getDate() + 30)

            const { error: subError } = await supabaseAdmin
                .from('profiles') // Assuming 'profiles' table holds plan info. Check schema!
                .update({
                    plan_type: 'plus',
                    valid_until: validUntil.toISOString()
                })
                .eq('id', transaction.user_id)

            if (subError) throw subError
        }

        return new Response(
            JSON.stringify({ message: 'Webhook processed' }),
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
