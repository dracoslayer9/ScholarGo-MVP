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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const { planType, userId, email } = await req.json()
        const xenditSecret = Deno.env.get('XENDIT_SECRET_KEY')

        if (!xenditSecret) {
            throw new Error('Server Key not configured')
        }

        const externalId = `inv_${Date.now()}_${userId.substring(0, 8)}`
        const amount = 49000 // Fixed for now

        // 1. Create Invoice in Xendit
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
                success_redirect_url: 'http://localhost:5173/?payment=success', // Localhost for now
                failure_redirect_url: 'http://localhost:5173/?payment=failed'
            })
        })

        const invoice = await response.json()

        if (!invoice.invoice_url) {
            console.error('Xendit Error:', invoice)
            throw new Error('Failed to create invoice')
        }

        // 2. Save to Supabase Transactions
        // Note: We use the SERVICE_ROLE_KEY to bypass RLS for inserting if needed, 
        // but here we are authenticated as user, so RLS should allow insert if policy exists.
        // However, typically writes to 'transactions' might be restricted. 
        // Let's assume we can write with the user's client or use service role if needed.
        // Ideally, we use a Supabase client with Service Role for admin tasks.

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: dbError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: userId,
                external_id: externalId,
                amount: amount,
                status: 'pending',
                payment_link: invoice.invoice_url
            })

        if (dbError) throw dbError

        return new Response(
            JSON.stringify({ invoice_url: invoice.invoice_url, external_id: externalId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
