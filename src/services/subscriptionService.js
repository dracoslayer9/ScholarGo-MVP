import { supabase } from '../lib/supabaseClient';

export const PLAN_LIMITS = {
    free: {
        pdf_analysis: 3,
        chat: 20,
        deep_review: 3
    },
    plus: {
        pdf_analysis: 9999, // Unlimited
        chat: 9999,
        deep_review: 9999
    }
};

/**
 * Fetches the user's plan and usage profile.
 * If no profile exists, it creates a default 'free' profile.
 */
export const getUserSubscription = async (userId) => {
    try {
        let { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{
                    id: userId,
                    plan_type: 'free',
                    usage_pdf_analysis: 0,
                    usage_chat: 0,
                    usage_deep_review: 0
                }])
                .select()
                .single();

            if (createError) throw createError;
            return newProfile;
        }

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return null;
    }
};

/**
 * Checks if a user can perform an action based on their plan limits.
 * @param {string} userId 
 * @param {'pdf_analysis' | 'chat' | 'deep_review'} feature 
 * @returns {Promise<{ allowed: boolean, remaining: number, plan: string }>}
 */
export const checkUsageQuota = async (userId, feature) => {
    const profile = await getUserSubscription(userId);
    if (!profile) return { allowed: false, remaining: 0, plan: 'unknown' };

    const plan = profile.plan_type || 'free';
    const limit = PLAN_LIMITS[plan][feature];
    const currentUsage = profile[`usage_${feature}`] || 0;

    return {
        allowed: currentUsage < limit,
        remaining: Math.max(0, limit - currentUsage),
        plan
    };
};

/**
 * Increments the usage counter for a specific feature.
 * @param {string} userId 
 * @param {'pdf_analysis' | 'chat' | 'deep_review'} feature 
 */
export const incrementUsage = async (userId, feature) => {
    try {
        // We use an RPC call ideally, or just fetch-update for MVP simplicity
        // Optimistic locking not strictly required for this scale
        const profile = await getUserSubscription(userId);
        if (!profile) return;

        const currentUsage = profile[`usage_${feature}`] || 0;
        const { error } = await supabase
            .from('profiles')
            .update({ [`usage_${feature}`]: currentUsage + 1 })
            .eq('id', userId);

        if (error) throw error;
    } catch (error) {
        console.error(`Error incrementing ${feature}:`, error);
    }
};
