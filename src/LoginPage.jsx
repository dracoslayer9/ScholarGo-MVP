import React, { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Loader, AlertCircle, ChevronLeft } from 'lucide-react';

const LoginPage = ({ onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up to match "Get started" vibe
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setErrorMsg(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMsg(error.message);
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                setSuccessMsg("Account created! Please check your email to confirm.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Session update is handled by onAuthStateChange in App.jsx
            }
        } catch (error) {
            console.error("Auth Error:", error);
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden font-sans">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center justify-center text-oxford-blue/60 hover:text-oxford-blue transition-colors z-20 bg-white/50 backdrop-blur-sm p-3 rounded-full border border-white/50 shadow-sm hover:bg-white/80"
                title="Back to Home"
            >
                <ChevronLeft size={20} />
            </button>

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-8 md:p-12 max-w-[480px] w-full relative z-10">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-serif font-bold text-oxford-blue mb-2">
                        {isSignUp ? "Get started with ScholarGo" : "Sign in to ScholarGo"}
                    </h1>
                </div>

                {/* Google Login (Top) */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white border border-gray-200 text-oxford-blue font-bold py-3.5 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-3 mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Error / Success Messages */}
                {errorMsg && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2 text-green-600 text-sm">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-5">

                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-bold text-oxford-blue mb-1.5 ml-1">Your Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Nadiem Makarim"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={isSignUp}
                                className="w-full bg-white border border-gray-200 text-oxford-blue text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-oxford-blue/30"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-oxford-blue mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-white border border-gray-200 text-oxford-blue text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-oxford-blue/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-oxford-blue mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="Please enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full bg-white border border-gray-200 text-oxford-blue text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-oxford-blue/30"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#4F46E5] text-white font-bold py-3.5 px-6 rounded-xl hover:bg-[#4338CA] transition-all shadow-lg shadow-[#4F46E5]/20 flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? (
                            <Loader className="animate-spin" size={20} />
                        ) : (
                            <span>{isSignUp ? "Start for free" : "Sign In"}</span>
                        )}
                    </button>
                </form>

                {/* Footer / Toggle */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setErrorMsg(null);
                            setSuccessMsg(null);
                        }}
                        className="text-sm font-medium text-oxford-blue hover:text-blue-600 transition-colors"
                    >
                        {isSignUp ? "Or sign in instead" : "Or sign up instead"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
