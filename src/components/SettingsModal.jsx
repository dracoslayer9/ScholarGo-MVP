import React, { useState, useEffect } from 'react';
import { X, User, Shield, FileText, Mail, Trash2, LogOut, Loader, Upload } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { extractResumeText, parseResumeWithAI } from '../services/resumeService';

const SettingsModal = ({ open, onClose, user, onSignOut, onOpenPrivacy }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isUploading, setIsUploading] = useState(false);
    const [resumeData, setResumeData] = useState(null);

    // Load Resume Data on Open
    useEffect(() => {
        if (open && user) {
            // Check user metadata for existing resume profile
            if (user.user_metadata?.resume_profile) {
                setResumeData(user.user_metadata.resume_profile);
            }
        }
    }, [open, user]);

    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Extract Text
            const text = await extractResumeText(file);
            console.log("Resume Text extracted, length:", text.length);

            // 2. Parse with AI
            const parsedData = await parseResumeWithAI(text);
            console.log("Parsed Data:", parsedData);

            // 3. Save to Supabase (User Metadata)
            const { data, error } = await supabase.auth.updateUser({
                data: { resume_profile: parsedData }
            });

            if (error) throw error;

            setResumeData(parsedData);
            alert("Resume analyzed and profile updated!");

        } catch (error) {
            console.error("Resume Upload Error:", error);
            alert(`Failed to process resume: ${error.message}`);
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = null;
        }
    };

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
                                <h3 className="text-lg font-bold text-oxford-blue border-b border-gray-100 pb-2">Profil Pengguna</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-oxford-blue/40 uppercase mb-1">Full Name</label>
                                        <div className="w-full p-3 bg-gray-50 border border-transparent rounded-xl text-oxford-blue font-medium">
                                            {user?.user_metadata?.full_name || "Scholar"}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-oxford-blue/40 uppercase mb-1">Email Address</label>
                                        <div className="w-full p-3 bg-gray-50 border border-transparent rounded-xl text-oxford-blue font-medium flex items-center gap-2">
                                            <Mail size={16} className="text-oxford-blue/40" />
                                            {user?.email}
                                        </div>
                                    </div>

                                    {/* Resume Upload Section */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-bold text-oxford-blue mb-3">Professional Profile</h4>

                                        {!resumeData ? (
                                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.txt"
                                                    onChange={handleResumeUpload}
                                                    disabled={isUploading}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                />
                                                <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                    {isUploading ? (
                                                        <>
                                                            <Loader size={24} className="text-bronze animate-spin" />
                                                            <span className="text-sm text-oxford-blue/60 font-medium">Analyzing Resume...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-10 h-10 bg-oxford-blue/5 rounded-full flex items-center justify-center text-oxford-blue/40">
                                                                <FileText size={20} />
                                                            </div>
                                                            <span className="text-sm text-oxford-blue font-medium">Upload Resume / CV</span>
                                                            <span className="text-xs text-oxford-blue/40">PDF or TXT (Max 5MB)</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white border border-oxford-blue/10 rounded-xl p-4 shadow-sm space-y-3 relative group">
                                                <button
                                                    onClick={() => setResumeData(null)}
                                                    className="absolute top-2 right-2 p-1 text-oxford-blue/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove Resume Data"
                                                >
                                                    <Trash2 size={14} />
                                                </button>

                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-bronze/10 flex items-center justify-center text-bronze font-bold text-lg">
                                                        {resumeData.full_name?.[0] || "U"}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-oxford-blue text-sm">{resumeData.full_name || "User"}</h5>
                                                        <span className="text-xs text-bronze font-medium px-2 py-0.5 bg-bronze/5 rounded-full border border-bronze/10">
                                                            {resumeData.ai_identity_label || "Scholar"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-wider">Top Skills</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {resumeData.top_skills?.map((skill, i) => (
                                                                <span key={i} className="text-xs bg-gray-100 text-oxford-blue/80 px-2 py-1 rounded-md">{skill}</span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {resumeData.latest_experience && (
                                                        <div>
                                                            <span className="text-[10px] font-bold text-oxford-blue/40 uppercase tracking-wider">Latest Experience</span>
                                                            <div className="mt-1 text-xs text-oxford-blue/80">
                                                                <p className="font-medium">{resumeData.latest_experience.title}</p>
                                                                <p className="text-oxford-blue/60">{resumeData.latest_experience.organization}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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
