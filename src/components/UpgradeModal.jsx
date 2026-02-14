import React, { useState } from 'react';
import { Crown, Check, X, Loader } from 'lucide-react';
import { createTransaction } from '../services/transactionService';

const UpgradeModal = ({ open, onClose, featureName }) => {
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    // MINIMALIST PRICING VIEW (General Upgrade)
    const isGeneralUpgrade = !featureName;

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // 1. Create Transaction (Xendit Invoice) via Backend
            const { invoice_url } = await createTransaction('plus');

            // 2. Redirect to Xendit Invoice Page
            if (invoice_url) {
                window.location.href = invoice_url;
            } else {
                throw new Error("Invalid invoice URL");
            }
        } catch (error) {
            console.error(error);
            alert(`Failed to initiate payment: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-oxford-blue/60 backdrop-blur-sm transition-opacity animate-fadeIn"
                onClick={loading ? null : onClose}
            ></div>

            {/* Modal */}
            <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${isGeneralUpgrade ? 'max-w-2xl' : 'max-w-lg'} overflow-hidden animate-slideIn`}>

                {/* Close Button */}
                {!loading && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-oxford-blue/40 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 z-20"
                    >
                        <X size={20} />
                    </button>
                )}

                {isGeneralUpgrade ? (
                    // --- GENERAL UPGRADE VIEW ---
                    <div className="flex flex-col md:flex-row h-full">
                        {/* Free Plan (Left) */}
                        <div className="flex-1 p-8 bg-gray-50/50 flex flex-col border-r border-oxford-blue/5">
                            <div className="mb-6">
                                <h3 className="font-serif font-bold text-xl text-oxford-blue mb-1">Free Plan</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-oxford-blue">Rp 0</span>
                                    <span className="text-xs text-oxford-blue/40">/month</span>
                                </div>
                                <p className="text-sm text-oxford-blue/40 font-medium mt-1">Your current plan</p>
                            </div>
                            <div className="space-y-4 mb-8 flex-1">
                                <FeatureRow text="3 PDF Analysis" />
                                <FeatureRow text="5 Chat Messages" />
                                <FeatureRow text="3 Deep Reviews" />
                            </div>
                            <button disabled className="w-full py-3 bg-gray-200 text-oxford-blue/40 font-bold rounded-xl cursor-default text-sm">
                                Current Plan
                            </button>
                        </div>

                        {/* Plus Plan (Right - Highlighted) */}
                        <div className="flex-1 p-8 bg-white relative overflow-hidden flex flex-col">

                            <div className="mb-6 relative z-10">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-serif font-bold text-xl text-oxford-blue">Plus Plan</h3>
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
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader size={16} className="animate-spin" /> : <Crown size={16} />}
                                {loading ? 'Processing...' : 'Upgrade Now'}
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- LIMIT REACHED VIEW ---
                    <>
                        <div className="bg-gradient-to-r from-oxford-blue to-[#2C3E50] p-8 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20 shadow-inner">
                                <Crown size={28} className="text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-serif font-bold mb-2">Unlock Unlimited Access</h2>
                            <p className="text-white/80 text-sm">You've reached your free limit for <span className="font-bold text-white">{featureName}</span>.</p>
                        </div>
                        <div className="p-8">
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
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                {loading ? <Loader size={16} className="animate-spin" /> : <Crown size={16} />}
                                {loading ? 'Processing...' : 'Upgrade to Plus'}
                            </button>
                            <button onClick={onClose} disabled={loading} className="w-full mt-4 text-xs text-oxford-blue/40 hover:text-oxford-blue font-medium transition-colors">
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
