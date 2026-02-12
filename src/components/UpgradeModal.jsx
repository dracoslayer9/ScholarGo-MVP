import React from 'react';
import { Sparkles, Crown, Check, X } from 'lucide-react';

const UpgradeModal = ({ open, onClose, featureName }) => {
    if (!open) return null;

    // MINIMALIST PRICING VIEW (General Upgrade)
    const isGeneralUpgrade = !featureName;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-oxford-blue/60 backdrop-blur-sm transition-opacity animate-fadeIn"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${isGeneralUpgrade ? 'max-w-2xl' : 'max-w-lg'} overflow-hidden animate-slideIn`}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-oxford-blue/40 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 z-20"
                >
                    <X size={20} />
                </button>

                {isGeneralUpgrade ? (
                    // --- GENERAL UPGRADE VIEW ---
                    <div className="flex flex-col md:flex-row h-full">
                        {/* Free Plan (Left) */}
                        <div className="flex-1 p-8 bg-gray-50/50 flex flex-col border-r border-oxford-blue/5">
                            <div className="mb-6">
                                <h3 className="font-serif font-bold text-xl text-oxford-blue mb-1">Free Plan</h3>
                                <p className="text-sm text-oxford-blue/40 font-medium">Your current plan</p>
                            </div>
                            <div className="space-y-4 mb-8 flex-1">
                                <FeatureRow text="3 PDF Analysis / day" />
                                <FeatureRow text="5 Chat Messages / day" />
                                <FeatureRow text="3 Deep Reviews / day" />
                            </div>
                            <button disabled className="w-full py-3 bg-gray-200 text-oxford-blue/40 font-bold rounded-xl cursor-default text-sm">
                                Current Plan
                            </button>
                        </div>

                        {/* Plus Plan (Right - Highlighted) */}
                        <div className="flex-1 p-8 bg-white relative overflow-hidden flex flex-col">
                            {/* Glow Effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-bronze/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="mb-6 relative z-10">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-serif font-bold text-xl text-oxford-blue">Plus Plan</h3>
                                    <Sparkles size={16} className="text-bronze" />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-oxford-blue">Rp 49rb</span>
                                    <span className="text-xs text-oxford-blue/40">/month</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 flex-1 relative z-10">
                                <FeatureRow text="Unlimited PDF Analysis" highlight />
                                <FeatureRow text="Unlimited Chat Messages" highlight />
                                <FeatureRow text="Unlimited Deep Reviews" highlight />
                                <FeatureRow text="Priority Support" highlight />
                            </div>

                            <button
                                onClick={() => alert("Payment coming soon!")}
                                className="w-full py-3 bg-gradient-to-r from-bronze to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-bronze/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 group"
                            >
                                <Crown size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- LIMIT REACHED VIEW (Existing logic, refined) ---
                    <>
                        <div className="bg-gradient-to-r from-oxford-blue to-[#2C3E50] p-8 text-center text-white relative overflow-hidden">
                            {/* ... existing header logic ... */}
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20 shadow-inner">
                                <Crown size={28} className="text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-serif font-bold mb-2">Unlock Unlimited Access</h2>
                            <p className="text-white/80 text-sm">You've reached your free limit for <span className="font-bold text-white">{featureName}</span>.</p>
                        </div>
                        <div className="p-8">
                            {/* ... existing body logic ... */}
                            <div className="text-center mb-8">
                                <p className="text-oxford-blue/60 mb-6 text-sm">
                                    Upgrade to <span className="font-bold text-oxford-blue">ScholarGo Plus</span> to continue analyzing without limits.
                                </p>
                                <div className="space-y-3 text-left max-w-xs mx-auto">
                                    <FeatureRow text="Unlimited PDF Analysis" highlight />
                                    <FeatureRow text="Unlimited Chat Messages" highlight />
                                    <FeatureRow text="Unlimited Deep Reviews" highlight />
                                </div>
                            </div>
                            <button
                                onClick={() => alert("Payment integration coming soon!")}
                                className="w-full py-3 bg-gradient-to-r from-bronze to-amber-600 text-white rounded-xl font-bold shadow-lg shadow-bronze/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-sm"
                            >
                                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                                Upgrade to Plus
                            </button>
                            <button onClick={onClose} className="w-full mt-4 text-xs text-oxford-blue/40 hover:text-oxford-blue font-medium transition-colors">
                                Maybe Later
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const FeatureRow = ({ text, highlight = false }) => (
    <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
            <Check size={10} strokeWidth={3} />
        </div>
        <span className={`text-sm ${highlight ? 'text-oxford-blue font-medium' : 'text-oxford-blue/60'}`}>{text}</span>
    </div>
);

export default UpgradeModal;
