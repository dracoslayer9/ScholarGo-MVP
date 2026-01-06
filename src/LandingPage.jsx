import React from 'react';
import {
    Send,
    Sparkles,
    Brain,
    Target,
    Zap,
    ChevronRight,
    ArrowDown,
    BookOpen,
    CheckCircle
} from 'lucide-react';

const LandingPage = ({ onStart }) => {
    const scrollToFeatures = () => {
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-oxford-blue overflow-x-hidden selection:bg-bronze/20">

            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-oxford-blue/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-oxford-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-oxford-blue/20">
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

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-oxford-blue/10 shadow-sm mb-8 animate-fadeIn">
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-xs font-bold uppercase tracking-wider text-oxford-blue/60">v1.0 Now Live</span>
                        </div>

                        {/* Main Visual: Paper Plane */}
                        <div className="relative mb-12 group cursor-pointer animate-float">
                            {/* Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700"></div>

                            {/* Motion Lines (New) */}
                            <svg className="absolute -left-20 top-10 w-40 h-20 z-0 opacity-50" viewBox="0 0 100 50">
                                <path d="M0 25 Q 50 25 100 25" stroke="url(#gradient)" strokeWidth="2" fill="none" className="animate-dash" strokeDasharray="100" />
                                <path d="M10 35 Q 60 35 90 35" stroke="url(#gradient)" strokeWidth="1" fill="none" className="animate-dash" strokeDasharray="80" style={{ animationDelay: '0.2s' }} />
                                <path d="M20 15 Q 70 15 80 15" stroke="url(#gradient)" strokeWidth="1" fill="none" className="animate-dash" strokeDasharray="60" style={{ animationDelay: '0.5s' }} />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="transparent" />
                                        <stop offset="100%" stopColor="#3B82F6" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* 3D-ish Plane Container */}
                            <div className="relative z-10 w-40 h-40 bg-gradient-to-br from-white to-blue-50 rounded-3xl border border-white/50 shadow-2xl shadow-blue-900/10 flex items-center justify-center transform rotate-[-5deg] group-hover:rotate-0 transition-all duration-500">
                                <Send size={80} className="text-blue-600 transform -rotate-45 translate-x-1 translate-y-1" strokeWidth={1.5} />
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -right-12 top-0 w-16 h-16 bg-white rounded-2xl shadow-lg border border-oxford-blue/5 flex items-center justify-center animate-bounce-slow" style={{ animationDelay: '0.2s' }}>
                                <Sparkles className="text-bronze" size={32} />
                            </div>
                            <div className="absolute -left-12 bottom-0 w-16 h-16 bg-white rounded-2xl shadow-lg border border-oxford-blue/5 flex items-center justify-center animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                                <Brain className="text-oxford-blue" size={32} />
                            </div>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-oxford-blue mb-8 leading-[1.1] tracking-tight max-w-4xl">
                            AI for Winning <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Scholarships</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-oxford-blue/60 mb-12 max-w-2xl leading-relaxed font-light">
                            ScholarGo analyzes essays, finds patterns, and crafts compelling narratives. Trusted by students worldwide.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={onStart}
                                className="w-full sm:w-auto px-8 py-4 bg-oxford-blue text-white rounded-xl font-bold hover:bg-oxford-blue/90 transition-all hover:scale-105 shadow-xl shadow-oxford-blue/20 flex items-center justify-center gap-2"
                            >
                                Start Now <ChevronRight size={20} />
                            </button>
                            <button
                                onClick={scrollToFeatures}
                                className="w-full sm:w-auto px-8 py-4 bg-white text-oxford-blue rounded-xl font-bold border border-oxford-blue/10 hover:bg-oxford-blue/5 transition-all flex items-center justify-center gap-2"
                            >
                                Explore AI Features <ArrowDown size={20} />
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 bg-white border-t border-oxford-blue/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-oxford-blue mb-4">Deep Analysis. Winning Patterns.</h2>
                        <p className="text-lg text-oxford-blue/60 max-w-2xl mx-auto">Our AI doesn't just check grammar. It evaluates the structural integrity and narrative arc of your essay.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-oxford-blue/5 hover:border-blue-500/20 transition-all group">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Brain size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-oxford-blue mb-3">Structural Breakdown</h3>
                            <p className="text-oxford-blue/60 leading-relaxed">
                                Identify hooks, body paragraphs, and conclusions instantly. See your essay's skeleton at a glance.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-oxford-blue/5 hover:border-bronze/20 transition-all group">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-bronze mb-6 group-hover:scale-110 transition-transform">
                                <Target size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-oxford-blue mb-3">Narrative Alignment</h3>
                            <p className="text-oxford-blue/60 leading-relaxed">
                                Ensure your values align with the scholarship's mission. We map your story to winning frameworks.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-oxford-blue/5 hover:border-indigo-500/20 transition-all group">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-oxford-blue mb-3">Instant Feedback</h3>
                            <p className="text-oxford-blue/60 leading-relaxed">
                                Get real-time actionable insights. Fix weak arguments and strengthen your "Why" immediately.
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
                <p>© 2026 ScholarGo. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
