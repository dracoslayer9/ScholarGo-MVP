import { supabase } from '../supabaseClient';

export const createTransaction = async (planType = 'plus') => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');

        // Call Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('create-midtrans-transaction', {
            body: { planType, userId: session.user.id }
        });

        if (error) throw error;
        return data; // Should contain { token, redirect_url }
    } catch (error) {
        console.error('Error creating transaction:', error);
        throw error;
    }
};
