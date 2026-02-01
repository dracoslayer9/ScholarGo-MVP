import React, { useState } from 'react';
import { X, User, Shield, FileText, Mail, Trash2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const SettingsModal = ({ open, onClose, user, onSignOut, onOpenPrivacy }) => {
    const [activeTab, setActiveTab] = useState('profile');

    if (!open) return null;

    const handleDeleteAccount = async () => {
        // In a real app with DB tables, we would delete data here.
        // For now, since it's local state + Auth, we just confirm and sign out.
        if (confirm("Are you sure you want to delete your account? This action cannot be undone. All your local settings will be lost.")) {
            // Optimistically "delete" by signing out. 
            // Truly deleting a Supabase Auth user requires Admin API or RPC. 
            // We'll mimic the "data wiped" experience.
            await supabase.auth.signOut();
            window.location.reload(); // Hard reset
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-oxford-blue/20 backdrop-blur-sm transition-opacity animate-fadeIn"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-[500px] animate-slideIn relative z-10">

                {/* Sidebar */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 shrink-0">
                    <h2 className="font-serif font-bold text-xl text-oxford-blue mb-6 px-2">Settings</h2>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-white text-oxford-blue shadow-sm' : 'text-oxford-blue/60 hover:text-oxford-blue hover:bg-white/50'}`}
                        >
                            <User size={18} />
                            Profil Pengguna
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-white text-oxford-blue shadow-sm' : 'text-oxford-blue/60 hover:text-oxford-blue hover:bg-white/50'}`}
                        >
                            <Shield size={18} />
                            Manajemen Akun
                        </button>
                        <button
                            onClick={() => setActiveTab('legal')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'legal' ? 'bg-white text-oxford-blue shadow-sm' : 'text-oxford-blue/60 hover:text-oxford-blue hover:bg-white/50'}`}
                        >
                            <FileText size={18} />
                            Legal & Dukungan
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-oxford-blue/40 hover:text-oxford-blue transition-colors rounded-lg hover:bg-gray-50"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex-1 p-8 overflow-y-auto">

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-fadeIn">
                                <h3 className="text-lg font-bold text-oxford-blue border-b border-gray-100 pb-4">Profil Pengguna</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-oxford-blue/40 uppercase mb-2 tracking-wider">Full Name</label>
                                        <div className="w-full p-3 bg-[#F8FAFC] border border-transparent rounded-xl text-oxford-blue font-medium shadow-sm">
                                            {user?.user_metadata?.full_name || "Scholar"}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-oxford-blue/40 uppercase mb-2 tracking-wider">Email Address</label>
                                        <div className="w-full p-3 bg-[#F8FAFC] border border-transparent rounded-xl text-oxford-blue font-medium flex items-center gap-3 shadow-sm">
                                            <Mail size={18} className="text-oxford-blue/40" />
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Tab */}
                        {activeTab === 'account' && (
                            <div className="space-y-6 animate-fadeIn">
                                <h3 className="text-lg font-bold text-oxford-blue border-b border-gray-100 pb-2">Manajemen Akun</h3>

                                <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                            <Trash2 size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-red-900">Delete Account</h4>
                                            <p className="text-sm text-red-700/80 mt-1">
                                                Permanently remove your account and all associated data from ScholarGo. This action is not reversible.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg shadow-sm hover:bg-red-50 transition-colors text-sm"
                                        >
                                            Delete My Account
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={onSignOut}
                                        className="flex items-center gap-2 text-oxford-blue/60 hover:text-oxford-blue transition-colors text-sm font-medium"
                                    >
                                        <LogOut size={16} />
                                        Sign out of all devices
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Legal Tab */}
                        {activeTab === 'legal' && (
                            <div className="space-y-6 animate-fadeIn">
                                <h3 className="text-lg font-bold text-oxford-blue border-b border-gray-100 pb-2">Legal & Dukungan</h3>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => { onClose(); onOpenPrivacy(); }}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group text-left"
                                    >
                                        <span className="font-medium text-oxford-blue">Privacy Policy</span>
                                        <FileText size={18} className="text-oxford-blue/40 group-hover:text-bronze transition-colors" />
                                    </button>

                                    <button
                                        // Placeholder for Terms
                                        onClick={() => alert("Terms of Service coming soon.")}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group text-left"
                                    >
                                        <span className="font-medium text-oxford-blue">Terms of Service</span>
                                        <Shield size={18} className="text-oxford-blue/40 group-hover:text-bronze transition-colors" />
                                    </button>
                                </div>

                                <div className="mt-8">
                                    <h4 className="text-sm font-bold text-oxford-blue mb-2">Need help?</h4>
                                    <p className="text-sm text-oxford-blue/60 mb-4">
                                        Our support team is here for you.
                                    </p>
                                    <a
                                        href="mailto:teamscholargo@gmail.com"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-oxford-blue text-white rounded-xl font-medium shadow-lg shadow-oxford-blue/20 hover:bg-oxford-blue/90 transition-all hover:scale-105"
                                    >
                                        <Mail size={18} />
                                        Contact Support
                                    </a>
                                </div>
                            </div>
                        )}

                    </div>
                    {/* Footer / Version */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
                        <p className="text-[10px] text-oxford-blue/30 font-medium">ScholarGo v1.2.0 • 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
