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

const LandingPage = ({ onStart, onPrivacy, onTerms, onLogin }) => {

    return (
        <div className="min-h-screen bg-white font-sans text-oxford-blue overflow-x-hidden selection:bg-bronze/20">

            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-oxford-blue/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-bronze rounded-xl flex items-center justify-center text-white shadow-lg shadow-bronze/20">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-xl font-serif font-bold tracking-tight text-oxford-blue">ScholarGo</span>
                    </div>

                    <button
                        onClick={onLogin}
                        className="px-5 py-2 text-sm font-bold text-oxford-blue hover:text-bronze transition-colors"
                    >
                        Masuk
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-12 lg:pt-48 lg:pb-20 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col items-center text-center">



                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-serif font-medium text-oxford-blue mb-8 leading-[1.1] tracking-tight max-w-4xl">
                            AI Asisten <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Beasiswa</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-oxford-blue/80 mb-12 max-w-2xl leading-relaxed font-normal">
                            Bantu bedah struktur esai pemenang dan susun narasi aplikasi autentik yang siap tembus beasiswa impian kamu
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto relative z-20">
                            <button
                                onClick={onStart}
                                className="w-full sm:w-auto px-6 py-3 bg-bronze text-white rounded-xl font-bold hover:brightness-90 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-bronze/20"
                            >
                                Langsung coba
                            </button>
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-6 py-3 bg-white border border-oxford-blue/10 text-oxford-blue rounded-xl font-bold hover:bg-gray-50 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-sm"
                            >
                                Lihat Fitur
                            </button>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-3 animate-fadeIn">
                            <span className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                100+
                            </span>
                            <span className="text-oxford-blue/60 font-medium">
                                pejuang beasiswa sudah gabung!
                            </span>
                        </div>

                        {/* App Screenshot */}
                        <div className="mt-16 w-full max-w-4xl mx-auto relative z-10 group flex justify-center">
                            <video
                                src="/hero-app-demo.MOV"
                                poster="/hero-app-screenshot copy.png"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="relative z-10 rounded-xl border border-oxford-blue/10 w-full shadow-sm"
                            />
                            {/* Bottom Fade Overlay - Smooth Transition */}
                            <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/20 to-transparent z-20 pointer-events-none" />
                        </div>

                        {/* Social Proof / Trust */}
                        <div className="mt-8 md:mt-10 text-center relative z-20">
                            <h3 className="text-sm font-medium text-oxford-blue/40 mb-6">Partner andalan raih beasiswa impian.</h3>
                            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700 ease-in-out">
                                <span className="text-xl font-serif font-bold cursor-default">Fulbright</span>
                                <span className="text-xl font-serif font-bold cursor-default">Chevening</span>
                                <span className="text-xl font-serif font-bold cursor-default">AAS</span>
                                <span className="text-xl font-serif font-bold cursor-default">LPDP</span>
                                <span className="text-xl font-serif font-bold cursor-default">GKS</span>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="pt-12 pb-24 px-6 bg-[#F8FAFC] border-t border-oxford-blue/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold tracking-wider text-sm uppercase mb-3 block">
                            FITUR UNGGULAN
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-oxford-blue mb-4">Analisis Mendalam. Esai <span className="italic">Level-up</span>.</h2>
                        <p className="text-base text-oxford-blue/80 max-w-2xl mx-auto">Bedah aplikasi dan susun esai di laboratorium interaktif.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Feature 1 */}
                        <div className="p-10 rounded-2xl bg-white border border-oxford-blue/5 hover:border-blue-500/20 transition-all group">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                                <Brain size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-oxford-blue mb-4">Analisis Esai Ala Awardee</h3>
                            <p className="text-oxford-blue/60 leading-relaxed text-lg">
                                Secara cepat bedah pola esai penerima beasiswa global dengan AI.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-10 rounded-2xl bg-white border border-oxford-blue/5 hover:border-bronze/20 transition-all group">
                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-bronze mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-bronze/10">
                                <BookOpen size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-oxford-blue mb-4">Canvas Menulis Interaktif</h3>
                            <p className="text-oxford-blue/60 leading-relaxed text-lg">
                                Tulis draf secara real-time dengan panduan interaktif agar esai kamu sesuai dengan pemenang beasiswa.
                            </p>
                        </div>
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
                <div className="mb-4 flex justify-center gap-4">
                    <button onClick={onPrivacy} className="text-xs text-oxford-blue/40 hover:text-oxford-blue underline decoration-oxford-blue/20 underline-offset-4 transition-all">
                        Kebijakan Privasi
                    </button>
                    <button onClick={onTerms} className="text-xs text-oxford-blue/40 hover:text-oxford-blue underline decoration-oxford-blue/20 underline-offset-4 transition-all">
                        Ketentuan Layanan
                    </button>
                </div>
                <p>© 2026 ScholarGo. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
