import React, { useState } from 'react';
import { Search, Sparkles, Building2, GraduationCap, Code2, HeartPulse, Leaf, X, FileUp, Loader } from 'lucide-react';
import { createTransaction } from '../services/transactionService';
import { matchWithUniversities } from '../services/campusMatchService';

const CampusMatchModal = ({ isOpen, onClose, user }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState(null);

    if (!isOpen) return null;

    const wordCount = query.trim() ? query.trim().split(/\s+/).length : 0;
    const isOverLimit = wordCount > 75;

    const handleSearch = async () => {
        if (!query.trim() || isOverLimit) return;

        setIsSearching(true);
        try {
            const matches = await matchWithUniversities(query);
            setResults(matches);
        } catch (err) {
            console.error("Failed to match universities:", err);
            alert("Maaf, terjadi kesalahan saat mencari rekomendasi kampus. Silakan coba lagi nanti.");
            setResults(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCVUpload = async () => {
        setIsSearching(true);
        try {
            const data = await createTransaction('cv_match');
            if (data?.invoice_url) {
                window.location.href = data.invoice_url; // Redirect to Xendit
            }
        } catch (err) {
            console.error("Payment Error:", err);
            alert("Gagal memproses pembayaran. Coba lagi.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-oxford-blue/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            {/* Modal Container */}
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden relative"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-gray-100/50 text-oxford-blue/60 hover:text-oxford-blue hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Content Area */}
                <div className="p-8 md:p-10 overflow-y-auto max-h-[85vh] custom-scrollbar">

                    {/* Header */}
                    <div className="text-center space-y-3 mb-8">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
                            <Search size={32} />
                        </div>
                        <h2 className="text-3xl font-serif font-medium text-oxford-blue">
                            Campus Match
                        </h2>
                        <p className="text-oxford-blue/60 text-sm max-w-md mx-auto leading-relaxed">
                            Ceritakan latar belakang & mimpimu. AI akan mencocokkannya dengan kampus top penerima beasiswa dunia.
                        </p>
                    </div>

                    {/* Main Input */}
                    <div className="space-y-4">
                        <div className={`relative bg-white border ${isOverLimit ? 'border-red-400 focus-within:ring-red-500/20' : 'border-oxford-blue/10 focus-within:border-blue-500 focus-within:ring-blue-500/20'} rounded-2xl shadow-sm transition-all flex flex-col focus-within:ring-4`}>
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cth: Saya bidan 3 tahun di Papua, dan ingin memperdalam public policy untuk menurunkan angka kematian ibu..."
                                className="w-full p-5 text-base text-oxford-blue placeholder:text-oxford-blue/30 focus:outline-none resize-none min-h-[140px] bg-transparent rounded-t-2xl"
                            />

                            {/* Toolbar / Actions inside text area */}
                            <div className="px-5 py-3 bg-gray-50 border-t border-inherit rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    {/* Word Count Indicator */}
                                    <div className={`text-xs font-semibold px-2 py-1 rounded-md ${isOverLimit ? 'bg-red-50 text-red-600' : 'bg-gray-200/50 text-oxford-blue/50'}`}>
                                        {wordCount} / 75 kata
                                    </div>

                                    {isOverLimit && (
                                        <span className="text-xs text-red-500 font-medium">Batas gratis terlampaui.</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                                    {/* Premium CV Button */}
                                    <button
                                        onClick={handleCVUpload}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-oxford-blue/20 text-oxford-blue hover:bg-oxford-blue/5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                                        title="Match by scanning your CV"
                                    >
                                        <FileUp size={16} />
                                        <span>Unggah CV</span>
                                    </button>

                                    {/* Search Button */}
                                    <button
                                        onClick={handleSearch}
                                        disabled={!query.trim() || isOverLimit || isSearching}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSearching ? <Loader className="animate-spin" size={16} /> : <Search size={16} className="text-white opacity-80" />}
                                        {isSearching ? 'Mencari...' : 'Match!'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Area */}
                    {results && (
                        <div className="mt-8 space-y-4 animate-fadeIn">
                            <h3 className="text-sm font-bold text-oxford-blue/40 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={16} className="text-bronze" />
                                Top Match
                            </h3>
                            <div className="grid gap-4">
                                {results.map((res, i) => (
                                    <div key={i} className="p-5 bg-white border border-blue-200/60 rounded-xl hover:border-blue-300 transition-all flex flex-col gap-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                            <div>
                                                <h4 className="text-xl font-bold text-oxford-blue bg-clip-text text-transparent bg-gradient-to-r from-oxford-blue to-blue-900">{res.university}</h4>
                                                <p className="text-sm font-medium text-oxford-blue/60 mt-1">{res.major} • {res.country}</p>
                                            </div>
                                            <div className="shrink-0 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-bold border border-green-200 inline-block self-start">
                                                {res.matchScore}% Match
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                                            {/* Reasoning */}
                                            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 md:col-span-2">
                                                <p className="text-sm text-oxford-blue/80 leading-relaxed flex items-start gap-3">
                                                    <span className="shrink-0 mt-0.5"><Sparkles size={16} className="text-blue-500" /></span>
                                                    <span><strong className="text-oxford-blue">Why It Fits:</strong> {res.reasoning}</span>
                                                </p>
                                            </div>

                                            {/* Alumni Careers */}
                                            {res.alumniCareers && (
                                                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                                    <p className="text-xs text-oxford-blue/80 leading-relaxed flex items-start gap-2">
                                                        <span className="shrink-0 mt-0.5">💼</span>
                                                        <span><strong className="text-oxford-blue block mb-0.5">Career Outlook</strong> {res.alumniCareers}</span>
                                                    </p>
                                                </div>
                                            )}

                                            {/* Deadline & Links */}
                                            <div className="flex flex-col gap-2 p-3 bg-gray-50/80 rounded-xl border border-gray-100 justify-center">
                                                {res.applicationDeadline && (
                                                    <div className="flex items-center gap-2 text-xs text-oxford-blue/80">
                                                        <span className="shrink-0 text-red-400">📅</span>
                                                        <span><strong>Deadline:</strong> {res.applicationDeadline}</span>
                                                    </div>
                                                )}
                                                {res.curriculumLink && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="shrink-0 text-blue-400">🔗</span>
                                                        <a href={res.curriculumLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline truncate">
                                                            Cek Kurikulum Program
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CampusMatchModal;
