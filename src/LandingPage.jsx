import React from 'react';
import {
    Send,
    Sparkles,
    Brain,
    ChevronRight,
    BookOpen,
    CheckCircle,
    Youtube,
    Search,
    FileText,
    Scan,
    ArrowDown
} from 'lucide-react';
import GuideModal from './components/GuideModal';

const LandingPage = ({ onStart, onPrivacy, onTerms, onLogin, onPricing, onCampusMatch }) => {
    const [showGuide, setShowGuide] = React.useState(false);

    return (
        <div className="min-h-screen bg-white font-sans text-oxford-blue overflow-x-hidden selection:bg-bronze/20">

            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-oxford-blue/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-xl font-sans font-bold tracking-tight text-oxford-blue">ScholarGo</span>
                    </div>

                    {/* Right: Navigation Actions grouped together */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onPricing}
                            className="px-4 py-2 text-sm font-semibold text-oxford-blue border border-gray-200 bg-white hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Upgrade Plan
                        </button>
                        <button
                            onClick={() => setShowGuide(true)}
                            className="px-4 py-2 text-sm font-semibold text-oxford-blue border border-gray-200 bg-white hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Panduan
                        </button>
                        <button
                            onClick={onLogin}
                            className="px-4 py-2 text-sm font-semibold text-oxford-blue border border-gray-200 bg-white hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Masuk
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col items-center text-center">

                        {/* Headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6.5xl font-sans font-extrabold text-[#1d3557] mb-6 leading-tight tracking-tight max-w-4xl text-center">
                            Your Personal <br />
                            Scholarship Writing Assistant
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-oxford-blue/60 mb-10 max-w-2xl leading-relaxed font-normal">
                            Canvas kolaboratif yang didukung AI canggih untuk memenangkan beasiswa
                        </p>

                        {/* Two Cards Section */}
                        <div className="grid md:grid-cols-2 gap-8 max-w-3xl w-full mb-12 px-4 relative z-20">
                            {/* Card 1: Tulis dari nol */}
                            <div className="bg-[#2563eb] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl min-h-[360px] text-left hover:scale-[1.02] transition-transform duration-300">
                                <div className="space-y-6">
                                    {/* Icon Box */}
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                        <FileText size={24} />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold">Tulis dari nol</h3>
                                        <p className="text-white/80 leading-relaxed text-sm">
                                            AI membimbing kamu langkah demi langkah — dari hook pembuka sampai visi kontribusi.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4">
                                    {/* Recommended Badge */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-white w-fit">
                                        <Sparkles size={12} className="animate-pulse" />
                                        <span>Direkomendasikan untuk pemula</span>
                                    </div>

                                    {/* Button with white text */}
                                    <button
                                        onClick={onStart}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold bg-[#1d4ed8] hover:bg-[#1e40af] border border-white/20 text-white transition-all group"
                                    >
                                        <span>Mulai menulis</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Scan essay saya */}
                            <div className="bg-white border border-gray-200 rounded-3xl p-8 text-oxford-blue flex flex-col justify-between shadow-md min-h-[360px] text-left hover:scale-[1.02] transition-transform duration-300">
                                <div className="space-y-6">
                                    {/* Icon Box */}
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#2563eb]">
                                        <Scan size={24} />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-oxford-blue">Scan essay saya</h3>
                                        <p className="text-oxford-blue/60 leading-relaxed text-sm">
                                            Sudah punya draft? Dapatkan skor, feedback, dan saran perbaikan dalam 10 detik.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    {/* Button */}
                                    <button
                                        onClick={onStart}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold border border-gray-200 bg-white hover:bg-gray-50 text-oxford-blue transition-all group"
                                    >
                                        <span>Upload essay</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-oxford-blue/60" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-4 flex items-center justify-center gap-2 animate-fadeIn relative z-20">
                            <span className="text-xl font-bold text-[#2563eb]">
                                300+
                            </span>
                            <span className="text-oxford-blue/60 font-medium text-sm">
                                pejuang beasiswa sudah gabung!
                            </span>
                        </div>

                        {/* Scroll Down Indicator */}
                        <div className="mt-8 flex justify-center animate-bounce">
                            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-oxford-blue/40 bg-white shadow-sm">
                                <ArrowDown size={16} />
                            </div>
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
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-oxford-blue mb-4">Esai <span className="italic">Level-up</span>.</h2>
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
                                Secara cepat bedah pola aplikasi penerima beasiswa global dengan AI.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-10 rounded-2xl bg-white border border-oxford-blue/5 hover:border-bronze/20 transition-all group">
                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-bronze mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-bronze/10">
                                <BookOpen size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-oxford-blue mb-4">Canvas Menulis Interaktif</h3>
                            <p className="text-oxford-blue/60 leading-relaxed text-lg">
                                Tulis draf secara real-time dengan panduan interaktif agar narasi kamu sesuai dengan pemenang beasiswa.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className="py-16 px-6 bg-white overflow-hidden border-t border-oxford-blue/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold tracking-wider text-sm uppercase mb-2 block">
                            KATA MEREKA
                        </span>
                        <h2 className="text-2xl md:text-3xl font-serif font-medium text-oxford-blue">
                            Cerita Pejuang Beasiswa
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
        </div>
    );
};

export default LandingPage;
