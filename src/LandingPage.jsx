import React from 'react';
import {
    Send,
    Sparkles,
    Brain,
    ChevronRight,
    BookOpen,
    CheckCircle,
    Youtube
} from 'lucide-react';

const LandingPage = ({ onStart, onPrivacy }) => {

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-oxford-blue overflow-x-hidden selection:bg-bronze/20">

            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-oxford-blue/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-bronze rounded-xl flex items-center justify-center text-white shadow-lg shadow-bronze/20">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-xl font-serif font-bold tracking-tight text-oxford-blue">ScholarGo</span>
                    </div>
                    {/* Right side empty as requested */}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col items-center text-center">



                        {/* Spacer to push content down slightly since image is gone */}
                        <div className="h-12"></div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-oxford-blue mb-8 leading-[1.1] tracking-tight max-w-4xl">
                            AI for Winning <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Scholarships</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-oxford-blue/60 mb-12 max-w-2xl leading-relaxed font-light">
                            A specialized workspace designed to dissect scholarship frameworks and build your winning narrative with ease.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={onStart}
                                className="w-full sm:w-auto px-8 py-4 bg-bronze text-white rounded-xl font-bold hover:bg-bronze/90 transition-all hover:scale-105 shadow-xl shadow-bronze/20 flex items-center justify-center gap-2"
                            >
                                Start Now <span className="font-normal opacity-80 ml-1">– it's free</span>
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 bg-white border-t border-oxford-blue/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold tracking-wider text-sm uppercase mb-3 block">
                            Powerful Features
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-oxford-blue mb-4">Analyze Deeper. Write Smarter.</h2>
                        <p className="text-lg text-oxford-blue/60 max-w-2xl mx-auto">Master the winning framework with AI-powered structural insights and an interactive laboratory for your scholarship narrative.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Feature 1 */}
                        <div className="p-10 rounded-2xl bg-[#F8FAFC] border border-oxford-blue/5 hover:border-blue-500/20 transition-all group">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                                <Brain size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-oxford-blue mb-4">AI-Powered Deep Analysis</h3>
                            <p className="text-oxford-blue/60 leading-relaxed text-lg">
                                Instantly dissect essay structure with gold-standard awardee benchmarks and scholarship narrative alignment analysis.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-10 rounded-2xl bg-[#F8FAFC] border border-oxford-blue/5 hover:border-bronze/20 transition-all group">
                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-bronze mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-bronze/10">
                                <BookOpen size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-oxford-blue mb-4">Interactive Writing Canvas</h3>
                            <p className="text-oxford-blue/60 leading-relaxed text-lg">
                                Write drafts with real-time interactive guidance to strengthen arguments and winning narrative patterns.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof / Trust */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-oxford-blue/40 mb-8">Trusted by Applicants Targeting</h3>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <span className="text-2xl font-serif font-bold">Fulbright</span>
                        <span className="text-2xl font-serif font-bold">Chevening</span>
                        <span className="text-2xl font-serif font-bold">AAS</span>
                        <span className="text-2xl font-serif font-bold">LPDP</span>
                        <span className="text-2xl font-serif font-bold">GKS</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-white border-t border-oxford-blue/5 text-center text-sm text-oxford-blue/40">
                <div className="flex items-center justify-center gap-6 mb-4">
                    <a href="https://youtube.com/@scholargooo?si=HmgmbNA6jdviKamt" target="_blank" rel="noopener noreferrer" className="text-oxford-blue/40 hover:text-red-600 transition-colors">
                        <Youtube size={20} />
                    </a>
                    <a href="https://www.tiktok.com/@scholargo?_r=1&_t=ZS-930EamaS16z" target="_blank" rel="noopener noreferrer" className="text-oxford-blue/40 hover:text-black transition-colors">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                    </a>
                </div>
                <div className="mb-4">
                    <button onClick={onPrivacy} className="text-xs text-oxford-blue/40 hover:text-oxford-blue underline decoration-oxford-blue/20 underline-offset-4 transition-all">
                        Privacy Policy
                    </button>
                </div>
                <p>© 2026 ScholarGo. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
