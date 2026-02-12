import React from 'react';
import { BookOpen, Check, ArrowLeft } from 'lucide-react';
import GuideModal from './components/GuideModal';

const PricingPage = ({ onBack, onLogin }) => {
    const [showGuide, setShowGuide] = React.useState(false);
    return (
        <div className="min-h-screen bg-white font-sans text-oxford-blue overflow-x-hidden selection:bg-bronze/20">
            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-oxford-blue/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex-1 flex items-center justify-start gap-3 cursor-pointer" onClick={onBack}>
                        <div className="w-10 h-10 bg-bronze rounded-xl flex items-center justify-center text-white shadow-lg shadow-bronze/20">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-xl font-serif font-bold tracking-tight text-oxford-blue">ScholarGo</span>
                    </div>

                    {/* Center: Navigation (Same as Landing) */}
                    <div className="hidden md:flex items-center justify-center gap-2">
                        <button
                            className="px-4 py-2 text-sm font-medium text-oxford-blue rounded-xl bg-oxford-blue/5 transition-all cursor-default"
                        >
                            Paket
                        </button>
                        <button
                            onClick={() => setShowGuide(true)}
                            className="px-4 py-2 text-sm font-medium text-oxford-blue/80 hover:text-oxford-blue hover:bg-oxford-blue/5 rounded-xl transition-all"
                        >
                            Panduan
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-end gap-6">
                        <button
                            onClick={onLogin}
                            className="px-5 py-2 text-sm font-bold text-oxford-blue hover:text-bronze transition-colors"
                        >
                            Masuk
                        </button>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-24 px-6 relative">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-serif font-medium text-oxford-blue mb-6">Pilih Paket Belajar</h2>
                        <p className="text-base md:text-lg text-oxford-blue/60 max-w-2xl mx-auto">
                            Investasi terbaik untuk studi impian kamu.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Free Plan */}
                        <div className="p-8 pb-12 rounded-[2rem] bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col">
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-oxford-blue/60 mb-4">Free</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-5xl font-bold text-oxford-blue">Rp 0</span>
                                    <span className="text-oxford-blue/60 text-lg">/bulan</span>
                                </div>
                                <button
                                    onClick={onLogin}
                                    className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 text-base"
                                >
                                    Mulai Gratis
                                </button>
                            </div>

                            <div className="space-y-4">
                                <FeatureItem text="3 Analisis Dokumen PDF" />
                                <FeatureItem text="5 Chat AI Assistant" />
                                <FeatureItem text="1 Deep Review (Insight)" />
                                <FeatureItem text="Akses Fitur Dasar" />
                            </div>
                        </div>

                        {/* Plus Plan */}
                        <div className="p-8 pb-12 rounded-[2rem] bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                            {/* Gradient hint for 'Plus' feel without overwhelming */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                            <div className="mb-8 relative z-10">
                                <h3 className="text-lg font-medium text-oxford-blue/60 mb-4">Plus</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-5xl font-bold text-oxford-blue">Rp 49rb</span>
                                    <span className="text-oxford-blue/60 text-lg">/bulan</span>
                                </div>
                                <button
                                    onClick={onLogin}
                                    className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 text-base"
                                >
                                    Mulai Gratis
                                </button>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <p className="font-bold text-oxford-blue text-sm mb-4 block">Semua fitur Free, ditambah:</p>
                                <FeatureItem text="Unlimited Analisis Dokumen" />
                                <FeatureItem text="Unlimited Chat AI Assistant" />
                                <FeatureItem text="Unlimited Deep Review" />
                                <FeatureItem text="Prioritas Akses Fitur Baru" />
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section - Copied for credibility */}
                    <div className="mt-24">
                        <div className="text-center mb-10">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold tracking-wider text-sm uppercase mb-2 block">
                                KATA MEREKA
                            </span>
                            <h2 className="text-2xl md:text-3xl font-serif font-medium text-oxford-blue">
                                Cerita Pejuang Beasiswa
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
                            {/* Review 1 */}
                            <div className="p-6 rounded-2xl bg-white border border-oxford-blue/5 shadow-xl shadow-oxford-blue/5 hover:scale-[1.02] transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                                        AD
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-oxford-blue text-sm">Afra Asmici Dian</h4>
                                    </div>
                                    <div className="ml-auto text-red-500">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-90">
                                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-oxford-blue/80 leading-relaxed text-sm">
                                    "Terima kasih web ini sudah membantu saya dalam penulisan esai"
                                </p>
                            </div>

                            {/* Review 2 */}
                            <div className="p-6 rounded-2xl bg-white border border-oxford-blue/5 shadow-xl shadow-oxford-blue/5 hover:scale-[1.02] transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                        RM
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-oxford-blue text-sm">Riza Mafiroh</h4>
                                    </div>
                                    <div className="ml-auto text-red-500">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-90">
                                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-oxford-blue/80 leading-relaxed font-medium text-sm">
                                    "...I will use this platform again once i find difficult"
                                </p>
                            </div>

                            {/* Review 3 */}
                            <div className="p-6 rounded-2xl bg-white border border-oxford-blue/5 shadow-xl shadow-oxford-blue/5 hover:scale-[1.02] transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src="/sooyaaa-review.jpg"
                                        alt="Sooyaaa"
                                        className="w-10 h-10 rounded-full object-cover border border-oxford-blue/10"
                                    />
                                    <div>
                                        <h4 className="font-bold text-oxford-blue text-sm">Sooyaaa</h4>
                                    </div>
                                    <div className="ml-auto text-black">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-80">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-oxford-blue/80 leading-relaxed text-sm">
                                    "Sangat membantu buat saran dan masukan review-nya"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Reused minimal style */}
            <footer className="py-8 bg-white border-t border-oxford-blue/5 text-center text-sm text-oxford-blue/40">
                <p>© 2026 ScholarGo. All rights reserved.</p>
            </footer>
            <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
        </div>
    );
};

// Helper Component for List Items
const FeatureItem = ({ text }) => (
    <div className="flex items-start gap-3 text-[15px] text-oxford-blue/80">
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
            <Check size={14} strokeWidth={3} />
        </div>
        <span className="font-medium text-oxford-blue">{text}</span>
    </div>
);

export default PricingPage;
