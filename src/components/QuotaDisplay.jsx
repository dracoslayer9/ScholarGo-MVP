import React, { useEffect, useState } from 'react';
import { getUserSubscription, PLAN_LIMITS } from '../services/subscriptionService';
import { Loader, MessageSquare, FileText, Sparkles } from 'lucide-react';

const QuotaDisplay = ({ userId, visibleQuotas }) => {
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUsage = async () => {
        if (!userId) return;
        const profile = await getUserSubscription(userId);
        setUsage(profile);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsage();
        // Poll every 5 seconds to keep updated (simple reactivity for MVP)
        const interval = setInterval(fetchUsage, 5000);
        return () => clearInterval(interval);
    }, [userId]);

    if (loading) return <div className="p-4 flex justify-center"><Loader size={16} className="animate-spin text-oxford-blue/40" /></div>;

    if (!usage) return null;

    const plan = usage.plan_type || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['free'];
    const isPlus = plan === 'plus';

    if (isPlus) return null;

    const visible = visibleQuotas || ['pdf_analysis', 'chat', 'deep_review'];

    const formatLimit = (current, max) => isPlus ? 'Unlimited' : `${current} / ${max}`;
    const getProgress = (current, max) => isPlus ? 100 : Math.min((current / max) * 100, 100);

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-xs font-bold text-oxford-blue/40 uppercase tracking-wider">Free Plan Usage</h3>

            {/* PDF Analysis */}
            {visible.includes('pdf_analysis') && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-oxford-blue font-medium items-end">
                        <div className="flex items-center gap-1.5">
                            <FileText size={14} className="text-blue-500" />
                            <span className="opacity-70">PDF Analysis</span>
                        </div>
                        <span className="font-bold text-sm">{formatLimit(usage.usage_pdf_analysis, limits.pdf_analysis)}</span>
                    </div>
                    {!isPlus && (
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${usage.usage_pdf_analysis >= limits.pdf_analysis ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${getProgress(usage.usage_pdf_analysis, limits.pdf_analysis)}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Chat Messages */}
            {visible.includes('chat') && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-oxford-blue font-medium items-end">
                        <div className="flex items-center gap-1.5">
                            <MessageSquare size={14} className="text-indigo-500" />
                            <span className="opacity-70">Chat Messages</span>
                        </div>
                        <span className="font-bold text-sm">{formatLimit(usage.usage_chat, limits.chat)}</span>
                    </div>
                    {!isPlus && (
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${usage.usage_chat >= limits.chat ? 'bg-red-500' : 'bg-indigo-500'}`}
                                style={{ width: `${getProgress(usage.usage_chat, limits.chat)}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Deep Review */}
            {visible.includes('deep_review') && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-oxford-blue font-medium items-end">
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={14} className="text-bronze" />
                            <span className="opacity-70">Deep Review</span>
                        </div>
                        <span className="font-bold text-sm">{formatLimit(usage.usage_deep_review, limits.deep_review)}</span>
                    </div>
                    {!isPlus && (
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${usage.usage_deep_review >= limits.deep_review ? 'bg-red-500' : 'bg-bronze'}`}
                                style={{ width: `${getProgress(usage.usage_deep_review, limits.deep_review)}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="pt-2 text-[10px] text-oxford-blue/40 text-center">
                Refreshes automatically
            </div>
        </div>
    );
};

export default QuotaDisplay;
