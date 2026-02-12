import React from 'react';
import { Sparkles, Crown, Check, X } from 'lucide-react';

const UpgradeModal = ({ open, onClose, featureName }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-oxford-blue/40 backdrop-blur-sm transition-opacity animate-fadeIn"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideIn">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-oxford-blue/40 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 z-10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-oxford-blue to-[#2C3E50] p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20 shadow-inner">
                        <Crown size={32} className="text-yellow-400" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold mb-2">Unlock Unlimited Access</h2>
                    <p className="text-white/80 text-sm">You've reached your free limit for <span className="font-bold text-white">{featureName}</span>.</p>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <p className="text-oxford-blue/60 mb-6">
                            Upgrade to <span className="font-bold text-oxford-blue">ScholarGo Plus</span> to continue analyzing without limits and unlock premium features.
                        </p>

                        <div className="space-y-3 text-left max-w-xs mx-auto">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                <span className="text-sm text-oxford-blue font-medium">Unlimited PDF Analysis</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                <span className="text-sm text-oxford-blue font-medium">Unlimited Chat Messages</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                <span className="text-sm text-oxford-blue font-medium">Detailed Deep Reviews</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => alert("Payment integration coming soon!")}
                        className="w-full py-4 bg-gradient-to-r from-bronze to-amber-600 text-white rounded-xl font-bold shadow-lg shadow-bronze/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                        <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                        Upgrade to Plus
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full mt-4 text-sm text-oxford-blue/40 hover:text-oxford-blue font-medium transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
